// src/app/cases/casesclient.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRightIcon,
  ChevronRightIcon,
  FolderIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import { CASES } from "@/data/cases";
import type { Case } from "@/lib/types";
import PageHero from "@/components/PageHero";

/* ---------- Utils ---------- */
function neutralLabel(idx: number) {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  if (idx < 26) return `Fall ${letters[idx]}`;
  const a = Math.floor(idx / 26) - 1;
  const b = idx % 26;
  return `Fall ${letters[a]}${letters[b]}`;
}

/* Mini-Progressbar (grün) + Prozent rechts */
function MiniBar({ pct }: { pct: number }) {
  const v = Math.max(0, Math.min(100, Math.round(pct || 0)));
  return (
    <div className="mt-2 flex items-center gap-2">
      <div className="h-2 w-40 rounded-full bg-gray-200" aria-label={`Fortschritt ${v}%`}>
        <div
          className="h-2 rounded-full bg-emerald-600 transition-[width] duration-300"
          style={{ width: `${v}%` }}
        />
      </div>
      <span className="text-[11px] tabular-nums text-gray-600">{v}%</span>
    </div>
  );
}

/* Großflächiges Skeleton */
function SymptomsSkeleton() {
  return (
    <main className="space-y-12 animate-pulse">
      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 px-6 py-12 text-white shadow-xl sm:px-8">
        <div className="absolute inset-y-0 right-0 w-1/2 bg-white/10 blur-3xl" />
        <div className="relative z-10 flex flex-col gap-6">
          <div className="h-5 w-36 rounded-full bg-white/30" />
          <div className="h-10 w-80 rounded-full bg-white/40" />
          <div className="h-4 w-72 rounded-full bg-white/20" />
        </div>
      </section>
      <div className="grid gap-8 lg:grid-cols-[minmax(320px,400px)_1fr] items-start">
        <section className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm">
          <div className="h-6 w-44 rounded bg-slate-200/80" />
          <ul className="mt-6 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <li key={i} className="rounded-2xl border border-slate-200 bg-white/70 px-4 py-4">
                <div className="h-4 w-48 rounded bg-slate-200/80" />
              </li>
            ))}
          </ul>
        </section>
        {/* rechte Karten */}
        <section className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm">
          <div className="h-6 w-56 rounded bg-slate-200/80" />
          <ul className="mt-6 grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(360px,1fr))]">
            {Array.from({ length: 6 }).map((_, i) => (
              <li key={i} className="space-y-4 rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm">
                <div className="h-5 w-44 rounded bg-slate-200/80" />
                <div className="h-3 w-40 rounded bg-slate-100" />
                <div className="h-9 w-28 rounded-xl border border-slate-200 bg-slate-50" />
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}

/* Progress-Typ vom API-Endpoint /api/progress/list */
type ProgressItem = {
  case_id: string;
  score?: number | null;
  max_score?: number | null;
  completed?: boolean | null;
  finished?: boolean | null;
  progress_pct?: number | null;
};

export default function SymptomsPage() {
  /* 1) Symptome + Mapping */
  const { symptoms, casesBySymptom } = useMemo(() => {
    const map = new Map<string, Case[]>();
    for (const c of CASES) {
      const s = (c.leadSymptom ?? "Sonstige").trim();
      if (!map.has(s)) map.set(s, []);
      map.get(s)!.push(c);
    }
    // Fälle innerhalb des Symptoms sortieren (nach pseudonym/id)
    for (const [k, arr] of map) {
      map.set(
        k,
        [...arr].sort((a, b) => (a.pseudonym ?? a.id).localeCompare(b.pseudonym ?? b.id, "de"))
      );
    }
    const syms = [...map.keys()].sort((a, b) => a.localeCompare(b, "de"));
    return { symptoms: syms, casesBySymptom: map };
  }, []);

  /* 2) Aktives Symptom (aus URL) */
  const [activeSymptom, setActiveSymptom] = useState<string>("");
  useEffect(() => {
    const sp = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
    const fromUrl = sp?.get("s") ?? "";
    const initial = fromUrl && symptoms.includes(fromUrl) ? fromUrl : symptoms[0] ?? "";
    setActiveSymptom(initial);
  }, [symptoms]);

  function setSymptom(s: string) {
    setActiveSymptom(s);
    if (typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search);
      sp.set("s", s);
      window.history.replaceState(null, "", `${window.location.pathname}?${sp.toString()}`);
    }
  }

  /* 3) Nutzer-Fortschritt laden */
  const [loadingProg, setLoadingProg] = useState(true);
  const [progByCase, setProgByCase] = useState<Record<string, { pct: number; done: boolean }>>({});

  useEffect(() => {
    let alive = true;
    const MIN_SKELETON_MS = 600;
    const started = Date.now();

    (async () => {
      try {
        const res = await fetch("/api/progress/list", { cache: "no-store" });
        const json = (await res.json()) as { items?: ProgressItem[] } | ProgressItem[];
        const items = Array.isArray(json) ? json : json.items ?? [];

        const map: Record<string, { pct: number; done: boolean }> = {};
        for (const it of items) {
          const pct =
            typeof it.progress_pct === "number"
              ? it.progress_pct
              : typeof it.score === "number" && typeof it.max_score === "number" && it.max_score > 0
              ? Math.round((it.score / it.max_score) * 100)
              : 0;
          const done = Boolean(it.completed ?? it.finished);
          map[it.case_id] = { pct: Math.max(0, Math.min(100, pct)), done };
        }
        if (alive) setProgByCase(map);
      } catch {
        if (alive) setProgByCase({});
      } finally {
        const elapsed = Date.now() - started;
        const rest = Math.max(0, MIN_SKELETON_MS - elapsed);
        setTimeout(() => alive && setLoadingProg(false), rest);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  /* 4) Aktive Fälle */
  const activeCases = useMemo(
    () => casesBySymptom.get(activeSymptom) ?? [],
    [casesBySymptom, activeSymptom]
  );

  /* 5) Skeleton während Progress lädt */
  if (loadingProg) return <SymptomsSkeleton />;

  /* 6) Render */
  return (
    <main className="space-y-12">
      <PageHero
        badge="Leitsymptome"
        title="Finde die passenden Fälle zu jedem Beschwerdebild."
        description="Wähle ein Leitsymptom und starte direkt in die zugehörigen Simulationen – inklusive Fortschrittsübersicht."
        bullets={[
          { text: "Strukturierte Übersicht aller Leitsymptome", colorClass: "bg-sky-300" },
          { text: "Fortschrittsanzeige für jeden Fall", colorClass: "bg-emerald-300" },
          { text: "Schneller Wechsel zwischen Symptomen", colorClass: "bg-amber-300" },
        ]}
      />

      <div className="grid gap-8 lg:grid-cols-[minmax(320px,400px)_1fr] items-start">
        <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="absolute -top-16 -left-20 h-36 w-36 rounded-full bg-slate-100 blur-3xl" />
          <div className="relative z-10">
            <h2 className="mb-4 text-xl font-semibold tracking-tight text-slate-900">Symptome</h2>
            {symptoms.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200/80 bg-slate-50/40 px-4 py-6 text-sm text-slate-500">
                Noch keine Leitsymptome hinterlegt.
              </div>
            ) : (
              <ul className="space-y-2">
                {symptoms.map((s) => {
                  const count = casesBySymptom.get(s)?.length ?? 0;
                  const active = s === activeSymptom;
                  return (
                    <li key={s}>
                      <button
                        type="button"
                        onClick={() => setSymptom(s)}
                        className={`flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-3 text-left transition ${
                          active
                            ? "border border-slate-900/20 bg-slate-900/5"
                            : "border border-transparent hover:border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        <span className="flex items-center gap-3">
                          <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-900/5">
                            <FolderIcon className="h-5 w-5 text-slate-700" />
                          </span>
                          <span className="font-medium text-slate-900">{s}</span>
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500">
                          {count}
                          <ChevronRightIcon className="h-4 w-4" />
                        </span>
                           </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>

         <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="absolute -bottom-16 -right-20 h-40 w-40 rounded-full bg-slate-100 blur-3xl" />
          <div className="relative z-10">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-xl font-semibold tracking-tight text-slate-900">
                {activeSymptom ? `Fälle: ${activeSymptom}` : "Fälle"}
              </h2>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Fortschritt</p>
            </div>

           {!activeSymptom ? (
              <div className="mt-6 rounded-2xl border border-dashed border-slate-200/80 bg-slate-50/40 px-4 py-6 text-sm text-slate-500">
                Wähle links ein Leitsymptom.
              </div>
            ) : activeCases.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-dashed border-slate-200/80 bg-slate-50/40 px-4 py-6 text-sm text-slate-500">
                Keine Fälle zu diesem Symptom.
              </div>
            ) : (
              <ul className="mt-6 grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(360px,1fr))]">
                {activeCases.map((c, i) => {
                  const label = c.pseudonym?.replace(/[_-]/g, " ") || neutralLabel(i);
                  const p = progByCase[c.id];
                  const done = p?.done ?? false;
                  const pct = p?.pct ?? 0;

                  return (
                    <li
                      key={c.id}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/80 px-5 py-4 shadow-sm transition hover:border-slate-300 hover:shadow-md"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="truncate font-medium text-slate-900 capitalize">{label}</div>
                          <div
                            className={`inline-flex items-center justify-center rounded-md border px-1.5 py-0.5 text-[11px] ${
                              done
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : "border-slate-200 bg-slate-50 text-slate-500"
                            }`}
                            title={done ? "Abgeschlossen" : "Noch offen"}
                          >
                            {done ? (
                              <span className="inline-flex items-center gap-1">
                                <CheckCircleIcon className="h-3.5 w-3.5" />
                                fertig
                              </span>
                            ) : (
                              <span className="inline-block h-3 w-3 rounded-sm border border-slate-300 bg-white" />
                            )}
                          </div>
                        </div>
                      

                      <MiniBar pct={pct} />
                      </div>

                    <div className="flex shrink-0 items-center gap-2">
                        <Link
                          href={`/exam/${c.id}`}
                          className="inline-flex items-center gap-1 rounded-xl bg-slate-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
                          title="Fall im Prüfungsmodus starten"
                        >
                          Starten <ArrowRightIcon className="h-4 w-4" />
                        </Link>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}