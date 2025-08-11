import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Role = "student" | "examiner" | "patient";
type TranscriptItem = { role: Role; text: string };

type ObjMin = { id: string; label: string };
type CompletionRules = { minObjectives: number; maxLLMTurns?: number; hardStopTurns?: number };

type ApiOut = {
  say_to_student: string | null;
  evaluation:
    | {
        correctness: "correct" | "partially_correct" | "incorrect";
        feedback: string;
        tips?: string;
      }
    | null;
  next_question: string | null;
  end: boolean;
};

type BodyIn = {
  caseText?: string;
  transcript?: TranscriptItem[];
  outline?: string[];
  style?: "coaching" | "strict";
  tipRequest?: boolean;
  explainRequest?: boolean;
  clarifyQuestion?: string;
  objectives?: ObjMin[];
  completion?: CompletionRules | null;
  attemptStage?: number; // 1 erster Versuch, 2 Retry
  focusQuestion?: string; // 🎯 für Tipp
  explainContext?: { question?: string; lastAnswer?: string }; // 📘 für Erklären
};

// einfache Markdown/Emoji-Entfärbung (Fettdruck/Fences)
function stripMd(s: string): string {
  return (s || "")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, "$1")
    .replace(/^-\s+/gm, "• ")
    .trim();
}

