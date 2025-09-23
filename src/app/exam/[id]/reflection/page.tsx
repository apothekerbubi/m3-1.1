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
    <main className="mx-auto max-w-3xl p-6">
      <div className="mb-6">
        <button
          type="button"
          onClick={() => router.back()}
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          ← Zurück
        </button>
      </div>
      {snapshot ? (
        <header className="mb-6">
          <h1 className="text-3xl font-semibold tracking-tight">Fall-Auswertung</h1>
          <p className="mt-1 text-sm text-gray-600">{snapshot.caseTitle}</p>
          <div className="mt-4 rounded-xl border border-black/10 bg-white p-4 shadow-sm">
            <div className="text-xs uppercase tracking-wide text-gray-500">Gesamtscore</div>
            <div className="mt-1 text-3xl font-bold text-blue-700">{snapshot.totalScore.toFixed(1)}%</div>
            <p className="mt-2 text-sm text-gray-600">Abgeschlossen am {new Date(snapshot.completedAt).toLocaleString()}</p>
          </div>
        </header>
      ) : null}

      {loading && (
        <div className="mb-6 rounded-md border border-dashed border-black/10 p-4 text-sm text-gray-600">
          Die Stärken-Schwächen-Analyse wird geladen …
        </div>
      )}

      {display ? (
        <section className="space-y-6">
          <article className="rounded-xl border border-black/10 bg-white p-4 shadow-sm">
            <h2 className="text-xl font-semibold">Gesamtfazit</h2>
            <p className="mt-2 text-sm text-gray-700 whitespace-pre-line">{display.overview}</p>
          </article>

          <article className="rounded-xl border border-black/10 bg-white p-4 shadow-sm">
            <h3 className="text-lg font-semibold text-green-700">Stärken</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-700">
              {display.strengths.map((item, idx) => (
                <li key={`strength-${idx}`}>{item}</li>
              ))}
            </ul>
          </article>

          <article className="rounded-xl border border-black/10 bg-white p-4 shadow-sm">
            <h3 className="text-lg font-semibold text-amber-700">Schwächen</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-700">
              {display.weaknesses.map((item, idx) => (
                <li key={`weakness-${idx}`}>{item}</li>
              ))}
            </ul>
          </article>

          <article className="rounded-xl border border-black/10 bg-white p-4 shadow-sm">
            <h3 className="text-lg font-semibold text-blue-700">Konkrete Verbesserungsschritte</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-700">
              {display.improvements.map((item, idx) => (
                <li key={`improve-${idx}`}>{item}</li>
              ))}
            </ul>
          </article>
        </section>
      ) : null}

      {snapshot ? (
        <section className="mt-8 space-y-4">
          <h2 className="text-lg font-semibold">Schrittübersicht</h2>
          <ul className="space-y-3">
            {snapshot.steps.map((step, idx) => (
              <li key={idx} className="rounded-lg border border-black/10 bg-white p-3 text-sm text-gray-700 shadow-sm">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-semibold text-gray-900">Schritt {idx + 1}</span>
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-700">
                    {step.bestScore.toFixed(1)}%
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-700">{shortLabel(step.prompt)}</p>
                {step.studentUnion.length ? (
                  <p className="mt-2 text-xs text-gray-500">
                    Genannt: {step.studentUnion.join(", ")}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="mt-10 flex flex-wrap gap-3">
        <Link
          href={`/exam/${caseId}`}
          className="rounded-md border border-black/10 px-4 py-2 text-sm text-gray-900 hover:bg-gray-50"
        >
          Fall erneut üben
        </Link>
        {nextHref ? (
          <Link
            href={nextHref}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Nächster Fall der Serie
          </Link>
        ) : null}
        <Link
          href="/subjects"
          className="rounded-md border border-black/10 px-4 py-2 text-sm text-gray-900 hover:bg-gray-50"
        >
          Zur Fallübersicht
        </Link>
      </div>
    </main>
  );
}