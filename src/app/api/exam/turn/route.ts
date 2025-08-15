// src/app/api/exam/turn/route.ts
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";

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

type ExplainContext = { question?: string; lastAnswer?: string };

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
  attemptStage?: number;
  focusQuestion?: string;
  explainContext?: ExplainContext;
  caseId?: string;
  points?: number;
  progressPct?: number;

  /** Schrittsteuerung */
  stepIndex?: number;
  stepsPrompts?: string[];
  stepRule?: unknown;
};

/* ---------------------- Utils ---------------------- */

// Markdown/Emoji-Entfärbung
function stripMd(s: string): string {
  return (s || "")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, "$1")
    .replace(/^\-\s+/gm, "• ")
    .trim();
}

// Patient:innen-Info-Nachfragen (FIX: nur echte Fragen!)
function looksLikePatientInfoQuery(s: string): boolean {
  const t = (s || "").trim().toLowerCase();
  if (!t) return false;

  // relevante Schlüsselwörter (Anamnese/Vitals/Labore etc.)
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
    "anamnese" // ← bleibt enthalten, aber triggert nur bei echter Frage
  ];

  // typische Frage-Starts
  const starts = [
    "hat","ist","sind","nimmt","gab","gibt","bestehen",
    "wie","wann","wo","warum","welche","welcher","welches","wer",
    "gibt es","kann ich","können sie","könnten sie","möchte wissen","dürfen wir",
    "kann man","sagen sie mir","teilen sie mir mit"
  ];

  const isQuestion = t.endsWith("?") || starts.some(p => t.startsWith(p + " "));
  if (!isQuestion) return false;

  return kw.some(k => t.includes(k));
}

// Give-up / „nächste frage“
function looksLikeGiveUp(s: string): boolean {
  const t = (s || "").trim().toLowerCase();
  if (!t) return false;
  const kw = [
    "weiß nicht","weiss nicht","keine ahnung","k. a.","ka","idk",
    "komme nicht weiter","nicht weiter","hilfe","lösung","loesung","bitte lösung",
    "aufgeben","weiter bitte","überspringen","ueberspringen","pass","skip",
    "nächste frage","naechste frage","weiter","continue","next","mach weiter","weitermachen"
  ];
  return kw.some(k => t.includes(k));
}

// Versuche robust aus Transkript ableiten
function inferAttemptFromTranscript(transcript: TranscriptItem[]): 1|2|3 {
  let lastQIdx = -1;
  for (let i = transcript.length - 1; i >= 0; i--) {
     const it = transcript[i];
     if (it.role === "examiner" && /\?\s*$/.test((it.text || "").trim())) { lastQIdx = i; break; }
  }
  if (lastQIdx === -1) return 1;
  const answers = transcript.slice(lastQIdx + 1).filter(it => it.role === "student");
  const n = answers.length;
  if (n <= 1) return 1;
  if (n === 2) return 2;
  return 3;
}

// Spoiler-Schutz für attempt < 3
function sanitizeForEarlyAttempts(txt: string): string {
  let s = (txt || "");
  s = s.replace(/\b(z\.?\s?b\.?|u\.a\.|unter anderem|zum beispiel)\b[^.]*\./gi, " (Beispiele weggelassen).");
  const dx = [
    /pankreatit\w*/gi, /cholezystit\w*/gi, /choledocholith\w*/gi,
    /aortenaneurysm\w*/gi, /aortendissek\w*/gi, /gastrit\w*/gi,
    /ulkus\w*/gi, /stemi|nstemi|akutes\s*koronar\w*/gi
  ];
  dx.forEach(r => { s = s.replace(r, "[…]"); });
  s = s.replace(/(:\s*)([^.]*?,\s*){2,}[^.]*\./g, "$1(Beispiele weggelassen).");
  s = s.replace(/^\s*tipp:\s*/i, "");
  return s.trim();
}

/* ---------------------- Handlers ---------------------- */

