// src/app/simulate/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CASES } from "@/data/cases";
import type { Case } from "@/lib/types";
import { AcademicCapIcon, ArrowRightIcon } from "@heroicons/react/24/outline";

function sample<T>(arr: T[], n: number): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, Math.max(0, Math.min(n, copy.length)));
}

/** --- Skeleton --- */
const DEFAULT_MIN_SKELETON_MS = 1500; // via ?sk_ms=2500 überschreibbar

function SimulateSkeleton() {
  return (
    <main className="p-0 animate-pulse">
      <div className="mb-4 flex items-center gap-2">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gray-200" />
        <div className="h-6 w-56 rounded bg-gray-200" />
      </div>

      <div className="mb-4 flex gap-2">
        <div className="h-9 w-40 rounded-md bg-gray-200" />
        <div className="h-9 w-48 rounded-md bg-gray-200" />
      </div>

      <section className="rounded-2xl border border-black/10 bg-white/80 p-4 shadow-sm">
        <div className="mb-3 h-5 w-40 rounded bg-gray-200" />
        <ul className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <li
              key={i}
              className="flex items-center justify-between gap-3 rounded-xl border border-black/10 bg-white/80 px-3 py-2"
            >
              <div className="min-w-0 flex-1">
                <div className="mb-1 h-4 w-3/4 rounded bg-gray-200" />
                <div className="h-3 w-1/3 rounded bg-gray-200" />
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <div className="hidden sm:block h-7 w-16 rounded-md border bg-gray-50" />
                <div className="h-8 w-24 rounded-md bg-gray-200" />
              </div>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-3 h-3 w-80 rounded bg-gray-200" />
    </main>
  );
}

export default function SimulatePage() {
  const [seed, setSeed] = useState(0); // bei Klick neu auslosen

  // Skeleton-Steuerung
  const [loading, setLoading] = useState(true);
  const minSkeletonMs = useMemo(() => {
    if (typeof window === "undefined") return DEFAULT_MIN_SKELETON_MS;
    const sp = new URLSearchParams(window.location.search);
    const n = Number(sp.get("sk_ms"));
    return Number.isFinite(n) && n > 0 ? Math.min(n, 10000) : DEFAULT_MIN_SKELETON_MS;
  }, []);
  useEffect(() => {
    let alive = true;
    const t = setTimeout(() => alive && setLoading(false), minSkeletonMs);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [minSkeletonMs]);

  const selected = useMemo(() => {
    // 2x Innere, 2x Chirurgie, 2x Wahlfach
    const innere = CASES.filter((c) => (c.subject ?? c.specialty) === "Innere Medizin");
    const chir = CASES.filter((c) => (c.subject ?? c.specialty) === "Chirurgie");
    const wahl = CASES.filter((c) => (c.subject ?? c.specialty) === "Wahlfach");
    // seed „nutzen“: nichts pseudo-deterministisch, aber Änderung triggert useMemo
    void seed;

    const pick = [...sample(innere, 2), ...sample(chir, 2), ...sample(wahl, 2)];

    return pick as Case[];
  }, [seed]);

  if (loading) return <SimulateSkeleton />;

  return (
    <main className="p-0">
      <div className="mb-4 flex items-center gap-2">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-black/[.05]">
          <AcademicCapIcon className="h-5 w-5 text-gray-700" />
        </span>
        <h1 className="text-2xl font-semibold tracking-tight">Examenssimulation</h1>
      </div>

      <p className="mb-4 text-sm text-gray-700">
        Diese Prüfung besteht aus <b>2 Fällen Innere</b>, <b>2 Fällen Chirurgie</b> und <b>2 Fällen Wahlfach</b>.
        Klicke auf „Neu zusammenstellen“, um eine andere Kombination zu erhalten.
      </p>

      <div className="mb-4 flex gap-2">
        <button
          type="button"
          onClick={() => setSeed((x) => x + 1)}
          className="rounded-md border border-black/10 bg-white px-3 py-2 text-sm hover:bg-black/[.04]"
        >
          Neu zusammenstellen
        </button>
        {selected[0] && (
          <Link
            href={`/exam/${selected[0].id}`}
            className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700"
            title="Prüfung starten (erster Fall)"
          >
            Prüfung starten <ArrowRightIcon className="h-4 w-4" />
          </Link>
        )}
      </div>

      <section className="rounded-2xl border border-black/10 bg-white/80 p-4 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold">Deine Auswahl</h2>
        {selected.length === 0 ? (
          <div className="text-sm text-gray-600">Keine passenden Fälle gefunden.</div>
        ) : (
          <ul className="space-y-2">
            {selected.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-black/10 bg-white/80 px-3 py-2"
              >
                <div className="min-w-0">
                  <div className="truncate font-medium">{c.title}</div>
                  <div className="text-[11px] text-gray-600">
                    {(c.subject ?? c.specialty) || "Fach"} · {(c.category ?? c.subspecialty) || "Kategorie"}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Link
                    href={`/cases/${c.id}`}
                    className="hidden sm:inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs hover:bg-black/[.04]"
                  >
                    Details
                  </Link>
                  <Link
                    href={`/exam/${c.id}`}
                    className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-2.5 py-1.5 text-sm text-white hover:bg-blue-700"
                    title="Diesen Fall starten"
                  >
                    Starten <ArrowRightIcon className="h-4 w-4" />
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="mt-3 text-xs text-gray-500">
        Hinweis: Aktuell startet „Prüfung starten“ mit dem ersten Fall. Nach Abschluss gelangst du zurück zur App und
        kannst den nächsten Fall starten.
      </p>
    </main>
  );
}