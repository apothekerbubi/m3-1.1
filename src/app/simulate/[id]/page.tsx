"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { CASES } from "@/data/cases";
import { scoreAnswer } from "@/lib/scoring";

export default function SimulatePage() {
  const params = useParams<{ id: string | string[] }>();
  const rawId = params?.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;

  const c = CASES.find((x) => x.id === id) ?? null;

  // ✅ Hooks immer unconditionally aufrufen
  const steps = useMemo(
    () => (c ? [...c.steps].sort((a, b) => a.order - b.order) : []),
    [c]
  );
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<string[]>(() => steps.map(() => ""));
  const [showHint, setShowHint] = useState(false);
  const [result, setResult] = useState<ReturnType<typeof scoreAnswer> | null>(null);

  // Reset wenn Fall/Steps wechseln
  useEffect(() => {
  setIdx(0);
  setAnswers(steps.map(() => ""));
  setShowHint(false);
  setResult(null);
}, [id, steps]); // ← statt [id, steps.length]

  function updateAnswer(v: string) {
    setAnswers((arr) => {
      const copy = [...arr];
      copy[idx] = v;
      return copy;
    });
  }

  function evaluate() {
    if (!c) return;
    const all = answers.join(" ");
    const r = scoreAnswer(all, c.rubric);
    setResult(r);
  }

  // ❗️Erst JETZT conditional rendern (Hooks wurden oben bereits aufgerufen)
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

  const step = steps[idx];

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h2 className="text-xl font-semibold mb-2">{c.title}</h2>
      <p className="text-sm text-gray-600 mb-4">{c.vignette}</p>

      <div className="mb-3 text-sm text-gray-700">
        Schritt {idx + 1} / {steps.length}: {step?.prompt}
      </div>

      <textarea
        className="w-full rounded-md border p-3 text-sm"
        rows={5}
        value={answers[idx] || ""}
        onChange={(e) => updateAnswer(e.target.value)}
        placeholder="Deine Antwort…"
      />

      <div className="mt-2 flex gap-2">
        <button
          onClick={() => setShowHint((s) => !s)}
          className="rounded-md border px-3 py-1 text-sm hover:bg-gray-50"
        >
          Hinweis
        </button>
        <button
          onClick={() => setIdx((i) => Math.max(0, i - 1))}
          disabled={idx === 0}
          className="rounded-md border px-3 py-1 text-sm hover:bg-gray-50 disabled:opacity-50"
        >
          Zurück
        </button>
        <button
          onClick={() => setIdx((i) => Math.min(steps.length - 1, i + 1))}
          disabled={idx >= steps.length - 1}
          className="rounded-md border px-3 py-1 text-sm hover:bg-gray-50 disabled:opacity-50"
        >
          Weiter
        </button>
        <button
          onClick={evaluate}
          className="ml-auto rounded-md border px-3 py-1 text-sm hover:bg-gray-50"
        >
          Bewerten
        </button>
      </div>

      {showHint && step?.hint && (
        <div className="mt-3 rounded-md border bg-yellow-50 p-3 text-sm">
          <b>Tipp:</b> {step.hint}
        </div>
      )}

      {result && (
        <div className="mt-4 rounded-md border p-3 text-sm">
          <div className="font-medium mb-1">Punktzahl: {result.total}</div>
          <ul className="list-disc pl-5">
            {result.sections.map((s) => (
              <li key={s.name}>
                {s.name}: {s.got}/{s.max} — {s.missing.length ? `Fehlt: ${s.missing.join(", ")}` : "vollständig"}
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}
