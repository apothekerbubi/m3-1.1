// src/app/subjects/subjects-inner.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  FolderIcon,
  ChevronRightIcon,
  CheckCircleIcon,
  ClipboardDocumentCheckIcon,
} from "@heroicons/react/24/outline";
import type { Case } from "@/lib/types";
import { CASES } from "@/data/cases";
import PageHero from "@/components/PageHero";

/* ---------- Utils ---------- */
function shortName(c: Case) {
  const s = c.shortTitle?.trim();
  if (s) return s;
  const first = c.title.split(/[–—-]/)[0].trim();
  return first.length > 28 ? `${first.slice(0, 28)}…` : first;
}

const SUBJECT_ORDER: ReadonlyArray<string> = ["Innere Medizin", "Chirurgie", "Wahlfach"];

/* Mini-Progressbar für die Fallliste (grün + Prozent rechts) */
function MiniBar({ pct }: { pct: number }) {
  const v = Math.max(0, Math.min(100, Math.round(pct || 0)));
  return (
    <div className="mt-1 flex items-center gap-2">
      <div className="h-1.5 w-32 rounded-full bg-gray-200" aria-label={`Fortschritt ${v}%`}>
        <div
          className="h-1.5 rounded-full bg-emerald-600 transition-[width] duration-300"
          style={{ width: `${v}%` }}
        />
      </div>
      <span className="text-[11px] tabular-nums text-gray-600">{v}%</span>
    </div>
  );
}

/* Großflächiges Skeleton für diese Seite */
function SubjectsSkeleton() {
  return (
     <main className="animate-pulse space-y-12">
      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 px-5 py-6 text-white shadow-xl sm:px-6">
        <div className="absolute inset-y-0 right-0 w-1/2 bg-white/10 blur-3xl" />
        <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-3">
            <div className="h-4 w-28 rounded-full bg-white/30" />
            <div className="h-7 w-56 rounded-full bg-white/40" />
          </div>
          <div className="flex w-full max-w-xs flex-col gap-2 text-left">
            <div className="flex items-center gap-3">
              <span className="h-7 w-7 rounded-full bg-white/20" />
              <span className="h-3 w-full rounded-full bg-white/20" />
            </div>
            <div className="flex items-center gap-3">
              <span className="h-7 w-7 rounded-full bg-white/20" />
              <span className="h-3 w-11/12 rounded-full bg-white/20" />
            </div>
            <div className="flex items-center gap-3">
              <span className="h-7 w-7 rounded-full bg-white/20" />
              <span className="h-3 w-10/12 rounded-full bg-white/20" />
            </div>
            <div className="flex items-center gap-3">
              <span className="h-7 w-7 rounded-full bg-white/20" />
              <span className="h-3 w-9/12 rounded-full bg-white/20" />
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-[1fr_1fr] xl:grid-cols-[1.15fr_1fr_1fr]">
        {[0, 1, 2].map((col) => (
          <article key={col} className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm">
            <div className="h-6 w-40 rounded bg-slate-200/70" />
            <ul className="mt-6 space-y-3">
              {[0, 1, 2, 3].map((i) => (
                <li key={i} className="rounded-2xl border border-slate-200 bg-white/70 px-4 py-4">
                  <div className="h-4 w-3/4 rounded bg-slate-200 mb-2" />
                  <div className="h-3 w-1/3 rounded bg-slate-200/80" />
                </li>
              ))}
            </ul>
          </article>
        ))}
       </section>
    </main>
  );
}

type ProgressItem = {
  case_id: string;
  score?: number | null;
  max_score?: number | null;
  finished?: boolean | null;
  progress_pct?: number | null; // server kann auch direkt Prozent liefern
};

