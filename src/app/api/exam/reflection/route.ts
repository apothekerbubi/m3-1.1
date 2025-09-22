import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

import type { ReflectionSnapshot } from "@/lib/reflectionStore";

function truncate(text: string, max = 900): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max)}…`;
}

function formatStep(step: ReflectionSnapshot["steps"][number], idx: number): string {
  const transcript = step.transcript
    .map((t) => `${t.role === "examiner" ? "Prüfer" : "Stud"}: ${t.text}`)
    .join(" \n");
  const union = step.studentUnion.join(", ");
  const rule = step.rule ? `\nRegel: ${truncate(JSON.stringify(step.rule), 600)}` : "";
  return `Schritt ${idx + 1} (Order ${step.order}): ${step.prompt}\nBestScore: ${step.bestScore}\nStudentUnion: ${union || "(leer)"}\nModellösung: ${step.solutionText || "(nicht hinterlegt)"}\nTranscript: ${truncate(transcript, 1200)}${rule}`;
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

    const body = (await req.json().catch(() => null)) as ReflectionSnapshot | null;
    if (!body) {
      return NextResponse.json({ error: "Ungültiger JSON-Body." }, { status: 400 });
    }

    if (!body.caseId || !Array.isArray(body.steps)) {
      return NextResponse.json({ error: "caseId und steps sind erforderlich." }, { status: 400 });
    }

    const stepsText = body.steps.map(formatStep).join("\n\n");

    const sys = `Du bist Prüfer:in des 3. Staatsexamens (M3) und analysierst den Leistungsstand einer Kandidatin basierend auf einem simulierten Fall.
Erstelle eine kurze, strukturierte Auswertung.
Antworte ausschließlich mit JSON im Format:
{
  "overview": "ein Absatz mit dem Gesamtfazit (max. 3 Sätze)",
  "strengths": ["Bullet 1", "Bullet 2"],
  "weaknesses": ["Bullet 1", "Bullet 2"],
  "improvements": ["Konkreter Handlungsvorschlag", "…"]
}
- Beziehe dich auf die MODELLÖSUNG und die StudentUnion, um zu erkennen, was genannt oder ausgelassen wurde.
- Formuliere die Schwächen und Verbesserungen so, dass sofort klar ist, was beim nächsten Mal anders gemacht werden soll.
- Nutze prägnante Sätze (max. 22 Wörter).
- Keine weiteren Felder, keine Erklärtexte.`;

    const usr = `Fall: ${body.caseTitle}
Gesamtscore: ${body.totalScore} von ${body.maxScore}
Vignette (Kurzfassung): ${truncate(body.vignette, 600)}

${stepsText}`;

    const completion = await client.chat.completions.create({
      model,
      temperature: 0.3,
      messages: [
        { role: "system", content: sys },
        { role: "user", content: usr },
      ],
    });

    const raw = completion.choices?.[0]?.message?.content;
    if (!raw) {
      return NextResponse.json({ error: "Keine Antwort vom Modell." }, { status: 502 });
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      return NextResponse.json(
        { error: "Antwort konnte nicht als JSON interpretiert werden.", raw },
        { status: 502 }
      );
    }

    return NextResponse.json(parsed);
  } catch (err) {
    console.error("reflection route error", err);
    return NextResponse.json({ error: "Unbekannter Fehler." }, { status: 500 });
  }
}
