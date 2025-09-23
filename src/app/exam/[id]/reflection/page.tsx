"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import type { ReflectionSnapshot } from "@/lib/reflectionStore";
import { clearReflectionSnapshot, readReflectionSnapshot } from "@/lib/reflectionStore";

function shortLabel(text: string): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return "Aufgabe";
  if (normalized.length <= 80) return normalized;
  return `${normalized.slice(0, 77)}…`;
}

type ReflectionAnalysis = {
  overview: string;
  strengths: string[];
  weaknesses: string[];
  improvements: string[];
};

function normalizeAnalysis(raw: unknown): ReflectionAnalysis | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  const overview = typeof obj.overview === "string" ? obj.overview : "";
  const strengths = Array.isArray(obj.strengths)
    ? obj.strengths.filter((x): x is string => typeof x === "string")
    : [];
  const weaknesses = Array.isArray(obj.weaknesses)
    ? obj.weaknesses.filter((x): x is string => typeof x === "string")
    : [];
  const improvements = Array.isArray(obj.improvements)
    ? obj.improvements.filter((x): x is string => typeof x === "string")
    : [];
  if (!overview && !strengths.length && !weaknesses.length && !improvements.length) {
    return null;
  }
  return { overview, strengths, weaknesses, improvements };
}

function buildFallback(snapshot: ReflectionSnapshot): ReflectionAnalysis {
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const improvements: string[] = [];

  snapshot.steps.forEach((step, idx) => {
    const title = `Schritt ${idx + 1}: ${shortLabel(step.prompt)}`;
    if (step.bestScore >= 70) {
      strengths.push(`${title} (${step.bestScore}%) solide beantwortet.`);
    }
    if (step.bestScore <= 60) {
      weaknesses.push(`${title} (${step.bestScore}%) hatte deutliche Lücken.`);
      improvements.push(`Vertiefe ${shortLabel(step.prompt)} und gleiche die fehlenden Aspekte aus der Musterlösung ab.`);
    }
  });

  if (!strengths.length) strengths.push("Grundlagen wiederholen, um sicherer zu werden – bislang keine klaren Stärken erkennbar.");
  if (!weaknesses.length) weaknesses.push("Keine gravierenden Lücken in den modellierten Antworten entdeckt.");
  if (!improvements.length) improvements.push("Weiter so – wiederhole die Abläufe regelmäßig, um die Sicherheit zu festigen.");

  return {
    overview: `Vorläufige Auswertung: Gesamtscore ${snapshot.totalScore}% (automatisch generiert, da kein KI-Feedback vorliegt).`,
    strengths,
    weaknesses,
    improvements,
  };
}

