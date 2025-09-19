import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type TranscriptTurn = { role: "examiner" | "student"; text: string };

type Body = {
  caseId?: string;
  caseText?: string;
  nextPrompt?: string;
  transcript?: TranscriptTurn[];
  style?: "coaching" | "strict";
};

function stripMd(s: string): string {
  return (s || "")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, "$1")
    .replace(/^\-\s+/gm, "• ")
    .trim();
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY fehlt (.env.local oder Vercel-Env setzen)" },
      { status: 500 }
    );
  }

  const model = (process.env.OPENAI_MODEL || "gpt-4o-mini").trim();

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Ungültiger JSON-Body." }, { status: 400 });
  }

  const caseId = typeof body.caseId === "string" ? body.caseId.trim() : "";
  const caseText = typeof body.caseText === "string" ? body.caseText.trim() : "";
  const style: "coaching" | "strict" = body.style === "strict" ? "strict" : "coaching";
  const nextPrompt = typeof body.nextPrompt === "string" ? body.nextPrompt.trim() : "";

  const transcriptRaw = Array.isArray(body.transcript) ? body.transcript : [];
  const transcript: TranscriptTurn[] = transcriptRaw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const role = (item as TranscriptTurn).role === "examiner" ? "examiner" : "student";
      const text = typeof (item as TranscriptTurn).text === "string" ? (item as TranscriptTurn).text.trim() : "";
      if (!text) return null;
      return { role, text };
    })
    .filter((t): t is TranscriptTurn => Boolean(t));

  const transcriptLimited = transcript.slice(-14);

  if (!nextPrompt) {
    return NextResponse.json({ question: "" });
  }

  const client = new OpenAI({ apiKey });

  const sys =
    `Du bist Prüfer:in am 2. Tag (Theorie) des M3.` +
    ` Ziel: Formuliere eine einzige flüssige Chat-Nachricht, die zur nächsten Frage überleitet.` +
    ` Halte dich sinngemäß an den Inhalt von NEXT_PROMPT (keine neuen Themen),` +
    ` würdige in ein bis zwei kurzen Sätzen den bisherigen Verlauf und stelle dann in derselben Nachricht die nächste Frage.` +
    ` Keine Listen, keine Emojis, keine Mehrfachnachrichten.` +
    ` Sprich in der Sie-Form, ${style === "strict" ? "knapp und sachlich" : "freundlich-klar"}.`;

  const usr =
    `CASE_ID: ${caseId || "(unbekannt)"}\n` +
    `CASE_VIGNETTE: ${caseText || "(leer)"}\n` +
    `NEXT_PROMPT: ${nextPrompt}\n` +
    `TRANSCRIPT (letzte ${transcriptLimited.length} Beiträge):\n${JSON.stringify(transcriptLimited, null, 2)}\n` +
    `Gib NUR den endgültigen Chat-Text zurück.`;

  try {
    const out = await client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: sys },
        { role: "user", content: usr },
      ],
      temperature: 0.6,
    });

    const raw = (out.choices?.[0]?.message?.content || "").trim();
    const clean = stripMd(raw).replace(/\n{3,}/g, "\n\n").trim();
    const finalText = clean || nextPrompt;

    return NextResponse.json({ question: finalText });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "LLM error";
    return NextResponse.json({ error: message, question: nextPrompt }, { status: 500 });
  }
}
