"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRightIcon, ChevronRightIcon, FolderIcon } from "@heroicons/react/24/outline";
import { CASES } from "@/data/cases";
import type { Case } from "@/lib/types";

// neutrale Labels, falls kein pseudonym vorhanden
function neutralLabel(idx: number) {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  if (idx < 26) return `Fall ${letters[idx]}`;
  const a = Math.floor(idx / 26) - 1;
  const b = idx % 26;
  return `Fall ${letters[a]}${letters[b]}`;
}

export default function SymptomsPage() {
  // 1) Symptome + Mapping
  const { symptoms, casesBySymptom } = useMemo(() => {
    const map = new Map<string, Case[]>();
    for (const c of CASES) {
      const s = (c.leadSymptom ?? "Sonstige").trim();
      if (!map.has(s)) map.set(s, []);
      map.get(s)!.push(c);
    }
    // sortiere innerhalb des Symptoms nach pseudonym (oder id als Fallback)
    for (const [k, arr] of map) {
      map.set(
        k,
        [...arr].sort((a, b) => (a.pseudonym ?? a.id).localeCompare(b.pseudonym ?? b.id, "de"))
      );
    }
    const syms = [...map.keys()].sort((a, b) => a.localeCompare(b, "de"));
    return { symptoms: syms, casesBySymptom: map };
  }, []);

  // 2) Auswahl (ohne useSearchParams → keine Suspense-Warnung)
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

  const activeCases = useMemo(
    () => casesBySymptom.get(activeSymptom) ?? [],
    [casesBySymptom, activeSymptom]
  );

  return (
    <main className="p-0">
      <h1 className="mb-4 text-3xl font-semibold tracking-tight">Leitsymptome</h1>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3 items-start">
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

        {/* Spalten 2–3: Fälle zu aktivem Symptom (Diagnose bleibt verborgen) */}
        <section className="rounded-2xl border border-black/10 bg-white/80 p-4 shadow-sm md:col-span-1 xl:col-span-2">
          <h2 className="mb-3 text-xl font-semibold">
            {activeSymptom ? `Fälle: ${activeSymptom}` : "Fälle"}
          </h2>

          {!activeSymptom ? (
            <div className="text-sm text-gray-600">Wähle links ein Leitsymptom.</div>
          ) : activeCases.length === 0 ? (
            <div className="text-sm text-gray-600">Keine Fälle zu diesem Symptom.</div>
          ) : (
            <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {activeCases.map((c, i) => {
                const label = c.pseudonym?.replace(/[_-]/g, " ") || neutralLabel(i);
                return (
                  <li
                    key={c.id}
                    className="group flex items-center justify-between gap-3 rounded-xl border border-black/10 bg-white/80 px-3 py-2 shadow-sm hover:shadow-md"
                  >
                    <div className="min-w-0">
                      {/* bewusst KEIN c.title */}
                      <div className="truncate font-medium capitalize">{label}</div>
                      <div className="text-[11px] text-gray-600">
                        {(c.subject ?? c.specialty) || "Fach"}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Link
                        href={`/exam/${c.id}`}
                        className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-2.5 py-1.5 text-sm text-white hover:bg-blue-700"
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