export default function ReflectionPage() {
  const params = useParams<{ id: string | string[] }>();
  const rawId = params?.id;
  const caseId = Array.isArray(rawId) ? rawId[0] : rawId;
  const router = useRouter();

  const [snapshot, setSnapshot] = useState<ReflectionSnapshot | null>(null);
  const [analysis, setAnalysis] = useState<ReflectionAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!caseId) return;
    const snap = readReflectionSnapshot(caseId);
    if (!snap) {
      setError("Keine Auswertung gefunden – bitte den Fall erneut abschließen.");
      return;
    }
    setSnapshot(snap);
    setLoading(true);

    void fetch("/api/exam/reflection", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(snap),
    })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error((data as { error?: string }).error || `HTTP ${res.status}`);
        }
        const json = await res.json();
        const normalized = normalizeAnalysis(json);
        if (!normalized) throw new Error("Ungültiges Analyseformat");
        return normalized;
      })
      .then((data: ReflectionAnalysis) => {
        setAnalysis(data);
        clearReflectionSnapshot(caseId);
      })
      .catch((err: unknown) => {
        console.warn("Reflection summary failed", err);
        setAnalysis(buildFallback(snap));
      })
      .finally(() => setLoading(false));
  }, [caseId]);

  const nextHref = useMemo(() => {
    if (!snapshot || !snapshot.series) return null;
    const { ids, index, sid } = snapshot.series;
    if (!Array.isArray(ids) || index >= ids.length - 1) return null;
    const nextId = ids[index + 1];
    const params = new URLSearchParams();
    params.set("s", ids.join(","));
    params.set("i", String(index + 1));
    if (sid) params.set("sid", sid);
    return `/exam/${nextId}?${params.toString()}`;
  }, [snapshot]);

  if (!caseId) {
    return (
      <main className="mx-auto max-w-3xl p-6">
        <h1 className="text-2xl font-semibold">Fall nicht gefunden</h1>
        <p className="mt-2 text-sm text-gray-600">Bitte wählen Sie einen Fall aus der Übersicht.</p>
        <Link href="/subjects" className="mt-4 inline-block rounded-md border px-3 py-2 text-sm text-gray-900 hover:bg-gray-50">
          Zur Übersicht
        </Link>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto max-w-3xl p-6">
        <h1 className="text-2xl font-semibold">Auswertung nicht verfügbar</h1>
        <p className="mt-2 text-sm text-gray-600">{error}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={`/exam/${caseId}`}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Fall erneut starten
          </Link>
          <Link
            href="/subjects"
            className="rounded-md border px-4 py-2 text-sm text-gray-900 hover:bg-gray-50"
          >
            Zur Übersicht
          </Link>
        </div>
      </main>
    );
  }

  const display = analysis && snapshot ? analysis : snapshot ? buildFallback(snapshot) : null;

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-8 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="text-sm font-medium text-blue-600 transition-colors hover:text-blue-700"
        >
          ← Zurück
        </button>
        {snapshot ? (
          <span className="text-xs uppercase tracking-[0.2em] text-slate-400">
            Abgeschlossen am {new Date(snapshot.completedAt).toLocaleString()}
          </span>
        ) : null}
      </div>

      {snapshot ? (
        <header className="mb-10 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">Fall-Auswertung</h1>
          <p className="mt-2 text-sm text-slate-500">{snapshot.caseTitle}</p>
        </header>
      ) : null}

      {loading && (
        <div className="mb-8 rounded-2xl border border-dashed border-slate-200 bg-white/70 p-5 text-sm text-slate-600 shadow-sm">
          Die Stärken-Schwächen-Analyse wird geladen …
        </div>
      )}

      {display ? (
        <section className="space-y-10">
          <article className="relative mx-auto max-w-3xl overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 p-[1px] shadow-2xl">
            <div className="rounded-[calc(1.5rem-1px)] bg-white/95 px-8 py-10 text-center backdrop-blur">
              <div className="mx-auto inline-flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-500 text-4xl font-bold text-white shadow-lg">
                {snapshot?.totalScore.toFixed(1)}%
              </div>
              <p className="mt-3 text-xs font-semibold uppercase tracking-[0.3em] text-indigo-500/80">
                Gesamtscore
              </p>
              <h2 className="mt-6 text-2xl font-semibold text-slate-900">Gesamtfazit</h2>
              <p className="mt-3 text-base leading-relaxed text-slate-600 whitespace-pre-line">
                {display.overview}
              </p>
            </div>
          </article>

          <div className="grid gap-6 lg:grid-cols-2">
            <article className="group relative overflow-hidden rounded-3xl border border-emerald-100 bg-emerald-50/70 p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg">
              <div className="absolute -top-12 -left-12 h-32 w-32 rounded-full bg-emerald-200/60 blur-2xl transition-opacity group-hover:opacity-80" />
              <div className="relative">
                <h3 className="text-lg font-semibold text-emerald-700">Stärken</h3>
                <ul className="mt-3 space-y-2 text-sm leading-relaxed text-emerald-900">
                  {display.strengths.map((item, idx) => (
                    <li key={`strength-${idx}`} className="flex gap-2">
                      <span className="mt-1 inline-block h-1.5 w-1.5 flex-none rounded-full bg-emerald-500" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </article>

            <article className="group relative overflow-hidden rounded-3xl border border-rose-100 bg-rose-50/80 p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg">
              <div className="absolute -top-14 -right-12 h-36 w-36 rounded-full bg-rose-200/60 blur-2xl transition-opacity group-hover:opacity-80" />
              <div className="relative">
                <h3 className="text-lg font-semibold text-rose-700">Schwächen</h3>
                <ul className="mt-3 space-y-2 text-sm leading-relaxed text-rose-900">
                  {display.weaknesses.map((item, idx) => (
                    <li key={`weakness-${idx}`} className="flex gap-2">
                      <span className="mt-1 inline-block h-1.5 w-1.5 flex-none rounded-full bg-rose-500" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          </div>

          <article className="rounded-3xl border border-sky-100 bg-sky-50/80 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-sky-700">Konkrete Verbesserungsschritte</h3>
            <ul className="mt-3 space-y-2 text-sm leading-relaxed text-slate-700">
              {display.improvements.map((item, idx) => (
                <li key={`improve-${idx}`} className="flex gap-2">
                  <span className="mt-1 inline-block h-1.5 w-1.5 flex-none rounded-full bg-sky-500" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>
        </section>
      ) : null}

      <div className="mt-12 flex flex-wrap gap-3">
        <Link
          href={`/exam/${caseId}`}
          className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-blue-200 hover:text-blue-700"
        >
          Fall erneut üben
        </Link>
        {nextHref ? (
          <Link
            href={nextHref}
            className="rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:shadow-md"
          >
            Nächster Fall der Serie
          </Link>
        ) : null}
        <Link
          href="/subjects"
          className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-blue-200 hover:text-blue-700"
        >
          Zur Fallübersicht
        </Link>
      </div>
    </main>
  );
}