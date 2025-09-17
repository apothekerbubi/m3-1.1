"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CASES } from "@/data/cases";
import type { Case } from "@/lib/types";
import { hasExamModeCase } from "@/data/exam-mode";
import { SparklesIcon } from "@heroicons/react/24/outline";

// Lokale Erweiterung um optionale Meta-Felder aus deinen Daten
type CaseWithMeta = Case & Partial<{
  specialty: string;
  subspecialty: string;
  category: string;
  shortTitle: string;
  difficulty: number;
  tags: string[];
}>;

// Kurzname für die Kachel
function shortName(c: CaseWithMeta) {
  const s = c.shortTitle?.trim();
  if (s) return s;
  const first = c.title.split(/[–—-]/)[0].trim();
  return first.length > 28 ? first.slice(0, 28) + "…" : first;
}

export default function SearchPage() {
  const [q, setQ] = useState("");

  // Einmalig als CaseWithMeta[] „sichtbar“ machen
  const ALL: CaseWithMeta[] = useMemo(
    () => (CASES as unknown as CaseWithMeta[]),
    []
  );

  // Suchindex ohne any
  const index = useMemo(
    () =>
      ALL.map((c) => {
        const hay = [
          c.title,
          c.vignette,
          c.specialty ?? "",
          c.subspecialty ?? "",
          c.category ?? "",
          String(c.difficulty ?? ""),
          ...(c.tags ?? []),
        ]
          .join(" ")
          .toLowerCase();
        return { id: c.id, case: c, hay };
      }),
    [ALL]
  );

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return ALL;
    return index.filter((r) => r.hay.includes(term)).map((r) => r.case);
  }, [q, index, ALL]);

  return (
    <main className="mx-auto max-w-4xl p-6">
      <h1 className="text-2xl font-semibold tracking-tight mb-4">Suche</h1>

      <div className="mb-4">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Fall, Fach oder Schlagwort suchen…"
          className="w-full rounded-md border px-3 py-2 text-sm"
        />
      </div>

      {results.length === 0 ? (
        <div className="text-sm text-gray-600">Keine Treffer.</div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {results.map((c) => (
            <li
              key={c.id}
              className="rounded-xl bg-[var(--panel)] border border-black/5 shadow-card p-4 hover:shadow-lg transition-shadow"
            >
              <div className="mb-1 font-medium">{shortName(c)}</div>
              <div className="text-xs text-gray-600 line-clamp-2">{c.vignette}</div>
              <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-gray-700">
                {c.specialty && (
                  <span className="inline-flex rounded-full border border-black/10 px-2 py-0.5">
                    {c.specialty}
                  </span>
                )}
                {c.subspecialty && (
                  <span className="inline-flex rounded-full border border-black/10 px-2 py-0.5">
                    {c.subspecialty}
                  </span>
                )}
                {typeof c.difficulty !== "undefined" && (
                  <span className="inline-flex rounded-full border border-black/10 px-2 py-0.5">
                    Schwierigkeit {c.difficulty}
                  </span>
                )}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link
                  href={`/cases/${c.id}`}
                  className="rounded-md border px-3 py-1 text-xs hover:bg-black/[.04]"
                >
                  Details
                </Link>
                {hasExamModeCase(c.id) && (
                  <Link
                    href={`/exam-mode/${c.id}`}
                    className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-3 py-1 text-xs text-white hover:bg-emerald-700"
                  >
                    Neuer Prüfungsmodus <SparklesIcon className="h-4 w-4" />
                  </Link>
                )}
                <Link
                  href={`/exam/${c.id}`}
                  className="rounded-md bg-blue-600 px-3 py-1 text-xs text-white hover:bg-blue-700"
                >
                  Prüfungsmodus
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}