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
import { scoreBandComment } from "@/lib/feedbackBands";
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
          className="h-2 w-2 rounded-full bg-blue-500/90 animate-bounce"
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
  const [style] = useState<"strict" | "coaching">("coaching");
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
const nuance = scoreBandComment(safeScore);
      const base = feedback ? `${nuance} ${feedback}` : nuance;

      const parts = [
        base,
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

  const formatPercentValue = (value: number): string => {
    if (!Number.isFinite(value)) return "–";
    const normalized = Math.round(value * 10) / 10;
    return Number.isInteger(normalized) ? `${normalized}%` : `${normalized.toFixed(1)}%`;
  };

  const answeredSummary = useMemo(() => {
    const answeredIndices = asked.filter((item) => item.status !== "pending").map((item) => item.index);
    const answeredSet = new Set(answeredIndices);
    const totalScoreSum = perStepScores.reduce((sum, value, idx) => {
      if (!answeredSet.has(idx)) return sum;
      const safe = Number.isFinite(value) ? Number(value) : 0;
      return sum + safe;
    }, 0);
    const answeredSteps = answeredSet.size;
    const averageScore = answeredSteps > 0 ? Math.round((totalScoreSum / answeredSteps) * 10) / 10 : 0;
    return { answeredSteps, averageScore };
  }, [asked, perStepScores]);

  const answeredSteps = answeredSummary.answeredSteps;
  const averageScore = answeredSummary.averageScore;
  const totalScoreText = formatPercentValue(totalScorePct);
  const averageScoreText = answeredSteps > 0 ? formatPercentValue(averageScore) : "–";

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

  // Bild des gerade betrachteten Schritts (für Chat-Panel)
  const stepImg = stepsOrdered[viewIndex]?.image;

  const caseSubtitle = c.shortTitle || c.title;
  const specialtyLabel = [c.specialty, c.subspecialty].filter(Boolean).join(" · ");
  const displayedStep = hasStarted ? Math.min(activeIndex + 1, nSteps) : 0;
  const seriesProgressValue =
    seriesTotal > 0 ? (ended ? Math.round(((seriesIdx + 1) / seriesTotal) * 100) : seriesPct) : 0;

  return (
    <main className="min-h-screen bg-white pb-16 text-slate-900">
      <div className="mx-auto max-w-6xl px-4 pt-2 sm:px-6 sm:pt-4">
        <header className="relative mb-6 overflow-hidden rounded-3xl bg-gradient-to-br from-sky-500 via-indigo-500 to-fuchsia-500 p-[1px] shadow-2xl">
          <div className="rounded-[calc(1.5rem-1px)] bg-white px-5 py-5 sm:px-8">
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-2 text-center lg:text-left">
                <span className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.4em] text-slate-500">
                  Prüfungslauf
                </span>
                <h1 className="text-3xl font-semibold text-slate-900">{anonymousTitle(c)}</h1>
                <p className="text-base text-slate-600">{caseSubtitle}</p>
                {specialtyLabel ? (
                  <p className="text-[11px] uppercase tracking-[0.4em] text-slate-400">{specialtyLabel}</p>
                ) : null}
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-left shadow-sm">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.35em] text-slate-500">Prüfungslauf</div>
                  <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                    <div className="flex flex-col gap-1">
                      <p className="text-[11px] uppercase tracking-[0.3em] text-slate-400">Fortlaufend</p>
                      <p className="text-xl font-semibold text-slate-900">
                        {displayedStep}
                        <span className="ml-1 text-sm font-normal text-slate-500">/ {nSteps}</span>
                      </p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <p className="text-[11px] uppercase tracking-[0.3em] text-slate-400">Bester Score</p>
                      <p className="text-xl font-semibold text-slate-900">{averageScoreText}</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-left shadow-sm">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.35em] text-slate-500">Gesamtwertung</div>
                  <div className="mt-3 flex flex-col gap-2 text-sm">
                    <p className="text-2xl font-semibold text-slate-900">{totalScoreText}</p>
                    <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.3em] text-slate-400">
                      <span>Gewichtete Punkte</span>
                      <span className="rounded-full bg-gradient-to-r from-sky-100 via-indigo-100 to-fuchsia-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                        {answeredSteps}/{nSteps}
                      </span>
                    </div>
                  </div>
                </div>
                {seriesTotal > 0 ? (
                  <div className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-left shadow-sm">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.35em] text-slate-500">Serie</div>
                    <div className="mt-3 flex items-end justify-between gap-3 text-sm">
                      <div>
                        <p className="text-2xl font-semibold text-slate-900">
                          {seriesIdx + 1}
                          <span className="ml-1 text-base font-normal text-slate-500">/ {seriesTotal}</span>
                        </p>
                        <p className="text-[11px] uppercase tracking-[0.3em] text-slate-400">Fortschritt</p>
                      </div>
                      <div className="min-w-[120px]">
                        <ProgressBar value={seriesProgressValue} />
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <aside
            ref={sidebarRef}
            className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-xl ring-1 ring-black/5 lg:sticky lg:top-28 lg:max-h-[calc(100vh-220px)] lg:overflow-y-auto"
          >
            <div className="text-[10px] font-semibold uppercase tracking-[0.4em] text-slate-500">Fragenfolge</div>
            <ul className="mt-4 space-y-3">
              {asked.map((a, i) => {
                const dot =
                  a.status === "pending"
                    ? "bg-slate-300"
                    : a.status === "correct"
                    ? "bg-emerald-500"
                    : a.status === "partial"
                    ? "bg-amber-400"
                    : "bg-rose-500";
                const isView = a.index === viewIndex;
                const isActive = a.index === activeIndex;
                const rawScore = perStepScores[a.index];
                const showScore =
                  Number.isFinite(rawScore) && (a.status !== "pending" || (rawScore as number) > 0);
                const scoreText = showScore ? formatPercentValue(rawScore as number) : null;
                const labelText = `Frage ${i + 1}`;
                const summary = shortQuestion(a.text);

                return (
                  <li key={a.index} ref={i === asked.length - 1 ? lastAskedRef : null}>
                    <button
                      type="button"
                      onClick={() => setViewIndex(a.index)}
                      className={[
                        "group relative w-full overflow-hidden rounded-2xl border px-4 py-3 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300",
                        isView
                          ? "border-transparent bg-gradient-to-r from-sky-50 via-indigo-50 to-fuchsia-50 shadow-lg"
                          : "border-slate-200 bg-white/80 hover:border-slate-300 hover:bg-slate-50/80",
                      ].join(" ")}
                      aria-current={isView ? "step" : undefined}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">
                          <span className={`h-2.5 w-2.5 rounded-full ${dot}`} aria-hidden />
                          {labelText}
                        </div>
                        {scoreText ? (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 shadow-inner">
                            {scoreText}
                          </span>
                        ) : null}
                      </div>
                      <div className={`mt-2 line-clamp-2 text-sm ${isActive ? "text-slate-700" : "text-slate-500"}`}>
                        {summary}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
            {!hasStarted ? (
              <p className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-600">
                Klicke auf <span className="font-semibold text-slate-700">Prüfung starten</span>, um zu beginnen.
              </p>
            ) : null}
            <div className="mt-6 flex flex-col gap-2">
              <button
                type="button"
                onClick={hasStarted ? nextStep : startExam}
                disabled={loading}
                className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-sky-500 via-indigo-500 to-fuchsia-500 px-5 py-2 text-sm font-semibold text-white shadow-lg transition hover:from-sky-400 hover:via-indigo-500 hover:to-fuchsia-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
              >
                {hasStarted ? (isLastStep ? "Abschließen" : "Nächste Frage") : "Prüfung starten"}
              </button>
              {hasStarted && viewIndex !== activeIndex ? (
                <button
                  type="button"
                  onClick={() => setViewIndex(activeIndex)}
                  className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white/80 px-5 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
                >
                  Zur aktuellen Frage
                </button>
              ) : null}
              <Link
                href={`/cases/${c.id}`}
                className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white/80 px-5 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
              >
                Fallinfo
              </Link>
            </div>
          </aside>

          <section className="flex flex-col gap-4">
            <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white/95 shadow-2xl ring-1 ring-black/5">
              <div ref={listRef} className="min-h-[60vh] overflow-y-auto px-6 py-6 text-slate-900">
                {hasStarted && viewIndex === activeIndex && stepImg ? (
                  <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 shadow-inner">
                    <CaseImagePublic
                      path={stepImg.path}
                      alt={stepImg.alt}
                      caption={stepImg.caption}
                      zoomable
                      thumbMaxHeight={220}
                    />
                  </div>
                ) : null}

                {viewChat.map((t, i) => (
                  <div key={i} className={`mb-3 flex ${t.role === "prof" ? "justify-start" : "justify-end"}`}>
                    <div
                      className={`inline-block max-w-[80%] rounded-3xl px-4 py-3 text-sm shadow-lg ${
                        t.role === "prof"
                          ? "border border-slate-200 bg-white/90 text-slate-900"
                          : "bg-gradient-to-r from-sky-500 via-indigo-500 to-fuchsia-500 text-white"
                      }`}
                    >
                      <span className="text-[10px] font-semibold uppercase tracking-[0.25em] opacity-70">
                        {t.role === "prof" ? "Prüfer" : "Du"}
                      </span>
                      <p className="mt-1 text-sm leading-relaxed">
                        {t.role === "prof" ? (
                          <TypewriterText
                            text={t.text}
                            enabled={
                              i === viewChat.length - 1 &&
                              t.role === "prof" &&
                              hasStarted &&
                              viewIndex === activeIndex &&
                              !loading
                            }
                          />
                        ) : (
                          t.text
                        )}
                      </p>
                    </div>
                  </div>
                ))}

                {loading && hasStarted && viewIndex === activeIndex ? (
                  <div className="mb-3 flex justify-start">
                    <div className="inline-flex items-center gap-2 rounded-3xl border border-slate-200 bg-white/90 px-4 py-3 text-sm text-slate-900 shadow-lg">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.25em] opacity-70">Prüfer</span>
                      <TypingDots />
                    </div>
                  </div>
                ) : null}

                {!hasStarted ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-4 text-sm text-slate-600">
                    Klicke auf <span className="font-semibold text-slate-700">Prüfung starten</span>, um den Chat zu öffnen.
                  </div>
                ) : null}

                {ended ? (
                  <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 shadow-inner">
                    ✅ Fall abgeschlossen
                  </div>
                ) : null}
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!hasStarted) return startExam();
                  if (!ended) onSend();
                }}
                className="border-t border-slate-200 bg-slate-50/80 px-4 py-4 backdrop-blur"
              >
                <div className="flex flex-col gap-2 md:flex-row md:items-center">
                  <input
                    className="min-w-0 flex-1 rounded-full border border-slate-300 bg-white/90 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 shadow-inner focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
                    placeholder={
                      ended
                        ? "Fall beendet"
                        : !hasStarted
                        ? "Zum Start bitte links klicken"
                        : viewIndex !== activeIndex
                        ? "Nur Ansicht – zur aktuellen Frage wechseln"
                        : "Deine Antwort…"
                    }
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={!hasStarted || ended || viewIndex !== activeIndex}
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={recording ? stopRecording : startRecording}
                      disabled={!hasStarted || ended || viewIndex !== activeIndex}
                      className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {recording ? "⏹️" : "🎙️"}
                    </button>
                    <button
                      type="submit"
                      disabled={loading || !hasStarted || ended || viewIndex !== activeIndex || !input.trim()}
                      className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-sky-500 via-indigo-500 to-fuchsia-500 px-5 py-2 text-sm font-semibold text-white shadow-lg transition hover:from-sky-400 hover:via-indigo-500 hover:to-fuchsia-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
                    >
                      Senden
                    </button>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={requestTip}
                    disabled={loading || !hasStarted || ended || viewIndex !== activeIndex}
                    className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-1.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    💡 Tipp
                  </button>
                  <button
                    type="button"
                    onClick={requestExplain}
                    disabled={loading || !hasStarted || ended || viewIndex !== activeIndex}
                    className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-1.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    📘 Erklären
                  </button>
                  <button
                    type="button"
                    onClick={requestSolution}
                    disabled={loading || !hasStarted || viewIndex !== activeIndex}
                    className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-1.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    📝 Lösung anzeigen
                  </button>
                  <label className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-inner">
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
                    className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-sky-500 via-indigo-500 to-fuchsia-500 px-5 py-2 text-sm font-semibold text-white shadow-lg transition hover:from-sky-400 hover:via-indigo-500 hover:to-fuchsia-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
                  >
                    {hasStarted ? (isLastStep ? "Abschließen" : "Nächste Frage") : "Prüfung starten"}
                  </button>
                  <Link
                    href={`/cases/${c.id}`}
                    className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white/80 px-5 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
                  >
                    Fallinfo
                  </Link>
                </div>
              </form>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
