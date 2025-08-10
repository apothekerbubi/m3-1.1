"use client";

import { Suspense, useMemo } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  FolderIcon,
  ArrowRightIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import type { Case } from "@/lib/types";
import { CASES } from "@/data/cases";

function shortName(c: Case) {
  const s = c.shortTitle?.trim();
  if (s) return s;
  const first = c.title.split(/[–—-]/)[0].trim();
  return first.length > 28 ? `${first.slice(0, 28)}…` : first;
}

const SUBJECT_ORDER: ReadonlyArray<string> = [
  "Innere Medizin",
  "Chirurgie",
  "Wahlfach",
];

// -------- Inner: nutzt useSearchParams (muss in Suspense laufen) --------
function SubjectsPageInner() {
  const search = useSearchParams();
  const router = useRouter();

  // 1) Fächer → Kategorien → Cases aus CASES bauen
  const { subjects, catsBySubject, casesByKey } = useMemo(() => {
    const catsMap = new Map<string, Set<string>>();
    const casesMap = new Map<string, Case[]>();

    for (const c of CASES) {
      const subj = (c.subject ?? "Sonstiges").trim();
      const cat = (c.category ?? "Allgemein").trim();

      if (!catsMap.has(subj)) catsMap.set(subj, new Set());
      catsMap.get(subj)!.add(cat);

      const key = `${subj}::${cat}`;
      if (!casesMap.has(key)) casesMap.set(key, []);
      casesMap.get(key)!.push(c);
    }

    const allSubjects = Array.from(catsMap.keys());
    const ordered = [
      ...SUBJECT_ORDER.filter((s) => allSubjects.includes(s)),
      ...allSubjects
        .filter((s) => !SUBJECT_ORDER.includes(s))
        .sort((a, b) => a.localeCompare(b, "de")),
    ];

    const catsBySubjectObj: Record<string, string[]> = Object.fromEntries(
      ordered.map((s) => [
        s,
        Array.from(catsMap.get(s) ?? new Set<string>()).sort((a, b) =>
          a.localeCompare(b, "de")
        ),
      ])
    );

    return {
      subjects: ordered,
      catsBySubject: catsBySubjectObj,
      casesByKey: casesMap,
    };
  }, []);

  // 2) Auswahl aus URL oder Defaults
  const sParam = search.get("s") || subjects[0] || "";
  const subParam = search.get("sub") || (sParam && catsBySubject[sParam]?.[0]) || "";

  // 3) URL-Setter (ohne reload)
  function setSubject(s: string) {
    const firstCat = catsBySubject[s]?.[0] || "";
    const params = new URLSearchParams(search.toString());
    params.set("s", s);
    if (firstCat) params.set("sub", firstCat);
    else params.delete("sub");
    router.replace(`/subjects?${params.toString()}`);
  }
  function setSub(sub: string) {
    const params = new URLSearchParams(search.toString());
    params.set("sub", sub);
    router.replace(`/subjects?${params.toString()}`);
  }

  // 4) Fälle für rechte Spalte
  const activeCases = useMemo(() => {
    const key = `${sParam}::${subParam}`;
    const list = casesByKey.get(key) || [];
    return [...list].sort((a, b) =>
      shortName(a).localeCompare(shortName(b), "de")
    );
  }, [casesByKey, sParam, subParam]);

  return (
    <main className="p-0">
      <h1 className="mb-4 text-3xl font-semibold tracking-tight">Bibliothek</h1>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3 items-start">
        {/* Spalte 1: Fächer */}
        <section className="rounded-2xl border border-black/10 bg-white/80 p-4 shadow-sm">
          <h2 className="mb-3 text-xl font-semibold">Fächer</h2>
          <ul className="divide-y divide-black/5">
            {subjects.map((s) => {
              const count =
                catsBySubject[s]?.reduce(
                  (acc, cat) => acc + (casesByKey.get(`${s}::${cat}`)?.length || 0),
                  0
                ) ?? 0;
              const active = s === sParam;
              return (
                <li key={s}>
                  <button
                    onClick={() => setSubject(s)}
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
        </section>

        {/* Spalte 2: Kategorien */}
        <section className="rounded-2xl border border-black/10 bg-white/80 p-4 shadow-sm">
          <h2 className="mb-3 text-xl font-semibold">{sParam || "Subfächer"}</h2>
          {sParam && catsBySubject[sParam]?.length ? (
            <ul className="divide-y divide-black/5">
              {catsBySubject[sParam].map((cat) => {
                const count = casesByKey.get(`${sParam}::${cat}`)?.length || 0;
                const active = cat === subParam;
                return (
                  <li key={cat}>
                    <button
                      onClick={() => setSub(cat)}
                      className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-3 text-left hover:bg-black/[.03] ${
                        active ? "bg-black/[.03]" : ""
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-black/[.05]">
                          <FolderIcon className="h-5 w-5 text-gray-700" />
                        </span>
                        <span className="font-medium">{cat}</span>
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs text-gray-600">
                        {count}
                        {count > 0 && <ChevronRightIcon className="h-4 w-4" />}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="text-sm text-gray-600">Keine Subfächer gefunden.</div>
          )}
        </section>

        {/* Spalte 3: Fälle */}
        <section className="rounded-2xl border border-black/10 bg-white/80 p-4 shadow-sm">
          <h2 className="mb-3 text-xl font-semibold">{subParam || "Fälle"}</h2>
          {!subParam ? (
            <div className="text-sm text-gray-600">Wähle links ein Subfach.</div>
          ) : activeCases.length === 0 ? (
            <div className="text-sm text-gray-600">Keine Fälle in diesem Subfach.</div>
          ) : (
            <ul className="space-y-2">
              {activeCases.map((c) => (
                <li
                  key={c.id}
                  className="group flex items-center justify-between gap-3 rounded-xl border border-black/10 bg-white/80 px-3 py-2 shadow-sm hover:shadow-md"
                >
                  <div className="min-w-0">
                    <div className="truncate font-medium">{shortName(c)}</div>
                    <div className="text-xs text-gray-600">
                      {c.tags?.slice(0, 2).join(" · ")}
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
                      className="inline-flex items-center gap-1 rounded-md bg-brand-600 px-2.5 py-1.5 text-sm text-white hover:bg-brand-700"
                      title="Prüfungsmodus"
                    >
                      Prüfen <ArrowRightIcon className="h-4 w-4" />
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}

// -------- Export: Suspense-Wrapper (fix für useSearchParams) --------
export default function SubjectsPage() {
  return (
    <Suspense fallback={<main className="p-6 text-sm text-gray-600">Lade Bibliothek…</main>}>
      <SubjectsPageInner />
    </Suspense>
  );
}