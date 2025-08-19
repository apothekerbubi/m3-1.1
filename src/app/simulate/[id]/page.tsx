// src/app/simulate/[id]/page.tsx
"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { CASES } from "@/data/cases";
import type { Case } from "@/lib/types";
import { scoreAnswer } from "@/lib/scoring";

// --- Lokale Minimal-Typen (unabhängig von scoring.ts) ---
type ScoreSection = { name: string; got: number; max: number; missing?: string[] };
type ScoreResult = { total: number; sections: ScoreSection[] };

// Rubric nur als flexibles Objekt – Struktur übernimmt scoreAnswer intern
type Rubric = Record<string, unknown>;

// Case um optionale Rubrik erweitern
type CaseWithRubric = Case & { rubric?: Rubric };

export default function SimulatePage() {
  // params kann string ODER string[] sein -> sicher extrahieren
  const params = useParams<{ id: string | string[] }>();
  const rawId = params?.id;
  const caseId = Array.isArray(rawId) ? rawId[0] : rawId ?? "";

  const c = useMemo<CaseWithRubric | undefined>(
    () => (CASES.find((x) => x.id === caseId) as CaseWithRubric | undefined) ?? undefined,
    [caseId]
  );

  const [answers, setAnswers] = useState<string[]>([]);
  const [result, setResult] = useState<ScoreResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [text, setText] = useState<string>("");

  function onAdd() {
    if (!text.trim()) return;
    setAnswers((prev) => [...prev, text.trim()]);
    setText("");
  }

  function onScore() {
    setError(null);
    setResult(null);
    if (!c) {
      setError("Fall nicht gefunden.");
      return;
    }
    if (!c.rubric) {
      setError("Für diesen Fall ist (noch) kein Bewertungsraster hinterlegt.");
      return;
    }
    const all = answers.join(" ");
    const r = scoreAnswer(all, c.rubric) as ScoreResult; // Ergebnis passend typisieren
    setResult(r);
  }

  if (!c) {
    return (
      <main className="mx-auto max-w-3xl p-6">
        <h2 className="text-xl font-semibold mb-2">Fall nicht gefunden</h2>
        <Link href="/cases" className="rounded-md border px-3 py-1 text-sm hover:bg-gray-50">
          Zur Fallliste
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl p-6">
      <div className="mb-4 flex items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Simulation: {c.title}</h1>
        <Link
          href={`/exam/${c.id}`}
          className="ml-auto rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50"
        >
          Zum Prüfungsmodus
        </Link>
      </div>

      <p className="mb-4 text-sm text-gray-600">{c.vignette}</p>

      <div className="rounded-xl border border-black/10 bg-white p-4 shadow-sm">
        <label className="mb-1 block text-sm font-medium">Deine Antwort (frei):</label>
        <textarea
          className="w-full rounded-md border px-3 py-2 text-sm"
          rows={5}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Argumentiere frei. Füge einzelne Punkte hinzu und werte danach."
        />
        <div className="mt-2 flex gap-2">
          <button
            onClick={onAdd}
            className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50"
          >
            Punkt hinzufügen
          </button>
          <button
            onClick={onScore}
            className="rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
          >
            Auswerten
          </button>
        </div>

        {answers.length > 0 && (
          <div className="mt-3">
            <div className="mb-1 text-xs font-medium text-gray-700">Gesammelte Punkte:</div>
            <ul className="space-y-1 list-disc pl-5 text-sm">
              {answers.map((a, i) => (
                <li key={i}>{a}</li>
              ))}
            </ul>
          </div>
        )}

        {error && <div className="mt-3 text-sm text-red-600">{error}</div>}

        {result && (
          <div className="mt-4 rounded-lg border border-black/10 bg-black/[.03] p-3">
            <div className="text-sm font-medium">Gesamtscore: {result.total}</div>
            <ul className="mt-2 space-y-2">
              {result.sections.map((s) => (
                <li key={s.name} className="text-sm">
                  <div className="font-medium">
                    {s.name}: {s.got}/{s.max}
                  </div>
                  {s.missing?.length ? (
                    <div className="text-xs text-gray-600">
                      Fehlende Punkte: {s.missing.join(", ")}
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </main>
  );
}