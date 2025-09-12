"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CASES } from "@/data/cases";
import type { Case } from "@/lib/types";
import ProgressBar from "@/components/ProgressBar";
import ScorePill from "@/components/ScorePill";

/** ---- Zusatttypen ---- */
type RevealWhen = "on_enter" | "always" | "after_answer" | "after_full" | "after_partial";
type RevealConfig = { when: RevealWhen; content?: unknown };
type CaseStepExtra = { prompt: string; order: number; rule?: unknown; points?: number; reveal?: RevealConfig | null };

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

type ObjMin = { id: string; label: string };
type CompletionRules = { minObjectives: number; maxLLMTurns?: number; hardStopTurns?: number };
type CaseWithRules = Case & { objectives?: ObjMin[]; completion?: CompletionRules | null };

export default function ExamPage() {
  const params = useParams<{ id: string | string[] }>();
  const rawId = params?.id;
  const caseId = Array.isArray(rawId) ? rawId[0] : rawId;
  const c = (CASES.find((x) => x.id === caseId) ?? null) as CaseWithRules | null;

  const router = useRouter();
  const REDIRECT_AFTER_MS = 1200;

  const related = useMemo<Case[]>(() => {
    if (!c?.relatedCases) return [];
    return c.relatedCases
      .map((id) => CASES.find((x) => x.id === id))
      .filter((x): x is Case => Boolean(x));
  }, [c]);

  // --- Serie (aus Query ?s=...,&i=...) — OHNE useSearchParams ---
  const [seriesIds, setSeriesIds] = useState<string[]>([]);
  const [seriesIdx, setSeriesIdx] = useState<number>(0);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const sp = new URLSearchParams(window.location.search);
    const s = sp.get("s");
    const iStr = sp.get("i");
    const ids = s ? s.split(",").map((x) => x.trim()).filter(Boolean) : [];
    setSeriesIds(ids);
    const i = Number.parseInt(iStr ?? "0", 10);
    setSeriesIdx(Number.isFinite(i) && i >= 0 ? i : 0);
  }, [caseId]);
  const seriesTotal = seriesIds.length;
  const seriesPos = Math.min(seriesIdx + 1, Math.max(1, seriesTotal)); // 1-based Anzeige

  // *** State ***
  const [asked, setAsked] = useState<Asked[]>([]);
  const [style, setStyle] = useState<"strict" | "coaching">("coaching");
  const [ended, setEnded] = useState(false);
  const [loading, setLoading] = useState(false);

  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [viewIndex, setViewIndex] = useState<number>(0);

  const [chats, setChats] = useState<Turn[][]>([]);
  const listRef = useRef<HTMLDivElement | null>(null);

  const [perStepScores, setPerStepScores] = useState<number[]>([]);
  const [lastCorrectness, setLastCorrectness] =
    useState<"correct" | "partially_correct" | "incorrect" | null>(null);

  const [attemptCount, setAttemptCount] = useState<number>(0);
  const [input, setInput] = useState("");

  // *** Abgeleitete Daten ***
  const stepsOrdered = useMemo<CaseStepExtra[]>(
    () =>
      c
        ? [...c.steps]
            .sort((a, b) => a.order - b.order)
            .map((s) => ({
              prompt: (s as unknown as { prompt: string }).prompt,
              order: (s as unknown as { order: number }).order,
              rule: (s as Partial<CaseStepExtra>).rule,
              points: (s as Partial<CaseStepExtra>).points,
              reveal: (s as Partial<CaseStepExtra>).reveal ?? null,
            }))
        : [],
    [c]
  );

  const nSteps = stepsOrdered.length;
  const currentPrompt = stepsOrdered[activeIndex]?.prompt ?? "";
  const stepRule: unknown = stepsOrdered[activeIndex]?.rule ?? null;

  const stepPoints = useMemo<number>(() => {
    const p = stepsOrdered[activeIndex]?.points;
    return typeof p === "number" ? p : 2;
  }, [stepsOrdered, activeIndex]);

  const stepReveal: RevealConfig | null = stepsOrdered[activeIndex]?.reveal ?? null;

  const maxPoints = useMemo<number>(
    () => stepsOrdered.reduce((acc, s) => acc + (typeof s.points === "number" ? s.points : 2), 0),
    [stepsOrdered]
  );

  const totalPointsRaw = useMemo<number>(() => perStepScores.reduce((a, b) => a + (b || 0), 0), [perStepScores]);
  const totalPoints = Math.min(Math.round(totalPointsRaw * 10) / 10, maxPoints);

  const progressPct = useMemo<number>(() => {
    const total = Math.max(1, nSteps);
    const done = asked.filter((a) => a.status !== "pending").length;
    return Math.round((done / total) * 100);
  }, [asked, nSteps]);

  const viewChat: Turn[] = useMemo(() => chats[viewIndex] ?? [], [chats, viewIndex]);

  // *** UI Helpers ***
  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [viewChat, loading]);

  // ✅ Nach Abschluss: nur dann zur Übersicht, wenn KEINE Serie mehr offen ist
  useEffect(() => {
    if (!ended) return;
    const goHome = () => router.replace("/subjects");
    const t = setTimeout(goHome, REDIRECT_AFTER_MS);
    return () => clearTimeout(t);
  }, [ended, router]);

  function label(correctness: "correct" | "partially_correct" | "incorrect") {
    return correctness === "correct"
      ? "✅ Richtig"
      : correctness === "partially_correct"
      ? "🟨 Teilweise richtig"
      : "❌ Nicht korrekt";
  }
  const normalize = (s: string) =>
    s.toLowerCase().replace(/\s+/g, " ").replace(/[.,;:!?]+$/g, "").trim();

  function pushProf(step: number, text?: string | null) {
    if (!text || !text.trim()) return;
    const t = text.trim();
    setChats((prev) => {
      const copy: Turn[][] = prev.map((x): Turn[] => [...x]);
      const arr: Turn[] = copy[step] ?? [];
      const lastProf = [...arr].reverse().find((x) => x.role === "prof");
      if (!lastProf || normalize(lastProf.text) !== normalize(t)) {
        const next: Turn[] = [...arr, { role: "prof" as const, text: t }];
        copy[step] = next;
      }
      return copy;
    });
  }
  function pushStudent(step: number, text: string) {
    setChats((prev) => {
      const copy: Turn[][] = prev.map((x): Turn[] => [...x]);
      const arr: Turn[] = copy[step] ?? [];
      copy[step] = [...arr, { role: "student" as const, text }];
      return copy;
    });
  }

  function shouldReveal(
    now: RevealConfig | null,
    evaluation: ApiReply["evaluation"] | null,
    hadSolution: boolean
  ): boolean {
    if (!now) return false;
    const w = now.when;
    if (w === "always") return true;
    if (w === "after_answer") return Boolean(evaluation) || hadSolution;
    if (w === "after_full") return evaluation?.correctness === "correct";
    if (w === "after_partial")
      return evaluation?.correctness === "partially_correct" || evaluation?.correctness === "correct";
    return false;
  }

  function formatReveal(content: unknown): string {
    try {
      const c = content as Record<string, unknown> | null;
      const title =
        c && typeof c.befundpaketTitel === "string" ? (c.befundpaketTitel as string) : undefined;

      const parts: string[] = [];

      const vital =
        c && typeof c.vitalparameter === "object" && c.vitalparameter !== null
          ? (c.vitalparameter as Record<string, unknown>)
          : null;
      if (vital) {
        const rr = typeof vital.rr === "string" ? vital.rr : "?";
        const puls =
          typeof vital.puls === "number" || typeof vital.puls === "string" ? vital.puls : "?";
        const temp =
          typeof vital.temp === "number" || typeof vital.temp === "string" ? vital.temp : "?";
        const spo2 =
          typeof vital.spo2 === "number" || typeof vital.spo2 === "string" ? vital.spo2 : "?";
        parts.push(`Vitalparameter: RR ${rr}, Puls ${puls}/min, Temp ${temp}°C, SpO₂ ${spo2}`);
      }

      const lab =
        c && typeof c.labor === "object" && c.labor !== null ? (c.labor as Record<string, unknown>) : null;
      if (lab) {
        const labPairs: string[] = [];
        for (const k of Object.keys(lab)) {
          const entry = lab[k] as unknown;
          if (entry && typeof entry === "object" && entry !== null && "wert" in (entry as Record<string, unknown>)) {
            const e = entry as Record<string, unknown>;
            const wert = e.wert as string | number | undefined;
            const einheit = (e.einheit as string | undefined) ?? "";
            const referenz = (e.referenz as string | undefined) ?? "";
            labPairs.push(`${k}: ${wert ?? "?"} ${einheit} (Ref ${referenz})`);
          } else {
            labPairs.push(`${k}: ${String(entry)}`);
          }
        }
        parts.push(`Labor: ${labPairs.join(", ")}`);
      }

      const bild =
        c && typeof c.bildgebung === "object" && c.bildgebung !== null
          ? (c.bildgebung as Record<string, unknown>)
          : null;
      const sono = bild && typeof c?.ultraschall === "string" ? (bild?.ultraschall as string) : null;
      if (sono) parts.push(`Sono: ${sono}`);

      const kurz = c && typeof c.interpretationKurz === "string" ? (c.interpretationKurz as string) : null;
      if (kurz) parts.push(`Kurzinterpretation: ${kurz}`);

      if (title || parts.length > 0) {
        return `🔎 ${title ?? "Zusatzinformation"}\n- ${parts.join("\n- ")}`;
      }
      return `Zusatzinfo:\n${JSON.stringify(content, null, 2)}`;
    } catch {
      return "Zusatzinfo verfügbar.";
    }
  }

  function maybeRevealOnEnter(idx: number) {
    const rv = stepsOrdered[idx]?.reveal;
    if (rv && rv.when === "on_enter") {
      pushProf(idx, formatReveal(rv.content));
    }
  }

  // *** API ***
  async function callExamAPI(current: Turn[], opts: { mode: "answer" | "tip" | "explain" }) {
    if (!c) return;
    setLoading(true);
    try {
      const payload: Record<string, unknown> = {
        caseId: c.id,
        points: totalPoints,
        progressPct,
        caseText: c.vignette,
        transcript: current.map((t) => ({
          role: t.role === "prof" ? "examiner" : "student",
          text: t.text,
        })),
        outline: [],
        style,
        objectives: c.objectives ?? [],
        completion: c.completion ?? null,
        stepIndex: activeIndex,
        stepsPrompts: [],
        stepRule,
        focusQuestion: currentPrompt,
      };

      if (opts.mode === "tip") payload["tipRequest"] = true;
      if (opts.mode === "explain") payload["explainRequest"] = true;
      if (opts.mode === "answer") payload["attemptStage"] = Math.min(3, attemptCount + 1);

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

      const hadSolution =
        typeof data.say_to_student === "string" &&
        /^lösung\s*:/i.test(data.say_to_student.trim());

      if (hadSolution) pushProf(activeIndex, data.say_to_student);

      if (data.evaluation && opts.mode === "answer") {
        const { correctness, feedback, tips } = data.evaluation;
        setLastCorrectness(correctness);

        setPerStepScores((prev) => {
          const curPrev = prev[activeIndex] || 0;
          const candidate =
            correctness === "correct" ? stepPoints : correctness === "partially_correct" ? stepPoints * 0.5 : 0;
          const best = Math.max(curPrev, candidate);
          if (best === curPrev) return prev;
          const copy = [...prev];
          copy[activeIndex] = Math.min(Math.round(best * 10) / 10, stepPoints);
          return copy;
        });

        setAsked((prev) => {
          const copy = [...prev];
          const i = copy.findIndex((x) => x.index === activeIndex);
          if (i >= 0) {
            copy[i] = {
              ...copy[i],
              status:
                correctness === "correct"
                  ? "correct"
                  : correctness === "partially_correct"
                  ? "partial"
                  : "incorrect",
            };
          }
          return copy;
        });

        const parts = [
          `${label(correctness)} — ${feedback}`,
          correctness !== "correct" && tips ? `Tipp: ${tips}` : "",
        ].filter(Boolean);
        if (!hadSolution) pushProf(activeIndex, parts.join(" "));

        if (stepReveal && shouldReveal(stepReveal, data.evaluation, hadSolution)) {
          pushProf(activeIndex, formatReveal(stepReveal.content));
        }
      }

      if (!hadSolution && (!data.evaluation || !data.evaluation.feedback) && data.say_to_student) {
        pushProf(activeIndex, data.say_to_student);
      }
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  // --- Fortschritt speichern ---
  async function persistProgress({ completed }: { completed: boolean }) {
    if (!c) return;
    try {
      await fetch("/api/progress/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseId: c.id, score: totalPoints, maxScore: maxPoints, completed }),
      });
    } catch {
      // still
    }
  }

  // *** Flow-Funktionen ***
  function startExam() {
    if (!c) return;
    const n = stepsOrdered.length;

    setAsked([]);
    setPerStepScores(Array(n).fill(0));
    setLastCorrectness(null);
    setAttemptCount(0);
    setActiveIndex(0);
    setViewIndex(0);
    setEnded(false);

    const initChats: Turn[][] = Array.from({ length: n }, () => []);
    const q0 = stepsOrdered[0]?.prompt ?? "";
    initChats[0] = [
      { role: "prof" as const, text: `Vignette: ${c.vignette}` },
      { role: "prof" as const, text: q0 },
    ];
    setChats(initChats);

    setAsked([{ index: 0, text: q0, status: "pending" }]);
    maybeRevealOnEnter(0);
  }

  function onSend() {
    if (!c || loading || ended) return;
    if (viewIndex !== activeIndex) return;

    const text = input.trim();
    if (!text) return;

    pushStudent(activeIndex, text);
    setInput("");
    setAttemptCount((n) => (n >= 2 ? 2 : n + 1));

    const current: Turn[] = [
      ...(((chats[activeIndex] ?? []) as Turn[])),
      { role: "student" as const, text },
    ];
    void callExamAPI(current, { mode: "answer" });
  }

  function goToStep(idx: number) {
    if (!c) return;
    if (!asked.find((a) => a.index === idx)) return;
    setViewIndex(idx);
  }

  function nextStep() {
    if (!c) return;

    const last = activeIndex >= nSteps - 1;
    if (last) {
      // 🔁 Serie aktiv? -> direkt zum nächsten Fall springen
      if (seriesTotal > 0 && seriesIdx < seriesTotal - 1) {
        void persistProgress({ completed: true });
        const nextIdx = seriesIdx + 1;
        const sParam = encodeURIComponent(seriesIds.join(","));
        router.replace(`/exam/${seriesIds[nextIdx]}?s=${sParam}&i=${nextIdx}`);
        return;
      }

      // sonst „normal“ abschließen (und per Effekt zurück)
      setEnded(true);
      void persistProgress({ completed: true });
      return;
    }

    const idx = activeIndex + 1;
    const q = stepsOrdered[idx]?.prompt ?? "";

    setAsked((prev) => {
      if (prev.find((a) => a.index === idx)) return prev;
      return [...prev, { index: idx, text: q, status: "pending" }];
    });

    setChats((prev) => {
      const copy: Turn[][] = prev.map((x): Turn[] => [...x]);
      if (!copy[idx] || copy[idx].length === 0) {
        copy[idx] = [{ role: "prof" as const, text: q }];
      }
      return copy;
    });

    setActiveIndex(idx);
    setViewIndex(idx);
    setAttemptCount(0);
    setLastCorrectness(null);
    maybeRevealOnEnter(idx);
  }

  async function requestTip() {
    if (!c || loading || ended) return;
    if (viewIndex !== activeIndex) return;
    const current = (chats[activeIndex] ?? []) as Turn[];
    await callExamAPI(current, { mode: "tip" });
  }

  async function requestExplain() {
    if (!c || loading || ended) return;
    if (viewIndex !== activeIndex) return;
    const current = (chats[activeIndex] ?? []) as Turn[];
    await callExamAPI(current, { mode: "explain" });
  }

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

  const hasStarted = asked.length > 0;
  const isLastStep = activeIndex >= nSteps - 1;

  return (
    <main className="p-0">
      {/* Kopfzeile */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h2 className="flex-1 text-2xl font-semibold tracking-tight">Prüfung: {c.title}</h2>
        <ScorePill points={totalPoints} maxPoints={maxPoints} last={lastCorrectness} />

        {/* 🔁 Serien-Progress (klein) */}
        {seriesTotal > 0 && (
          <div className="hidden w-48 sm:block">
            <ProgressBar
              value={Math.round((seriesIdx / Math.max(1, seriesTotal)) * 100)}
            />
          </div>
        )}

        <div className="hidden w-56 sm:block">
          <ProgressBar value={ended ? 100 : progressPct} />
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
      <div className="grid grid-cols-1 gap-4 md:grid-cols-[var(--steps-w,260px)_1fr]">
        {/* Linke Spalte */}
        <aside className="h-fit rounded-xl border border-black/10 bg-white/70 p-3 md:sticky md:top-20">
          <div className="mb-2 text-xs font-medium text-gray-700">Fragenfolge</div>
          <ul className="space-y-2">
            {asked.map((a) => {
              const dot =
                a.status === "pending"
                  ? "bg-gray-300"
                  : a.status === "correct"
                  ? "bg-green-500"
                  : a.status === "partial"
                  ? "bg-yellow-400"
                  : "bg-red-500";
              const isView = a.index === viewIndex;
              const isActive = a.index === activeIndex;
              return (
                <li key={a.index} className="grid grid-cols-[12px_1fr] items-start gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full self-start mt-2 flex-none ${dot}`} aria-hidden />
                  <button
                    type="button"
                    onClick={() => setViewIndex(a.index)}
                    className={[
                      "block w-full rounded-2xl border px-3 py-2 text-left text-[13px] leading-snug",
                      "hover:bg-blue-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400",
                      isView ? "border-blue-400 bg-blue-50 ring-1 ring-blue-300" : "border-blue-200 bg-white",
                      isActive ? "text-gray-900" : "text-gray-800",
                    ].join(" ")}
                    title="Frage ansehen"
                  >
                    {a.text}
                  </button>
                </li>
              );
            })}
          </ul>

          {/* Start / Nächste Frage */}
          <div className="mt-4 flex flex-col gap-2">
            <button
              type="button"
              onClick={hasStarted ? nextStep : startExam}
              disabled={loading}
              className="rounded-md border border-black/10 bg-white px-3 py-2 text-sm text-gray-900 hover:bg-black/[.04] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
            >
              {hasStarted ? (isLastStep ? "Abschließen" : "Nächste Frage") : "Prüfung starten"}
            </button>
            {hasStarted && (viewIndex !== activeIndex) && (
              <button
                type="button"
                onClick={() => setViewIndex(activeIndex)}
                className="rounded-md border border-black/10 bg-white px-3 py-2 text-xs text-gray-800 hover:bg-black/[.04] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
              >
                Zur aktuellen Frage springen
              </button>
            )}
          </div>
        </aside>

        {/* Rechte Spalte: Chat */}
        <section className="relative flex flex-col gap-3">
          <div
            ref={listRef}
            className="relative z-10 h-[58vh] overflow-y-auto rounded-2xl border border-black/10 bg-white p-4 shadow-card text-gray-900"
          >
            {viewChat.map((t, i) => (
              <div key={i} className={`mb-3 ${t.role === "prof" ? "" : "text-right"}`}>
                <div
                  className={`inline-block max-w-[80%] rounded-2xl px-3 py-2 shadow-sm ${
                    t.role === "prof" ? "border border-black/10 bg-white text-gray-900" : "bg-blue-600 text-white"
                  }`}
                >
                  <span className="text-sm leading-relaxed">
                    <b className="opacity-80">{t.role === "prof" ? "Prüfer" : "Du"}:</b> {t.text}
                  </span>
                </div>
              </div>
            ))}
            {!hasStarted && (
              <div className="text-sm text-gray-600">
                Klicke auf <b>Prüfung starten</b>, um zu beginnen.
              </div>
            )}
            {ended && (
              <div className="mt-2 text-sm text-green-700">
                ✅ Fall abgeschlossen — Score {Number.isInteger(totalPoints) ? totalPoints : totalPoints.toFixed(1)}/
                {maxPoints} ({Math.round(((totalPoints || 0) / Math.max(1, maxPoints)) * 100)}%)
              </div>
            )}
          </div>

          {/* Eingabezeile */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!hasStarted) return startExam();
              if (!ended) onSend();
            }}
            className="relative z-10 flex flex-wrap gap-2"
          >
            <input
              className="min-w-0 flex-1 rounded-md border border-black/10 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
              placeholder={
                ended
                  ? "Fall beendet"
                  : !hasStarted
                  ? "Zum Start bitte links klicken"
                  : (viewIndex !== activeIndex)
                  ? "Nur Ansicht – zurück zur aktuellen Frage wechseln"
                  : "Deine Antwort…"
              }
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={!hasStarted || ended || viewIndex !== activeIndex}
            />
            <button
              type="submit"
              disabled={loading || !hasStarted || ended || viewIndex !== activeIndex || !input.trim()}
              className="rounded-md border border-black/10 bg-white px-3 py-2 text-sm text-gray-900 hover:bg-black/[.04] disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
            >
              Senden
            </button>
            <button
              type="button"
              onClick={requestTip}
              disabled={loading || !hasStarted || ended || viewIndex !== activeIndex}
              className="rounded-md border border-black/10 bg-white px-3 py-2 text-sm text-gray-900 hover:bg-black/[.04] disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
              title="Kleinen Hinweis erhalten"
            >
              💡 Tipp
            </button>
            <button
              type="button"
              onClick={requestExplain}
              disabled={loading || !hasStarted || ended || viewIndex !== activeIndex}
              className="rounded-md border border-black/10 bg-white px-3 py-2 text-sm text-gray-900 hover:bg-black/[.04] disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
              title="Kurze Erklärung zur aktuellen Frage/Antwort"
            >
              📘 Erklären
            </button>

            <button
              type="button"
              onClick={hasStarted ? nextStep : startExam}
              disabled={loading}
              className="ml-auto rounded-md px-3 py-2 text-sm text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 bg-blue-600 hover:bg-blue-700"
            >
              {hasStarted ? (isLastStep ? "Abschließen" : "Nächste Frage") : "Prüfung starten"}
            </button>

            <Link
              href={`/cases/${c.id}`}
              className="rounded-md border border-black/10 bg-white px-3 py-2 text-sm text-gray-900 hover:bg-black/[.04] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
            >
              Fallinfo
            </Link>
          </form>
        </section>
      </div>

      {related.length > 0 && (
        <div className="mt-8">
          <h3 className="mb-2 text-lg font-semibold">Verwandte Fälle</h3>
          <ul className="list-disc space-y-1 pl-5">
            {related.map((rc) => (
              <li key={rc.id}>
                <Link
                  href={`/simulate/${rc.id}`}
                  className="text-blue-600 underline-offset-2 hover:underline"
                >
                  {rc.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}