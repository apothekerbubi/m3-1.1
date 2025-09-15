"use client";
import { useState } from "react";

export default function SpeakButton({ text }: { text: string }) {
  const [loading, setLoading] = useState(false);

  async function speak() {
    if (!text) return;
    setLoading(true);
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.play();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button type="button" onClick={speak} disabled={!text || loading} className="ml-1 text-xs" title="Vorlesen">
      🔊
    </button>
  );
}