// --- Heuristik: erkennt “Patienteninfo-Nachfragen” im letzten student-Text ---
function looksLikePatientInfoQuery(s: string): boolean {
  const t = (s || "").trim().toLowerCase();
  if (!t) return false;
  const kw = [
    "raucht","raucher","rauchverhalten","pack","nikotin",
    "fieber","fieberhöhe","temperatur","frösteln","schüttelfrost",
    "atemfrequenz","puls","herzfrequenz","blutdruck","sauerstoff","spo2",
    "d-dimer","troponin","crp","leuko","labor",
    "vorerkrank","medikament","antikoag","ass","statin",
    "familie","familiär","allergie",
    "reisen","flug","immobilis","operation","op",
    "belastbarkeit","anstrengung","ruhe",
    "husten","auswurf","hämoptyse","schmerzqualität","ausstrahlung",
    "bein","schwellung","ödeme",
    "gewicht","appetit","nacht","nächtliches",
    "schwanger","verhütung",
  ];
  const starts = ["hat","ist","sind","nimmt","gab","gibt","bestehen","wie","wann","wo","warum","welche","welcher","welches","wer","gibt es","kann ich","möchte wissen","können sie mir sagen"];
  if (t.endsWith("?") && kw.some(k => t.includes(k))) return true;
  if (starts.some(p => t.startsWith(p + " ")) && kw.some(k => t.includes(k))) return true;
  if (t.includes("mehr info") || t.includes("weitere info") || t.includes("anamnese")) return true;
  if (/^[a-zäöüß0-9\- ]{1,8}\?$/.test(t)) return false;
  return false;
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    hint: "POST { caseText, transcript, outline?, style?, tipRequest?, explainRequest?, clarifyQuestion?, objectives?, completion?, attemptStage?, focusQuestion?, explainContext? }",
  });
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.OPENAI_API_KEY?.trim();
    if (!apiKey) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY fehlt (.env.local oder Vercel-Env setzen)" },
        { status: 500 }
      );
    }

    const model = (process.env.OPENAI_MODEL || "gpt-4o-mini").trim();
    const client = new OpenAI({ apiKey });

    let body: BodyIn;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Ungültiger JSON-Body." }, { status: 400 });
    }

    const caseText = (body.caseText || "").trim();
    const transcript: TranscriptItem[] = Array.isArray(body.transcript) ? body.transcript : [];
    const outline: string[] = Array.isArray(body.outline) ? body.outline : [];
    const style: "coaching" | "strict" = body.style === "strict" ? "strict" : "coaching";
    const tipRequest = Boolean(body.tipRequest);
    const explainRequest = Boolean(body.explainRequest);
    const clarifyQuestion = typeof body.clarifyQuestion === "string" ? body.clarifyQuestion.trim() : "";
    const objectives: ObjMin[] = Array.isArray(body.objectives) ? body.objectives : [];
    const completion: CompletionRules | null = body.completion ?? null;
    const attemptStage = typeof body.attemptStage === "number" ? body.attemptStage : 1;
    const focusQuestion = typeof body.focusQuestion === "string" ? body.focusQuestion.trim() : "";
    const explainContext = body.explainContext && typeof body.explainContext === "object" ? body.explainContext : undefined;

    if (!caseText) {
      return NextResponse.json({ error: "Bad request: caseText ist erforderlich." }, { status: 400 });
    }

    // ---------- MODE A: Tipp (zur aktuellen Frage) ----------
    if (tipRequest) {
      const sysTip = `Du bist Prüfer:in im 3. Staatsexamen.
Gib genau EINEN kurzen, konkreten Tipp (1 Satz) zur BEANTWORTUNG DER ANGEGEBENEN FRAGE.
Kein Spoiler der finalen Lösung. Deutsch, prüfungsnah.`;

      const lastStudent = [...transcript].reverse().find((t) => t.role === "student")?.text || "";
      const targetQuestion =
        focusQuestion ||
        ([...transcript].reverse().find((t) => t.role === "examiner" && /\?\s*$/.test(t.text))?.text || "");

      const usrTip = `Vignette: ${caseText}
Aktuelle Frage: ${targetQuestion || "(unbekannt)"}
Letzte Studierenden-Antwort (nur Kontext): ${lastStudent || "(noch keine)"}
${outline.length ? `Prüfungs-Outline: ${outline.join(" • ")}` : ""}
Gib NUR den Tipp-Text zurück, ohne Präambel.`.trim();

      const outTip = await client.chat.completions.create({
        model,
        messages: [
          { role: "system", content: sysTip },
          { role: "user", content: usrTip },
        ],
        temperature: 0.2,
      });

      const sayRaw = (outTip.choices?.[0]?.message?.content || "").trim();
      const say = stripMd(sayRaw) || "Denke an den nächsten sinnvollen Diagnoseschritt.";
      const payload: ApiOut = {
        say_to_student: say.startsWith("Tipp:") ? say : `Tipp: ${say}`,
        evaluation: null,
        next_question: null,
        end: false,
      };
      return NextResponse.json(payload);
    }

    // --- Nachfrage automatisch erkennen ---
    const lastStudentText = [...transcript].reverse().find((t) => t.role === "student")?.text?.trim() || "";
    const autoClarify = !clarifyQuestion && looksLikePatientInfoQuery(lastStudentText);
    const clarify = clarifyQuestion || (autoClarify ? lastStudentText : "");

    // ---------- MODE B: Zusatzinfos (Clarify) ----------
    if (clarify) {
      const sysClarify = `Du bist die/der PRÜFER:IN im 3. Staatsexamen.
Auf Nachfrage gibst du ZUSÄTZLICHE PATIENTENDETAILS, realistisch zur Vignette.
Form: 1–3 kurze Sätze ODER 2–3 Bulletpoints (mit '- ').
Kein Spoiler (keine Enddiagnose/definitive Therapie). Nur Basis-/Anamnese-/Klinikinfos. Deutsch.`;

      const usrClarify = `Vignette: ${caseText}
${outline.length ? `Geplante Schritte: ${outline.join(" • ")}` : ""}
${transcript.length ? `Bisheriger Dialog (student/examiner/patient):\n${JSON.stringify(transcript.slice(-14), null, 2)}` : ""}
Nachfrage des Studierenden: ${clarify}
Gib NUR die Zusatzinformation (ohne Präambel/Bewertung).`.trim();

      const outClarify = await client.chat.completions.create({
        model,
        messages: [
          { role: "system", content: sysClarify },
          { role: "user", content: usrClarify },
        ],
        temperature: 0.2,
      });

      const info = stripMd((outClarify.choices?.[0]?.message?.content || "").trim()) || "Keine weiteren relevanten Details verfügbar.";
      const payload: ApiOut = { say_to_student: info, evaluation: null, next_question: null, end: false };
      return NextResponse.json(payload);
    }

    // ---------- MODE D: Erklärung auf Abruf ----------
    if (explainRequest) {
      const sysExplain = `Du bist Prüfer:in am 2. Tag (Theorie) des M3.
Erkläre KURZ die Qualität der Antwort auf die angegebene Frage:
- 2–5 knappe Punkte: Kerngedanke, warum richtig/falsch, typische Fallen, Mini-Merkhilfe.
- KEINE neue Frage stellen.`;

      const fallbackQuestion =
        explainContext?.question?.trim() ||
        ([...transcript].reverse().find((t) => t.role === "examiner" && /\?\s*$/.test(t.text))?.text || "");
      const fallbackAnswer =
        explainContext?.lastAnswer?.trim() ||
        ([...transcript].reverse().find((t) => t.role === "student")?.text || "");

      const usrExplain = `Vignette: ${caseText}
Frage: ${fallbackQuestion || "(unbekannt)"}
Antwort: ${fallbackAnswer || "(unbekannt)"}
${outline.length ? `Prüfungs-Outline: ${outline.join(" • ")}` : ""}
Gib nur die kurze Erklärung (ohne neue Aufgabe).`.trim();

      const outExplain = await client.chat.completions.create({
        model,
        messages: [
          { role: "system", content: sysExplain },
          { role: "user", content: usrExplain },
        ],
        temperature: 0.2,
      });

      const say = stripMd((outExplain.choices?.[0]?.message?.content || "").trim()) ||
        "Kurz erklärt: Relevanz, typisches Vorgehen und Fallstricke beachten.";
      const payload: ApiOut = { say_to_student: say, evaluation: null, next_question: null, end: false };
      return NextResponse.json(payload);
    }
