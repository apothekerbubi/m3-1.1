// src/app/api/exam/final/route.ts
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type StepStatus = "correct" | "partial" | "incorrect" | "pending";

type StepPayload = {
  order: number;
  prompt: string;
  maxPoints: number;
  awardedPoints: number;
  status: StepStatus;
  rule: unknown;
  studentAnswers: string[];
};

type CaseInfoPayload = {
  id?: string;
  title?: string;
  shortTitle?: string | null;
  vignette?: string;
  specialty?: string | null;
  subspecialty?: string | null;
  leadSymptom?: string | null;
};

type FinalReportRequest = {
  case?: CaseInfoPayload;
  steps?: StepPayload[];
  totalPoints?: number;
  maxPoints?: number;
  studentAllAnswers?: string[];
};

type LLMReport = {
  steps?: Array<{
    order?: number;
    awarded?: number;
    max?: number;
    reason?: string;
  }>;
  totalPoints?: number;
  maxPoints?: number;
  percentage?: number;
  summary?: string;
  strengths?: string[];
  improvements?: string[];
  language?: { rating?: string; comment?: string };
};

function toStringArray(value: unknown, limit = 3): string[] {
  if (!Array.isArray(value)) return [];
  const clean = value
    .map((v) => (typeof v === "string" ? v : typeof v === "number" || typeof v === "boolean" ? String(v) : ""))
    .map((v) => v.trim())
    .filter((v) => v.length > 0);
  return clean.slice(0, limit);
}

