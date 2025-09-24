// src/app/exam/[id]/page.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CASES } from "@/data/cases";
import type { Case, Step, StepReveal } from "@/lib/types";
import { saveReflectionSnapshot } from "@/lib/reflectionStore";
import type { ReflectionTurn } from "@/lib/reflectionStore";
import ProgressBar from "@/components/ProgressBar";
import CaseImagePublic from "@/components/CaseImagePublic";




// ---- Lokale UI-Typen ----
type Turn = { role: "prof" | "student"; text: string };

type ApiReply = {
  say_to_student: string | null;
  evaluation: null | {
    correctness: "correct" | "partially_correct" | "incorrect";
     score: number; // 0-100
    feedback: string;
    tips?: string;
  };
  next_question: string | null;
  end: boolean;
};

type Asked = { index: number; text: string; status: "pending" | "correct" | "partial" | "incorrect" };

function TypingDots() {
  return (
    <div className="flex items-end gap-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-2.5 w-2.5 rounded-full bg-blue-500/90 animate-bounce"
          style={{ animationDelay: `${i * 0.15}s`, animationDuration: "0.9s" }}
        />
      ))}
    </div>
  );
}

function TypewriterText({ text, enabled, speed = 20 }: { text: string; enabled: boolean; speed?: number }) {
  const [displayed, setDisplayed] = useState(enabled ? "" : text);

  useEffect(() => {
    if (!enabled) {
      setDisplayed(text);
      return;
    }

    setDisplayed("");
    let index = 0;
    let active = true;

    const tick = () => {
      if (!active) return;
      index = Math.min(index + 1, text.length);
      setDisplayed(text.slice(0, index));
      if (index < text.length) {
        timeout = window.setTimeout(tick, speed);
      }
    };

    let timeout = window.setTimeout(tick, speed);

    return () => {
      active = false;
      window.clearTimeout(timeout);
    };
  }, [text, enabled, speed]);

  return <span>{displayed}</span>;
}

function shortQuestion(text: string): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return "Frage";
  const words = normalized.split(" ");
  const cropped = words.slice(0, 8).join(" ");
  if (cropped.length >= normalized.length) return normalized;
  return `${cropped}…`;
}

function solutionTextForStep(step?: Step | null): string {
  if (!step) return "";
  const { solutions } = step;
  if (!solutions) return "";
  if (Array.isArray(solutions)) {
    return solutions.map((s) => (typeof s === "string" ? s.trim() : "")).filter(Boolean).join("\n\n");
  }
  return typeof solutions === "string" ? solutions.trim() : "";
}

function buildStudentUnionFromTurns(turns: Turn[]): string[] {
  const items = turns
    .filter((t) => t.role === "student")
    .map((t) => t.text)
    .join(" ; ")
    .split(/[,;\/\n\r]+/g)
    .map((s) => s.trim())
    .filter(Boolean);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of items) {
    const key = item.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}


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

  // Router
  const router = useRouter();
 

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
  const listRef = useRef<HTMLDivElement | null>(null);

  // 🔽 Sidebar: Container + letztes Item für Auto-Scroll
  const sidebarRef = useRef<HTMLDivElement | null>(null);
  const lastAskedRef = useRef<HTMLLIElement | null>(null);

  // Punkte pro Schritt (Bestwert)
  const [perStepScores, setPerStepScores] = useState<number[]>([]);
  

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

