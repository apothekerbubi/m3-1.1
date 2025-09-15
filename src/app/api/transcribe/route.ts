import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof Blob)) {
      return NextResponse.json({ error: "No file" }, { status: 400 });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const arrayBuffer = await file.arrayBuffer();
    const transcription = await openai.audio.transcriptions.create({
      file: new File([arrayBuffer], "speech.webm"),
      model: "whisper-1",
      language: "de",
    });

    return NextResponse.json({ text: transcription.text ?? "" });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
