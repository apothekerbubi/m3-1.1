"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { CASES } from "@/data/cases";
import ProgressBar from "@/components/ProgressBar";
import ScorePill from "@/components/ScorePill";

type Turn = { role: "prof" | "student"; text: string };
type ApiReply = {
  say_to_student: string | null;
  evaluation: null | {
    correctness: "correct" | "partially_correct" | "incorrect";
    feedback: string;
    tips?: string;
  };
  next_question: string | null;
  end: boolean;
};
type Asked = { index: number; text: string; status: "pending" | "correct" | "partial" | "incorrect" };

export default function ExamPage() {
  // ✅ Hooks immer oben (nie hinter einem early return)
  const params = useParams<{ id: string | string[] }>();
  const rawId = params?.id;
  const caseId = Array.isArray(rawId) ? rawId[0] : rawId;

  const c = CASES.find((x) => x.id === caseId) ?? null;
  const hasCase = Boolean(c);

  const [transcript, setTranscript] = useState<Turn[]>([]);
  const [asked, setAsked] = useState<Asked[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [ended, setEnded] = useState(false);
  const [style, setStyle] = useState<"strict" | "coaching">("coaching");

  const [points, setPoints] = useState<number>(0);
  const [lastCorrectness, setLastCorrectness] =
    useState<"correct" | "partially_correct" | "incorrect" | null>(null);
  const [allowRetryNext, setAllowRetryNext] = useState(false);

  const listRef = useRef<HTMLDivElement | null>(null);

  // ✅ Outline sicher berechnen (auch wenn c null ist)
  const outline = useMemo(
    () => (c ? [...c.steps].sort((a, b) => a.order - b.order).map((s) => s.prompt) : []),
    [c]
  );
  const maxPoints = outline.length * 2;

  const progressPct = useMemo(() => {
    if (!outline.length) return 0;
    const done = Math.min(asked.length, outline.length);
    return Math.round((done / outline.length) * 100);
  }, [asked.length, outline.length]);

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [transcript, loading]);

  function label(correctness: "correct" | "partially_correct" | "incorrect") {
    return correctness === "correct"
      ? "✅ Richtig"
      : correctness === "partially_correct"
      ? "🟨 Teilweise richtig"
      : "❌ Nicht korrekt";
  }

  async function callExamAPI(current: Turn[], isRetry: boolean) {
    if (!c) return; // Guard
    setLoading(true);
    try {
      const res = await fetch("/api/exam/turn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseText: c.vignette,
          transcript: current.map((t) => ({
            role: t.role === "prof" ? "examiner" : "student",
            text: t.text,
          })),
          outline,
          style,
          objectives: (c as any).objectives || [],
          completion: (c as any).completion || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || `HTTP ${res.status}`);
      }
      const data: ApiReply = await res.json();
      const nextT = [...current];

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

      if (data.evaluation) {
        const { correctness, feedback, tips } = data.evaluation;
        setLastCorrectness(correctness);
        const base = correctness === "correct" ? 2 : correctness === "partially_correct" ? 1 : 0;
        const gain = isRetry ? base * 0.75 : base;
        setPoints((p) => p + gain);

        setAsked((prev) => {
          const i = [...prev].reverse().findIndex((a) => a.status === "pending");
          if (i === -1) return prev;
          const idx = prev.length - 1 - i;
          const copy = [...prev];
          copy[idx] = {
            ...copy[idx],
            status: correctness === "correct" ? "correct" : correctness === "partially_correct" ? "partial" : "incorrect",
          };
          return copy;
        });

        const parts = [
          `${label(correctness)} — ${feedback}`,
          correctness !== "correct" && tips ? `Tipp: ${tips}` : "",
        ].filter(Boolean);
        pushProf(parts.join(" "));
        setAllowRetryNext(correctness !== "correct" && Boolean(tips && tips.trim()));
      } else {
        setAllowRetryNext(false);
      }

      const retryIsOpenNow = allowRetryNext === true && !isRetry;
      const shouldAskNext = Boolean(data.next_question && data.next_question.trim()) && !retryIsOpenNow;

      if (shouldAskNext) {
        const q = data.next_question!.trim();
        pushProf(q);
        setAsked((prev) => [...prev, { index: prev.length, text: q, status: "pending" }]);
      } else if (data.say_to_student && data.say_to_student.trim()) {
        pushProf(data.say_to_student);
      }

      setTranscript(nextT);
      setEnded(Boolean(data.end));
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  const hasStarted = transcript.length > 0;

  function startExam() {
    if (!c) return;
    const intro: Turn[] = [{ role: "prof", text: `Vignette: ${c.vignette}` }];
    setTranscript(intro);
    setAsked([]);
    setPoints(0);
    setLastCorrectness(null);
    setEnded(false);
    setAllowRetryNext(false);
    setTimeout(() => callExamAPI(intro, false), 0);
  }

  function onSend() {
    if (!c) return;
    if (!input.trim() || loading || ended) return;
    const isRetry = allowRetryNext;
    setAllowRetryNext(false);
    const newT: Turn[] = [...transcript, { role: "student", text: input.trim() }];
    setTranscript(newT);
    setInput("");
    callExamAPI(newT, isRetry);
  }

  // ✅ Erst hier das bedingte Rendern (Hooks sind bereits alle aufgerufen)
  if (!hasCase) {
    return (
      <main className="p-6">
        <h2 className="text-xl font-semibold mb-2">Fall nicht gefunden</h2>
        <Link href="/cases" className="rounded-md border px-3 py-1 text-sm hover:bg-gray-50">
          Zur Fallliste
        </Link>
      </main>
    );
  }

  return (
    <main className="p-0">
      {/* Kopfzeile */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h2 className="text-2xl font-semibold tracking-tight flex-1">Prüfung: {c.title}</h2>
        <ScorePill points={points} maxPoints={maxPoints} last={lastCorrectness} />
        <div className="w-56 hidden sm:block">
          <ProgressBar value={progressPct} label="Fortschritt" />
        </div>
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

      {/* ZWEI SPALTEN: Fragenfolge | Chat */}
      <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-4">
        <aside className="rounded-xl bg-white/70 border border-black/10 p-3 md:sticky md:top-20 h-fit">
          <div className="mb-2 text-xs font-medium text-gray-700">Fragenfolge</div>
          <ul className="space-y-2">
            {outline.map((prompt, i) => {
              const a = asked[i];
              const status = a?.status ?? null;
              const dot =
                !a ? "bg-gray-200"
                : status === "pending" ? "bg-gray-300"
                : status === "correct" ? "bg-green-500"
                : status === "partial" ? "bg-yellow-400"
                : "bg-red-500";
              return (
                <li key={i} className="flex items-start gap-2 text-sm leading-snug">
                  <span className={`mt-1 inline-block h-3 w-3 rounded-full ${dot}`} />
                  {a ? (
                    <span className="text-gray-900">{a.text}</span>
                  ) : (
                    <span className="text-gray-400 italic select-none">{i + 1}. …</span>
                  )}
                </li>
              );
            })}
          </ul>

          {allowRetryNext && (
            <div className="mt-3 rounded-md border border-yellow-200 bg-yellow-50 p-2 text-[11px] text-yellow-800">
              🔁 Du kannst die letzte Frage <b>nochmal beantworten</b> oder eine kurze Verständnisfrage stellen.
              Diese nächste Antwort zählt zu <b>75%</b>.
            </div>
          )}
        </aside>

        <section className="flex flex-col gap-3">
          <div
            ref={listRef}
            className="h-[58vh] overflow-y-auto rounded-2xl border border-black/10 bg-[var(--panel)] p-4 shadow-card"
          >
            {transcript.map((t, i) => (
              <div key={i} className={`mb-3 ${t.role === "prof" ? "" : "text-right"}`}>
                <div
                  className={`inline-block max-w-[80%] rounded-2xl px-3 py-2 shadow-sm ${
                    t.role === "prof"
                      ? "bg-white/80 border border-black/10"
                      : "bg-brand-600 text-white"
                  }`}
                >
                  <span className="text-sm leading-relaxed">
                    <b className="opacity-80">{t.role === "prof" ? "Prüfer" : "Du"}:</b> {t.text}
                  </span>
                </div>
              </div>
            ))}
            {loading && <div className="text-sm text-gray-500">Denke nach…</div>}
            {!hasStarted && <div className="text-sm text-gray-600">Klicke auf <b>Prüfung starten</b>, um zu beginnen.</div>}
            {ended && (
              <div className="mt-2 text-sm text-green-700">
                ✅ Fall abgeschlossen — Score {Number.isInteger(points) ? points : points.toFixed(1)}
                /{maxPoints} ({Math.round((points / Math.max(1, maxPoints)) * 100)}%)
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => { e.preventDefault(); hasStarted ? onSend() : startExam(); }}
            className="flex gap-2"
          >
            {!hasStarted ? (
              <button type="submit" className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50">
                Prüfung starten
              </button>
            ) : (
              <>
                <input
                  className="flex-1 rounded-md border px-3 py-2 text-sm"
                  placeholder={ended ? "Fall beendet" : allowRetryNext ? "Retry/Verständnisfrage…" : "Deine Antwort…"}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={ended}
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim() || ended}
                  className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
                >
                  Senden
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!c || loading || ended) return;
                    (async () => {
                      setLoading(true);
                      try {
                        const res = await fetch("/api/exam/turn", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            caseText: c.vignette,
                            transcript: transcript.map((t) => ({
                              role: t.role === "prof" ? "examiner" : "student",
                              text: t.text,
                            })),
                            outline,
                            style,
                            tipRequest: true,
                          }),
                        });
                        const data = (await res.json()) as ApiReply;
                        if (data.say_to_student) {
                          setTranscript((prev) => [...prev, { role: "prof", text: data.say_to_student! }]);
                          setAllowRetryNext(true);
                        }
                      } finally {
                        setLoading(false);
                      }
                    })();
                  }}
                  disabled={loading || ended}
                  className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
                  title="Kleinen Hinweis erhalten"
                >
                  💡 Tipp
                </button>
              </>
            )}
            <Link href={`/cases/${c.id}`} className="ml-auto rounded-md border px-3 py-2 text-sm hover:bg-gray-50">
              Fallinfo
            </Link>
          </form>
        </section>
      </div>
    </main>
  );
}