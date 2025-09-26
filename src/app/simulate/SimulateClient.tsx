// src/app/simulate/simulateClient.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CASES } from "@/data/cases";
import type { Case } from "@/lib/types";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import { requireBrowserSupabase } from "@/lib/supabase/client"; // ⬅️ hier importieren
import ProgressBar from "@/components/ProgressBar";
import PageHero from "@/components/PageHero";

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
    <main className="space-y-12 animate-pulse">
      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-r from-slate-900 via-slate-800 to-sky-800 px-6 py-12 text-white shadow-xl sm:px-8">
        <div className="absolute inset-y-0 right-0 w-1/2 bg-sky-300/20 blur-3xl" />
        <div className="relative z-10 flex flex-col gap-6">
          <div className="h-5 w-32 rounded-full bg-white/30" />
          <div className="h-10 w-80 rounded-full bg-white/40" />
          <div className="h-4 w-72 rounded-full bg-white/20" />
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm">
        <div className="h-6 w-48 rounded bg-slate-200/80" />
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-3 rounded-2xl border border-slate-200/80 bg-white/70 p-4">
              <div className="h-4 w-32 rounded bg-slate-200/70" />
              <div className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50" />
              <div className="h-3 w-24 rounded bg-slate-100" />
            </div>
          ))}
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <div className="h-10 w-44 rounded-xl border border-slate-200 bg-white" />
          <div className="h-10 w-52 rounded-xl bg-slate-900/70" />
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm">
        <div className="h-6 w-56 rounded bg-slate-200/80" />
        <ul className="mt-6 space-y-3">
          {Array.from({ length: minRows }).map((_, i) => (
            <li
              key={i}
              className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/80 px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <div className="h-4 w-64 rounded bg-slate-200/80" />
                <div className="mt-2 h-3 w-36 rounded bg-slate-100" />
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <div className="hidden sm:block h-8 w-24 rounded-xl border border-slate-200 bg-white/80" />
                <div className="h-10 w-28 rounded-xl bg-slate-900/70" />
              </div>
            </li>
          ))}
        </ul>
      </section>
    </main>
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

  if (loading) return <SimulateSkeleton />;

  // 👉 Serie in Query packen (+ sid)
  const ids = selected.map((c) => c.id);
  const seriesQuery = ids.length
    ? `?s=${encodeURIComponent(ids.join(","))}&i=0&sid=${encodeURIComponent(
        seriesId
      )}`
    : "";

  return (
    <main className="space-y-12">
      <PageHero
        badge="Simulation"
        title="Stelle dir deine persönliche Examenssimulation zusammen."
        description="Kombiniere Innere Medizin, Chirurgie und dein Wahlfach zu einer individuellen Serie – inklusive Fortschrittsüberblick."
        bullets={[
          { text: "Flexible Fallanzahl pro Fach", colorClass: "bg-emerald-300" },
          { text: "Automatische Prüfungsserie mit Tracking", colorClass: "bg-amber-300" },
          { text: "Direkter Zugriff auf Fälle und Ergebnisse", colorClass: "bg-sky-300" },
        ]}
        gradientClassName="from-slate-900 via-slate-800 to-sky-800"
        overlayClassName="bg-sky-400/20"
      />

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-semibold tracking-tight text-slate-900">Zusammenstellung</h2>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Konfiguration</p>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <label className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white/60 px-4 py-4 text-sm text-slate-700 shadow-sm">
            <span className="font-medium text-slate-900">Innere-Fälle</span>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={0}
                max={innerePool.length}
                value={innerCount}
                onChange={(e) =>
                  setInnerCount(clampInt(Number(e.target.value), 0, innerePool.length))
                }
                className="w-24 rounded-xl border border-slate-200 bg-white px-3 py-2 text-right text-sm"
              />
              <span className="text-xs text-slate-500">max. {innerePool.length}</span>
            </div>
          </label>

          <label className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white/60 px-4 py-4 text-sm text-slate-700 shadow-sm">
            <span className="font-medium text-slate-900">Chirurgie-Fälle</span>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={0}
                max={chirurgiePool.length}
                value={chirCount}
                onChange={(e) =>
                  setChirCount(clampInt(Number(e.target.value), 0, chirurgiePool.length))
                }
                className="w-24 rounded-xl border border-slate-200 bg-white px-3 py-2 text-right text-sm"
              />
              <span className="text-xs text-slate-500">max. {chirurgiePool.length}</span>
            </div>
          </label>

          <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white/60 px-4 py-4 text-sm text-slate-700 shadow-sm">
            <span className="font-medium text-slate-900">Dein Wahlfach</span>
            <select
              className="min-w-[10rem] rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
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

          <label className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white/60 px-4 py-4 text-sm text-slate-700 shadow-sm sm:col-span-2 xl:col-span-1">
            <span className="font-medium text-slate-900">Wahlfach-Fälle</span>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={0}
                max={
                  wahlfachCases.filter(
                    (c) => (c.category ?? c.subspecialty ?? "Allgemein") === wahlfachSelected,
                  ).length
                }
                value={wahlCount}
                onChange={(e) => {
                  const maxAvail = wahlfachCases.filter(
                    (c) => (c.category ?? c.subspecialty ?? "Allgemein") === wahlfachSelected,
                  ).length;
                  setWahlCount(clampInt(Number(e.target.value), 0, maxAvail));
                }}
                className="w-24 rounded-xl border border-slate-200 bg-white px-3 py-2 text-right text-sm"
              />
              <span className="text-xs text-slate-500">
                max. {wahlfachCases.filter((c) => (c.category ?? c.subspecialty ?? "Allgemein") === wahlfachSelected).length}
              </span>
            </div>
          </label>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setSeed((x) => x + 1)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            Neu zusammenstellen
          </button>

          {selected[0] && (
            <Link
              href={`/exam/${selected[0].id}${seriesQuery}`}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
              title="Prüfung starten (erster Fall)"
            >
              Prüfung starten <ArrowRightIcon className="h-4 w-4" />
            </Link>
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-semibold tracking-tight text-slate-900">Deine Auswahl</h2>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Fallübersicht</p>
        </div>
        {selected.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-200/80 bg-slate-50/40 px-4 py-6 text-sm text-slate-500">
            Keine passenden Fälle gefunden.
          </div>
        ) : (
          <ul className="mt-6 space-y-3">
            {selected.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 shadow-sm transition hover:border-slate-300 hover:shadow-md"
              >
                <div className="min-w-0">
                  <div className="truncate font-medium text-slate-900">{c.title}</div>
                  <div className="text-[11px] text-slate-500">
                    {(c.subject ?? c.specialty) || "Fach"} · {(c.category ?? c.subspecialty) || "Kategorie"}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Link
                    href={`/cases/${c.id}`}
                    className="hidden sm:inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    Details
                  </Link>
                  <Link
                    href={`/exam/${c.id}`}
                    className="inline-flex items-center gap-1 rounded-xl bg-slate-900 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-slate-700"
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

      {lastSeries && (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-slate-900">Letzte Simulation</h2>
              <p className="text-sm text-slate-600">
                Score: <b>{lastSeries.total_score}</b> / {lastSeries.total_max} (
                {Math.round((lastSeries.total_score / Math.max(1, lastSeries.total_max)) * 100)}%)
              </p>
              <p className="text-xs text-slate-500">
                Beendet am {new Date(lastSeries.ended_at).toLocaleString("de-DE")}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-32">
                <ProgressBar
                  value={Math.round(
                    (lastSeries.total_score / Math.max(1, lastSeries.total_max)) * 100,
                  )}
                />
              </div>
              <Link
                href={`/exam/summary?sid=${encodeURIComponent(lastSeries.series_id)}`}
                className="inline-flex items-center gap-1 rounded-xl bg-slate-900 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-slate-700"
              >
                Ergebnisse ansehen
              </Link>
            </div>
          </div>
        </section>
      )}

      <p className="text-xs text-slate-500">
        Hinweis: „Prüfung starten“ öffnet den ersten Fall deiner Serie. Nach jedem Fall wird automatisch der nächste gestartet,
        bis alle erledigt sind.
      </p>
    </main>
  );
}