"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { CASES } from "@/data/cases";
import type { Case, Rubric, ScoreResult } from "@/lib/types";
import { scoreAnswer } from "@/lib/scoring";

// Lokaler, erweiterter Typ: einige Cases haben rubric, andere nicht
type CaseWithRubric = Case & { rubric?: Rubric };

export default function SimulatePage() {
  const params = useParams<{ id: string | string[] }>();
  const rawId = params?.id;
  const caseId = Array.isArray(rawId) ? rawId[0] : rawId;

  const c = useMemo(
    () => (CASES.find((x) => x.id === caseId) as CaseWithRubric | undefined) ?? undefined,
    [caseId]
  );

  const [answers, setAnswers] = useState<string[]>([]);
  const [result, setResult] = useState<ScoreResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Dummy-Eingabe: ein großes Textfeld; du kannst hier auch mehrere Felder pro Schritt rendern
  const [text, setText] = useState("");

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
    const r = scoreAnswer(all, c.rubric); // <-- hier ist rubric nun sicher vorhanden
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
        <Link href={`/exam/${c.id}`} className="ml-auto rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50">
          Zum Prüfungsmodus
        </Link>
      </div>

      <p className="text-sm text-gray-600 mb-4">{c.vignette}</p>

      <div className="rounded-xl border border-black/10 bg-white p-4 shadow-sm">
        <label className="block text-sm font-medium mb-1">Deine Antwort (frei):</label>
        <textarea
          className="w-full rounded-md border px-3 py-2 text-sm"
          rows={5}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Argumentiere frei. Füge einzelne Punkte hinzu und werte danach."
        />
        <div className="mt-2 flex gap-2">
          <button onClick={onAdd} className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50">
            Punkt hinzufügen
          </button>
          <button onClick={onScore} className="rounded-md bg-brand-600 text-white px-3 py-1.5 text-sm hover:bg-brand-700">
            Auswerten
          </button>
        </div>

        {answers.length > 0 && (
          <div className="mt-3">
            <div className="text-xs font-medium text-gray-700 mb-1">Gesammelte Punkte:</div>
            <ul className="list-disc pl-5 text-sm space-y-1">
              {answers.map((a, i) => (
                <li key={i}>{a}</li>
              ))}
            </ul>
          </div>
        )}

        {error && <div className="mt-3 text-sm text-red-600">{error}</div>}

        {result && (
          <div className="mt-4 rounded-lg border border-black/10 bg-black/[.03] p-3">
            <div className="font-medium text-sm">Gesamtscore: {result.total}</div>
            <ul className="mt-2 space-y-2">
              {result.sections.map((s) => (
                <li key={s.name} className="text-sm">
                  <div className="font-medium">
                    {s.name}: {s.got}/{s.max}
                  </div>
                  {s.missing?.length > 0 && (
                    <div className="text-xs text-gray-600">
                      Fehlende Punkte: {s.missing.join(", ")}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </main>
  );
}