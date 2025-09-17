// src/app/exam/[id]/page.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CASES } from "@/data/cases";
import type { Case, Step, StepReveal } from "@/lib/types";
import ProgressBar from "@/components/ProgressBar";
import ScorePill from "@/components/ScorePill";
import CaseImagePublic from "@/components/CaseImagePublic";

// ---- Lokale UI-Typen ----
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

/* ------- Serien-Store für Summary ------- */
type SeriesResultRow = {
  title: string;
  subject: string | null;
  category: string | null;
  score: number;
  maxScore: number;
  pct: number;
  completed: boolean;
};
type SeriesStore = {
  seriesId: string;
  startedAt?: string | null;
  endedAt?: string | null;
  caseIds?: string[];
  results?: Record<string, SeriesResultRow>;
};

function updateSeriesLocal(
  sid: string,
  data: {
    caseId: string;
    title: string;
    subject: string | null;
    category: string | null;
    score: number;
    maxScore: number;
    completed: boolean;
  },
  meta?: { caseIds?: string[]; ended?: boolean }
): void {
  if (typeof window === "undefined") return;
  const key = `series:${sid}`;
  const now = new Date().toISOString();

  const cur: SeriesStore =
    JSON.parse(localStorage.getItem(key) || "{}") || ({} as SeriesStore);

  const next: SeriesStore = {
    seriesId: sid,
    startedAt: cur.startedAt || now,
    endedAt: meta?.ended ? now : cur.endedAt || null,
    caseIds:
      Array.isArray(meta?.caseIds) && meta?.caseIds.length
        ? meta.caseIds
        : cur.caseIds || [],
    results: {
      ...(cur.results || {}),
      [data.caseId]: {
        title: data.title,
        subject: data.subject,
        category: data.category,
        score: data.score,
        maxScore: data.maxScore,
        pct: data.maxScore > 0 ? Math.round((data.score / data.maxScore) * 100) : 0,
        completed: data.completed,
      },
    },
  };

  localStorage.setItem(key, JSON.stringify(next));
}

