"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Case } from "@/lib/types";
import { CASES } from "@/data/cases";

function tokensFromCase(c: Case): string[] {
  const base: string[] = [
    c.title,
    c.vignette,
    c.specialty ?? "",
    c.subspecialty ?? "",
    c.category ?? "",
    String(c.difficulty ?? ""),
    ...(c.tags ?? []),
  ];
  return base
    .join(" ")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .split(/\s+/)
    .filter(Boolean);
}

export default function SearchPage() {
  const [q, setQ] = useState<string>("");

  // Index vornbauen (ohne any)
  const index = useMemo(() => {
    return CASES.map((c: Case) => ({
      case: c,
      text: tokensFromCase(c).join(" "),
    }));
  }, []);

  // Query normieren
  const normQ = useMemo(() => {
    return q
      .toLowerCase()
      .normalize("NFKD")
      .replace(/\p{Diacritic}/gu, "")
      .trim();
  }, [q]);

  // Trefferliste (ohne any)
  const results: Case[] = useMemo(() => {
    if (!normQ) return [];
    const parts = normQ.split(/\s+/);
    return index
      .filter((row) => parts.every((p) => row.text.includes(p)))
      .map((row) => row.case);
  }, [index, normQ]);

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-semibold tracking-tight mb-4">Suche</h1>

      <div className="mb-4 flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Suche nach Titel, Stichwort, Tag…"
          className="w-full rounded-md border px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={() => setQ("")}
          className="rounded-md border px-3 py-2 text-sm hover:bg-black/[.04]"
        >
          Löschen
        </button>
      </div>

      {!normQ ? (
        <p className="text-sm text-gray-600">Gib einen Suchbegriff ein.</p>
      ) : results.length === 0 ? (
        <p className="text-sm text-gray-600">Keine Treffer.</p>
      ) : (
        <ul className="space-y-2">
          {results.map((c: Case) => (
            <li
              key={c.id}
              className="flex items-center justify-between rounded-lg border bg-white px-3 py-2 shadow-sm"
            >
              <div className="min-w-0">
                <div className="truncate font-medium">{c.title}</div>
                <div className="text-xs text-gray-600">
                  {[c.specialty, c.subspecialty, c.category].filter(Boolean).join(" · ")}
                </div>
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/cases/${c.id}`}
                  className="hidden sm:inline-block rounded-md border px-2 py-1 text-xs hover:bg-black/[.04]"
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
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}