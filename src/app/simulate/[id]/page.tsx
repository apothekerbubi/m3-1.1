// src/app/simulate/[id]/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { CASES } from "@/data/cases";
import { scoreAnswer, type Rubric } from "@/lib/scoring";
import type {
  Case,
  Step,
  StepRule,
  CategoriesRule,
  AllOfRule,
  AnyOfRule,
  SynonymsMap,
} from "@/lib/types";

/** kleine Utils */
const uniq = <T,>(arr: T[]) => Array.from(new Set(arr));
const asArray = (v: unknown) => (Array.isArray(v) ? v : v ? [v] : []);

/** Aus einem StepRule-Objekt Keywords extrahieren (mit Synonymen, falls vorhanden) */
function buildItemsFromRule(step: Step): { text: string; keywords: string[] }[] {
  const rule = step.rule as StepRule;

  // AnyOf
  if ((rule as AnyOfRule).mode === "anyOf") {
    const r = rule as AnyOfRule;
    const exp = asArray(r.expected).map((s) => String(s).toLowerCase());
    const syn: SynonymsMap | undefined = r.synonyms;
    return exp.map((term) => ({
      text: term,
      keywords: uniq([term, ...(syn?.[term] ?? [])].map((s) => s.toLowerCase())),
    }));
  }

  // AllOf
  if ((rule as AllOfRule).mode === "allOf") {
    const r = rule as AllOfRule;
    const syn: SynonymsMap | undefined = r.synonyms;

    const req = asArray(r.required).map((s) => String(s).toLowerCase());
    const opt = asArray(r.optional).map((s) => String(s).toLowerCase());

    const itemsReq = req.map((term) => ({
      text: term,
      keywords: uniq([term, ...(syn?.[term] ?? [])].map((s) => s.toLowerCase())),
    }));
    const itemsOpt = opt.map((term) => ({
      text: term,
      keywords: uniq([term, ...(syn?.[term] ?? [])].map((s) => s.toLowerCase())),
    }));

    return [...itemsReq, ...itemsOpt];
  }

  // Categories
  if ((rule as CategoriesRule).mode === "categories") {
    const r = rule as CategoriesRule;
    const flat = Object.values(r.categories ?? {}).flat();
    const keywords = uniq(flat.map((s) => String(s).toLowerCase()));
    return keywords.map((k) => ({ text: k, keywords: [k] }));
  }

  // Fallback: nichts
  return [];
}

/** Baut eine Detailed-Rubric aus allen Steps des Falls */
function buildRubricFromCase(c: Case): Rubric {
  const sections = [...c.steps]
    .sort((a, b) => a.order - b.order)
    .map((step) => {
      const itemsRaw = buildItemsFromRule(step);
      const items = itemsRaw.length > 0 ? itemsRaw : [{ text: step.prompt, keywords: [] }];

      // Punkte gleichmäßig auf Items verteilen, danach hart auf step.points deckeln
      const perItem = items.length > 0 ? step.points / items.length : 0;

      return {
        id: String(step.order),
        name: `Frage ${step.order}`,
        maxPoints: step.points,
        items: items.map((it) => ({
          text: it.text,
          points: perItem,
          keywords: it.keywords,
        })),
      };
    });

  return { sections };
}

export default function SimulatePage() {
  const params = useParams<{ id: string | string[] }>();
  const rawId = params?.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;

  const c = (CASES.find((x) => x.id === id) ?? null) as Case | null;

  // Steps und Rubrik vorbereiten
  const steps = useMemo<Step[]>(
    () => (c ? [...c.steps].sort((a, b) => a.order - b.order) : []),
    [c]
  );

  const rubric = useMemo<Rubric | null>(() => (c ? buildRubricFromCase(c) : null), [c]);

  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<string[]>(() => steps.map(() => ""));
  const [showHint, setShowHint] = useState(false);
  const [result, setResult] = useState<ReturnType<typeof scoreAnswer> | null>(null);

  // Reset, wenn Fall/Steps wechseln
  useEffect(() => {
    setIdx(0);
    setAnswers(steps.map(() => ""));
    setShowHint(false);
    setResult(null);
  }, [id, steps]); // wichtig: auf Steps reagieren (Länge & Inhalte)

  function updateAnswer(v: string) {
    setAnswers((arr) => {
      const copy = [...arr];
      copy[idx] = v;
      return copy;
    });
  }

  function evaluate() {
    if (!c || !rubric) return;
    const all = answers.join(" ");
    const r = scoreAnswer(all, rubric);
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

  const step = steps[idx];

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h2 className="text-xl font-semibold mb-2">{c.title}</h2>
      <p className="mb-4 text-sm text-gray-600">{c.vignette}</p>

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
          <div className="mb-1 font-medium">Punktzahl: {Math.round(result.total * 100) / 100}</div>
          <ul className="list-disc pl-5">
            {result.sections.map((s) => (
              <li key={s.name}>
                {s.name}: {Math.round(s.got * 100) / 100}/{Math.round(s.max * 100) / 100} —{" "}
                {s.missing && s.missing.length
                  ? `Fehlt: ${s.missing.join(", ")}`
                  : "vollständig"}
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}