export default function ExamPage() {
  const params = useParams<{ id: string | string[] }>();
  const rawId = params?.id;
  const caseId = Array.isArray(rawId) ? rawId[0] : rawId;
  const c = (CASES.find((x) => x.id === caseId) ?? null) as CaseWithRules | null;

  // Router + Verzögerungsdauer
  const router = useRouter();
  const REDIRECT_AFTER_MS = 900;

  // -------- Serie (aus Query ?s=...,&i=...,&sid=...) – OHNE useSearchParams --------
  function readSeriesFromLocation() {
    if (typeof window === "undefined") return { ids: [] as string[], idx: 0, sid: null as string | null };
    const sp = new URLSearchParams(window.location.search);
    const s = sp.get("s");
    const ids = s ? s.split(",").map((x) => x.trim()).filter(Boolean) : [];
    const iRaw = sp.get("i");
    const i = Number.parseInt(iRaw ?? "0", 10);
    const sid = sp.get("sid");
    return { ids, idx: Number.isFinite(i) && i >= 0 ? i : 0, sid: sid || null };
  }

  const [{ ids: seriesIds, idx: seriesIdx, sid: seriesId }, setSeries] = useState(() => readSeriesFromLocation());

  // Neu einlesen, wenn die Route (Fall) wechselt
  useEffect(() => {
    setSeries(readSeriesFromLocation());
  }, [caseId]);

  const seriesTotal = seriesIds.length;
  const seriesDone = Math.min(seriesIdx + 0, Math.max(0, seriesTotal ? seriesIdx : 0)); // während des Falls = bereits abgeschlossene Fälle
  const seriesPct = seriesTotal > 0 ? Math.round((seriesDone / seriesTotal) * 100) : 0;

  // *** State ***
  const [asked, setAsked] = useState<Asked[]>([]);
  const [style, setStyle] = useState<"strict" | "coaching">("coaching");
  const [ended, setEnded] = useState(false);
  const [loading, setLoading] = useState(false);

  // Aktueller Schritt (aktiv zu beantworten) + Ansicht (Review)
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [viewIndex, setViewIndex] = useState<number>(0);

  // Chats pro Schritt
  const [chats, setChats] = useState<Turn[][]>([]);
  const [nextQuestionOverrides, setNextQuestionOverrides] = useState<Record<number, string>>({});
  const listRef = useRef<HTMLDivElement | null>(null);

  // 🔽 Sidebar: Container + letztes Item für Auto-Scroll
  const sidebarRef = useRef<HTMLDivElement | null>(null);
  const lastAskedRef = useRef<HTMLLIElement | null>(null);

  // Punkte pro Schritt (Bestwert)
  const [perStepScores, setPerStepScores] = useState<number[]>([]);
  const [lastCorrectness, setLastCorrectness] =
    useState<"correct" | "partially_correct" | "incorrect" | null>(null);

  // Versuchszähler für den aktiven Schritt
  const [attemptCount, setAttemptCount] = useState<number>(0);

  const [input, setInput] = useState("");

  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [ttsEnabled, setTtsEnabled] = useState(false);

  // *** Abgeleitete Daten ***
  const stepsOrdered = useMemo<Step[]>(
    () => (c ? [...c.steps].sort((a, b) => a.order - b.order) : []),
    [c]
  );

  const nSteps = stepsOrdered.length;

  const currentPrompt = stepsOrdered[activeIndex]?.prompt ?? "";
  const stepRule: unknown = stepsOrdered[activeIndex]?.rule ?? null;

  const stepPoints = useMemo<number>(() => {
    const p = stepsOrdered[activeIndex]?.points;
    return typeof p === "number" ? p : 2;
  }, [stepsOrdered, activeIndex]);

  const stepReveal: StepReveal | null = (stepsOrdered[activeIndex]?.reveal ?? null) as StepReveal | null;

  // ❗ maximale Punktzahl
  const maxPoints = useMemo<number>(
    () => stepsOrdered.reduce((acc, s) => acc + (typeof s.points === "number" ? s.points : 2), 0),
    [stepsOrdered]
  );

  const totalPointsRaw = useMemo<number>(
    () => perStepScores.reduce((a, b) => a + (b || 0), 0),
    [perStepScores]
  );
  const totalPoints = Math.min(Math.round(totalPointsRaw * 10) / 10, maxPoints);

  // Fortschritt = erledigte Schritte / alle Schritte
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

  // 🔽 Sidebar Auto-Scroll
  useEffect(() => {
    if (lastAskedRef.current) {
      lastAskedRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [asked.length, activeIndex]);

  // ✅ Nach Abschluss: entweder nächster Fall der Serie, sonst Summary (mit sid) oder zurück
  useEffect(() => {
    if (!ended) return;
    const t = setTimeout(() => {
      // Serie vorhanden & noch nicht am Ende?
      if (seriesTotal > 0 && seriesIdx < seriesTotal - 1) {
        const nextIdx = seriesIdx + 1;
        const nextId = seriesIds[nextIdx];
        const q = `?s=${encodeURIComponent(seriesIds.join(","))}&i=${nextIdx}${
          seriesId ? `&sid=${encodeURIComponent(seriesId)}` : ""
        }`;
        router.replace(`/exam/${nextId}${q}`);
      } else if (seriesId) {
        router.replace(`/exam/summary?sid=${encodeURIComponent(seriesId)}`);
      } else {
        router.replace("/subjects");
      }
    }, REDIRECT_AFTER_MS);
    return () => clearTimeout(t);
  }, [ended, seriesIdx, seriesIds, seriesTotal, seriesId, router]);

  function label(correctness: "correct" | "partially_correct" | "incorrect") {
    return correctness === "correct"
      ? "✅ Richtig"
      : correctness === "partially_correct"
      ? "🟨 Teilweise richtig"
      : "❌ Nicht korrekt";
  }
  const normalize = (s: string) =>
    s.toLowerCase().replace(/\s+/g, " ").replace(/[.,;:!?]+$/g, "").trim();

  // 🔒 Immer anonyme Überschrift
  function anonymousTitle(caseObj: CaseWithRules | null): string {
    if (!caseObj) return "Prüfung";
    const pseudo = caseObj.pseudonym;
    if (pseudo && pseudo.trim()) {
      return pseudo.replace(/[_-]+/g, " ").replace(/\p{L}+/gu, (w) => w[0].toUpperCase() + w.slice(1));
    }
    const sym = caseObj.leadSymptom;
    if (sym && sym.trim()) return sym;
    return "Prüfung";
  }
  async function speak(text: string) {
    try {
      const res = await fetch("/api/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.play();
    } catch {}
  }


  function pushProf(step: number, text?: string | null) {
    if (!text || !text.trim()) return;
    const t = text.trim();
    setChats((prev) => {
      const copy: Turn[][] = prev.map((x) => [...x]);
      const arr: Turn[] = (copy[step] ?? []) as Turn[];
      const lastProf = [...arr].reverse().find((x) => x.role === "prof");
      if (!lastProf || normalize(lastProf.text) !== normalize(t)) {
        const next: Turn[] = [...arr, { role: "prof" as const, text: t }];
        copy[step] = next;
      }
      return copy;
    });
     if (ttsEnabled) {
      void speak(t);
    }
  }

  function pushStudent(step: number, text: string) {
    setChats((prev) => {
      const copy: Turn[][] = prev.map((x) => [...x]);
      const arr: Turn[] = (copy[step] ?? []) as Turn[];
      copy[step] = [...arr, { role: "student" as const, text }];
      return copy;
    });
  }


  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      audioChunksRef.current = [];
      const mr = new MediaRecorder(stream);
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      mr.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const fd = new FormData();
        fd.append("file", blob, "speech.webm");
        try {
          const res = await fetch("/api/transcribe", { method: "POST", body: fd });
          const data = await res.json();
          if (data.text) {
            setInput((prev) => (prev ? prev + " " : "") + data.text);
          }
        } catch {}
        stream.getTracks().forEach((t) => t.stop());
      };
      mediaRecorderRef.current = mr;
      mr.start();
      setRecording(true);
    } catch (e) {
      console.error(e);
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  }

  function shouldReveal(
    now: StepReveal | null,
    evaluation: ApiReply["evaluation"] | null,
    hadSolution: boolean
  ): boolean {
    if (!now) return false;
    const w = now.when;
    if (w === "always") return true;
    if (w === "on_enter") return false;
    if (w === "on_submit") return Boolean(evaluation) || hadSolution;
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

      const sono =
        (typeof bild?.lungensonografie === "string" ? (bild?.lungensonografie as string) : null) ??
        (typeof bild?.ultraschall === "string" ? (bild?.ultraschall as string) : null);
      if (sono) parts.push(`Sono: ${sono}`);

      const rx = typeof bild?.roentgen === "string" ? (bild?.roentgen as string) : null;
      if (rx) parts.push(`Röntgen: ${rx}`);

      const ct = typeof bild?.ct === "string" ? (bild?.ct as string) : null;
      if (ct) parts.push(`CT: ${ct}`);

      const mrt = typeof bild?.mrt === "string" ? (bild?.mrt as string) : null;
      if (mrt) parts.push(`MRT: ${mrt}`);

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
    const rv = stepsOrdered[idx]?.reveal as StepReveal | undefined;
    if (rv && rv.when === "on_enter") {
      pushProf(idx, formatReveal(rv.content));
    }
  }

// *** API ***
async function callExamAPI(
  current: Turn[],
  opts: { mode: "answer" | "tip" | "explain" }
) {
  if (!c) return;
  setLoading(true);
  try {
    // 🔹 NEU: kumulierte Student:innen-Antworten für den aktuellen Schritt sammeln
    const turnsThisStep = (chats[activeIndex] ?? []) as Turn[];
    const studentSoFar = turnsThisStep
      .filter((t) => t.role === "student")
      .map((t) => t.text.trim())
      .filter(Boolean);

    // sehr simple Itemisierung + Deduplizierung (Komma / Semikolon / Slash / Zeilenumbruch)
    const studentUnion = Array.from(
      new Set(
        studentSoFar
          .join(" ; ")
          .split(/[,;\/\n\r]+/g)
          .map((s) => s.trim())
          .filter(Boolean)
      )
    );

    const payload: Record<string, unknown> = {
      caseId: c.id,
      points: totalPoints,
      progressPct,
      caseText: c.vignette,
      transcript: current.map((t): { role: "examiner" | "student"; text: string } => ({
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

      // 🔹 NEU: Felder für die kumulative Bewertung
      student_so_far: studentSoFar,                 // alle bisherigen Texte
      student_union: studentUnion,                  // deduplizierte Items
      student_so_far_text: studentSoFar.join("\n"), // als Fließtext
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

    if (
      typeof data.next_question === "string" &&
      data.next_question.trim() &&
      activeIndex < nSteps - 1
    ) {
      const nextIdx = activeIndex + 1;
      const text = data.next_question.trim();
      setNextQuestionOverrides((prev) => ({ ...prev, [nextIdx]: text }));
    }

    const hadSolution =
      typeof data.say_to_student === "string" &&
      /^lösung\s*:/i.test(data.say_to_student.trim());

    if (hadSolution) pushProf(activeIndex, data.say_to_student);

    if (data.evaluation && opts.mode === "answer") {
      const { correctness, feedback, tips } = data.evaluation;
      setLastCorrectness(correctness);

      // Punkte (Bestwert je Schritt)
      setPerStepScores((prev) => {
        const curPrev = prev[activeIndex] || 0;
        const candidate =
          correctness === "correct"
            ? stepPoints
            : correctness === "partially_correct"
            ? stepPoints * 0.5
            : 0;
        const best = Math.max(curPrev, candidate);
        if (best === curPrev) return prev;
        const copy = [...prev];
        copy[activeIndex] = Math.min(Math.round(best * 10) / 10, stepPoints);
        return copy;
      });

      // Status aktualisieren
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

      // Reveal (falls konfiguriert, nicht on_enter)
      if (stepReveal && shouldReveal(stepReveal, data.evaluation, hadSolution)) {
        pushProf(activeIndex, formatReveal(stepReveal.content));
      }
    }

    // Zusätzliche Prüfer-Nachrichten (Tip/Explain)
    if (!hadSolution && (!data.evaluation || !data.evaluation.feedback) && data.say_to_student) {
      pushProf(activeIndex, data.say_to_student);
    }
  } catch (e: unknown) {
    alert(e instanceof Error ? e.message : String(e));
  } finally {
    setLoading(false);
  }
}

  // -------------------------------------------------
  // Fortschritt in Supabase speichern (+ lokal für Summary)
  // -------------------------------------------------
  async function persistProgress({ completed }: { completed: boolean }) {
    if (!c) return;
    try {
      await fetch("/api/progress/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseId: c.id,
          score: totalPoints,
          maxScore: maxPoints,
          completed,
        }),
      });
    } catch {
      // Absichtlich still – UI nicht blockieren
    } finally {
      // ➕ NEU: lokale Serien-Resultate für Summary sichern
      if (seriesId) {
        const subj = (c.subject ?? c.specialty) ?? null;
        const cat = (c.category ?? c.subspecialty) ?? null;
        updateSeriesLocal(
          seriesId,
          {
            caseId: c.id,
            title: c.title,
            subject: subj,
            category: cat,
            score: totalPoints,
            maxScore: maxPoints,
            completed,
          },
          {
            caseIds: seriesIds,
            ended: true, // wir rufen persistProgress nur beim Abschluss des Falls
          }
        );
      }
    }
  }
  // -------------------------------------------------

  // *** Flow-Funktionen ***
  async function startExam() {
    if (!c) return;

    // 🔹 Zähler in Supabase hochziehen
    try {
      await fetch("/api/progress/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseId: c.id }),
      });
    } catch {
      console.warn("Start-Tracking fehlgeschlagen");
    }

    const n = stepsOrdered.length;

    // Reset
    setAsked([]);
    setPerStepScores(Array(n).fill(0));
    setLastCorrectness(null);
    setAttemptCount(0);
    setActiveIndex(0);
    setViewIndex(0);
    setEnded(false);
    setNextQuestionOverrides({});

    // Chats vorbereiten
    const initChats: Turn[][] = Array.from({ length: n }, () => []);
    const q0 = stepsOrdered[0]?.prompt ?? "";
    initChats[0] = [
      { role: "prof", text: `Vignette: ${c.vignette}` },
      { role: "prof", text: q0 },
    ];
    setChats(initChats);

    // Erste Frage sichtbar + evtl. on_enter-Reveal
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
    // Nur bereits freigegebene Fragen wählbar
    if (!asked.find((a) => a.index === idx)) return;

    setViewIndex(idx);
  }

  function nextStep() {
    if (!c) return;

    const last = activeIndex >= nSteps - 1;
    if (last) {
      setEnded(true);
      // beim Abschließen Fortschritt speichern (+ lokal)
      void persistProgress({ completed: true });
      return;
    }

    const idx = activeIndex + 1;
    const basePrompt = stepsOrdered[idx]?.prompt ?? "";
    const nextText = nextQuestionOverrides[idx]?.trim() || basePrompt;

    // neue Frage freischalten (immer erlaubt)
    setAsked((prev) => {
      if (prev.find((a) => a.index === idx)) return prev; // schon freigeschaltet
      return [...prev, { index: idx, text: nextText, status: "pending" }];
    });

    // neuen Chat ggf. anlegen
    setChats((prev) => {
      const copy = prev.map((x) => [...x]);
      if (!copy[idx] || copy[idx].length === 0) {
        copy[idx] = [{ role: "prof", text: nextText }];
      }
      return copy;
    });

    // Status/Steuerung
    setActiveIndex(idx);
    setViewIndex(idx);
    setAttemptCount(0);
    setLastCorrectness(null);

    // on_enter-Reveal
    maybeRevealOnEnter(idx);
  }

  async function requestTip() {
    if (!c || loading || ended) return;
    if (viewIndex !== activeIndex) return;
    const current = chats[activeIndex] ?? [];
    await callExamAPI(current, { mode: "tip" });
  }

  async function requestExplain() {
    if (!c || loading || ended) return;
    if (viewIndex !== activeIndex) return;
    const current = chats[activeIndex] ?? [];
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
  const viewingPast = viewIndex !== activeIndex;

  // Bild des gerade betrachteten Schritts (für Chat-Panel)
  const stepImg = stepsOrdered[viewIndex]?.image;

  return (
    <main className="p-0">
      {/* Kopfzeile */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h2 className="flex-1 text-2xl font-semibold tracking-tight">
          Prüfung: {anonymousTitle(c)}
        </h2>

        {/* Serien-Progressbar (falls Serie vorhanden) */}
        {seriesTotal > 0 && (
  <div className="w-48">
    <div className="mb-1 text-[11px] text-gray-600">
      Serie {seriesIdx + 1}/{seriesTotal}
    </div>
    <ProgressBar
      value={ended ? Math.round(((seriesIdx + 1) / seriesTotal) * 100) : seriesPct}
    />
  </div>
)}

        <ScorePill points={totalPoints} maxPoints={maxPoints} last={lastCorrectness} />

        {/* Schritt-Progressbar */}
<div className="hidden w-56 sm:block">
  <div className="mb-1 text-[11px] text-gray-600">Fortschritt</div>
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
        <aside
          ref={sidebarRef}
          className="rounded-xl border border-black/10 bg-white/70 p-3 md:sticky md:top-20
                     overflow-y-auto max-h-[calc(100vh-120px)]"
        >
          <div className="mb-2 text-xs font-medium text-gray-700">Fragenfolge</div>
          <ul className="space-y-2">
            {asked.map((a, i) => {
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
                <li
                  key={a.index}
                  ref={i === asked.length - 1 ? lastAskedRef : null}
                  className="grid grid-cols-[12px_1fr] items-start gap-2"
                >
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
              {hasStarted ? (activeIndex >= stepsOrdered.length - 1 ? "Abschließen" : "Nächste Frage") : "Prüfung starten"}
            </button>

            {hasStarted && viewIndex !== activeIndex && (
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
            {/* Bild nur anzeigen, wenn gestartet & aktueller Schritt aktiv ist */}
            {hasStarted && viewIndex === activeIndex && stepImg && (
              <div className="mb-3">
                <CaseImagePublic
                  path={stepImg.path}
                  alt={stepImg.alt}
                  caption={stepImg.caption}
                  zoomable
                  thumbMaxHeight={220}
                />
              </div>
            )}

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
            {loading && viewIndex === activeIndex && (
              <div className="mb-3 flex items-center gap-2">
                <span
                  className="inline-flex h-3 w-3 animate-pulse rounded-full bg-blue-500"
                  aria-hidden
                />
                <span className="sr-only">Antwort des Prüfers wird geladen…</span>
              </div>
            )}
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
  className="sticky bottom-0 left-0 right-0 z-20 flex flex-col gap-2 border-t bg-white p-2"
>
  {/* Reihe 1: Eingabe + Senden */}
  <div className="flex gap-2">
    <input
      className="min-w-0 flex-1 rounded-md border border-black/10 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
      placeholder={
        ended
          ? "Fall beendet"
          : !hasStarted
          ? "Zum Start bitte links klicken"
          : viewIndex !== activeIndex
          ? "Nur Ansicht – zurück zur aktuellen Frage wechseln"
          : "Deine Antwort…"
      }
      value={input}
      onChange={(e) => setInput(e.target.value)}
      disabled={!hasStarted || ended || viewIndex !== activeIndex}
    />
      <button
      type="button"
      onClick={recording ? stopRecording : startRecording}
      disabled={!hasStarted || ended || viewIndex !== activeIndex}
      className="rounded-md border border-black/10 bg-white px-3 py-2 text-sm text-gray-900 hover:bg-black/[.04] disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
    >
      {recording ? "⏹️" : "🎙️"}
    </button>
    <button
      type="submit"
      disabled={loading || !hasStarted || ended || viewIndex !== activeIndex || !input.trim()}
      className="rounded-md border border-black/10 bg-blue-600 text-white px-4 py-2 text-sm hover:bg-blue-700 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
    >
      Senden
    </button>
  </div>

  {/* Reihe 2: Zusatz-Buttons */}
  <div className="flex flex-wrap gap-2">
    <button
      type="button"
      onClick={requestTip}
      disabled={loading || !hasStarted || ended || viewIndex !== activeIndex}
      className="rounded-md border border-black/10 bg-white px-3 py-1.5 text-sm text-gray-900 hover:bg-black/[.04] disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
    >
      💡 Tipp
    </button>
    <button
      type="button"
      onClick={requestExplain}
      disabled={loading || !hasStarted || ended || viewIndex !== activeIndex}
      className="rounded-md border border-black/10 bg-white px-3 py-1.5 text-sm text-gray-900 hover:bg-black/[.04] disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
    >
      📘 Erklären
    </button>
    <label className="flex items-center gap-1 text-xs text-gray-600">
      <input
        type="checkbox"
        checked={ttsEnabled}
        onChange={(e) => setTtsEnabled(e.target.checked)}
      />
      Antworten vorlesen
    </label>
    <button
      type="button"
      onClick={hasStarted ? nextStep : startExam}
      disabled={loading}
      className="ml-auto rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
    >
      {hasStarted ? (isLastStep ? "Abschließen" : "Nächste Frage") : "Prüfung starten"}
    </button>
    <Link
      href={`/cases/${c.id}`}
      className="rounded-md border border-black/10 bg-white px-3 py-1.5 text-sm text-gray-900 hover:bg-black/[.04] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
    >
      Fallinfo
    </Link>
  </div>
</form>
        </section>
      </div>
    </main>
  );
}