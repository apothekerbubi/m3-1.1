import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Schnelltest: http://localhost:3000/api/exam/turn
export async function GET() {
  return NextResponse.json({ ok: true, hint: "POST {caseText, transcript, outline?, style?}" });
}

type Turn = { role: string; text: string };

export async function POST(req: NextRequest) {
  try {
    const rawKey = process.env.OPENAI_API_KEY?.trim();
    if (!rawKey) return NextResponse.json({ error: "OPENAI_API_KEY fehlt (.env.local)" }, { status: 500 });
    if (!rawKey.startsWith("sk-")) return NextResponse.json({ error: "OPENAI_API_KEY ungültig" }, { status: 500 });

    const body = (await req.json()) as {
      caseText: string;
      transcript: Turn[];
      outline?: string[];                // optional: Schritte/Topics für den Fall
      style?: "strict" | "coaching";     // optional: Tonalität
    };

    const { caseText, transcript, outline = [], style = "coaching" } = body || {};
    if (!caseText || !Array.isArray(transcript)) {
      return NextResponse.json({ error: "Bad request: caseText (string), transcript (array)" }, { status: 400 });
    }

    const client = new OpenAI({ apiKey: rawKey });
    const model = (process.env.OPENAI_MODEL || "gpt-4o-mini").trim();

    // Hilfsinfos aus dem Verlauf
    const lastStudent = [...transcript].reverse().find((t) => t.role === "student")?.text ?? "";
    const lastProfQ = [...transcript].reverse().find((t) => t.role === "prof" && /[?？]$/.test(t.text))?.text ?? "";

    // ===== Dein bestehender Prompt + Engagement-Regeln (flüssiger Dialog) =====
    const systemBase = [
      // (Dein vorhandener Prompt, inhaltlich unverändert)
      "Du bist Prüfer:in im 3. Staatsexamen (Innere Medizin).",
      "Sprache: Deutsch. Stil: knapp, prüfungsnah, freundlich-klar.",
      "Bei jeder Studierenden-Antwort tust du GENAU das:",
      "1) Bewertung (kurz): korrekt / teilweise korrekt / nicht korrekt.",
      "2) Begründung (1–2 Sätze): WARUM ist es so? Beziehe dich nur auf das Gesagte.",
      "3) Tipp-Regel (PFLICHT):",
      "   - Wenn correctness = 'partially_correct' ODER 'incorrect', MUSS das Feld 'tips' genau 1 kurzen, konkreten Hinweis enthalten, beginnend z. B. mit 'Es fehlt noch: …' oder 'Ergänze: …'.",
      "   - Der Tipp darf keine vollständige Lösung vorwegnehmen, sondern soll gezielt in die richtige Richtung schubsen (z. B. fehlende DD, fehlender Untersuchungsschritt).",
      "   - Wenn correctness = 'correct', darf 'tips' null sein.",
      "4) Stelle GENAU EINE nächste Frage.",
      "5) Wenn der Student richtig oder teilweise richtig antwortet, begründe ihm auch warum das so ist. Wenn er falsch antwortet, begründe auch warum es falsch ist.",
      "",
      "Spoiler-Schutz:",
      "- Verrate KEINE Inhalte, die in der nächsten Frage gezielt abgefragt werden.",
      "- Nenne keine finalen Diagnosen/Therapiedetails, wenn sie erst erarbeitet werden sollen.",
      "",
      "Feldregeln (keine Dopplungen):",
      "- 'evaluation' enthält Bewertung + Begründung (+ optional Tips nur bei korrekt).",
      "- 'next_question' enthält AUSSCHLIESSLICH die nächste Frage (ein Satz, Fragezeichen am Ende).",
      "- 'say_to_student' ist optional und enthält höchstens 1 kurzen Übergangssatz, KEINE Frage.",
      "- Wiederhole dieselbe Frage NICHT in mehreren Feldern.",
      "",
      "Gib NUR ein JSON-Objekt zurück:",
      "{ \"say_to_student\": string, \"evaluation\": { \"correctness\": \"correct\" | \"partially_correct\" | \"incorrect\", \"feedback\": string, \"tips\"?: string } | null, \"next_question\": string | null, \"end\": boolean }",
    ];

    // Engagement-Regeln (flüssiger, auf letzte Antwort eingehen)
    const engagement = [
      "",
      "Engagement-Regeln für flüssiges Gespräch:",
      `- Beziehe dich explizit auf die letzte Studierenden-Antwort (z. B. zitiere 2–5 Schlüsselwörter: „${lastStudent.slice(0, 40)}…“).`,
      "- Stelle die nächste Frage so, dass sie ENTWEDER nahtlos an die letzte Aussage anknüpft (Vertiefung/Begründung) ODER den nächsten sinnvollen Schritt im Fall (laut Outline) einleitet.",
      "- Stelle NICHT dieselbe Frage wie zuvor erneut; wiederhole die vorherige Frage nicht paraphrasiert.",
      "- Wenn der/die Studierende explizit um einen Tipp bittet (z. B. 'tipp', 'weiß nicht'), gib einen präzisen, kurzen Tipp und stelle dann eine niedrigschwelligere Folgefrage.",
      `- Ton (${style}): ${style === "strict"
        ? "streng, knapp, prüfungsnah; bohre gezielt nach Begründungen; keine langen Hinweise."
        : "coaching-orientiert, wertschätzend; kurze Bestärkung bei korrekten Teilen; prägnante Hinweise bei Lücken."
      }`,
    ];

    const outlineBlock = outline.length
      ? [
          "",
          "Outline (Themen-Schritte des Falls; nutze sie zur Struktur, aber spoilerfrei):",
          ...outline.map((o, i) => `- Schritt ${i + 1}: ${o}`),
          "Wähle die nächste Frage so, dass sie ENTWEDER die aktuelle Stelle vertieft ODER sinnvoll zum nächsten Schritt überleitet, ohne Inhalte vorwegzunehmen.",
        ]
      : [];

    const systemPrompt = [...systemBase, ...engagement, ...outlineBlock].join("\n");

    const userContent =
      `Fall (Vignette): ${caseText}\n\n` +
      `Letzte Prüferfrage: ${lastProfQ || "(keine)"}\n` +
      `Letzte Studierenden-Antwort: ${lastStudent || "(keine)"}\n\n` +
      `Vollständiges Transkript (bisher):\n${JSON.stringify(transcript, null, 2)}\n\n` +
      `Erzeuge jetzt NUR das JSON-Objekt ohne zusätzlichen Text.`;

    const completion = await client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
      temperature: 0.1,
    });

    const raw = completion.choices?.[0]?.message?.content ?? "";
    if (!raw) return NextResponse.json({ error: "LLM lieferte keinen Text" }, { status: 502 });

    // JSON sicher herausziehen
    let jsonText = raw.trim();
    if (!(jsonText.startsWith("{") && jsonText.endsWith("}"))) {
      const s = jsonText.indexOf("{");
      const e = jsonText.lastIndexOf("}");
      if (s >= 0 && e > s) jsonText = jsonText.slice(s, e + 1);
    }

    let payload: unknown;
    try {
      payload = JSON.parse(jsonText);
    } catch {
      console.error("JSON parse failed. Raw reply:", raw);
      return NextResponse.json({ error: "Antwort war kein gültiges JSON." }, { status: 502 });
    }

    return NextResponse.json(payload);
  } catch (err: any) {
    console.error("OpenAI/Route error:", err?.message || err);
    return NextResponse.json({ error: err?.message || "LLM error" }, { status: 500 });
  }
}