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
      <main className="min-h-screen bg-white py-12 text-slate-900">
        <div className="mx-auto max-w-3xl px-6">
          <h1 className="text-3xl font-semibold tracking-tight">Fall nicht gefunden</h1>
          <p className="mt-3 text-sm text-slate-600">Bitte wählen Sie einen Fall aus der Übersicht.</p>
          <Link
            href="/subjects"
            className="mt-6 inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Zur Übersicht
          </Link>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-white py-12 text-slate-900">
        <div className="mx-auto max-w-3xl px-6">
          <h1 className="text-3xl font-semibold tracking-tight">Auswertung nicht verfügbar</h1>
          <p className="mt-3 text-sm text-slate-600">{error}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={`/exam/${caseId}`}
              className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-sky-500 via-indigo-500 to-fuchsia-500 px-5 py-2 text-sm font-semibold text-white shadow-lg transition hover:from-sky-400 hover:via-indigo-500 hover:to-fuchsia-600"
            >
              Fall erneut starten
            </Link>
            <Link
              href="/subjects"
              className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Zur Übersicht
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const display = analysis && snapshot ? analysis : snapshot ? buildFallback(snapshot) : null;

  return (
    <main className="min-h-screen bg-white py-10 text-slate-900">
      <div className="mx-auto max-w-5xl px-6">
        <div className="mb-10">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600 transition hover:bg-slate-50 hover:text-slate-800"
          >
            ← Zurück
          </button>
        </div>
        {snapshot ? (
          <header className="relative mb-12 overflow-hidden rounded-3xl bg-gradient-to-br from-sky-500 via-indigo-500 to-fuchsia-500 p-[1px] shadow-2xl">
            <div className="rounded-[calc(1.5rem-1px)] bg-white px-8 py-12 text-center sm:px-12">
              <span className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-1 text-xs font-semibold uppercase tracking-[0.4em] text-slate-500">
                Fall-Auswertung
              </span>
              <h1 className="mt-6 text-4xl font-semibold text-slate-900">Gesamtscore</h1>
              <div className="mt-3 text-6xl font-bold text-slate-900">{snapshot.totalScore.toFixed(1)}%</div>
              <p className="mt-6 text-base text-slate-600">{snapshot.caseTitle}</p>
              <p className="mt-1 text-xs uppercase tracking-widest text-slate-400">
                Abgeschlossen am {new Date(snapshot.completedAt).toLocaleString()}
              </p>
              {display ? (
                <div className="mt-10 rounded-2xl border border-slate-200 bg-slate-50 px-6 py-6 text-left shadow-inner">
                  <h2 className="text-lg font-semibold text-slate-900">Gesamtfazit</h2>
                  <p className="mt-3 whitespace-pre-line text-base text-slate-700">{display.overview}</p>
                </div>
              ) : null}
            </div>
          </header>
        ) : null}

        {loading && (
          <div className="mb-10 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-5 text-sm text-slate-600">
            Die Stärken-Schwächen-Analyse wird geladen …
          </div>
        )}

        {display ? (
          <section className="space-y-8">
            <div className="grid gap-6 lg:grid-cols-2">
              <article className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 shadow-lg shadow-emerald-200/40">
                <h3 className="text-lg font-semibold text-emerald-800">Stärken</h3>
                <ul className="mt-3 space-y-2 text-sm text-emerald-900/80">
                  {display.strengths.map((item, idx) => (
                    <li key={`strength-${idx}`} className="rounded-lg bg-white px-3 py-2 text-emerald-800">
                      {item}
                    </li>
                  ))}
                </ul>
              </article>

              <article className="rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-lg shadow-amber-200/50">
                <h3 className="text-lg font-semibold text-amber-800">Schwächen</h3>
                <ul className="mt-3 space-y-2 text-sm text-amber-900/80">
                  {display.weaknesses.map((item, idx) => (
                    <li key={`weakness-${idx}`} className="rounded-lg bg-white px-3 py-2 text-amber-800">
                      {item}
                    </li>
                  ))}
                </ul>
              </article>
            </div>

            <article className="rounded-2xl border border-sky-200 bg-sky-50 p-6 shadow-lg shadow-sky-200/50">
              <h3 className="text-lg font-semibold text-sky-800">Konkrete Verbesserungsschritte</h3>
              <ul className="mt-3 space-y-2 text-sm text-sky-900/80">
                {display.improvements.map((item, idx) => (
                  <li key={`improve-${idx}`} className="rounded-lg bg-white px-3 py-2 text-sky-800">
                    {item}
                  </li>
                ))}
              </ul>
            </article>
          </section>
        ) : null}

        <div className="mt-12 flex flex-wrap gap-4">
          <Link
            href={`/exam/${caseId}`}
            className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Fall erneut üben
          </Link>
          {nextHref ? (
            <Link
              href={nextHref}
              className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-sky-500 via-indigo-500 to-fuchsia-500 px-5 py-2 text-sm font-semibold text-white shadow-lg transition hover:from-sky-400 hover:via-indigo-500 hover:to-fuchsia-600"
            >
              Nächster Fall der Serie
            </Link>
          ) : null}
          <Link
            href="/subjects"
            className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Zur Fallübersicht
          </Link>
        </div>
      </div>
    </main>
  );
}