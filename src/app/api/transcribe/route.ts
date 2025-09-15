import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No audio file" }, { status: 400 });
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    const audioFile = await OpenAI.toFile(buffer, file.name);
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const transcription = await client.audio.transcriptions.create({
      file: audioFile,
      model: "gpt-4o-transcribe", // Whisper large-v2
      language: "de",
    });
    return NextResponse.json({ text: transcription.text });
  } catch (err) {
    console.error("Transcription failed", err);
    return NextResponse.json({ error: "Transcription failed" }, { status: 500 });
  }
}
