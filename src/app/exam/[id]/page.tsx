"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { CASES } from "@/data/cases";
import type { Case } from "@/lib/types";
import ProgressBar from "@/components/ProgressBar";
import ScorePill from "@/components/ScorePill";

type Turn = { role: "prof" | "student"; text: string };

type ApiReply =
  | {
      say_to_student: string | null;
      evaluation: null | {
        correctness: "correct" | "partially_correct" | "incorrect";
        feedback: string;
        tips?: string;
      };
      next_question: string | null;
      end: boolean;
    }
  | { examiner_info: string };

type Asked = {
  index: number;
  text: string;
  status: "pending" | "correct" | "partial" | "incorrect";
};

type ObjMin = { id: string; label: string };
type CompletionRules = { minObjectives: number; maxLLMTurns?: number; hardStopTurns?: number };
type CaseWithRules = Case & { objectives?: ObjMin[]; completion?: CompletionRules | null };

export default function ExamPage() {
  // --- Routing / Fall holen ---
  const params = useParams<{ id: string | string[] }>();
  const rawId = params?.id;
  const caseId = Array.isArray(rawId) ? rawId[0] : rawId;
  const c = (CASES.find((x) => x.id === caseId) ?? null) as CaseWithRules | null;

  // --- UI State ---
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

  // --- Outline & Progress ---
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

  // --- Auto scroll ---
  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [transcript, loading]);

  // --- Helpers ---
  function label(correctness: "correct" | "partially_correct" | "incorrect") {
    return correctness === "correct"
      ? "✅ Richtig"
      : correctness === "partially_correct"
      ? "🟨 Teilweise richtig"
      : "❌ Nicht korrekt";
  }

  const normalize = (s: string) =>
    s.toLowerCase().replace(/\s+/g, " ").replace(/[.,;:!?]+$/g, "").trim();

  function pushProfDedup(next: Turn[], text?: string | null) {
    if (!text || !text.trim()) return;
    const t = text.trim();
    const lastProf = [...next].reverse().find((x) => x.role === "prof");
    if (!lastProf || normalize(lastProf.text) !== normalize(t)) {
      next.push({ role: "prof", text: t });
    }
  }

  // --- API Call ---
  async function callExamAPI(
    current: Turn[],
    opts: { isRetry: boolean; tipRequest?: boolean; clarify?: string }
  ) {
    if (!c) return;
    setLoading(true);
    try {
      const payload: Record<string, unknown> = {
        caseText: c.vignette,
        transcript: current.map((t) => ({
          role: t.role === "prof" ? "examiner" : "student",
          text: t.text,
        })),
        outline,
        style,
        objectives: c.objectives ?? [],
        completion: c.completion ?? null,
      };
      if (opts.tipRequest) payload.tipRequest = true;
      if (opts.clarify) payload.clarifyQuestion = opts.clarify;

      const res = await fetch("/api/exam/turn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string })?.error || `HTTP ${res.status}`);
      }

      const data: ApiReply = (await res.json()) as ApiReply;
      const nextT = [...current];

      // A) reine Zusatzinfo (Patientendetails etc.)
      if ("examiner_info" in data) {
        pushProfDedup(nextT, data.examiner_info);
        setTranscript(nextT);
        return;
      }

      // B) Bewertung + Punkte
      if (data.evaluation) {
        const { correctness, feedback, tips } = data.evaluation;
        setLastCorrectness(correctness);

        const base = correctness === "correct" ? 2 : correctness === "partially_correct" ? 1 : 0;
        const gain = opts.isRetry ? base * 0.75 : base;
        setPoints((p) => p + gain);

        setAsked((prev) => {
          const i = [...prev].reverse().findIndex((a) => a.status === "pending");
          if (i === -1) return prev;
          const idx = prev.length - 1 - i;
          const copy = [...prev];
          copy[idx] = {
            ...copy[idx],
            status:
              correctness === "correct"
                ? "correct"
                : correctness === "partially_correct"
                ? "partial"
                : "incorrect",
          };
          return copy;
        });

        const parts = [
          `${label(correctness)} — ${feedback}`,
          correctness !== "correct" && tips ? `Tipp: ${tips}` : "",
        ].filter(Boolean);
        pushProfDedup(nextT, parts.join(" "));
        setAllowRetryNext(correctness !== "correct" && Boolean(tips && tips.trim()));
      } else {
        setAllowRetryNext(false);
      }

      // C) Folgefrage nur, wenn kein Retry offen
      const retryIsOpenNow = allowRetryNext === true && !opts.isRetry;
      const shouldAskNext = Boolean(data.next_question && data.next_question.trim()) && !retryIsOpenNow;
      if (shouldAskNext) {
        const q = data.next_question!.trim();
        pushProfDedup(nextT, q);
        setAsked((prev) => [...prev, { index: prev.length, text: q, status: "pending" }]);
      } else if (data.say_to_student && data.say_to_student.trim()) {
        pushProfDedup(nextT, data.say_to_student);
      }

      setTranscript(nextT);
      setEnded(Boolean(data.end));
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      alert(msg);
    } finally {
      setLoading(false);
    }
  }

  // --- Flow Control ---
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
    setTimeout(() => callExamAPI(intro, { isRetry: false }), 0);
  }

  function onSend() {
    if (!c) return;
    if (!input.trim() || loading || ended) return;

    const text = input.trim();
    const wantsTip = /(^|\b)(tipp|hinweis|hilfe|help)\b/i.test(text);
    const looksClarify = /[?？]$/.test(text);

    const isRetry = allowRetryNext;
    setAllowRetryNext(false);

    const newT: Turn[] = [...transcript, { role: "student", text }];
    setTranscript(newT);
    setInput("");

    callExamAPI(newT, {
      isRetry,
      tipRequest: wantsTip ? true : undefined,
      clarify: !wantsTip && looksClarify ? text : undefined,
    });
  }

  // Tipp (Hint) manuell anfordern (für den 💡 Tipp-Button)
  async function requestTip() {
    if (!c || loading || ended) return;
    await callExamAPI(transcript, { isRetry: false, tipRequest: true });
  }

  // --- Not found ---
  if (!c) {
    return (
      <main className="p-6">
        <h2 className="text-xl font-semibold mb-2">Fall nicht gefunden</h2>
        <Link href="/subjects" className="rounded-md border px-3 py-1 text-sm hover:bg-gray-50">
          Zur Bibliothek
        </Link>
      </main>
    );
  }

  return (
    <main className="p-0">
      {/* Kopfzeile */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h2 className="flex-1 text-2xl font-semibold tracking-tight">Prüfung: {c.title}</h2>
        <ScorePill points={points} maxPoints={maxPoints} last={lastCorrectness} />
        <div className="hidden w-56 sm:block">
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

      {/* Zwei Spalten */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-[var(--steps-w,220px)_1fr]">
        {/* Linke Spalte: Fragenfolge */}
        <aside className="h-fit rounded-xl border border-black/10 bg-white/70 p-3 md:sticky md:top-20">
          <div className="mb-2 text-xs font-medium text-gray-700">Fragenfolge</div>
          <ul className="space-y-2">
            {outline.map((_, i) => {
              const a = asked[i];
              const status = a?.status ?? null;
              const dot =
                !a
                  ? "bg-gray-200"
                  : status === "pending"
                  ? "bg-gray-300"
                  : status === "correct"
                  ? "bg-green-500"
                  : status === "partial"
                  ? "bg-yellow-400"
                  : "bg-red-500";
              return (
                <li key={i} className="flex items-start gap-2 text-sm leading-snug">
                  <span className={`mt-1 inline-block h-3 w-3 rounded-full ${dot}`} />
                  {a ? (
                    <span className="text-gray-900">{a.text}</span>
                  ) : (
                    <span className="select-none italic text-gray-400">{i + 1}. …</span>
                  )}
                </li>
              );
            })}
          </ul>

          {allowRetryNext && (
            <div className="mt-3 rounded-md border border-yellow-200 bg-yellow-50 p-2 text-[11px] text-yellow-800">
              🔁 Du kannst die letzte Frage <b>nochmal beantworten</b> oder eine kurze
              Verständnisfrage stellen. Diese nächste Antwort zählt zu <b>75%</b>.
            </div>
          )}
        </aside>

        {/* Rechte Spalte: Chat */}
        <section className="flex flex-col gap-3">
          <div
            ref={listRef}
            className="h-[58vh] overflow-y-auto rounded-2xl border border-black/10 bg-white p-4 shadow-card text-gray-900"
          >
            {transcript.map((t, i) => (
              <div key={i} className={`mb-3 ${t.role === "prof" ? "" : "text-right"}`}>
                <div
                  className={`inline-block max-w-[80%] rounded-2xl px-3 py-2 shadow-sm ${
                    t.role === "prof"
                      ? "border border-black/10 bg-white/80"
                      : "bg-brand-600 text-white"
                  }`}
                >
                  <span className="text-sm leading-relaxed">
                    <b className="opacity-80">{t.role === "prof" ? "Prüfer" : "Du"}:</b>{" "}
                    {t.text}
                  </span>
                </div>
              </div>
            ))}
            {loading && <div className="text-sm text-gray-500">Denke nach…</div>}
            {!hasStarted && (
              <div className="text-sm text-gray-600">
                Klicke auf <b>Prüfung starten</b>, um zu beginnen.
              </div>
            )}
            {ended && (
              <div className="mt-2 text-sm text-green-700">
                ✅ Fall abgeschlossen — Score {Number.isInteger(points) ? points : points.toFixed(1)}/
                {maxPoints} ({Math.round((points / Math.max(1, maxPoints)) * 100)}%)
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (hasStarted) onSend();
              else startExam();
            }}
            className="flex gap-2"
          >
            {!hasStarted ? (
              <button
                type="submit"
                className="rounded-md bg-brand-600 px-3 py-2 text-sm text-white hover:bg-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
              >
                Prüfung starten
              </button>
            ) : (
              <>
                <input
                  className="flex-1 rounded-md border border-black/10 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
                  placeholder={
                    ended ? "Fall beendet" : allowRetryNext ? "Retry/Verständnisfrage…" : "Deine Antwort…"
                  }
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={ended}
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim() || ended}
                  className="rounded-md border border-black/10 bg-white px-3 py-2 text-sm text-gray-900 hover:bg-black/[.04] disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
                >
                  Senden
                </button>
                <button
                  type="button"
                  onClick={requestTip}
                  disabled={loading || ended}
                  className="rounded-md border border-black/10 bg-white px-3 py-2 text-sm text-gray-900 hover:bg-black/[.04] disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
                  title="Kleinen Hinweis erhalten"
                >
                  💡 Tipp
                </button>
              </>
            )}

            <Link
              href={`/cases/${c.id}`}
              className="ml-auto rounded-md border border-black/10 bg-white px-3 py-2 text-sm text-gray-900 hover:bg-black/[.04] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
            >
              Fallinfo
            </Link>
          </form>
        </section>
      </div>
    </main>
  );
}