export default function SubjectsPageInner() {
  const search = useSearchParams();
  const router = useRouter();

  /* -------- 1) Fächer/Kategorien/Mapping aus CASES bauen -------- */
  const { subjects, catsBySubject, casesByKey } = useMemo(() => {
    const catsMap = new Map<string, Set<string>>();
    const casesMap = new Map<string, Case[]>();

    for (const c of CASES) {
      const subj = (c.subject ?? c.specialty ?? "Sonstiges").trim();
      const cat = (c.category ?? c.subspecialty ?? "Allgemein").trim();

      if (!catsMap.has(subj)) catsMap.set(subj, new Set());
      catsMap.get(subj)!.add(cat);

      const key = `${subj}::${cat}`;
      if (!casesMap.has(key)) casesMap.set(key, []);
      casesMap.get(key)!.push(c);
    }

    const allSubjects = Array.from(catsMap.keys());
    const ordered = [
      ...SUBJECT_ORDER.filter((s) => allSubjects.includes(s)),
      ...allSubjects.filter((s) => !SUBJECT_ORDER.includes(s)).sort((a, b) => a.localeCompare(b, "de")),
    ];

    const catsBySubjectObj: Record<string, string[]> = Object.fromEntries(
      ordered.map((s) => [
        s,
        Array.from(catsMap.get(s) ?? new Set<string>()).sort((a, b) => a.localeCompare(b, "de")),
      ])
    );

    return { subjects: ordered, catsBySubject: catsBySubjectObj, casesByKey: casesMap };
  }, []);

  /* -------- 2) Auswahl aus URL oder Defaults -------- */
  const sParam = search.get("s") || subjects[0] || "";
  const subParam = search.get("sub") || (sParam && catsBySubject[sParam]?.[0]) || "";

  /* -------- 3) URL Setter -------- */
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

  /* -------- 4) Nutzer-Fortschritt laden (clientseitig) -------- */
  const [progByCase, setProgByCase] = useState<Record<string, { pct: number; done: boolean }>>({});
  const [loadingProg, setLoadingProg] = useState(true);

  // 👉 Mindestdauer für das Skeleton (in ms)
  const MIN_SKELETON_MS = 200;

  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout> | null = null;
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
          map[it.case_id] = { pct: Math.max(0, Math.min(100, pct)), done: Boolean(it.finished) };
        }
        if (alive) setProgByCase(map);
      } catch {
        if (alive) setProgByCase({});
      } finally {
        const elapsed = Date.now() - started;
        const rest = Math.max(0, MIN_SKELETON_MS - elapsed);
        if (alive) {
          timer = setTimeout(() => setLoadingProg(false), rest);
        }
      }
    })();

    return () => {
      alive = false;
      if (timer) clearTimeout(timer);
    };
  }, []);

  /* -------- 5) Fälle für rechte Spalte -------- */
  const activeCases = useMemo(() => {
    const key = `${sParam}::${subParam}`;
    const list = casesByKey.get(key) || [];
    return [...list].sort((a, b) => shortName(a).localeCompare(shortName(b), "de"));
  }, [casesByKey, sParam, subParam]);

  /* ---------- Während der Progress lädt: großes Skeleton ---------- */
  if (loadingProg) return <SubjectsSkeleton />;

  /* ---------- Render ---------- */
  return (
    <main className="space-y-12">
      <PageHero
        badge="Bibliothek"
        title="Deine Fälle nach Fachgebiet geordnet."
        bullets={[
          { text: "Fortschrittstracking für jeden Fall", colorClass: "bg-emerald-300" },
          { text: "Übersichtliche Struktur nach Themen", colorClass: "bg-sky-300" },
          { text: "Direkter Start in Simulationen", colorClass: "bg-amber-300" },
          { text: "Funktioniert auf allen Geräten", colorClass: "bg-fuchsia-300" },
        ]}
      />

      <section className="grid gap-8 lg:grid-cols-[1fr_1fr] xl:grid-cols-[1.15fr_1fr_1fr] items-start">
        {/* Spalte 1: Fächer */}
        <article className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md">
          <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-slate-100 blur-3xl" />
          <div className="relative z-10">
            <h2 className="mb-4 text-xl font-semibold tracking-tight text-slate-900">Fächer</h2>
            <ul className="divide-y divide-slate-200/70">
            {subjects.map((s) => {
              const count =
                catsBySubject[s]?.reduce((acc, cat) => acc + (casesByKey.get(`${s}::${cat}`)?.length || 0), 0) ?? 0;
              const active = s === sParam;
              return (
                <li key={s}>
                  <button
                    onClick={() => setSubject(s)}
                     className={`flex w-full items-center justify-between gap-3 px-3 py-3 text-left transition ${
                      active
                        ? "rounded-2xl border border-slate-900/20 bg-slate-900/5"
                        : "rounded-2xl hover:bg-slate-50"
                    }`}
                  >
                    <span className="flex items-center gap-2">
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
          </div>
        </article>

        {/* Spalte 2: Kategorien */}
        <article className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md">
          <div className="absolute -top-20 -left-16 h-36 w-36 rounded-full bg-slate-100 blur-3xl" />
          <div className="relative z-10">
            <h2 className="mb-4 text-xl font-semibold tracking-tight text-slate-900">{sParam || "Subfächer"}</h2>
          {sParam && catsBySubject[sParam]?.length ? (
             <ul className="divide-y divide-slate-200/70">
              {catsBySubject[sParam].map((cat) => {
                const count = casesByKey.get(`${sParam}::${cat}`)?.length || 0;
                const active = cat === subParam;
                return (
                  <li key={cat}>
                    <button
                      onClick={() => setSub(cat)}
                      className={`flex w-full items-center justify-between gap-3 px-3 py-3 text-left transition ${
                        active
                          ? "rounded-2xl border border-slate-900/20 bg-slate-900/5"
                          : "rounded-2xl hover:bg-slate-50"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-900/5">
                          <FolderIcon className="h-5 w-5 text-slate-700" />
                        </span>
                         <span className="font-medium text-slate-900">{cat}</span>
                      </span>
                       <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500">
                        {count}
                        {count > 0 && <ChevronRightIcon className="h-4 w-4" />}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200/80 bg-slate-50/40 px-4 py-6 text-sm text-slate-500">
              Keine Subfächer gefunden.
            </div>
          )}
        </div>
        </article>

        {/* Spalte 3: Fälle mit Progress */}
         <article className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md">
          <div className="absolute -bottom-16 -right-16 h-36 w-36 rounded-full bg-slate-100 blur-3xl" />
          <div className="relative z-10">
            <h2 className="mb-4 text-xl font-semibold tracking-tight text-slate-900">{subParam || "Fälle"}</h2>
          {!subParam ? (
            <div className="rounded-2xl border border-dashed border-slate-200/80 bg-slate-50/40 px-4 py-6 text-sm text-slate-500">
              Wähle links ein Subfach.
            </div>
          ) : activeCases.length === 0 ? (
             <div className="rounded-2xl border border-dashed border-slate-200/80 bg-slate-50/40 px-4 py-6 text-sm text-slate-500">
              Keine Fälle in diesem Subfach.
            </div>
          ) : (
            <ul className="space-y-3">
              {activeCases.map((c) => {
                const p = progByCase[c.id];
                const done = p?.done ?? false;
                const pct = p?.pct ?? 0;
                return (
                  <li
                    key={c.id}
                     className="group flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 shadow-sm transition hover:border-slate-300 hover:shadow-md"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="truncate font-medium text-slate-900">{shortName(c)}</div>
                        {done && <CheckCircleIcon className="h-4 w-4 text-emerald-600" aria-hidden />}
                      </div>
                      
                      <MiniBar pct={pct} />
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Link
                        href={`/cases/${c.id}`}
                        className="hidden sm:inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
                      >
                        Details
                      </Link>
                      <Link
                         href={`/exam/${c.id}`}
                        className="inline-flex items-center justify-center rounded-xl bg-slate-900 p-2 text-sm text-white transition hover:bg-slate-700"
                        aria-label="Prüfungsmodus starten"
                        title="Prüfungsmodus"
                      >
                        <ClipboardDocumentCheckIcon className="h-5 w-5" aria-hidden />
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        </article>
      </section>
    </main>
  );
}