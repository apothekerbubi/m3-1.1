import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();
    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "No text" }, { status: 400 });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const speech = await openai.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice: "sage",
      input: text,
    });
    const buffer = Buffer.from(await speech.arrayBuffer());
    return new NextResponse(buffer, {
      status: 200,
      headers: { "Content-Type": "audio/mpeg" },
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}