"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CASES } from "@/data/cases";
import type { Case } from "@/lib/types";

// Hilfsfunktionen
const norm = (s: string) => s.normalize("NFKD").toLowerCase();
const inText = (needle: string, hay: string) => norm(hay).includes(norm(needle));

// Anzeigenamen für Fach/Subfach – kompatibel zu altem (specialty) und neuem (subject/subspecialty) Schema
function subjectOf(c: Case): string {
  const anyC = c as unknown as { specialty?: string; subject?: string };
  return (anyC.specialty ?? anyC.subject ?? "").trim();
}
function subspecialtyOf(c: Case): string {
  const anyC = c as unknown as { subspecialty?: string; category?: string };
  return (anyC.subspecialty ?? anyC.category ?? "").trim();
}

export default function SearchPage() {
  const [q, setQ] = useState("");

  const results = useMemo(() => {
    const query = q.trim();
    if (!query) return [];

    return CASES.filter((c) => {
      const haystackParts: string[] = [
        c.title,
        c.vignette,
        subjectOf(c),
        subspecialtyOf(c),
        String((c as any).difficulty ?? ""),
        ...(c.tags ?? []),
      ].filter(Boolean);

      return haystackParts.some((part) => inText(query, part));
    });
  }, [q]);

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-semibold mb-4">Suche</h1>

      <div className="mb-4">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Suche nach Titel, Fach, Subfach, Tags…"
          className="w-full rounded-md border px-3 py-2 text-sm"
        />
      </div>

      {!q.trim() ? (
        <p className="text-sm text-gray-600">Tippe, um Fälle zu durchsuchen.</p>
      ) : results.length === 0 ? (
        <p className="text-sm text-gray-600">Keine Treffer.</p>
      ) : (
        <ul className="space-y-3">
          {results.map((c) => (
            <li key={c.id} className="rounded-xl border border-black/10 bg-white/80 p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-medium leading-tight">{c.title}</h3>
                  <p className="mt-1 text-xs text-gray-600">
                    {subjectOf(c)}
                    {subspecialtyOf(c) ? ` · ${subspecialtyOf(c)}` : ""}
                    {typeof (c as any).difficulty !== "undefined"
                      ? ` · Schwierigkeit ${(c as any).difficulty}`
                      : ""}
                  </p>
                  <p className="mt-1 line-clamp-2 text-sm text-gray-700">{c.vignette}</p>
                </div>
                <div className="shrink-0 flex gap-2">
                  <Link
                    href={`/cases/${c.id}`}
                    className="rounded-md border px-2.5 py-1.5 text-sm hover:bg-black/[.04]"
                  >
                    Details
                  </Link>
                  <Link
                    href={`/exam/${c.id}`}
                    className="rounded-md bg-brand-600 px-2.5 py-1.5 text-sm text-white hover:bg-brand-700"
                  >
                    Prüfen
                  </Link>
                </div>
              </div>
              {c.tags?.length ? (
                <div className="mt-3 text-[11px] text-gray-600">{c.tags.join(" · ")}</div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}