export async function GET() {
  return NextResponse.json({
    ok: true,
    hint:
      "POST { caseText, transcript, outline?, style?, tipRequest?, explainRequest?, clarifyQuestion?, objectives?, completion?, attemptStage?, focusQuestion?, explainContext?, caseId?, points?, progressPct?, stepIndex?, stepsPrompts?, stepRule? }",
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
    const caseId = typeof body.caseId === "string" ? body.caseId.trim() : undefined;
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
    const points = typeof body.points === "number" ? body.points : undefined;
    const progressPct = typeof body.progressPct === "number" ? body.progressPct : undefined;

    // Schritt-Kontext
    const stepIndex = typeof body.stepIndex === "number" ? body.stepIndex : 0;
    const stepsPrompts = Array.isArray(body.stepsPrompts) ? body.stepsPrompts : [];
    const stepRule = body.stepRule ?? null;

    // Abgeleitete Prompts
    const currentPrompt =
      (stepsPrompts[stepIndex] || "").trim()
      || focusQuestion
      || ([...transcript].reverse().find(t => t.role === "examiner" && /\?\s*$/.test(t.text))?.text?.trim() || "");
    const nextPrompt = (stepsPrompts[stepIndex + 1] || "").trim() || null;

    if (!caseText) {
      return NextResponse.json({ error: "Bad request: caseText ist erforderlich." }, { status: 400 });
    }

    // Supabase-Serverclient
    const supabase = createClient();
    const { data: userRes } = await supabase.auth.getUser();
    const userId = userRes?.user?.id ?? null;

    // --- Nachfrage/Letzte Antwort vorbereiten ---
    const lastStudentText = [...transcript].reverse().find((t) => t.role === "student")?.text?.trim() || "";

    /* ---------- MODE A: Tipp ---------- */
    if (tipRequest) {
      const sysTip = `Du bist Prüfer:in im 3. Staatsexamen (M3, Tag 2 – Theorie).
Gib GENAU EINEN sehr kurzen Tipp (1 Satz) zur CURRENT_STEP_PROMPT.
- attemptStage=1: sehr allgemein (Vorgehen/Kategorien/Prioritäten).
- attemptStage=2: etwas fokussierter auf die Prüfungslogik des Schritts.
- KEINE Beispiele, KEINE Diagnosen, KEINE Laborwerte/Bildgebungsbefunde, keine Spoiler.
- Deutsch, ohne Präambel.`;

      const usrTip = `Vignette: ${caseText}
CURRENT_STEP_PROMPT: ${currentPrompt || "(unbekannt)"}
attemptStage: ${attemptStage}
Letzte Studierenden-Antwort (nur Kontext): ${lastStudentText || "(noch keine)"}
RULE_JSON: ${JSON.stringify(stepRule ?? {})}
Gib NUR den Tipp-Text zurück (ohne Präambel).`;

      const outTip = await client.chat.completions.create({
        model,
        messages: [
          { role: "system", content: sysTip },
          { role: "user", content: usrTip },
        ],
        temperature: 0.2,
      });

      const sayRaw = (outTip.choices?.[0]?.message?.content || "").trim();
      const say = stripMd(sayRaw) || "Denke in Säulen (KU, Labor, Bildgebung) und priorisiere Zeitkritisches.";
      const payload: ApiOut = {
        say_to_student: say.startsWith("Tipp:") ? say : `Tipp: ${say}`,
        evaluation: null,
        next_question: null,
        end: false,
      };

      if (userId) {
        void logTurn(supabase, {
          userId,
          caseId,
          attemptStage,
          tipRequest: true,
          explainRequest: false,
          clarifyQuestion: null,
          focusQuestion: currentPrompt || null,
          lastStudentAnswer: lastStudentText || null,
          modelOut: payload,
        });
        if (typeof points === "number" || typeof progressPct === "number") {
          void upsertProgress(supabase, { userId, caseId, points, progressPct });
        }
      }

      return NextResponse.json(payload);
    }

    // --- Nachfrage automatisch erkennen (FIX: nur echte Fragen triggern) ---
    const autoClarify = !clarifyQuestion && looksLikePatientInfoQuery(lastStudentText);
    const clarify = (clarifyQuestion || (autoClarify ? lastStudentText : "")).trim();

    // --- Drei-Versuche-Logik + Give-up ---
    const inferredAttempt = inferAttemptFromTranscript(transcript);
    const gaveUp = looksLikeGiveUp(lastStudentText);
    const effectiveAttempt = gaveUp ? 3 : Math.max(inferredAttempt, attemptStage ?? 1);

    /* ---------- MODE B: Zusatzinfos (Clarify) ---------- */
    if (clarify) {
      const sysClarify = `Du bist Prüfer:in.
Auf Nachfrage gibst du ZUSÄTZLICHE PATIENTENDETAILS, realistisch zur Vignette und zum aktuellen Schritt.
Form: 1–3 Sätze ODER 2–3 Bulletpoints (mit "- ").
Kein Spoiler (keine Enddiagnose, keine definitive Therapie).
Keine erfundenen Labor-/Bildbefunde; bleibe auf Anamnese/Untersuchungsebene, außer wenn der Schritt ausdrücklich Diagnostik betrifft.
Deutsch.`;

      const usrClarify = `Vignette: ${caseText}
CURRENT_STEP_PROMPT: ${currentPrompt || "(unbekannt)"}
Nachfrage des Studierenden: ${clarify}
Gib NUR die Zusatzinformation (ohne Präambel/Bewertung).`;

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

      if (userId) {
        void logTurn(supabase, {
          userId,
          caseId,
          attemptStage: effectiveAttempt,
          tipRequest: false,
          explainRequest: false,
          clarifyQuestion: clarify,
          focusQuestion: currentPrompt || null,
          lastStudentAnswer: lastStudentText || null,
          modelOut: payload,
        });
      }

      return NextResponse.json(payload);
    }

    /* ---------- MODE D: Erklärung ---------- */
    if (explainRequest) {
      const sysExplain = `Du bist Prüfer:in am 2. Tag (Theorie) des M3.
Erkläre KURZ die Qualität der Antwort auf die CURRENT_STEP_PROMPT:
- 2–5 knappe Punkte: Kerngedanke, warum richtig/falsch, typische Fallen, Mini-Merksatz.
- attemptStage=1/2: keine konkreten Beispiele/Lösungen nennen (nur Kategorien/Hinweise).
- KEINE neue Frage stellen. Deutsch.`;

      const fallbackQuestion =
        (currentPrompt || explainContext?.question?.trim()) ||
         ([...transcript].reverse().find((t) => t.role === "examiner" && /\?\s*$/.test(t.text))?.text || "");
      const fallbackAnswer =
        explainContext?.lastAnswer?.trim() ||
        ([...transcript].reverse().find((t) => t.role === "student")?.text || "");

      const usrExplain = `Vignette: ${caseText}
CURRENT_STEP_PROMPT: ${fallbackQuestion || "(unbekannt)"}
Antwort: ${fallbackAnswer || "(unbekannt)"}
attemptStage: ${effectiveAttempt}
${outline.length ? `Prüfungs-Outline: ${outline.join(" • ")}` : ""}
Gib nur die kurze Erklärung (ohne neue Aufgabe).`;

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

      if (userId) {
        void logTurn(supabase, {
          userId,
          caseId,
          attemptStage: effectiveAttempt,
          tipRequest: false,
          explainRequest: true,
          clarifyQuestion: null,
          focusQuestion: fallbackQuestion || null,
          lastStudentAnswer: fallbackAnswer || null,
          modelOut: payload,
        });
      }

      return NextResponse.json(payload);
    }

    /* ---------- KICKOFF ---------- */
    {
      const lastStudentIdx = [...transcript].map((t) => t.role).lastIndexOf("student");
      const lastExaminerIdx = [...transcript].map((t) => t.role).lastIndexOf("examiner");
      const noStudentAfterExaminer =
        lastExaminerIdx >= 0 && (lastStudentIdx < lastExaminerIdx || lastStudentIdx === -1);

      const isJustVignetteStart =
        transcript.length === 1 &&
        transcript[0]?.role === "examiner" &&
        !/[?？]\s*$/.test(transcript[0]?.text || "");

      // Falls stepsPrompts[0] vorhanden ist, nimm die als Startfrage (kein LLM nötig)
      if (noStudentAfterExaminer || isJustVignetteStart) {
        if (stepsPrompts[0]) {
          const payload: ApiOut = {
            say_to_student: null,
            evaluation: null,
            next_question: stepsPrompts[0],
            end: false,
          };

          if (userId) {
            void logTurn(supabase, {
              userId,
              caseId,
              attemptStage: 1,
              tipRequest: false,
              explainRequest: false,
              clarifyQuestion: null,
              focusQuestion: stepsPrompts[0],
              lastStudentAnswer: null,
              modelOut: payload,
            });
          }

          return NextResponse.json(payload);
        }

        // Fallback (nur falls kein stepsPrompts übergeben wurde)
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
        const q = stripMd(qRaw);

        const payload: ApiOut = {
          say_to_student: null,
          evaluation: null,
          next_question: q.endsWith("?") ? q : `${q}?`,
          end: false,
        };

        if (userId) {
          void logTurn(supabase, {
            userId,
            caseId,
            attemptStage: 1,
            tipRequest: false,
            explainRequest: false,
            clarifyQuestion: null,
            focusQuestion: payload.next_question,
            lastStudentAnswer: null,
            modelOut: payload,
          });
        }

        return NextResponse.json(payload);
      }
    }

    /* ---------- MODE C: Normaler Prüfungszug ---------- */
    const sysExam = `Du bist Prüfer:in am 2. Tag (Theorie) des 3. Staatsexamens (M3).
Stil: ${style === "strict" ? "knapp, streng-sachlich" : "freundlich-klar, coaching-orientiert"}.
Sprache: Deutsch.
Im Transkript: Rollen student/examiner/patient – bewerte ausschließlich student.

KONTEXT-REGELN:
- Beziehe dich NUR auf Vignette + bereits preisgegebene Informationen.
- Nichts dazuerfinden (insb. keine Labor-/Bildbefunde, die nicht genannt wurden).
- Es wird ausschließlich die AKTUELLE Frage bewertet (CURRENT_STEP_PROMPT).

VERSUCHSLOGIK (hart):
- Drei Versuche (attemptStage=1..3). Give-up zählt wie 3.
- attemptStage=1/2 UND nicht korrekt: 1–3 Sätze Feedback (kategorial/prozessual), optional 1 Tipp. KEINE Beispiele/konkreten Diagnosen/Labor-/Bild-Befunde. next_question = null.
- attemptStage=3 ODER Give-up: say_to_student MUSS mit "Lösung:" beginnen. 1–2 Sätze Kernlösung + 1–3 sehr kurze Bullet-Begründungen (Fallen/Merksatz). next_question = NEXT_STEP_PROMPT (falls vorhanden).
- Antwort ist korrekt ⇒ next_question = NEXT_STEP_PROMPT (falls vorhanden); end=true falls letzter Schritt.

REGEL-ENGINE (RULE_JSON):
- mode="exact": Antwort muss exakt eines der expected (inkl. Synonyme) treffen; forbidden → incorrect.
- mode="anyOf":
  • Treffer, wenn ≥ (minHits||1) Elemente aus expected/synonyms genannt werden.
  • Forbidden-Keywords machen die Antwort incorrect, wenn sie zentral sind oder mehrfach auftreten.
- mode="allOf":
  • required müssen alle (über Synonyme) erkannt werden; optional zählen für Feedback, nicht für Korrektheit.
  • minHits kann verwendet werden, um Teilmengen zu erlauben → dann "partially_correct".
- mode="categories":
  • Es zählen Kategoriennamen nicht – nur Nennungen aus den Kategorie-Listen.
  • Korrekt, wenn ≥ (minCategories||1) verschiedene Kategorien jeweils ≥1 Treffer haben UND (minHits||0) gesamt erfüllt ist.
- mode="numeric": prüfe numeric.min/max/equals gegen eindeutig genannte Zahlenwerte.
- mode="regex": prüfe regex gegen die Antwort.
- synonyms: Map aus Canon → [Synonyme]. Ein Synonym zählt wie der Canon.

BEWERTUNG:
- correctness: "correct" | "partially_correct" | "incorrect" gemäß obiger Logik.
- feedback: 1–3 Sätze, präzise, ohne Markdown. Bei attempt<3 keine Spoiler/Beispiele.
- tips (optional): 1 Satz, spoilerfrei.

AUSGABE NUR als JSON exakt im Schema:
{
  "say_to_student": string | null,
  "evaluation": { "correctness": "correct"|"partially_correct"|"incorrect", "feedback": string, "tips"?: string } | null,
  "next_question": string | null,
  "end": boolean
}`;

    const usrExam = `Vignette: ${caseText}

CURRENT_STEP_PROMPT: ${currentPrompt || "(unbekannt)"}
NEXT_STEP_PROMPT: ${nextPrompt ?? "(keine – letzter Schritt)"}
RULE_JSON (für CURRENT_STEP_PROMPT):
${JSON.stringify(stepRule ?? {}, null, 2)}

attemptStage: ${effectiveAttempt}
Transkript (letzte 20 Züge, Rollen: student/examiner/patient):
${JSON.stringify(transcript.slice(-20), null, 2)}

${outline.length ? `ZIELE: ${objectives.map(o => `${o.id}: ${o.label}`).join(" | ")}` : ""}
${completion ? `COMPLETION: ${JSON.stringify(completion)}` : ""}
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

    // Spoiler-Schutz für frühe Versuche
    if (payload.evaluation && effectiveAttempt < 3) {
      payload.evaluation.feedback = sanitizeForEarlyAttempts(payload.evaluation.feedback || "");
      if (payload.evaluation.tips) {
        payload.evaluation.tips = sanitizeForEarlyAttempts(payload.evaluation.tips);
      }
    }
    // Doppel-"Tipp:" bereinigen
    if (payload.evaluation?.tips) {
      payload.evaluation.feedback = (payload.evaluation.feedback || "").replace(/^\s*tipp:\s*/i, "");
    }

    // --- Guards für 3-Versuche-System ---
    const isCorrect = payload.evaluation?.correctness === "correct";

    // attempt < 3 & nicht korrekt: NICHT weiter
    if (effectiveAttempt < 3 && !isCorrect) {
      payload.next_question = null;
      payload.end = false;
    }

    // Bei korrekt → zwingend zum nächsten Schritt
    if (isCorrect) {
      payload.next_question = nextPrompt ?? null;
      payload.end = !nextPrompt;
      if (!payload.say_to_student) {
        payload.say_to_student = "Gut, weiter geht’s.";
      }
    }

    // Beim dritten Versuch (oder Give-up) MUSS Lösung kommen, dann weiter (falls möglich)
    if (effectiveAttempt === 3) {
      if (!payload.say_to_student || !/lösung/i.test(payload.say_to_student)) {
        payload.say_to_student = (payload.say_to_student && payload.say_to_student.trim().length > 0)
          ? `Lösung: ${payload.say_to_student}`
          : "Lösung: (Hier 1–2 Sätze zur Kernlösung + 1–3 kurze Begründungen/Merksätze.)";
      }
      payload.next_question = nextPrompt ?? null;
      payload.end = !nextPrompt;
    }

    // 🔐 Persistenz (nicht blockierend)
    if (userId) {
      const lastStudentAns = lastStudentText || null;
      void logTurn(supabase, {
        userId,
        caseId,
        attemptStage: effectiveAttempt,
        tipRequest: false,
        explainRequest: false,
        clarifyQuestion: null,
        focusQuestion: payload.next_question,
        lastStudentAnswer: lastStudentAns,
        modelOut: payload,
      });
      if (typeof points === "number" || typeof progressPct === "number") {
        void upsertProgress(supabase, { userId, caseId, points, progressPct });
      }
    }

    return NextResponse.json(payload);

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : typeof err === "string" ? err : "LLM error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/* ---------------------- Helpers: Supabase Writes ---------------------- */

type LogTurnArgs = {
  userId: string;
  caseId?: string;
  attemptStage: number;
  tipRequest: boolean;
  explainRequest: boolean;
  clarifyQuestion: string | null;
  focusQuestion: string | null;
  lastStudentAnswer: string | null;
  modelOut: ApiOut;
};

async function logTurn(
  supabase: ReturnType<typeof createClient>,
  args: LogTurnArgs
) {
  try {
    await supabase.from("exam_turns").insert({
      user_id: args.userId,
      case_id: args.caseId ?? null,
      attempt_stage: args.attemptStage,
      tip_request: args.tipRequest,
      explain_request: args.explainRequest,
      clarify_question: args.clarifyQuestion,
      focus_question: args.focusQuestion,
      last_student_answer: args.lastStudentAnswer,
      model_out: args.modelOut,
    });
  } catch {
    // bewusst geschluckt – App-Fluss nicht stören
  }
}

async function upsertProgress(
  supabase: ReturnType<typeof createClient>,
  params: { userId: string; caseId?: string; points?: number; progressPct?: number }
) {
  const { userId, caseId, points, progressPct } = params;
  if (!caseId) return;
  try {
    await supabase
      .from("user_progress")
      .upsert({
        user_id: userId,
        case_id: caseId,
        points: typeof points === "number" ? points : undefined,
        progress_pct: typeof progressPct === "number" ? progressPct : undefined,
        updated_at: new Date().toISOString(),
      });
  } catch {
    // nicht blockieren
  }
}