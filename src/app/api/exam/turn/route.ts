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

type KickoffHistoryItem = { step?: number; role?: string; text?: string };
type NormalizedHistoryItem = { step: number | null; role: "examiner" | "student"; text: string };

/* ---------------------- Rule-Engine ---------------------- */

type RuleJson =
  | {
      exact?: { expected?: string[]; forbidden?: string[] };
      anyOf?: { expected?: string[]; minHits?: number };
      allOf?: { expected?: string[]; minHits?: number };
      categories?: Record<string, { items: string[] }> | Array<{ items: string[] }>;
      numeric?: { min?: number; max?: number };
      regex?: string;
      synonyms?: Record<string, string[]>;
    }
  | Record<string, unknown>; // fallback, falls extern andere Strukturen kommen

/* ---------------------- Request Body ---------------------- */

type BodyIn = {
  caseText?: string;
  transcript?: TranscriptItem[];
  outline?: string[];
  style?: "coaching" | "strict";
  tipRequest?: boolean;
  explainRequest?: boolean;
  clarifyQuestion?: string;
  objectives?: ObjMin[];
  solutionRequest?: boolean;
  completion?: CompletionRules | null;
  attemptStage?: number;
  focusQuestion?: string;
  explainContext?: ExplainContext;
  caseId?: string;
  points?: number;
  progressPct?: number;

  stepIndex?: number;
  stepsPrompts?: string[];
  stepRule?: RuleJson | null;

  kickoff?: boolean;
  kickoffStepIndex?: number;
  kickoffFromStep?: number;
  kickoffFromQuestion?: string;
  kickoffLastStudent?: string;
  kickoffHistory?: KickoffHistoryItem[];
};

/* ---------------------- Utils ---------------------- */

function stripMd(s: string): string {
  return (s || "")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, "$1")
    .replace(/^\-\s+/gm, "• ")
    .trim();
}



function looksLikeGiveUp(s: string): boolean {
  const t = (s || "").trim().toLowerCase();
  if (!t) return false;
  const kw = [
    "weiß nicht"
  ];
  return kw.some(k => t.includes(k));
}

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

function sanitizeForEarlyAttempts(txt: string): string {
  if (!txt) return "";
  let s = txt;
  s = s.replace(/^\s*tipp:\s*/i, "");
  return s.trim();
}

