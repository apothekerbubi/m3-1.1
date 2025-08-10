import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Role = "student" | "examiner" | "patient";
type TranscriptItem = { role: Role; text: string };

type ObjMin = { id: string; label: string };
type CompletionRules = { minObjectives: number; maxLLMTurns?: number; hardStopTurns?: number };

type ApiOut =
  | {
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
    }
  | { examiner_info: string }
  | { say_to_student: string; evaluation: null; next_question: null; end: false };

type BodyIn = {
  caseText?: string;
  transcript?: TranscriptItem[];
  outline?: string[];
  style?: "coaching" | "strict";
  tipRequest?: boolean;
  clarifyQuestion?: string;
  objectives?: ObjMin[];
  completion?: CompletionRules | null;
};

// --- Heuristik: erkenne Patienten-Nachfragen im letzten student-Text ---
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
  const starts = [
    "hat","ist","sind","nimmt","gab","gibt","bestehen",
    "wie","wann","wo","warum","welche","welcher","welches","wer",
    "gibt es","kann ich","möchte wissen","können sie mir sagen",
  ];

  if (t.endsWith("?") && kw.some(k => t.includes(k))) return true;
  if (starts.some(p => t.startsWith(p + " ")) && kw.some(k => t.includes(k))) return true;
  if (t.includes("mehr info") || t.includes("weitere info") || t.includes("anamnese")) return true;
  if (/^[a-zäöüß0-9\- ]{1,8}\?$/.test(t)) return false;
  return false;
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    hint: "POST { caseText, transcript, outline?, style?, tipRequest?, clarifyQuestion?, objectives?, completion? }",
  });
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.OPENAI_API_KEY?.trim();

    // Robust: nur auf Existenz prüfen
    if (!apiKey) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY fehlt (.env.local oder Vercel-Env setzen)" },
        { status: 500 }
      );
    }

    // Optionales Debug: nur Länge loggen (nicht den Key)
    if (process.env.NODE_ENV !== "production") {
      console.log("[exam/turn] OPENAI_API_KEY length:", apiKey.length);
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
    const clarifyQuestion = typeof body.clarifyQuestion === "string" ? body.clarifyQuestion.trim() : "";
    const objectives: ObjMin[] = Array.isArray(body.objectives) ? body.objectives : [];
    const completion: CompletionRules | null = body.completion ?? null;

    if (!caseText) {
      return NextResponse.json({ error: "Bad request: caseText ist erforderlich." }, { status: 400 });
    }

    // ---------- MODE A: Tipp ----------
    if (tipRequest) {
      const sysTip = `Du bist Prüfer:in im 3. Staatsexamen (Innere/Chirurgie/Wahlfach).
Gib genau EINEN kurzen, konkreten Tipp (1 Satz), der in die richtige Richtung schubst.
Kein Spoiler (keine Enddiagnose/Therapie verraten).
Sprache: Deutsch. Stil: freundlich-klar, prüfungsnah.`;

      const lastStudent = [...transcript].reverse().find((t) => t.role === "student")?.text || "";
      const usrTip = `Fall (Vignette): ${caseText}
${outline.length ? `Prüfungs-Outline: ${outline.join(" • ")}` : ""}
Letzte Studierenden-Antwort: ${lastStudent || "(noch keine)"}
Gib NUR den Tipp-Text zurück, ohne Zusatz.`.trim();

      const outTip = await client.chat.completions.create({
        model,
        messages: [
          { role: "system", content: sysTip },
          { role: "user", content: usrTip },
        ],
        temperature: 0.2,
      });

      const tip = (outTip.choices?.[0]?.message?.content || "").trim();
      return NextResponse.json({
        say_to_student: tip ? `Tipp: ${tip}` : "Tipp: Denke an eine fehlende DD oder einen nächsten Untersuchungsschritt.",
        evaluation: null,
        next_question: null,
        end: false,
      });
    }

    // --- Auto-Erkennung einer Nachfrage im letzten student-Text ---
    const lastStudentText = [...transcript].reverse().find((t) => t.role === "student")?.text?.trim() || "";
    const autoClarify = !clarifyQuestion && looksLikePatientInfoQuery(lastStudentText);
    const clarify = clarifyQuestion || (autoClarify ? lastStudentText : "");

    // ---------- MODE B: Prüfer liefert Zusatzinfos ----------
    if (clarify) {
      const sysClarify = `Du bist die/der PRÜFER:IN im 3. Staatsexamen.
Auf Nachfrage gibst du ZUSÄTZLICHE PATIENTENDETAILS, die realistisch zur Vignette passen.
Form: 1–3 kurze Sätze ODER 2–3 Bulletpoints (mit '- ').
Kein Spoiler: keine Enddiagnose, keine definitive Therapie verraten.
Enthülle nur Infos, die man in Anamnese/Klinik/Basisdiagnostik plausibel erheben könnte.
Sprache: Deutsch, freundlich-klar, prüfungsnah.`;

      const usrClarify = `Vignette: ${caseText}
${outline.length ? `Geplante Prüfungsschritte: ${outline.join(" • ")}` : ""}
${transcript.length ? `Bisheriger Dialog (Rollen student/examiner/patient):\n${JSON.stringify(transcript, null, 2)}` : ""}
Nachfrage des Studierenden: ${clarify}
Gib NUR die Zusatzinformation (ohne Präambel, ohne Bewertung) zurück.`.trim();

      const outClarify = await client.chat.completions.create({
        model,
        messages: [
          { role: "system", content: sysClarify },
          { role: "user", content: usrClarify },
        ],
        temperature: 0.2,
      });

      const info = (outClarify.choices?.[0]?.message?.content || "").trim();
      return NextResponse.json({ examiner_info: info || "Keine weiteren relevanten Details verfügbar." });
    }

    // ---------- MODE C: Normaler Prüfungszug ----------
    const sysExam = `Du bist Prüfer:in im 3. Staatsexamen.
Stil: ${style === "strict" ? "knapp, streng-sachlich" : "freundlich-klar, coaching-orientiert"}.
Im Transkript können vorkommen: student, examiner, patient.
- BEWERTE AUSSCHLIESSLICH die student-Antworten (patient/examiner sind Kontext).

Bewertung: 'correct' / 'partially_correct' / 'incorrect'.
Erlaube TEILPUNKTE, wenn der Kern erkennbar ist. Formuliere 1 kurzen Tipp bei 'partially_correct' oder 'incorrect'.
Bei Differentialdiagnosen gilt: 2–3 plausible DD REICHEN (nicht vollständige Listen verlangen).

Du bekommst (optional) eine Ziel-Checkliste (objectives) und End-Regeln (completion).
Halte intern fest, welche Ziele der/die Studierende bereits erfüllt hat.
Wenn die End-Regeln erfüllt sind (z. B. minObjectives erreicht, maxLLMTurns überschritten, etc.), setze 'end=true'.
Wenn 'end=true', stelle KEINE neue Frage mehr. Fasse kurz zusammen, was gut war und was noch fehlt (ohne neue Aufgaben).

Feldregeln:
- 'evaluation' = { correctness, feedback, tips? } (1–2 Sätze; Tipp nur wenn nicht 'correct').
- 'next_question' = nur eine Frage (ein Satz, Fragezeichen).
- 'say_to_student' = optionaler Übergangssatz (ohne Frage).
- 'end' = boolean (siehe Regeln).

Gib NUR folgendes JSON zurück:
{ "say_to_student": string, "evaluation": { "correctness": "correct" | "partially_correct" | "incorrect", "feedback": string, "tips"?: string } | null, "next_question": string | null, "end": boolean }`;

    const usrExam = `Fall (Vignette): ${caseText}
${outline.length ? `Prüfungs-Outline: ${outline.join(" • ")}` : ""}
${objectives.length ? `Ziele (objectives): ${objectives.map(o => `${o.id}: ${o.label}`).join(" | ")}` : ""}
${completion ? `End-Regeln (completion): minObjectives=${completion.minObjectives}${typeof completion.maxLLMTurns === "number" ? `, maxLLMTurns=${completion.maxLLMTurns}` : ""}${typeof completion.hardStopTurns === "number" ? `, hardStopTurns=${completion.hardStopTurns}` : ""}` : ""}
${transcript.length ? `Transkript (Rollen student/examiner/patient):\n${JSON.stringify(transcript, null, 2)}` : ""}
Erzeuge NUR das JSON-Objekt.`.trim();

    const outExam = await client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: sysExam },
        { role: "user", content: usrExam }
      ],
      temperature: 0.2
    });

    const raw = (outExam.choices?.[0]?.message?.content || "").trim();
    let jsonText = raw;
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

    return NextResponse.json(payload);

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : typeof err === "string" ? err : "LLM error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}