// ---------- KICKOFF: Erstfrage ohne Bewertung (wenn noch keine Studentenantwort nach letzter Prüfer-Nachricht) ----------
{
  // Index der letzten Beiträge je Rolle
  const lastStudentIdx = [...transcript].map((t) => t.role).lastIndexOf("student");
  const lastExaminerIdx = [...transcript].map((t) => t.role).lastIndexOf("examiner");

  const noStudentAfterExaminer =
    lastExaminerIdx >= 0 && (lastStudentIdx < lastExaminerIdx || lastStudentIdx === -1);

  // Zusätzlich: typischer Startfall = nur Vignette vom Prüfer vorhanden
  const isJustVignetteStart =
    transcript.length === 1 &&
    transcript[0]?.role === "examiner" &&
    !/[?？]\s*$/.test(transcript[0]?.text || "");

  if (noStudentAfterExaminer || isJustVignetteStart) {
    const sysKickoff = `Du bist Prüfer:in am 2. Tag (Theorie) des M3.
Stelle GENAU EINE präzise Einstiegsfrage zur Vignette (ein Satz, Fragezeichen).
KEINE Bewertung, KEIN Feedback, KEIN Tipp. Nur die Frage. Deutsch.`;

    const usrKickoff = `Vignette: ${caseText}
${outline.length ? `Prüfungs-Outline (optional): ${outline.join(" • ")}` : ""}
Erzeuge NUR die Frage (ein Satz, Fragezeichen).`;

    const outKick = await client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: sysKickoff },
        { role: "user", content: usrKickoff },
      ],
      temperature: 0.2,
    });

    const qRaw = (outKick.choices?.[0]?.message?.content || "").trim();
    const q = qRaw
      .replace(/```[\s\S]*?```/g, "")
      .replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, "$1")
      .trim();

    const payload: ApiOut = {
      say_to_student: null,
      evaluation: null,
      next_question: q.endsWith("?") ? q : `${q}?`,
      end: false,
    };
    return NextResponse.json(payload);
  }
}
    // ---------- MODE C: Normaler Prüfungszug ----------
    const sysExam = `Du bist Prüfer:in am 2. Tag (Theorie) des 3. Staatsexamens.
Stil: ${style === "strict" ? "knapp, streng-sachlich" : "freundlich-klar, coaching-orientiert"}.
Im Transkript: student/examiner/patient – bewerte ausschließlich student.

Zwei-Versuche-Regel (attemptStage):
- Wenn attemptStage=1 und Antwort nicht 'correct': KEINE neue Frage stellen. Gib kurze begründete Rückmeldung (1–3 Sätze) und optional Tipp.
- Wenn attemptStage=2 und Antwort weiterhin 'incorrect': nenne kurz die korrekte Kernlösung (1–2 Sätze) + 1–3 erklärende Stichpunkte und FAHRE DANN mit der nächsten, sinnvollen Frage fort.

Bewertung: correctness ('correct' | 'partially_correct' | 'incorrect') mit begründetem Feedback; Tipp nur wenn nicht 'correct'.

Antworte NUR als JSON:
{ "say_to_student": string | null,
  "evaluation": { "correctness": "correct"|"partially_correct"|"incorrect", "feedback": string, "tips"?: string } | null,
  "next_question": string | null,
  "end": boolean }`;

    const usrExam = `Vignette: ${caseText}
${outline.length ? `Prüfungs-Outline: ${outline.join(" • ")}` : ""}
${objectives.length ? `Ziele: ${objectives.map(o => `${o.id}: ${o.label}`).join(" | ")}` : ""}
${completion ? `End-Regeln: minObjectives=${completion.minObjectives}${typeof completion.maxLLMTurns==="number"?`, maxLLMTurns=${completion.maxLLMTurns}`:""}${typeof completion.hardStopTurns==="number"?`, hardStopTurns=${completion.hardStopTurns}`:""}` : ""}
attemptStage: ${attemptStage}
Transkript (student/examiner/patient):
${JSON.stringify(transcript.slice(-20), null, 2)}
Erzeuge NUR das JSON-Objekt.`.trim();

    const outExam = await client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: sysExam },
        { role: "user", content: usrExam }
      ],
      temperature: 0.2
    });

    // Robust gegen Fences
    const raw = (outExam.choices?.[0]?.message?.content || "").trim();
    let jsonText = raw.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
    if (!(jsonText.startsWith("{") && jsonText.endsWith("}"))) {
      const s = jsonText.indexOf("{");
      const e = jsonText.lastIndexOf("}");
      if (s >= 0 && e > s) jsonText = jsonText.slice(s, e + 1);
    }

    let payload: ApiOut;
    try {
      payload = JSON.parse(jsonText) as ApiOut;
    } catch {
      return NextResponse.json({ error: "Antwort war kein gültiges JSON." }, { status: 502 });
    }

    // Fallbacks + Markdown säubern
    payload.say_to_student = stripMd((payload.say_to_student ?? "") as string) || null;
    payload.evaluation = payload.evaluation
      ? {
          ...payload.evaluation,
          feedback: stripMd(payload.evaluation.feedback || ""),
          tips: payload.evaluation.tips ? stripMd(payload.evaluation.tips) : undefined,
        }
      : null;
    payload.next_question = stripMd((payload.next_question ?? "") as string) || null;
    payload.end = Boolean(payload.end);

    return NextResponse.json(payload);

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : typeof err === "string" ? err : "LLM error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}