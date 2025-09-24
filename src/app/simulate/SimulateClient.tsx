// src/app/simulate/simulateClient.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CASES } from "@/data/cases";
import type { Case } from "@/lib/types";
import { AcademicCapIcon, ArrowRightIcon } from "@heroicons/react/24/outline";
import { requireBrowserSupabase } from "@/lib/supabase/client";  // ⬅️ hier importieren
import ProgressBar from "@/components/ProgressBar";

/* ---------- Utils ---------- */
function sample<T>(arr: T[], n: number): T[] {
  if (n <= 0) return [];
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, Math.max(0, Math.min(n, copy.length)));
}
const clampInt = (v: number, min = 0, max = 999) =>
  Math.max(min, Math.min(max, Math.round(v)));


/* ---------- Skeleton ---------- */
function SimulateSkeleton({ minRows = 6 }: { minRows?: number }) {
  return (
    <div className="animate-pulse space-y-6">
      <div className="flex items-center gap-3">
        <span className="inline-flex h-8 w-32 rounded-full bg-slate-200/80" />
        <span className="hidden h-3 w-28 rounded-full bg-slate-200/70 sm:block" />
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
        <div className="mb-4 h-5 w-40 rounded bg-slate-200/70" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-4 w-32 rounded bg-slate-200/70" />
              <div className="h-8 w-24 rounded-2xl bg-slate-100" />
              <div className="h-4 w-16 rounded bg-slate-100" />
            </div>
          ))}
        </div>
        <div className="mt-4 flex gap-3">
          <div className="h-9 w-40 rounded-2xl bg-slate-100" />
          <div className="h-9 w-48 rounded-2xl bg-slate-200/80" />
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
        <div className="mb-4 h-5 w-40 rounded bg-slate-200/70" />
        <ul className="space-y-3">
          {Array.from({ length: minRows }).map((_, i) => (
            <li
              key={i}
              className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <div className="mb-2 h-4 w-64 rounded bg-slate-200/80" />
                <div className="h-3 w-40 rounded bg-slate-100" />
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <div className="hidden h-7 w-20 rounded-2xl bg-slate-100 sm:block" />
                <div className="h-8 w-24 rounded-2xl bg-slate-200/70" />
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

/* ---------- Seite ---------- */

export default function SimulatePage() {
  // ⏳ Skeleton-Steuerung
  const MIN_SKELETON_MS = 600;
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const started = Date.now();
    const rest = Math.max(0, MIN_SKELETON_MS - (Date.now() - started));
    const t = setTimeout(() => setLoading(false), rest);
    return () => clearTimeout(t);
  }, []);

// 🆕 Letzte Simulation laden (kommt direkt nach Skeleton-States)
  const [lastSeries, setLastSeries] = useState<null | {
    series_id: string;
    total_score: number;
    total_max: number;
    ended_at: string;
  }>(null);

  useEffect(() => {
    const supabase = requireBrowserSupabase();

    async function load() {
      const { data, error } = await supabase
        .from("series_results") // deine Tabelle
        .select("series_id, total_score, total_max, ended_at")
        .order("ended_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data) setLastSeries(data);
    }

    load();
  }, []);

  // Eindeutige Serien-ID für diese Zusammenstellung
  const [seriesId] = useState(
    () =>
      `sid_${Date.now().toString(36)}_${Math.random()
        .toString(36)
        .slice(2, 8)}`
  );

  // Pools
  const innerePool = useMemo(
    () => CASES.filter((c) => (c.subject ?? c.specialty) === "Innere Medizin"),
    []
  );
  const chirurgiePool = useMemo(
    () => CASES.filter((c) => (c.subject ?? c.specialty) === "Chirurgie"),
    []
  );
  const wahlfachCases = useMemo(
    () => CASES.filter((c) => (c.subject ?? c.specialty) === "Wahlfach"),
    []
  );

  // Wahlfach-Optionen
  const wahlfachOptions = useMemo(() => {
    const set = new Set<string>();
    for (const c of wahlfachCases) {
      const opt = (c.category ?? c.subspecialty ?? "Allgemein").trim();
      if (opt) set.add(opt);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, "de"));
  }, [wahlfachCases]);

  // Konfiguration
  const [innerCount, setInnerCount] = useState<number>(2);
  const [chirCount, setChirCount] = useState<number>(2);
  const [wahlfachSelected, setWahlfachSelected] = useState<string>(
    () => wahlfachOptions[0] ?? "Allgemein"
  );
  const [wahlCount, setWahlCount] = useState<number>(2);
  const [seed, setSeed] = useState(0);

  // Auswahl berechnen
  const selected = useMemo(() => {
    void seed; // trigger
    const wahlPool = wahlfachCases.filter(
      (c) =>
        (c.category ?? c.subspecialty ?? "Allgemein") === wahlfachSelected
    );

    const pick: Case[] = [
      ...sample(innerePool, clampInt(innerCount, 0, innerePool.length)),
      ...sample(chirurgiePool, clampInt(chirCount, 0, chirurgiePool.length)),
      ...sample(wahlPool, clampInt(wahlCount, 0, wahlPool.length)),
    ];
    return pick;
  }, [
    seed,
    innerCount,
    chirCount,
    wahlCount,
    innerePool,
    chirurgiePool,
    wahlfachCases,
    wahlfachSelected,
  ]);

  if (loading) {
    return (
      <main className="min-h-screen bg-white py-10 text-slate-900">
        <div className="mx-auto max-w-5xl px-6">
          <div className="mb-8 flex flex-wrap items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.35em] text-slate-500">
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-1 text-[10px] font-semibold uppercase tracking-[0.4em] text-slate-600">
              Examenssimulation
            </span>
          </div>
          <SimulateSkeleton />
        </div>
      </main>
    );
  }

  // 👉 Serie in Query packen (+ sid)
  const ids = selected.map((c) => c.id);
  const seriesQuery = ids.length
    ? `?s=${encodeURIComponent(ids.join(","))}&i=0&sid=${encodeURIComponent(
        seriesId
      )}`
    : "";

  const lastSeriesPct = lastSeries
    ? Math.round(
        (lastSeries.total_score / Math.max(1, lastSeries.total_max)) * 100
      )
    : null;

  return (
    <main className="min-h-screen bg-white py-10 text-slate-900">
      <div className="mx-auto max-w-5xl px-6">
        <div className="mb-8 flex flex-wrap items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.35em] text-slate-500">
          <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-1 text-[10px] font-semibold uppercase tracking-[0.4em] text-slate-600">
            <AcademicCapIcon className="h-4 w-4" /> Examenssimulation
          </span>
          <div className="flex items-center gap-2">
            <span className="hidden text-[10px] uppercase tracking-[0.4em] text-slate-500 sm:inline">Auswahl</span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
              {selected.length} Fälle
            </span>
          </div>
          {lastSeriesPct !== null ? (
            <div className="flex items-center gap-2">
              <span className="hidden text-[10px] uppercase tracking-[0.4em] text-slate-500 sm:inline">
                Letzte Serie
              </span>
              <div className="w-36">
                <ProgressBar value={lastSeriesPct} />
              </div>
            </div>
          ) : null}
        </div>

        {/* Konfiguration */}
        <section className="mb-6 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-lg shadow-slate-200/60">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Zusammenstellung</h2>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <span className="min-w-[9rem]">Innere-Fälle</span>
              <input
                type="number"
                min={0}
                max={innerePool.length}
                value={innerCount}
                onChange={(e) =>
                  setInnerCount(
                    clampInt(Number(e.target.value), 0, innerePool.length)
                  )
                }
                className="w-24 rounded-2xl border border-slate-200 bg-white px-3 py-1.5 text-slate-900"
              />
              <span className="text-xs text-slate-500">max. {innerePool.length}</span>
            </label>

            <label className="flex items-center gap-2 text-sm text-slate-700">
              <span className="min-w-[9rem]">Chirurgie-Fälle</span>
              <input
                type="number"
                min={0}
                max={chirurgiePool.length}
                value={chirCount}
                onChange={(e) =>
                  setChirCount(
                    clampInt(Number(e.target.value), 0, chirurgiePool.length)
                  )
                }
                className="w-24 rounded-2xl border border-slate-200 bg-white px-3 py-1.5 text-slate-900"
              />
              <span className="text-xs text-slate-500">max. {chirurgiePool.length}</span>
            </label>

            <div className="flex items-center gap-2 text-sm text-slate-700">
              <span className="min-w-[9rem]">Dein Wahlfach</span>
              <select
                className="min-w-[10rem] rounded-2xl border border-slate-200 bg-white px-3 py-1.5 text-slate-900"
                value={wahlfachSelected}
                onChange={(e) => setWahlfachSelected(e.target.value)}
              >
                {wahlfachOptions.length === 0 ? (
                  <option value="Allgemein">Allgemein</option>
                ) : (
                  wahlfachOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))
                )}
              </select>
            </div>

            <label className="flex items-center gap-2 text-sm text-slate-700">
              <span className="min-w-[9rem]">Wahlfach-Fälle</span>
              <input
                type="number"
                min={0}
                max={
                  wahlfachCases.filter(
                    (c) =>
                      (c.category ?? c.subspecialty ?? "Allgemein") ===
                      wahlfachSelected
                  ).length
                }
                value={wahlCount}
                onChange={(e) => {
                  const maxAvail = wahlfachCases.filter(
                    (c) =>
                      (c.category ?? c.subspecialty ?? "Allgemein") ===
                      wahlfachSelected
                  ).length;
                  setWahlCount(clampInt(Number(e.target.value), 0, maxAvail));
                }}
                className="w-24 rounded-2xl border border-slate-200 bg-white px-3 py-1.5 text-slate-900"
              />
              <span className="text-xs text-slate-500">
                max. {" "}
                {
                  wahlfachCases.filter(
                    (c) =>
                      (c.category ?? c.subspecialty ?? "Allgemein") ===
                      wahlfachSelected
                  ).length
                }
              </span>
            </label>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setSeed((x) => x + 1)}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
            >
              Neu zusammenstellen
            </button>

            {selected[0] && (
              <Link
                href={`/exam/${selected[0].id}${seriesQuery}`}
                className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                title="Prüfung starten (erster Fall)"
              >
                Prüfung starten <ArrowRightIcon className="h-4 w-4" />
              </Link>
            )}
          </div>
        </section>

        {/* Auswahl-Liste */}
        <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-lg shadow-slate-200/60">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Deine Auswahl</h2>
          {selected.length === 0 ? (
            <div className="text-sm text-slate-600">Keine passenden Fälle gefunden.</div>
          ) : (
            <ul className="space-y-3">
              {selected.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3"
                >
                  <div className="min-w-0">
                    <div className="truncate font-medium text-slate-900">{c.title}</div>
                    <div className="text-[11px] text-slate-600">
                      {(c.subject ?? c.specialty) || "Fach"} · {" "}
                      {(c.category ?? c.subspecialty) || "Kategorie"}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Link
                      href={`/cases/${c.id}`}
                      className="hidden sm:inline-flex items-center gap-1 rounded-2xl border border-slate-200 px-3 py-1.5 text-xs text-slate-700 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                    >
                      Details
                    </Link>
                    <Link
                      href={`/exam/${c.id}`}
                      className="inline-flex items-center gap-1 rounded-2xl bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                      title="Diesen Fall alleine starten"
                    >
                      Starten <ArrowRightIcon className="h-4 w-4" />
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {lastSeries ? (
          <section className="mt-6 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-lg shadow-slate-200/60">
            <h2 className="mb-3 text-lg font-semibold text-slate-900">Letzte Simulation</h2>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-slate-700">
                <div>
                  Score: <b>{lastSeries.total_score}</b> / {lastSeries.total_max} ({lastSeriesPct}%)
                </div>
                <div className="text-xs text-slate-500">
                  beendet am {new Date(lastSeries.ended_at).toLocaleString("de-DE")}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-32">
                  <ProgressBar value={lastSeriesPct ?? 0} />
                </div>
                <Link
                  href={`/exam/summary?sid=${encodeURIComponent(lastSeries.series_id)}`}
                  className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                >
                  Ergebnisse ansehen
                </Link>
              </div>
            </div>
          </section>
        ) : null}

        <p className="mt-4 text-xs text-slate-500">
          Hinweis: „Prüfung starten“ öffnet den ersten Fall deiner Serie. Nach jedem Fall wird automatisch der nächste gestartet,
          bis alle erledigt sind.
        </p>
      </div>
    </main>
  );
}
