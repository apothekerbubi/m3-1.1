"use client";
import { useRef, useState } from "react";

export default function VoiceInput({ onResult }: { onResult: (t: string) => void }) {
  const [recording, setRecording] = useState(false);
  const mediaRecorder = useRef<MediaRecorder | null>(null);

  async function start() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    mediaRecorder.current = recorder;
    recorder.ondataavailable = async (e) => {
      if (e.data.size > 0) {
        const form = new FormData();
        form.append("file", e.data, `chunk-${Date.now()}.webm`);
        try {
          const res = await fetch("/api/transcribe", { method: "POST", body: form });
          const json = await res.json();
          if (json.text) onResult(json.text as string);
        } catch (err) {
          console.error("chunk failed", err);
        }
      }
    };
    recorder.start(1000); // send chunk every second
    setRecording(true);
  }

  function stop() {
    mediaRecorder.current?.stop();
    mediaRecorder.current?.stream.getTracks().forEach(t => t.stop());
    setRecording(false);
  }

  return (
    <button type="button" onClick={recording ? stop : start} title="Spracheingabe" className="rounded-md border border-black/10 px-3 py-2 text-sm bg-white text-gray-900 hover:bg-black/[.04]">
      {recording ? "⏹" : "🎙"}
    </button>
  );
}
