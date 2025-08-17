// src/app/cases/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CASES } from "@/data/cases";
import MiniProgress from "@/components/MiniProgress";
import { CheckCircleIcon } from "@heroicons/react/24/solid";

type ProgressRow = {
  case_id: string;
  score: number;
  max_score: number;
  completed: boolean;
};

export default function CasesPage() {
  const [prog, setProg] = useState<Record<string, ProgressRow>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const MIN_SKELETON_MS = 100; // min. Anzeigedauer für Skeleton
    const started = Date.now();

    (async () => {
      try {
        const res = await fetch("/api/progress/list", { cache: "no-store" });
        const json = await res.json();
        const map: Record<string, ProgressRow> = {};
        for (const it of json.items || []) {
          map[it.case_id] = it as ProgressRow;
        }
        setProg(map);
      } catch {
        setProg({});
      } finally {
        const elapsed = Date.now() - started;
        const rest = Math.max(0, MIN_SKELETON_MS - elapsed);
        const t = setTimeout(() => setLoading(false), rest);
        return () => clearTimeout(t);
      }
    })();
  }, []);

  if (loading) {
    // Skeleton-Ansicht
    return (
      <main className="p-6" aria-busy="true" aria-live="polite">
        <h1 className="mb-4 text-2xl font-semibold">Fälle</h1>

        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: Math.min(9, Math.max(6, CASES.length)) }).map((_, i) => (
            <li
              key={i}
              className="rounded-xl border border-black/10 bg-white p-4 shadow-sm animate-pulse"
            >
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  <div className="h-4 w-56 rounded bg-gray-200" />
                  <div className="mt-2 h-3 w-32 rounded bg-gray-100" />
                </div>
                <div className="h-6 w-16 rounded-md border border-gray-200 bg-gray-50" />
              </div>

              <div className="mt-3">
                <div className="h-2 w-40 rounded bg-gray-100" />
                <div className="mt-1 h-3 w-44 rounded bg-gray-100" />
              </div>

              <div className="mt-3 h-8 w-20 rounded-md border border-black/10 bg-gray-100" />
            </li>
          ))}
        </ul>
      </main>
    );
  }

  return (
    <main className="p-6">
      <h1 className="mb-4 text-2xl font-semibold">Fälle</h1>

      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {CASES.map((c) => {
          const p = prog[c.id];
          const pct = p ? Math.round((p.score / Math.max(1, p.max_score)) * 100) : 0;
          return (
            <li key={c.id} className="rounded-xl border border-black/10 bg-white p-4 shadow-sm transition">
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  <Link href={`/cases/${c.id}`} className="font-medium hover:underline">
                    {c.title}
                  </Link>
                  <div className="text-xs text-gray-500">{c.subject}</div>
                </div>
                {/* Abgehaktes Kästchen bei completed */}
                <div
                  className={`inline-flex items-center justify-center rounded-md border px-2 py-1 text-xs ${
                    p?.completed
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-gray-200 bg-gray-50 text-gray-500"
                  }`}
                  title={p?.completed ? "Abgeschlossen" : "Noch offen"}
                >
                  {p?.completed ? (
                    <span className="inline-flex items-center gap-1">
                      <CheckCircleIcon className="h-4 w-4" />
                      Fertig
                    </span>
                  ) : (
                    <span className="inline-block w-3 h-3 rounded-sm border border-gray-300 bg-white" />
                  )}
                </div>
              </div>

              {/* Mini-Scorebar */}
              <div className="mt-3">
                <MiniProgress value={pct} />
                <div className="mt-1 text-[11px] text-gray-600">
                  {p ? `${p.score}/${p.max_score} Punkte · ${pct}%` : "Noch kein Fortschritt"}
                </div>
              </div>

              <div className="mt-3">
                <Link
                  href={`/exam/${c.id}`}
                  className="inline-flex items-center rounded-md border border-black/10 bg-white px-2.5 py-1.5 text-sm text-gray-900 hover:bg-black/[.04]"
                >
                  Üben
                </Link>
              </div>
            </li>
          );
        })}
      </ul>
    </main>
  );
}