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
    <main className="p-0 animate-pulse">
      <div className="h-8 w-48 rounded bg-gray-200 mb-4" />
      {/* ⬇️ Immer 2 Spalten: links Symptome, rechts Fälle */}
      <div className="grid gap-6 grid-cols-[minmax(320px,420px)_1fr] items-start">
        {/* linke Liste */}
        <section className="rounded-2xl border border-black/10 bg-white/80 p-4 shadow-sm">
          <div className="h-6 w-40 rounded bg-gray-200 mb-3" />
          <ul className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <li key={i} className="rounded-xl border border-black/10 bg-white px-3 py-3">
                <div className="h-4 w-48 rounded bg-gray-200" />
              </li>
            ))}
          </ul>
        </section>
        {/* rechte Karten */}
        <section className="rounded-2xl border border-black/10 bg-white/80 p-4 shadow-sm">
          <div className="h-6 w-56 rounded bg-gray-200 mb-3" />
          <ul className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(420px,1fr))]">
            {Array.from({ length: 6 }).map((_, i) => (
              <li key={i} className="rounded-xl border border-black/10 bg-white px-4 py-4 shadow-sm">
                <div className="h-5 w-44 rounded bg-gray-200 mb-3" />
                <div className="h-2 w-40 rounded bg-gray-100" />
                <div className="mt-3 h-8 w-24 rounded-md border border-gray-200 bg-gray-50" />
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
    <main className="p-0">
      <h1 className="mb-4 text-3xl font-semibold tracking-tight">Leitsymptome</h1>

      {/* ⬇️ Immer zwei Spalten – Fälle stehen RECHTS neben der Liste */}
      <div className="grid gap-6 grid-cols-[minmax(320px,420px)_1fr] items-start">
        {/* Spalte 1: Symptome */}
        <section className="rounded-2xl border border-black/10 bg-white/80 p-4 shadow-sm">
          <h2 className="mb-3 text-xl font-semibold">Symptome</h2>
          {symptoms.length === 0 ? (
            <div className="text-sm text-gray-600">Noch keine Leitsymptome hinterlegt.</div>
          ) : (
            <ul className="divide-y divide-black/5">
              {symptoms.map((s) => {
                const count = casesBySymptom.get(s)?.length ?? 0;
                const active = s === activeSymptom;
                return (
                  <li key={s}>
                    <button
                      type="button"
                      onClick={() => setSymptom(s)}
                      className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-3 text-left hover:bg-black/[.03] ${
                        active ? "bg-black/[.03]" : ""
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-black/[.05]">
                          <FolderIcon className="h-5 w-5 text-gray-700" />
                        </span>
                        <span className="font-medium">{s}</span>
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs text-gray-600">
                        {count}
                        <ChevronRightIcon className="h-4 w-4" />
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Spalte 2: Fälle (rechts) */}
        <section className="rounded-2xl border border-black/10 bg-white/80 p-4 shadow-sm">
          <h2 className="mb-3 text-xl font-semibold">
            {activeSymptom ? `Fälle: ${activeSymptom}` : "Fälle"}
          </h2>

          {!activeSymptom ? (
            <div className="text-sm text-gray-600">Wähle links ein Leitsymptom.</div>
          ) : activeCases.length === 0 ? (
            <div className="text-sm text-gray-600">Keine Fälle zu diesem Symptom.</div>
          ) : (
            <ul className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(420px,1fr))]">
              {activeCases.map((c, i) => {
                const label = c.pseudonym?.replace(/[_-]/g, " ") || neutralLabel(i);
                const p = progByCase[c.id];
                const done = p?.done ?? false;
                const pct = p?.pct ?? 0;

                return (
                  <li
                    key={c.id}
                    className="group flex items-center justify-between gap-3 rounded-xl border border-black/10 bg-white/80 px-4 py-3 shadow-sm hover:shadow-md"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="truncate font-medium text-[15px] sm:text-base capitalize">{label}</div>
                        {/* Häkchen-Kästchen */}
                        <div
                          className={`inline-flex items-center justify-center rounded-md border px-1.5 py-0.5 text-[11px] ${
                            done
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border-gray-200 bg-gray-50 text-gray-600"
                          }`}
                          title={done ? "Abgeschlossen" : "Noch offen"}
                        >
                          {done ? (
                            <span className="inline-flex items-center gap-1">
                              <CheckCircleIcon className="h-3.5 w-3.5" />
                              fertig
                            </span>
                          ) : (
                            <span className="inline-block w-3 h-3 rounded-sm border border-gray-300 bg-white" />
                          )}
                        </div>
                      </div>

                      <MiniBar pct={pct} />
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <Link
                        href={`/exam/${c.id}`}
                        className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700"
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
        </section>
      </div>
    </main>
  );
}