"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { CASES } from "@/data/cases";

type Turn = { role: "prof" | "student"; text: string };
type ApiReply = {
  say_to_student: string;
  evaluation: null | {
    correctness: "correct" | "partially_correct" | "incorrect";
    feedback: string;
    tips?: string;
  };
  next_question: string | null;
  end: boolean;
};

export default function ExamPage() {
  const params = useParams<{ id: string | string[] }>();
  const rawId = params?.id;
  const caseId = Array.isArray(rawId) ? rawId[0] : rawId;

  const c = CASES.find((x) => x.id === caseId);

  const [transcript, setTranscript] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [ended, setEnded] = useState(false);
  const [style, setStyle] = useState<"strict" | "coaching">("coaching");
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [transcript, loading]);

  if (!c) {
    return (
      <main className="mx-auto max-w-3xl p-6">
        <h2 className="text-xl font-semibold mb-2">Fall nicht gefunden</h2>
        <Link href="/cases" className="rounded-md border px-3 py-1 text-sm hover:bg-gray-50">
          Zur Fallliste
        </Link>
      </main>
    );
  }

  function label(correctness: "correct" | "partially_correct" | "incorrect") {
    return correctness === "correct"
      ? "✅ Richtig"
      : correctness === "partially_correct"
      ? "🟨 Teilweise richtig"
      : "❌ Nicht korrekt";
  }

  async function callExamAPI(current: Turn[]) {
    setLoading(true);
    try {
      const outline = c.steps.slice().sort((a, b) => a.order - b.order).map((s) => s.prompt);

      const res = await fetch("/api/exam/turn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseText: c.vignette,
          transcript: current,
          outline,
          style,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || `HTTP ${res.status}`);
      }

      const data: ApiReply = await res.json();

      const nextT = [...current];

      // Duplikat-Schranke
      const normalize = (s: string) =>
        s.toLowerCase().replace(/\s+/g, " ").replace(/[.,;:!?]+$/g, "").trim();

      const pushProf = (text?: string | null) => {
        if (!text || !text.trim()) return;
        const t = text.trim();
        const lastProf = [...nextT].reverse().find((x) => x.role === "prof");
        if (!lastProf || normalize(lastProf.text) !== normalize(t)) {
          nextT.push({ role: "prof", text: t });
        }
      };

      // 1) Bewertung + kurze Begründung, stets mit Tipp bei teilweise/falsch
      if (data.evaluation) {
        const { correctness, feedback, tips } = data.evaluation;
        pushProf(`${label(correctness)} — ${feedback}`);

        const needsTip = correctness === "partially_correct" || correctness === "incorrect";
        const tipText = tips?.trim();
        if (needsTip) {
          pushProf(`Tipp: ${tipText || "Ergänze gezielt, was noch fehlt (z. B. fehlende DD oder Untersuchungsschritt)."}`
          );
        }
      }

      // 2) Genau EINE Folgefrage
      if (data.next_question && data.next_question.trim()) {
        pushProf(data.next_question);
      } else {
        pushProf(data.say_to_student); // nur ein Übergangssatz, keine Frage
      }

      setTranscript(nextT);
      setEnded(Boolean(data.end));
    } catch (e: any) {
      alert(e?.message || "Unbekannter Fehler");
    } finally {
      setLoading(false);
    }
  }

  const hasStarted = transcript.length > 0;

  function startExam() {
    const intro: Turn[] = [{ role: "prof", text: `Vignette: ${c.vignette}` }];
    setTranscript(intro);
    setTimeout(() => callExamAPI(intro), 0);
  }

  function onSend() {
    if (!input.trim() || loading || ended) return;
    const newT: Turn[] = [...transcript, { role: "student", text: input.trim() }];
    setTranscript(newT);
    setInput("");
    callExamAPI(newT);
  }

  return (
    <main className="mx-auto max-w-3xl p-6">
      <div className="mb-2 flex items-center gap-3">
        <h2 className="text-xl font-semibold">Prüfung: {c.title}</h2>
        <div className="ml-auto flex items-center gap-2">
          <label className="text-xs text-gray-600">Stil</label>
          <select
            className="rounded-md border px-2 py-1 text-sm"
            value={style}
            onChange={(e) => setStyle(e.target.value as "strict" | "coaching")}
          >
            <option value="coaching">Coaching</option>
            <option value="strict">Streng</option>
          </select>
        </div>
      </div>
      <div className="text-xs text-gray-600 mb-4">Thema: {c.tags.join(", ")}</div>

      <div ref={listRef} className="h-[50vh] overflow-y-auto rounded-lg border p-4 bg-white">
        {transcript.map((t, i) => (
          <div key={i} className={`mb-3 ${t.role === "prof" ? "" : "text-right"}`}>
            <div className={`inline-block rounded-xl px-3 py-2 ${t.role === "prof" ? "bg-gray-100 border" : "bg-blue-50 border"}`}>
              <span className="text-sm">
                <b>{t.role === "prof" ? "Prüfer" : "Du"}:</b> {t.text}
              </span>
            </div>
          </div>
        ))}
        {loading && <div className="text-sm text-gray-500">Denke nach…</div>}
        {!hasStarted && <div className="text-sm text-gray-600">Klicke auf <b>Prüfung starten</b>, um zu beginnen.</div>}
        {ended && <div className="mt-2 text-sm text-green-700">✅ Fall abgeschlossen.</div>}
      </div>

      <div className="mt-3 flex gap-2">
        {!hasStarted ? (
          <button onClick={startExam} className="rounded-md border px-3 py-1 text-sm hover:bg-gray-50">
            Prüfung starten
          </button>
        ) : (
          <>
            <input
              className="flex-1 rounded-md border px-3 py-2 text-sm"
              placeholder={ended ? "Fall beendet" : "Deine Antwort…"}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onSend()}
              disabled={ended}
            />
            <button
              onClick={onSend}
              disabled={loading || !input.trim() || ended}
              className="rounded-md border px-3 py-1 text-sm hover:bg-gray-50 disabled:opacity-50"
            >
              Senden
            </button>
          </>
        )}
        <Link href={`/cases/${c.id}`} className="ml-auto rounded-md border px-3 py-1 text-sm hover:bg-gray-50">
          Fallinfo
        </Link>
      </div>
    </main>
  );
}