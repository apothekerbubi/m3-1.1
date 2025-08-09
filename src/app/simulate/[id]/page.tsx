"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CASES } from "@/data/cases";
import { scoreAnswer } from "@/lib/scoring";
import { saveAttempt } from "@/lib/storage";

export default function SimulatePage() {
  const params = useParams<{ id: string | string[] }>();
  const router = useRouter();

  const rawId = params?.id;
  const caseId = Array.isArray(rawId) ? rawId[0] : rawId;

  const c = CASES.find((x) => x.id === caseId);

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

  const steps = c.steps.slice().sort((a, b) => a.order - b.order);

  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<string[]>(() => steps.map(() => ""));
  const [showHint, setShowHint] = useState(false);
  const [result, setResult] = useState<ReturnType<typeof scoreAnswer> | null>(null);

  const cur = steps[idx];

  function update(val: string) {
    setAnswers((arr) => {
      const copy = arr.slice();
      copy[idx] = val;
      return copy;
    });
  }

  function next() {
    setShowHint(false);
    setIdx((i) => Math.min(i + 1, steps.length - 1));
  }

  function prev() {
    setShowHint(false);
    setIdx((i) => Math.max(i - 1, 0));
  }

  function evaluate() {
    const allText = answers.join(" ");
    const r = scoreAnswer(allText, c.rubric);
    setResult(r);

    const attemptId = globalThis.crypto?.randomUUID?.() ?? `a_${Date.now()}`;
    saveAttempt({
      id: attemptId,
      caseId: c.id,
      caseTitle: c.title,
      dateISO: new Date().toISOString(),
      answers,
      result: r,
    });

    router.push(`/feedback/${attemptId}`);
  }

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h2 className="text-xl font-semibold mb-2">Simulation: {c.title}</h2>
      <p className="text-sm text-gray-600 mb-4">{c.vignette}</p>

      <div className="rounded-lg border p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-gray-500">
            Prüferfrage {idx + 1} / {steps.length}
          </p>
          <div className="text-xs text-gray-500">Thema: {c.tags.join(", ")}</div>
        </div>

        <p className="text-lg mb-3">{cur.prompt}</p>

        <textarea
          className="w-full rounded-md border p-3"
          rows={6}
          value={answers[idx]}
          onChange={(e) => update(e.target.value)}
          placeholder="Deine Antwort hier..."
        />

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            onClick={() => setShowHint((v) => !v)}
            className="rounded-md border px-3 py-1 text-sm hover:bg-gray-50"
          >
            {showHint ? "Hinweis verbergen" : "Hinweis anzeigen"}
          </button>
          <div className="ml-auto flex gap-2">
            <button
              onClick={prev}
              disabled={idx === 0}
              className="rounded-md border px-3 py-1 text-sm hover:bg-gray-50 disabled:opacity-50"
            >
              Zurück
            </button>
            {idx < steps.length - 1 ? (
              <button
                onClick={next}
                className="rounded-md border px-3 py-1 text-sm hover:bg-gray-50"
              >
                Weiter
              </button>
            ) : (
              <button
                onClick={evaluate}
                className="rounded-md border px-3 py-1 text-sm hover:bg-gray-50"
              >
                Bewerten
              </button>
            )}
          </div>
        </div>

        {showHint && cur.hint && (
          <div className="mt-3 rounded-md border p-3 bg-gray-50 text-sm">
            💡 <span className="text-gray-700">{cur.hint}</span>
          </div>
        )}
      </div>

      {result && (
        <div className="mt-6 rounded-lg border p-4 bg-gray-50">
          <h3 className="font-medium mb-2">Preview Feedback</h3>
          <p className="mb-3">
            Gesamtpunkte: <b>{result.total}</b>
          </p>
        </div>
      )}
    </main>
  );
}