function normalizeText(s: string): string {
  return (s || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9äöüß\s-]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function studentSinceLastExaminerQuestion(transcript: TranscriptItem[]): string[] {
  let lastQIdx = -1;
  for (let i = transcript.length - 1; i >= 0; i--) {
    const t = transcript[i];
    if (t.role === "examiner" && /\?\s*$/.test((t.text || "").trim())) { lastQIdx = i; break; }
  }
  return transcript.slice(lastQIdx + 1).filter(t => t.role === "student").map(t => t.text || "");
}

function collectCanonAndSynonyms(rule: RuleJson | null): Array<{ canon: string; alts: string[] }> {
  const out = new Map<string, Set<string>>();
  const push = (canon: string, alt?: string) => {
    const c = normalizeText(canon);
    if (!c) return;
    if (!out.has(c)) out.set(c, new Set<string>());
    if (alt) out.get(c)!.add(normalizeText(alt));
  };

  const walk = (node: unknown): void => {
    if (!node) return;
    if (Array.isArray(node)) { node.forEach(walk); return; }
    if (typeof node === "object") {
      const obj = node as Record<string, unknown>;
      for (const key of ["expected", "required", "items"]) {
        const arr = obj[key];
        if (Array.isArray(arr)) for (const v of arr) if (typeof v === "string") push(v);
      }
      const cats = obj["categories"];
      if (cats && typeof cats === "object") {
        if (Array.isArray(cats)) {
          for (const c of cats) {
            const it = (c as { items?: unknown })?.items;
            if (Array.isArray(it)) for (const v of it) if (typeof v === "string") push(v);
          }
        } else {
          for (const v of Object.values(cats as Record<string, unknown>)) {
            if (Array.isArray(v)) {
              for (const s of v) if (typeof s === "string") push(s);
            } else if (v && typeof v === "object" && Array.isArray((v as { items?: unknown }).items)) {
              for (const s of (v as { items: unknown[] }).items) if (typeof s === "string") push(s);
            }
          }
        }
      }
      if (obj.synonyms && typeof obj.synonyms === "object") {
        const syn = obj.synonyms as Record<string, unknown>;
        for (const [canon, alts] of Object.entries(syn)) {
          push(canon);
          if (Array.isArray(alts)) for (const a of alts) if (typeof a === "string") push(canon, a);
        }
      }
      for (const v of Object.values(obj)) walk(v);
    }
  };

  walk(rule);
  return Array.from(out.entries()).map(([canon, set]) => ({ canon, alts: Array.from(set) }));
}

function buildStudentUnion(studentTexts: string[], rule: RuleJson | null): string[] {
  const haystack = normalizeText(studentTexts.join(" \n "));
  const entries = collectCanonAndSynonyms(rule);
  const hits: string[] = [];
  for (const { canon, alts } of entries) {
    const variants = [canon, ...alts].map(normalizeText).filter(Boolean);
    if (variants.some(v => haystack.includes(v))) hits.push(canon);
  }
  if (hits.length === 0) {
    const rawPieces = studentTexts
      .join(", ")
      .split(/[,;]| und | sowie /gi)
      .map(s => normalizeText(s))
      .map(s => s.replace(/\s+/g, " ").trim())
      .filter(s => s.length >= 3 && s.length <= 60);
    return Array.from(new Set(rawPieces));
  }
  return Array.from(new Set(hits));
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
    
    const objectives: ObjMin[] = Array.isArray(body.objectives) ? body.objectives : [];
    const completion: CompletionRules | null = body.completion ?? null;
    const attemptStage = typeof body.attemptStage === "number" ? body.attemptStage : 1;
    const focusQuestion = typeof body.focusQuestion === "string" ? body.focusQuestion.trim() : "";
    const explainContext = body.explainContext && typeof body.explainContext === "object" ? body.explainContext : undefined;
    const points = typeof body.points === "number" ? body.points : undefined;
    const progressPct = typeof body.progressPct === "number" ? body.progressPct : undefined;
    const solutionRequest = Boolean(body.solutionRequest);

    // Schritt-Kontext
    const stepIndex = typeof body.stepIndex === "number" ? body.stepIndex : 0;
    const stepsPrompts = Array.isArray(body.stepsPrompts) ? body.stepsPrompts : [];
    const stepRule = body.stepRule ?? null;

    const kickoffFlag = Boolean(body.kickoff);
    const kickoffStepIndex =
      typeof body.kickoffStepIndex === "number" && body.kickoffStepIndex >= 0
        ? Math.floor(body.kickoffStepIndex)
        : 0;
    const kickoffFromStep =
      typeof body.kickoffFromStep === "number" && body.kickoffFromStep >= 0
        ? Math.floor(body.kickoffFromStep)
        : null;
    const kickoffFromQuestion =
      typeof body.kickoffFromQuestion === "string" && body.kickoffFromQuestion.trim()
        ? body.kickoffFromQuestion.trim()
        : null;
    const kickoffLastStudent =
      typeof body.kickoffLastStudent === "string" && body.kickoffLastStudent.trim()
        ? body.kickoffLastStudent.trim()
        : null;
    const kickoffHistoryRaw: KickoffHistoryItem[] = Array.isArray(body.kickoffHistory)
      ? body.kickoffHistory
      : [];
    const kickoffHistory: NormalizedHistoryItem[] = kickoffHistoryRaw
      .map((item) => {
        if (!item || typeof item !== "object") return null;
        const role = item.role === "examiner" ? "examiner" : "student";
        const text = typeof item.text === "string" ? item.text.trim() : "";
        const step = typeof item.step === "number" ? Math.floor(item.step) : null;
        if (!text) return null;
        return { role, text, step };
      })
      .filter((x): x is NormalizedHistoryItem => Boolean(x));

    // Abgeleitete Prompts
    const currentPrompt =
      (stepsPrompts[stepIndex] || "").trim()
      || focusQuestion
      || ([...transcript].reverse().find(t => t.role === "examiner" && /\?\s*$/.test(t.text))?.text?.trim() || "");
    const nextPrompt = (stepsPrompts[stepIndex + 1] || "").trim() || null;

    if (!caseText) {
      return NextResponse.json({ error: "Bad request: caseText ist erforderlich." }, { status: 400 });
    }

    // Supabase
    const supabase = createClient();
    const { data: userRes } = await supabase.auth.getUser();
    const userId = userRes?.user?.id ?? null;

    // --- Nachfrage/Letzte Antwort vorbereiten ---
const lastStudentText =
  [...transcript].reverse().find((t) => t.role === "student")?.text?.trim() || "";

  // --- Drei-Versuche-Logik + Give-up ---
const inferredAttempt = inferAttemptFromTranscript(transcript);
const gaveUp = looksLikeGiveUp(lastStudentText);
const effectiveAttempt = gaveUp ? 3 : Math.max(inferredAttempt, attemptStage ?? 1);

    // --- KUMULATIV: alle student-Antworten seit der letzten Frage sammeln ---
    const studentTextsWindow = studentSinceLastExaminerQuestion(transcript);
    const student_so_far_text = studentTextsWindow.join("\n").trim();
    const student_union = buildStudentUnion(studentTextsWindow, stepRule);

    /* ---------- MODE A: Tipp (nur per Button) ---------- */
    if (tipRequest) {
      const sysTip = `Du bist Prüfer:in im 3. Staatsexamen (M3, Tag 2 – Theorie).
        Gib GENAU EINEN sehr kurzen Tipp (1 Satz) zur CURRENT_STEP_PROMPT.
        - attemptStage=1: sehr allgemein (Vorgehen/Kategorien/Prioritäten).
        - attemptStage=2: etwas fokussierter auf die Prüfungslogik des Schritts.
        - KEINE Beispiele, KEINE Diagnosen, KEINE Laborwerte/Bildgebungsbefunde, keine Spoiler, nicht die richtige antwort.
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
        temperature: 0.5,
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
          solutionRequest: false,
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
  /* ---------- MODE B: Lösung (nur per Button) ---------- */
    if (solutionRequest) {
      const sysSolution = `Du bist Prüfer:in am 2. Tag (Theorie) des 3. Staatsexamens (M3).
        Ziel: Formuliere eine kompakte Musterlösung zur CURRENT_STEP_PROMPT.

        Vorgehen:
        - Greife nur auf Vignette + offiziell preisgegebene Informationen dieses Falls/Schritts zurück.
        - Beziehe STUDENT_TEXT ein, indem du würdigst, was bereits genannt wurde, und setze die fehlenden Kernelemente klar dagegen.
        - Strukturiere nach Leitgedanken (Diagnose, Kernaussagen, Differenzialdiagnosen, nächster Schritt).

        Format:
        - Satz 1: Kurze wertschätzende Einordnung der bisherigen Antwort (Sie-Form).
        - Satz 2–3: "Lösung: …" mit der Kernantwort.
        - Danach 2–3 Bulletpoints (•) mit den wichtigsten Ergänzungen/Begründungen.
        - Kein weiterer Fließtext, keine Fragen, keine Emojis.
        - Deutsch.`;

              const usrSolution = `Vignette: ${caseText}
        CURRENT_STEP_PROMPT: ${currentPrompt || "(unbekannt)"}
        RULE_JSON (für CURRENT_STEP_PROMPT):
        ${JSON.stringify(stepRule ?? {}, null, 2)}

        STUDENT_TEXT:
        ${student_so_far_text || "(leer)"}

        ${outline.length ? `Prüfungs-Outline: ${outline.join(" • ")}` : ""}
        ${completion ? `COMPLETION: ${JSON.stringify(completion)}` : ""}
        Gib NUR den Lösungstext zurück.`;

      const outSolution = await client.chat.completions.create({
        model,
        messages: [
          { role: "system", content: sysSolution },
          { role: "user", content: usrSolution },
        ],
        temperature: 0.4,
      });

      const sayRaw = (outSolution.choices?.[0]?.message?.content || "").trim();
      const sayClean = stripMd(sayRaw).replace(/\n{3,}/g, "\n\n").trim();
      const say = sayClean
        ? sayClean.match(/^lösung/i)
          ? sayClean
          : `Lösung: ${sayClean}`
        : "Lösung: (Kurz würdigen, dann 2–3 Kernaussagen und nächste Schritte als Bulletpoints.)";

      const payload: ApiOut = {
        say_to_student: say,
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
          solutionRequest: false,
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


    

    /* ---------- MODE D: Erklärung (kumulativ) ---------- */
if (explainRequest) {
  const sysExplain = `Du bist Prüfer:in am 2. Tag (Theorie) des M3.
Ziel: eine kurze, flüssige Einordnung der STUDIERENDENANTWORTEN zur CURRENT_STEP_PROMPT.
Beziehe dich NUR auf Vignette + bereits preisgegebene Informationen dieses Falls/Schritts.

WICHTIG: KUMULATIV BEWERTEN
- Nutze die kumulierten Felder:
  • CUMULATED_STUDENT_TEXT = alle bisherigen Antworten seit der letzten Prüferfrage (roh)
  • CUMULATED_STUDENT_LIST = deduplizierte extrahierte Items/Begriffe
- Erkläre bezogen auf die Gesamtheit dieser Angaben (nicht nur die letzte Nachricht).

FORMAT
- ZUERST 1–2 Sätze in natürlicher Prosa (keine Liste), die die Antwort einordnen kontextbezogen.
- DANACH optional maximal 2 sehr knappe Bulletpoints (mit "- "), nur wenn sie echten Mehrwert bieten (Struktur/Prio/Falle). Warum gerade wichtig etc.
- Keine neue Frage stellen. Keine Meta-Sprache in der Ich-/Du-Form („deine Antwort ist…“ vermeiden), keine Emojis, keine Auslassungspunkte, keine Platzhalter.

SPOILER-SCHUTZ
- Bei attemptStage 1/2: Striktes Spoilerverbot. Keine neuen Diagnosen, Beispiele, Labor-/Bild-Befunde oder Schlüsselbegriffe, die NICHT von der/dem Studierenden genannt oder offiziell preisgegeben wurden.
- Duzen (du/dir/dein). Deutsch.`;

  const fallbackQuestion =
    (currentPrompt || explainContext?.question?.trim()) ||
     ([...transcript].reverse().find((t) => t.role === "examiner" && /\?\s*$/.test(t.text))?.text || "");

  // <- WICHTIG: wir erklären jetzt kumulativ (nicht nur die letzte Antwort)
  const usrExplain = `Vignette: ${caseText}
CURRENT_STEP_PROMPT: ${fallbackQuestion || "(unbekannt)"}
attemptStage: ${effectiveAttempt}

RULE_JSON (für CURRENT_STEP_PROMPT):
${JSON.stringify(stepRule ?? {}, null, 2)}

CUMULATED_STUDENT_TEXT:
${student_so_far_text || "(leer)"}

CUMULATED_STUDENT_LIST:
${JSON.stringify(student_union)}

${outline.length ? `Prüfungs-Outline: ${outline.join(" • ")}` : ""}
Gib NUR den kurzen Erklärungstext zurück (1–2 Sätze + optional bis zu 2 Bullets mit "- ").`;

  const outExplain = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: sysExplain },
      { role: "user", content: usrExplain },
    ],
    temperature: 0.5,
  });

  const say = stripMd((outExplain.choices?.[0]?.message?.content || "").trim()) ||
    "Kurz eingeordnet: Inhaltlich passend und kontextgerecht begründet.";
  const payload: ApiOut = { say_to_student: say, evaluation: null, next_question: null, end: false };

  if (userId) {
        void logTurn(supabase, {
          userId,
          caseId,
          attemptStage: effectiveAttempt,
          tipRequest: false,
          explainRequest: true,
          solutionRequest: false,
          clarifyQuestion: null,
          focusQuestion: fallbackQuestion || null,
          lastStudentAnswer: student_so_far_text || null, // <- kumulativ loggen
          modelOut: payload,
        });

  return NextResponse.json(payload);
}}

    /* ---------- KICKOFF ---------- */
    {
      const shouldKickoff = transcript.length === 0;

      if (shouldKickoff) {
        const stepForKickoff = kickoffFlag ? kickoffStepIndex : Math.max(0, stepIndex);
        const promptFromList = (stepsPrompts[stepForKickoff] || "").trim();
        const firstPrompt = promptFromList || currentPrompt || focusQuestion || "";

        let sysKickoff: string;
        let usrKickoff: string;

        if (kickoffFlag && stepForKickoff > 0) {
          const historySlice = kickoffHistory.slice(-10);
          const historyText = historySlice
            .map((item) => {
              const stepLabel =
                typeof item.step === "number" && item.step >= 0
                  ? `Schritt ${item.step + 1}`
                  : "Schritt";
              const who = item.role === "examiner" ? "Prüfer:in" : "Studierende:r";
              return `${stepLabel} – ${who}: ${item.text}`;
            })
            .join("\n");

          sysKickoff = `Du bist Prüfer:in am 2. Tag (Theorie) des M3.
            Du setzt nach einem beantworteten Schritt die Prüfung fort.
            Aufgabe:
            1. Formuliere EINEN kurzen Übergangssatz (1–2 Sätze) in der Sie-Form, der auf den bisherigen Verlauf Bezug nimmt und den nächsten Themenblock anmoderiert. Kein Fragezeichen am Ende.
            2. Stelle anschließend die nächste Prüfungsfrage auf Basis von NEXT_PROMPT. Die Frage darf eine sehr kurze Hinführung enthalten, endet aber mit einem klaren Fragezeichen.
            Keine Floskeln oder Smalltalk, bleibe im fachlichen Prüfungston.
            Format: JSON exakt {"intro": "...", "question": "..."}. Keine weiteren Felder. Sprache: Deutsch.`;

          usrKickoff = `CASE_ID: ${caseId ?? "(unbekannt)"}
            CASE_VIGNETTE: ${caseText}
            LETZTER_SCHRITT_INDEX: ${kickoffFromStep ?? stepForKickoff - 1}
            LETZTE_FRAGE: ${kickoffFromQuestion || "(unbekannt)"}
            LETZTE_STUDIERENDEN_ANTWORT: ${kickoffLastStudent || "(leer)"}
            GESPRÄCHSVERLAUF_BISHER (letzte ${historySlice.length} Beiträge):
            ${historyText || "(leer)"}
            NEXT_STEP_INDEX: ${stepForKickoff}
            NEXT_PROMPT: ${firstPrompt || "(unbekannt)"}
            STIL: ${style}
            ${outline.length ? `OUTLINE: ${outline.join(" • ")}` : ""}
            ${objectives.length ? `ZIELE: ${objectives.map((o) => `${o.id}: ${o.label}`).join(" | ")}` : ""}
            Gib NUR das JSON-Objekt zurück.`;
        } else {
          sysKickoff = `Du bist Prüfer:in am 2. Tag (Theorie) des M3.
            Ziel: realistischer Prüfungsauftakt.
            Vorgehen:
            1. Begrüße die/den Studierenden kurz und wertschätzend zur Prüfung in der Sie-Form (1 Satz).
            2. Schilder die Fallvignette in 3–5 Sätzen frei paraphrasiert auf Basis von CASE_VIGNETTE – ergänze nur glaubhafte Details, die den Fall rahmen. Weise darauf hin, dass jetzt die strukturierte Befragung startet.
            Format: JSON exakt {"intro": "...", "question": "..."}. Die Frage basiert auf CURRENT_STEP_PROMPT und endet mit einem Fragezeichen.
            Sprache: Deutsch.`;

          usrKickoff = `CASE_ID: ${caseId ?? "(unbekannt)"}
            CASE_VIGNETTE: ${caseText}
            CURRENT_STEP_PROMPT: ${firstPrompt || "(unbekannt)"}
            STIL: ${style}
            ${outline.length ? `OUTLINE: ${outline.join(" • ")}` : ""}
            ${objectives.length ? `ZIELE: ${objectives.map((o) => `${o.id}: ${o.label}`).join(" | ")}` : ""}
            Gib NUR das JSON-Objekt zurück.`;
        }

        const outKick = await client.chat.completions.create({
          model,
          messages: [
            { role: "system", content: sysKickoff },
            { role: "user", content: usrKickoff },
          ],
          temperature: 1.0,
        });

        const rawKick = (outKick.choices?.[0]?.message?.content || "").trim();
        let jsonKick = rawKick.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
        if (!(jsonKick.startsWith("{") && jsonKick.endsWith("}"))) {
          const s = jsonKick.indexOf("{");
          const e = jsonKick.lastIndexOf("}");
          if (s >= 0 && e > s) jsonKick = jsonKick.slice(s, e + 1);
        }

        let intro = "";
        let question = "";
        try {
          const parsed = JSON.parse(jsonKick) as { intro?: string; question?: string };
          intro = typeof parsed.intro === "string" ? parsed.intro : "";
          question = typeof parsed.question === "string" ? parsed.question : "";
        } catch {
          // Fallback weiter unten
        }

        const introClean = stripMd(intro).replace(/\n{3,}/g, "\n\n").trim();
        let questionClean = stripMd(question).trim();
        if (!questionClean) questionClean = firstPrompt;
        if (questionClean && !/[?？]\s*$/.test(questionClean)) {
          questionClean = `${questionClean}?`;
        }

        const payload: ApiOut = {
          say_to_student: introClean || null,
          evaluation: null,
          next_question: questionClean || null,
          end: false,
        };

        if (userId) {
          void logTurn(supabase, {
            userId,
            caseId,
            attemptStage: 1,
            tipRequest: false,
            explainRequest: false,
            solutionRequest: false,
            clarifyQuestion: null,
            focusQuestion: questionClean || null,
            lastStudentAnswer: kickoffLastStudent || null,
            modelOut: payload,
          });
        }

        return NextResponse.json(payload);
      }
    }

    /* ---------- MODE C: Normaler Prüfungszug ---------- */
    const sysExam = `Du bist Prüfer:in am 2. Tag (Theorie) des 3. Staatsexamens (M3).
            Stil: ${style === "strict" ? "knapp, streng-sachlich" : "freundlich-klar, coaching-orientiert"}.
            Ansprache: Sie.
            Sprache: Deutsch.
            Im Transkript: Rollen student/examiner/patient – bewerte ausschließlich student.

            KONTEXT-REGELN
            - Beziehe dich NUR auf Vignette + bereits preisgegebene Infos.
            - Bewerte ausschließlich die AKTUELLE Frage (CURRENT_STEP_PROMPT).

            KUMULATIVE WERTUNG (wichtig)
            - Entscheide die Korrektheit nach der **Gesamtheit** der bisher genannten Inhalte in diesem Schritt.
            - Du erhältst dazu strukturierte Felder:
              • CUMULATED_STUDENT_TEXT = student_so_far_text
              • CUMULATED_STUDENT_LIST = student_union (deduplizierte Items)
            - **Zähle erfüllte Regeln über alle bisherigen Versuche zusammen** (Union). Wenn die Summe aus alten+aktuellen Antworten die Regel erfüllt, ist die Antwort 'correct' – auch wenn die letzte Einzelnachricht allein nicht ausreichen würde.
            - Doppelnennungen zählen nicht mehrfach;
            - Falls etwas falsch geschrieben ist, z.b. Rechtschreibung stark abweichend; Tippfehler, ausgelassene Buchstaben, verdrehte Buchstaben und Schreibweisen nach Lautsprache (z. B. „Kolezüstitis“ für „Cholezystitis“), dann auch als richtig zählen.

            NO-LEAK GUARD (streng, verbindlich)
            - In attemptStage 1/2 UND correctness != "correct": KEINE konkreten Inhalte nennen, die noch fehlen.
            - KEINE Aufzählungen („: …“, „z. B. …“, „etwa …“, „wie …“, „insbesondere …“) und KEINE Schlüsselwörter/Beispiele.
            - Nur Meta-Hinweis (max. 1 Satz), z. B.: „Es fehlen noch mehrere Bereiche; strukturieren Sie vollständig.“
            - Maximale Länge von evaluation.feedback bei attemptStage 1/2: 2 Sätze, keine Listen/Beispiele.


            AUSDRUCK & TON
            -  Keine Emojis/Auslassungspunkte/Klammer-Meta.
            - Sprich in klaren, vollständigen Sätzen und nimm Bezug auf den laufenden Prüfungsdialog.

            BEWERTUNG & EINORDNUNG
            - evaluation.feedback besteht aus einem klaren Bewertungssatz plus einem begründenden Teil in Hinblick auf die Krankheit.
            - Ordne die Angaben des Prüflings immer kurz im Gesamtfall ein, insbesondere mit Bezug zur zugrundeliegenden Erkrankung.
            - Wenn partially correct, gib einen sehr allgemeinen Hinweis, dass noch etwas fehlt

            VERSUCHSLOGIK (hart)
            - Drei Versuche (attemptStage 1-3). Give-up zählt wie 3.
            - attemptStage 1/2 UND nicht korrekt oder partially correct:
              • evaluation.feedback = 1 einordnender Satz Bewertung mit aussagekräftiger Begründung, allgemein, dass noch etwas fehlt, aaber nicht was!
              • evaluation.tips = weglassen (nur im Tipp-Modus).
              • next_question = null.
            - attemptStage 3 ODER Give-up:
              • say_to_student lobt den studenten für das bisher gesagte und ordnet es ein. Danach folgt zwingend eine klar bezeichnete Musterlösung (z. B. "Musterlösung: ..."), die den Kern erklärt. Starte mit einem Satz, der die bereits korrekten Angaben des Prüflings würdigt, und führe erst danach die ergänzenden Inhalte aus. Ergänze 2–3 Bullets (• Kerngedanke • Abgrenzung • nächster Schritt);
              
            - Antwort ist korrekt:
              • evaluation.feedback = 1 lobender Bestätigungssatz + 2–3 Sätze (warum passend • Einordnung in Hinsicht auf die Krankheit  • Ausblick).
              • next_question = Formuliere aus NEXT_STEP_PROMPT eine natürliche Übergangsfrage (mit Übergangsphrase); end=true falls letzter Schritt.

            TIPP-MODUS (tipRequest=true)
            - Nur "say_to_student" mit 1–2 neutralen Strukturhinweisen (keine Diagnosen/Beispiele). "evaluation" und "next_question" bleiben null.

            REGEL-ENGINE (RULE_JSON)
            - "exact": alle expected (Synonyme zulässig); forbidden → incorrect.
            - "anyOf": korrekt, wenn ≥ (minHits||1) aus expected/synonyms genannt werden.
            - "allOf": Gruppen müssen erfüllt sein; minHits erlaubt Teilpunkte.
            - "categories": korrekt, wenn ≥ (minCategories||1) Kategorien je ≥1 Item und (minHits||0) gesamt – auf Basis der **kumulierten** Nennungen.
            - "numeric"/"regex": wie definiert.
            - synonyms: Map Canon → [Synonyme].
            - Lasse auch alle synonyme der richtigen Antworten zählen. 
              •	Sei dabei sehr großzügig in der Bewertung. Paraphrasierung ist auch zulässig

            AUSGABE NUR als JSON exakt:
            {
              "say_to_student": string | null,
              "evaluation": { "correctness": "correct" | "partially_correct" | "incorrect", "feedback": string } | null,
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

CUMULATED_STUDENT_TEXT: ${student_so_far_text || "(leer)"}
CUMULATED_STUDENT_LIST: ${JSON.stringify(student_union)}

${outline.length ? `ZIELE: ${objectives.map(o => `${o.id}: ${o.label}`).join(" | ")}` : ""}
${completion ? `COMPLETION: ${JSON.stringify(completion)}` : ""}
Erzeuge NUR das JSON-Objekt.`.trim();

    const outExam = await client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: sysExam },
        { role: "user", content: usrExam }
      ],
      temperature: 0.5
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
          // KEINE Auto-Tipps mehr (nur im Tipp-Modus) – falls LLM doch eins schickt, lassen wir es still zu.
          tips: payload.evaluation.tips ? stripMd(payload.evaluation.tips) : undefined,
        }
      : null;
    payload.next_question = stripMd((payload.next_question ?? "") as string) || null;
    payload.end = Boolean(payload.end);

    // Spoiler-Schutz NUR für frühe Versuche und NICHT bei korrekter Antwort
    if (payload.evaluation && effectiveAttempt < 3 && payload.evaluation.correctness !== "correct") {
      payload.evaluation.feedback = sanitizeForEarlyAttempts(payload.evaluation.feedback || "");
      if (payload.evaluation.tips) {
        payload.evaluation.tips = sanitizeForEarlyAttempts(payload.evaluation.tips);
      }
    }

    // --- Guards für 3-Versuche-System ---
    const isCorrect = payload.evaluation?.correctness === "correct";

    // attempt < 3 & nicht korrekt: NICHT weiter
    if (effectiveAttempt < 3 && !isCorrect) {
      payload.next_question = null;
      payload.end = false;
    }

    // Bei korrekt → kein automatischer Schrittwechsel
    if (isCorrect) {
      payload.next_question = null;
      payload.end = false;
      if (!payload.say_to_student) {
        payload.say_to_student = "Gut, weiter geht’s.";
      }
    }

    // Beim dritten Versuch (oder Give-up) ebenfalls manuell fortsetzen
    if (effectiveAttempt === 3) {
      payload.next_question = null;
      payload.end = false;
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
        solutionRequest: false,
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

// ---------------------- Helpers: Supabase Writes ----------------------

type LogTurnArgs = {
  userId: string;
  caseId?: string;
  attemptStage: number;
  tipRequest: boolean;
  explainRequest: boolean;
  solutionRequest: boolean;
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
      solution_request: args.solutionRequest,
      clarify_question: args.clarifyQuestion,
      focus_question: args.focusQuestion,
      last_student_answer: args.lastStudentAnswer,
      model_out: args.modelOut,
    });
  } catch {
    // bewusst geschluckt
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