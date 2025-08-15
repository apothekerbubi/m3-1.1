// src/app/exam/[id]/page.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { CASES } from "@/data/cases";
import type { Case } from "@/lib/types";
import ProgressBar from "@/components/ProgressBar";
import ScorePill from "@/components/ScorePill";

// ---- Lokale UI-Typen ----
type Turn = { role: "prof" | "student"; text: string };

type ApiReply = {
  say_to_student: string | null;
  evaluation: null | {
    correctness: "correct" | "partially_correct" | "incorrect";
    feedback: string;
    tips?: string;
  };
  next_question: string | null; // im neuen Flow ungenutzt
  end: boolean; // im neuen Flow ungenutzt
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

  // *** State ***
  const [chat, setChat] = useState<Turn[]>([]); // Chat nur für den aktuellen Schritt
  const [asked, setAsked] = useState<Asked[]>([]); // Linke Übersicht – wächst dynamisch
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [ended, setEnded] = useState(false);
  const [style, setStyle] = useState<"strict" | "coaching">("coaching");
  const [lastCorrectness, setLastCorrectness] =
    useState<"correct" | "partially_correct" | "incorrect" | null>(null);

  // Aktueller Schritt + Versuche/Weiter
  const [stepIndex, setStepIndex] = useState<number>(0);
  const [attemptCount, setAttemptCount] = useState<number>(0); // 0→1. Versuch, 1→2., >=2 → weitere Sends = 3. Versuch
  const [canAdvance, setCanAdvance] = useState<boolean>(false);

  // Punkte pro Schritt (Bestwert) → verhindert Doppelzählung
  const [perStepScores, setPerStepScores] = useState<number[]>([]);

  const listRef = useRef<HTMLDivElement | null>(null);

  // *** Abgeleitete Daten ***
  const stepsOrdered = useMemo(
    () => (c ? [...c.steps].sort((a, b) => a.order - b.order) : []),
    [c]
  );
  const currentPrompt = stepsOrdered[stepIndex]?.prompt ?? "";
  const stepRule = (stepsOrdered[stepIndex] as any)?.rule ?? null;
  const stepPoints = useMemo(() => {
    const p = (stepsOrdered[stepIndex] as any)?.points as number | undefined;
    return typeof p === "number" ? p : 2;
  }, [stepsOrdered, stepIndex]);
  const stepReveal = (stepsOrdered[stepIndex] as any)?.reveal ?? null;

  const maxPoints = useMemo(
    () =>
      stepsOrdered.reduce((acc, s) => {
        const p = (s as any).points;
        return acc + (typeof p === "number" ? p : 2);
      }, 0),
    [stepsOrdered]
  );

  const totalPoints = useMemo(
    () => Math.round(perStepScores.reduce((a, b) => a + (b || 0), 0) * 10) / 10,
    [perStepScores]
  );

  // Fortschritt = erledigte Schritte / alle Schritte
  const progressPct = useMemo(() => {
    const total = Math.max(1, stepsOrdered.length);
    const done = ended ? total : stepIndex; // stepIndex ist die aktuell offene; alle davor sind erledigt
    return Math.round((done / total) * 100);
  }, [ended, stepIndex, stepsOrdered.length]);

  // *** UI Helpers ***
  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [chat, loading]);

  function label(correctness: "correct" | "partially_correct" | "incorrect") {
    return correctness === "correct"
      ? "✅ Richtig"
      : correctness === "partially_correct"
      ? "🟨 Teilweise richtig"
      : "❌ Nicht korrekt";
  }
  const normalize = (s: string) =>
    s.toLowerCase().replace(/\s+/g, " ").replace(/[.,;:!?]+$/g, "").trim();
  function pushProf(next: Turn[], text?: string | null) {
    if (!text || !text.trim()) return;
    const t = text.trim();
    const lastProf = [...next].reverse().find((x) => x.role === "prof");
    if (!lastProf || normalize(lastProf.text) !== normalize(t)) next.push({ role: "prof", text: t });
  }

  function shouldReveal(
    now: { when: string } | null,
    correctness: ApiReply["evaluation"] | null,
    hadSolution: boolean
  ): boolean {
    if (!now) return false;
    const w = (now as any).when as string;
    if (w === "always") return true;
    if (w === "after_answer") return Boolean(correctness) || hadSolution;
    if (w === "after_full") return correctness?.correctness === "correct";
    if (w === "after_partial")
      return correctness?.correctness === "partially_correct" || correctness?.correctness === "correct";
    return false;
  }

  function formatReveal(content: unknown): string {
    try {
      if (content && typeof content === "object" && (content as any).befundpaketTitel) {
        const c = content as any;
        const lines: string[] = [];
        if (c.vitalparameter) {
          const v = c.vitalparameter;
          lines.push(
            `Vitalparameter: RR ${v.rr ?? "?"}, Puls ${v.puls ?? "?"}/min, Temp ${v.temp ?? "?"}°C, SpO₂ ${v.spo2 ?? "?"}`
          );
        }
        if (c.labor) {
          const lab = c.labor;
          const labPairs = Object.keys(lab).map((k) => {
            const e = lab[k];
            if (e && typeof e === "object" && "wert" in e)
              return `${k}: ${e.wert} ${e.einheit ?? ""} (Ref ${e.referenz ?? ""})`;
            return `${k}: ${String(lab[k])}`;
          });
          lines.push(`Labor: ${labPairs.join(", ")}`);
        }
        if (c.bildgebung?.ultraschall) lines.push(`Sono: ${c.bildgebung.ultraschall}`);
        if (c.interpretationKurz) lines.push(`Kurzinterpretation: ${c.interpretationKurz}`);
        return `🔎 ${c.befundpaketTitel}\n- ${lines.join("\n- ")}`;
      }
      return `Zusatzinfo:\n${JSON.stringify(content, null, 2)}`;
    } catch {
      return "Zusatzinfo verfügbar.";
    }
  }

  // *** API ***
  async function callExamAPI(
    current: Turn[],
    opts: {
      mode: "answer" | "tip" | "explain";
      userText?: string;
    }
  ) {
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
        outline: [], // ➜ verhindert Auto-NEXT
        style,
        objectives: c.objectives ?? [],
        completion: c.completion ?? null,

        // pro Frage bewerten
        stepIndex,
        stepsPrompts: [], // ➜ verhindert Auto-NEXT
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
      const nextT = [...current];

      const hasSolution =
        typeof data.say_to_student === "string" &&
        /^lösung\s*:/i.test(data.say_to_student.trim());
      if (hasSolution) pushProf(nextT, data.say_to_student);

      if (data.evaluation && opts.mode === "answer") {
        const { correctness, feedback, tips } = data.evaluation;
        setLastCorrectness(correctness);

        // Punkte für diesen Schritt als Bestwert (Delta-Update)
        setPerStepScores((prev) => {
          const curPrev = prev[stepIndex] || 0;
          const candidate =
            correctness === "correct"
              ? stepPoints
              : correctness === "partially_correct"
              ? stepPoints * 0.5
              : 0;
          const best = Math.max(curPrev, candidate);
          if (best === curPrev) return prev; // nichts ändern
          const copy = [...prev];
          copy[stepIndex] = Math.round(best * 10) / 10;
          return copy;
        });

        // Asked-Status aktualisieren
        setAsked((prev) => {
          const copy = [...prev];
          const cur = copy[stepIndex];
          if (cur)
            copy[stepIndex] = {
              ...cur,
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
        if (!hasSolution) pushProf(nextT, parts.join(" "));

        // Weiter nur bei korrekt oder wenn Lösung erschienen ist (3. Versuch)
        setCanAdvance(correctness === "correct" || hasSolution);
      }

      // Reveal (falls konfiguriert)
      if (stepReveal && shouldReveal(stepReveal as any, data.evaluation, hasSolution)) {
        pushProf(nextT, formatReveal((stepReveal as any).content));
      }

      // Zusätzliche Prüfer-Nachrichten (Tip/Explain)
      if (!hasSolution && (!data.evaluation || !data.evaluation.feedback) && data.say_to_student) {
        pushProf(nextT, data.say_to_student);
      }

      setChat(nextT);
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  // *** Flow-Funktionen ***
  function startExam() {
    if (!c) return;

    // Reset
    setChat([{ role: "prof", text: `Vignette: ${c.vignette}` }]);
    setAsked([]);
    setPerStepScores(Array(stepsOrdered.length).fill(0));
    setLastCorrectness(null);
    setAttemptCount(0);
    setStepIndex(0);
    setCanAdvance(false);
    setEnded(false);

    // Erste Frage sichtbar machen
    const q = stepsOrdered[0]?.prompt ?? "";
    setAsked([{ index: 0, text: q, status: "pending" }]);
    setChat((prev) => [...prev, { role: "prof", text: q }]);
  }

  function onSend() {
    if (!c || loading || ended) return;
    const text = input.trim();
    if (!text) return;

    const next = [...chat, { role: "student", text }];
    setChat(next);
    setInput("");

    // Versuchszähler hoch (ab 3. Send bleibt attemptStage bei 3)
    setAttemptCount((n) => (n >= 2 ? 2 : n + 1));

    void callExamAPI(next, { mode: "answer", userText: text });
  }

  function nextStep() {
    if (!c) return;

    const last = stepIndex >= stepsOrdered.length - 1;
    if (last) {
      setEnded(true);
      setCanAdvance(false);
      return;
    }

    const idx = stepIndex + 1;
    setStepIndex(idx);
    setAttemptCount(0);
    setLastCorrectness(null);
    setCanAdvance(false);

    // nächste Frage sichtbar machen
    const q = stepsOrdered[idx]?.prompt ?? "";
    setAsked((prev) => [...prev, { index: idx, text: q, status: "pending" }]);

    // Chat für nächste Frage neu aufsetzen
    setChat([{ role: "prof", text: q }]);
  }

  async function requestTip() {
    if (!c || loading || ended) return;
    await callExamAPI(chat, { mode: "tip" });
  }

  async function requestExplain() {
    if (!c || loading || ended) return;
    await callExamAPI(chat, { mode: "explain" });
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
  const isLastStep = stepIndex >= stepsOrdered.length - 1;

  return (
    <main className="p-0">
      {/* Kopfzeile */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h2 className="flex-1 text-2xl font-semibold tracking-tight">Prüfung: {c.title}</h2>
        <ScorePill points={totalPoints} maxPoints={maxPoints} last={lastCorrectness} />
        <div className="hidden w-56 sm:block">
          <ProgressBar value={ended ? 100 : progressPct} label="Fortschritt" />
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
            {asked.map((a, i) => {
              const isCurrent = a.index === stepIndex;
              const dot =
                a.status === "pending"
                  ? "bg-gray-300"
                  : a.status === "correct"
                  ? "bg-green-500"
                  : a.status === "partial"
                  ? "bg-yellow-400"
                  : "bg-red-500";
              return (
                <li key={i} className="flex items-start gap-2 text-sm leading-snug">
                  <span className={`mt-1 inline-block h-3 w-3 rounded-full ${dot}`} />
                  <span className={`${isCurrent ? "font-medium" : ""}`}>{a.text}</span>
                </li>
              );
            })}
          </ul>

          {/* Start / Nächste Frage */}
          <div className="mt-4 flex flex-col gap-2">
            <button
              type="button"
              onClick={hasStarted ? nextStep : startExam}
              disabled={loading || (hasStarted && !canAdvance)}
              className={`rounded-md px-3 py-2 text-sm text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 ${
                hasStarted
                  ? canAdvance
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-gray-400"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {hasStarted ? (isLastStep && canAdvance ? "Abschließen" : "Nächste Frage") : "Prüfung starten"}
            </button>
            {hasStarted && !canAdvance && (
              <div className="rounded-md border border-yellow-200 bg-yellow-50 p-2 text-[11px] text-yellow-800">
                🔎 Antworte (max. 3 Versuche) oder nutze 💡 Tipp / 📘 Erklären. Weiter erst bei korrekter Lösung.
              </div>
            )}
          </div>
        </aside>

        {/* Rechte Spalte: Chat pro Frage */}
        <section className="relative flex flex-col gap-3">
          <div
            ref={listRef}
            className="relative z-10 h-[58vh] overflow-y-auto rounded-2xl border border-black/10 bg-white p-4 shadow-card text-gray-900"
          >
            {chat.map((t, i) => (
              <div key={i} className={`mb-3 ${t.role === "prof" ? "" : "text-right"}`}>
                <div
                  className={`inline-block max-w-[80%] rounded-2xl px-3 py-2 shadow-sm ${
                    t.role === "prof"
                      ? "border border-black/10 bg-white text-gray-900"
                      : "bg-blue-600 text-white"
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
                {maxPoints} ({Math.round((totalPoints / Math.max(1, maxPoints)) * 100)}%)
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
              placeholder={ended ? "Fall beendet" : !hasStarted ? "Zum Start bitte links klicken" : "Deine Antwort…"}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={!hasStarted || ended}
            />
            <button
              type="submit"
              disabled={loading || !hasStarted || ended || !input.trim()}
              className="rounded-md border border-black/10 bg-white px-3 py-2 text-sm text-gray-900 hover:bg-black/[.04] disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
            >
              Senden
            </button>
            <button
              type="button"
              onClick={requestTip}
              disabled={loading || !hasStarted || ended}
              className="rounded-md border border-black/10 bg-white px-3 py-2 text-sm text-gray-900 hover:bg-black/[.04] disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
              title="Kleinen Hinweis erhalten"
            >
              💡 Tipp
            </button>
            <button
              type="button"
              onClick={requestExplain}
              disabled={loading || !hasStarted || ended}
              className="rounded-md border border-black/10 bg-white px-3 py-2 text-sm text-gray-900 hover:bg-black/[.04] disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
              title="Kurze Erklärung zur aktuellen Frage/Antwort"
            >
              📘 Erklären
            </button>

            <button
              type="button"
              onClick={hasStarted ? nextStep : startExam}
              disabled={loading || (hasStarted && !canAdvance)}
              className={`ml-auto rounded-md px-3 py-2 text-sm text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 ${
                hasStarted
                  ? canAdvance
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-gray-400"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {hasStarted ? (isLastStep && canAdvance ? "Abschließen" : "Nächste Frage") : "Prüfung starten"}
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
    </main>
  );
}