"use client";
import { useRef, useState } from "react";

export default function VoiceInput({ onResult }: { onResult: (t: string) => void }) {
  const [recording, setRecording] = useState(false);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);

  async function start() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder.current = new MediaRecorder(stream);
    chunks.current = [];
    mediaRecorder.current.ondataavailable = e => {
      if (e.data.size > 0) chunks.current.push(e.data);
    };
    mediaRecorder.current.onstop = async () => {
      const blob = new Blob(chunks.current, { type: "audio/webm" });
      const form = new FormData();
      form.append("file", blob, "audio.webm");
      const res = await fetch("/api/transcribe", { method: "POST", body: form });
      const json = await res.json();
      if (json.text) onResult(json.text as string);
    };
    mediaRecorder.current.start();
    setRecording(true);
  }

  function stop() {
    mediaRecorder.current?.stop();
    setRecording(false);
  }

  return (
    <button type="button" onClick={recording ? stop : start} title="Spracheingabe" className="rounded-md border border-black/10 px-3 py-2 text-sm bg-white text-gray-900 hover:bg-black/[.04]">
      {recording ? "⏹" : "🎙"}
    </button>
  );
}