const stepSolutions = useMemo<string[]>(() => {
    const raw = stepsOrdered[activeIndex]?.solutions;
    if (!raw) return [];
    if (Array.isArray(raw)) {
      return raw.map((s) => (typeof s === "string" ? s.trim() : "")).filter(Boolean);
    }
    return typeof raw === "string" ? [raw.trim()].filter(Boolean) : [];
  }, [stepsOrdered, activeIndex]);

  const stepReveal: StepReveal | null = (stepsOrdered[activeIndex]?.reveal ?? null) as StepReveal | null;

  const totalWeight = useMemo<number>(
    () => stepsOrdered.reduce((acc, s) => acc + (typeof s.points === "number" ? s.points : 2), 0),
    [stepsOrdered]
  );

  const totalScorePct = useMemo<number>(() => {
    if (totalWeight <= 0) return 0;
    const weightedSum = perStepScores.reduce((acc, score, idx) => {
      const weight = typeof stepsOrdered[idx]?.points === "number" ? stepsOrdered[idx]!.points : 2;
      return acc + ((score || 0) * weight);
    }, 0);
    const avg = weightedSum / totalWeight;
    return Math.round(avg * 10) / 10;
  }, [perStepScores, stepsOrdered, totalWeight]);

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

  // Nach Abschluss: Navigation erfolgt direkt in nextStep

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
    opts: { mode: "answer" | "tip" | "explain" | "solution" | "kickoff" }
  ) {
    if (!c) return;
    setLoading(true);
    try {
    // 🔹 NEU: kumulierte Student:innen-Antworten für den aktuellen Schritt sammeln
    const turnsThisStep =
      opts.mode === "kickoff" ? current : ((chats[activeIndex] ?? []) as Turn[]);
    const studentSoFar =
      opts.mode === "kickoff"
        ? []
        : turnsThisStep
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
      points: totalScorePct,
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
       stepSolutions,
      focusQuestion: currentPrompt,

      // 🔹 NEU: Felder für die kumulative Bewertung
      student_so_far: studentSoFar,                 // alle bisherigen Texte
      student_union: studentUnion,                  // deduplizierte Items
      student_so_far_text: studentSoFar.join("\n"), // als Fließtext
    };

    if (opts.mode === "tip") payload["tipRequest"] = true;
    if (opts.mode === "solution") payload["solutionRequest"] = true;
    if (opts.mode === "explain") payload["explainRequest"] = true;
    if (opts.mode === "answer") payload["attemptStage"] = Math.min(3, attemptCount + 1);
     if (opts.mode === "kickoff") payload["kickoff"] = true;

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
     const { correctness, feedback, tips, score } = data.evaluation;
      const safeScore = Number.isFinite(score) ? Math.max(0, Math.min(100, score)) : 0;

      // Punkte (Bestwert je Schritt)
      setPerStepScores((prev) => {
        const curPrev = prev[activeIndex] || 0;
        const best = Math.max(curPrev, safeScore);
        if (best === curPrev) return prev;
        const copy = [...prev];
         copy[activeIndex] = Math.round(best * 10) / 10;
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

    const nextQuestion = data.next_question;
    if (typeof nextQuestion === "string" && nextQuestion) {
      pushProf(activeIndex, nextQuestion);
      setAsked((prev) => {
        const copy = [...prev];
        const idx = copy.findIndex((x) => x.index === activeIndex);
        if (idx >= 0) {
          copy[idx] = { ...copy[idx], text: nextQuestion };
        } else {
          copy.push({ index: activeIndex, text: nextQuestion, status: "pending" });
        }
        return copy;
      });
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
           score: totalScorePct,
          maxScore: 100,
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
            score: totalScorePct,
            maxScore: 100,
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
function createReflectionSnapshot(): void {
    if (!c) return;
    const steps = stepsOrdered.map((step, idx) => {
      const turnList = chats[idx] ?? [];
      const transcript = turnList.map<ReflectionTurn>((t) => ({
        role: t.role === "prof" ? "examiner" : "student",
        text: t.text,
      }));
      const bestScore = Math.max(0, Math.min(100, perStepScores[idx] ?? 0));
      return {
        order: step.order,
        prompt: step.prompt,
        bestScore: Math.round(bestScore * 10) / 10,
        transcript,
        solutionText: solutionTextForStep(step),
        studentUnion: buildStudentUnionFromTurns(turnList),
        rule: step.rule ?? null,
      };
    });

    const snapshot = {
      caseId: c.id,
      caseTitle: c.title,
      vignette: c.vignette,
      totalScore: Math.max(0, Math.min(100, totalScorePct)),
      maxScore: 100,
      completedAt: new Date().toISOString(),
      steps,
      series:
        seriesIds.length || seriesId
          ? { ids: [...seriesIds], index: seriesIdx, sid: seriesId ?? null }
          : undefined,
    };

    saveReflectionSnapshot(c.id, snapshot);
  }

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

  setAttemptCount(0);
  setActiveIndex(0);
  setViewIndex(0);
  setEnded(false);

    // Chats vorbereiten
  const initChats: Turn[][] = Array.from({ length: n }, () => []);
  const q0 = stepsOrdered[0]?.prompt ?? "";
  setChats(initChats);

     // Erste Frage sichtbar + evtl. on_enter-Reveal
  setAsked([{ index: 0, text: q0, status: "pending" }]);
  maybeRevealOnEnter(0);

  await callExamAPI(initChats[0], { mode: "kickoff" });
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

   async function nextStep() {
    if (!c || loading) return;

    const last = activeIndex >= nSteps - 1;
    if (last) {
       createReflectionSnapshot();
      setEnded(true);
      // beim Abschließen Fortschritt speichern (+ lokal)
      void persistProgress({ completed: true });
      const search = typeof window !== "undefined" ? window.location.search : "";
      router.push(`/exam/${c.id}/reflection${search}`);
      return;
    }

    const idx = activeIndex + 1;
     const fallbackPrompt = stepsOrdered[idx]?.prompt ?? "";

     const existingTurns = chats[idx] ?? [];
    const existingIntro = existingTurns.find((t) => t.role === "prof");
    if (existingIntro) {
      setAsked((prev) => {
        if (prev.find((a) => a.index === idx)) return prev;
        return [...prev, { index: idx, text: existingIntro.text, status: "pending" }];
      });
      setActiveIndex(idx);
      setViewIndex(idx);
      setAttemptCount(0);
   
      return;
    }

    const transcriptForBridge = (chats[activeIndex] ?? []).map((t) => ({
      role: t.role === "prof" ? "examiner" : "student",
      text: t.text,
    }));

    setAsked((prev) => {
      if (prev.find((a) => a.index === idx)) return prev;
      return [...prev, { index: idx, text: fallbackPrompt, status: "pending" }];
    });

    // Status/Steuerung
    setActiveIndex(idx);
    setViewIndex(idx);
    setAttemptCount(0);
    

     let transitionText = fallbackPrompt;

    setLoading(true);
    try {
      const res = await fetch("/api/exam/next-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseId: c.id,
          caseText: c.vignette,
          style,
          nextPrompt: fallbackPrompt,
          transcript: transcriptForBridge,
        }),
      });

      const data = (await res.json().catch(() => null)) as { question?: string } | null;
      if (data && typeof data.question === "string" && data.question.trim()) {
        transitionText = data.question.trim();
      }
    } catch (err) {
      console.warn("Übergangsfrage fehlgeschlagen", err);
    }

    setAsked((prev) => {
      const copy = [...prev];
      const entryIdx = copy.findIndex((a) => a.index === idx);
      if (entryIdx >= 0) {
        copy[entryIdx] = { ...copy[entryIdx], text: transitionText };
      } else {
        copy.push({ index: idx, text: transitionText, status: "pending" });
      }
      return copy;
    });

    pushProf(idx, transitionText);

    // on_enter-Reveal
    maybeRevealOnEnter(idx);
    setLoading(false);
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
   async function requestSolution() {
    if (!c || loading || viewIndex !== activeIndex) return;
    const current = chats[activeIndex] ?? [];
    await callExamAPI(current, { mode: "solution" });
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
               const rawScore = perStepScores[a.index];
              const showScore =
                Number.isFinite(rawScore) && (a.status !== "pending" || (rawScore as number) > 0);
              const scoreText = (() => {
                if (!showScore) return null;
                const pctRounded = Math.round((rawScore as number) * 10) / 10;
                return Number.isInteger(pctRounded)
                  ? `${pctRounded}%`
                  : `${pctRounded.toFixed(1)}%`;
              })();
              const labelText = `Frage ${i + 1}`;
              const summary = shortQuestion(a.text);

              return (
                <li
                  key={a.index}
                  ref={i === asked.length - 1 ? lastAskedRef : null}
                  className="grid grid-cols-[12px_1fr] items-start gap-2"
                >
                  <span className={`mt-2 h-2.5 w-2.5 flex-none self-start rounded-full ${dot}`} aria-hidden />
                  <button
                    type="button"
                    onClick={() => setViewIndex(a.index)}
                    className={[
                       "block w-full rounded-2xl border px-3 py-2 text-left text-[12px] leading-snug",
                      "hover:bg-blue-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400",
                      isView ? "border-blue-400 bg-blue-50 ring-1 ring-blue-300" : "border-blue-200 bg-white",
                      isActive ? "text-gray-900" : "text-gray-800",
                    ].join(" ")}
                    title="Frage ansehen"
                  >
                     <div className="flex items-center justify-between gap-2 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                      <span>{labelText}</span>
                      {scoreText ? (
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-700 tabular-nums">
                          {scoreText}
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-1 line-clamp-2 text-[12px] text-gray-600">{summary}</div>
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

            {viewChat.map((t, i) => {
              const isProf = t.role === "prof";
              const isLatest = i === viewChat.length - 1;

              return (
                <div key={i} className={`mb-3 ${isProf ? "" : "text-right"}`}>
                  <div
                    className={`inline-block max-w-[80%] rounded-2xl px-3 py-2 shadow-sm ${
                      isProf ? "border border-black/10 bg-white text-gray-900" : "bg-blue-600 text-white"
                    }`}
                  >
                    <span className="text-sm leading-relaxed">
                      <b className="opacity-80">{isProf ? "Prüfer" : "Du"}:</b>{" "}
                      <TypewriterText
                        text={t.text}
                        enabled={
                          isProf &&
                          isLatest &&
                          hasStarted &&
                          viewIndex === activeIndex &&
                          !loading
                        }
                      />
                    </span>
                  </div>
                </div>
              );
            })}
            {loading && hasStarted && viewIndex === activeIndex && (
              <div className="mb-3">
                <div className="inline-flex max-w-[80%] items-center gap-2 rounded-2xl border border-black/10 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm">
                  <b className="opacity-80">Prüfer:</b>
                  <TypingDots />
                </div>
              </div>
            )}
            {!hasStarted && (
              <div className="text-sm text-gray-600">
                Klicke auf <b>Prüfung starten</b>, um zu beginnen.
              </div>
            )}
             {ended && <div className="mt-2 text-sm text-green-700">✅ Fall abgeschlossen</div>}
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
     <button
      type="button"
      onClick={requestSolution}
      disabled={loading || !hasStarted || viewIndex !== activeIndex}
      className="rounded-md border border-black/10 bg-white px-3 py-1.5 text-sm text-gray-900 hover:bg-black/[.04] disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
    >
      📝 Lösung anzeigen
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