function sanitizeReason(reason: unknown): string | undefined {
  if (typeof reason !== "string") return undefined;
  const trimmed = reason.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function clampScore(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 100) return 100;
  return Math.round(value);
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json({ error: "OPENAI_API_KEY fehlt" }, { status: 500 });
  }

  let body: FinalReportRequest;
  try {
    body = (await req.json()) as FinalReportRequest;
  } catch {
    return NextResponse.json({ error: "Ungültiger JSON-Body" }, { status: 400 });
  }

  const caseInfo = body.case ?? {};
  const stepsRaw = Array.isArray(body.steps) ? body.steps : [];
  if (stepsRaw.length === 0) {
    return NextResponse.json({ error: "Keine Schritt-Daten vorhanden" }, { status: 400 });
  }

  const steps = stepsRaw.map((step, idx) => {
    const max = Number.isFinite(step?.maxPoints) ? Number(step.maxPoints) : 0;
    const awarded = Number.isFinite(step?.awardedPoints) ? Number(step.awardedPoints) : 0;
    const status: StepStatus = ["correct", "partial", "incorrect", "pending"].includes(
      step?.status as StepStatus,
    )
      ? (step?.status as StepStatus)
      : "pending";
    const answers = Array.isArray(step?.studentAnswers)
      ? step.studentAnswers
          .map((ans) => (typeof ans === "string" ? ans : ""))
          .map((ans) => ans.trim())
          .filter((ans) => ans.length > 0)
          .map((ans) => (ans.length > 500 ? `${ans.slice(0, 500)}…` : ans))
      : [];

    return {
      order: Number.isFinite(step?.order) ? Number(step?.order) : idx + 1,
      prompt: typeof step?.prompt === "string" ? step.prompt : "",
      maxPoints: max,
      awardedPoints: Math.max(0, Math.min(awarded, max)),
      status,
      rule: step?.rule ?? null,
      studentAnswers: answers,
    };
  });

  const totalHint = steps.reduce((acc, step) => acc + (Number.isFinite(step.awardedPoints) ? step.awardedPoints : 0), 0);
  const maxHint = steps.reduce((acc, step) => acc + (Number.isFinite(step.maxPoints) ? step.maxPoints : 0), 0);
  const pctHint = maxHint > 0 ? Math.round((totalHint / maxHint) * 100) : 0;

  const studentAllAnswers = Array.isArray(body.studentAllAnswers)
    ? body.studentAllAnswers
        .map((ans) => (typeof ans === "string" ? ans : ""))
        .map((ans) => ans.trim())
        .filter((ans) => ans.length > 0)
    : steps.flatMap((step) => step.studentAnswers);
  const allAnswersText = studentAllAnswers.join("\n").slice(0, 4000);

  const client = new OpenAI({ apiKey });
  const model = (process.env.OPENAI_MODEL || "gpt-4o-mini").trim();

  const sysPrompt = `Du bist Prüfer:in im 3. Staatsexamen (Theorie, Tag 2). Du erhältst Vignette, Lösungsvorgaben (rule) und die kumulierten Antworten einer Kandidatin. Erstelle auf Basis dieser Daten eine Abschlussbewertung.

Arbeitsweise:
1. Analysiere jeden Schritt. Die Felder "studentAnswers" enthalten alle Antworten (kumuliert). Nutze "rule" als offizielle Lösungsvorgabe. Die Felder "status" und "awardedPoints" sind Hinweise aus der Einzelbewertung – übernimm diese Punkte, sofern sie zu den Antworten passen. Passe sie nur an, wenn sie offensichtlich falsch sind.
2. Formuliere pro Schritt eine Begründung (max. 1 Satz), warum die vergebenen Punkte angemessen sind.
3. Berechne Gesamtpunkte und Prozentwert. Prozentwert = (Summe awarded / Summe max) * 100, auf ganze Zahlen gerundet.
4. Verfasse eine kurze Gesamteinschätzung (2 Sätze), liste 2–3 Stärken und 2–3 Verbesserungsfelder als Stichpunkte und bewerte die medizinische Sprache (Fachlichkeit, Präzision, Struktur) mit einem prägnanten Label.
5. Antworte ausschließlich mit JSON im folgenden Format:
{
  "steps": [{ "order": number, "awarded": number, "max": number, "reason": string }],
  "totalPoints": number,
  "maxPoints": number,
  "percentage": number,
  "summary": string,
  "strengths": string[],
  "improvements": string[],
  "language": { "rating": string, "comment": string }
}`;

  const payloadForLLM = {
    case: {
      id: caseInfo.id ?? null,
      title: caseInfo.title ?? null,
      shortTitle: caseInfo.shortTitle ?? null,
      specialty: caseInfo.specialty ?? null,
      subspecialty: caseInfo.subspecialty ?? null,
      leadSymptom: caseInfo.leadSymptom ?? null,
    },
    vignette: caseInfo.vignette ?? null,
    score_hint: {
      total: totalHint,
      max: maxHint,
      percentage: pctHint,
    },
    steps: steps.map((step) => ({
      order: step.order,
      prompt: step.prompt,
      max_points: step.maxPoints,
      awarded_points_hint: step.awardedPoints,
      status_hint: step.status,
      rule: step.rule,
      student_answers: step.studentAnswers,
    })),
    student_answers_text: allAnswersText,
  };

  const userPrompt = `Bewerte diesen Prüfungsfall und liefere das JSON-Objekt. Daten:
${JSON.stringify(payloadForLLM, null, 2)}
`;

  const completion = await client.chat.completions.create({
    model,
    temperature: 0.2,
    messages: [
      { role: "system", content: sysPrompt },
      { role: "user", content: userPrompt },
    ],
  });

  const raw = (completion.choices?.[0]?.message?.content || "").trim();
  let jsonText = raw.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  if (!(jsonText.startsWith("{") && jsonText.endsWith("}"))) {
    const start = jsonText.indexOf("{");
    const end = jsonText.lastIndexOf("}");
    if (start >= 0 && end > start) {
      jsonText = jsonText.slice(start, end + 1);
    }
  }

  let parsed: LLMReport;
  try {
    parsed = JSON.parse(jsonText) as LLMReport;
  } catch {
    return NextResponse.json({ error: "Antwort konnte nicht geparst werden" }, { status: 502 });
  }

  const strengths = toStringArray(parsed.strengths, 4);
  const improvements = toStringArray(parsed.improvements, 4);

  const languageRating = parsed.language?.rating ?? "";
  const languageComment = parsed.language?.comment ?? "";

  const stepsOut = Array.isArray(parsed.steps)
    ? parsed.steps.map((step) => ({
        order: Number.isFinite(step?.order) ? Number(step?.order) : undefined,
        awarded: Number.isFinite(step?.awarded) ? Number(step?.awarded) : undefined,
        max: Number.isFinite(step?.max) ? Number(step?.max) : undefined,
        reason: sanitizeReason(step?.reason),
      }))
    : [];

  const totalPoints = Number.isFinite(parsed.totalPoints) ? Number(parsed.totalPoints) : totalHint;
  const maxPoints = Number.isFinite(parsed.maxPoints) ? Number(parsed.maxPoints) : maxHint;
  const pctRaw = Number.isFinite(parsed.percentage) ? Number(parsed.percentage) : pctHint;
  const score = clampScore(maxPoints > 0 ? (totalPoints / maxPoints) * 100 : pctRaw);

  return NextResponse.json({
    score,
    totalPoints,
    maxPoints,
    summary: typeof parsed.summary === "string" && parsed.summary.trim().length > 0
      ? parsed.summary.trim()
      : `Gesamtleistung: ${totalHint}/${maxHint} Punkte (${pctHint}%).`,
    strengths,
    improvements,
    language: {
      rating: typeof languageRating === "string" && languageRating.trim().length > 0
        ? languageRating.trim()
        : "solide",
      comment: typeof languageComment === "string" && languageComment.trim().length > 0
        ? languageComment.trim()
        : "Fachliche Ausdrucksweise konnte nicht bewertet werden.",
    },
    steps: stepsOut,
  });
}

