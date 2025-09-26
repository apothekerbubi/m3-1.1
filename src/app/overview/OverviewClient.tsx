// src/app/overview/page.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { CASES } from "@/data/cases";
import Link from "next/link";
import PageHero from "@/components/PageHero";

type ProgressItem = {
  case_id: string;
  score?: number | null;
  max_score?: number | null;
  completed?: boolean | null;
  updated_at?: string | null;
};

type ProfileRow = {
  exam_date?: string | null;
  first_name?: string | null;
};

function MiniBar({ pct }: { pct: number }) {
  const v = Math.max(0, Math.min(100, Math.round(pct || 0)));
  return (
    <div className="flex items-center gap-2">
      <div
        className="h-1.5 w-36 shrink-0 rounded-full bg-slate-200"
        aria-label={`Fortschritt ${v}%`}
      >
        <div className="h-1.5 rounded-full bg-slate-900 transition-[width] duration-300" style={{ width: `${v}%` }} />
      </div>
      <span className="text-[11px] tabular-nums text-slate-600">{v}%</span>
    </div>
  );
}

function OverviewSkeleton() {
  return (
    <main className="space-y-12 animate-pulse">
      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 px-6 py-12 text-white shadow-xl sm:px-8">
        <div className="absolute inset-y-0 right-0 w-1/2 bg-white/10 blur-3xl" />
        <div className="relative z-10 flex flex-col gap-6">
          <div className="h-5 w-32 rounded-full bg-white/30" />
          <div className="h-10 w-80 rounded-full bg-white/40" />
          <div className="h-4 w-72 rounded-full bg-white/20" />
        </div>
      </section>
      <section className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm">
          <div className="h-6 w-44 rounded bg-slate-200/80" />
          <div className="mt-4 h-4 w-60 rounded bg-slate-100" />
          <div className="mt-2 h-3 w-40 rounded bg-slate-100" />
        </article>
        <article className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm">
          <div className="h-6 w-52 rounded bg-slate-200/80" />
          <div className="mt-4 h-3 w-32 rounded bg-slate-100" />
          <div className="mt-2 h-3 w-28 rounded bg-slate-100" />
        </article>
      </section>
      <section className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm">
        <div className="h-6 w-64 rounded bg-slate-200/80" />
        <ul className="mt-6 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <li
              key={i}
              className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/70 px-4 py-4"
            >
              <div className="h-4 w-64 rounded bg-slate-200/80" />
              <div className="h-3 w-32 rounded bg-slate-100" />
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

export default function OverviewClient() {
  // Supabase sicher halten (kann null sein, wenn ENV fehlt)
  const supabaseRef = useRef<ReturnType<typeof createBrowserSupabase> | null>(null);
  supabaseRef.current = createBrowserSupabase();

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<ProgressItem[]>([]);
  const [profile, setProfile] = useState<ProfileRow | null>(null);

  // Stabil vor early-returns halten (Hooks-Reihenfolge)
  const titleById = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of CASES) map.set(c.id, c.title);
    return map;
  }, []);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        // Fortschrittsliste (ohne Supabase)
        const res = await fetch("/api/progress/list", { cache: "no-store" });
        const json = await res.json();
        const arr: ProgressItem[] = Array.isArray(json) ? json : (json.items ?? []);
        if (alive) setItems(arr);

        // Optional: Profildaten nur laden, wenn Supabase konfiguriert ist
        const sb = supabaseRef.current;
        if (!sb) {
          if (alive) setProfile(null);
        } else {
          const { data: userData } = await sb.auth.getUser();
          const user = userData?.user;

          if (user) {
            const { data } = await sb
              .from("profiles")
              .select("exam_date, first_name")
              .eq("id", user.id)
              .maybeSingle();

            if (alive) setProfile((data as ProfileRow) ?? null);
          } else {
            if (alive) setProfile(null);
          }
        }
      } catch {
        if (alive) {
          setItems([]);
          setProfile(null);
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
    // keine Abhängigkeit von supabaseRef – Ref bleibt stabil
  }, []);

  if (loading) return <OverviewSkeleton />;

  // Deduplizieren auf den letzten Eintrag pro case_id
  const latestByCase = new Map<string, ProgressItem>();
  for (const r of items) {
    const prev = latestByCase.get(r.case_id);
    if (!prev) {
      latestByCase.set(r.case_id, r);
    } else {
      const ta = prev.updated_at ? Date.parse(prev.updated_at) : 0;
      const tb = r.updated_at ? Date.parse(r.updated_at) : 0;
      if (tb >= ta) latestByCase.set(r.case_id, r);
    }
  }

  const totalCases = CASES.length;
  const workedCount = latestByCase.size;

  let sumPct = 0;
  let nPct = 0;
  for (const row of latestByCase.values()) {
    const s = Number(row.score ?? 0);
    const m = Number(row.max_score ?? 0);
    if (m > 0) {
      const pct = Math.max(0, Math.min(100, Math.round((s / m) * 100)));
      sumPct += pct;
      nPct += 1;
    }
  }
  const avgPct = nPct > 0 ? Math.round(sumPct / nPct) : 0;

  // Gesamtfortschritt (bearbeitete Fälle / alle Fälle)
  const overallPct = totalCases > 0 ? Math.round((workedCount / totalCases) * 100) : 0;

  const examDateStr = profile?.exam_date
    ? new Date(profile.exam_date).toLocaleDateString("de-DE")
    : "—";
  const daysLeft =
    profile?.exam_date
      ? Math.max(0, Math.ceil((new Date(profile.exam_date).getTime() - Date.now()) / 86400000))
      : null;

  const recent = [...latestByCase.values()]
    .sort((a, b) => {
      const ta = a.updated_at ? Date.parse(a.updated_at) : 0;
      const tb = b.updated_at ? Date.parse(b.updated_at) : 0;
      return tb - ta;
    })
    .slice(0, 5);

  function pctOf(row: ProgressItem) {
    const s = Number(row.score ?? 0);
    const m = Number(row.max_score ?? 0);
    return m > 0 ? Math.round((s / m) * 100) : 0;
  }

  return (
    <main className="space-y-12">
      <PageHero
        badge="Dashboard"
        title="Alle Kennzahlen deiner Vorbereitung auf einen Blick."
        description="Behalte Fortschritt, Prüfungstermin und deine zuletzt bearbeiteten Fälle im Blick."
        bullets={[
          { text: "Bearbeitete Fälle und Erfolgsquote", colorClass: "bg-emerald-300" },
          { text: "Countdown bis zum Examens­termin", colorClass: "bg-amber-300" },
          { text: "Direkte Links zu Account und Fällen", colorClass: "bg-sky-300" },
        ]}
      />

      <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <article className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="absolute -top-20 -right-24 h-44 w-44 rounded-full bg-slate-100 blur-3xl" />
          <div className="relative z-10 space-y-4">
            <h2 className="text-xl font-semibold tracking-tight text-slate-900">Dein Stand</h2>
            <p className="text-sm text-slate-600">
              Bearbeitete Fälle: <b>{workedCount}</b> von <b>{totalCases}</b>
            </p>
            <MiniBar pct={overallPct} />
            <p className="text-sm text-slate-600">
              Durchschnittliche Punktzahl: <b>{avgPct}%</b>
            </p>
          </div>
        </article>

        <article className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="absolute -bottom-16 -left-12 h-36 w-36 rounded-full bg-slate-100 blur-3xl" />
          <div className="relative z-10 space-y-3">
            <h2 className="text-xl font-semibold tracking-tight text-slate-900">Examens­termin</h2>
            <p className="text-sm text-slate-600">
              Datum: <b>{examDateStr}</b>
            </p>
            {daysLeft !== null && (
              <p className="text-sm text-slate-600">
                Verbleibende Tage: <b>{daysLeft}</b>
              </p>
            )}
            <Link
              href="/account"
              className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            >
              Termin bearbeiten
            </Link>
          </div>
        </article>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-semibold tracking-tight text-slate-900">Letzte bearbeitete Fälle</h2>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
            Aktualisiert automatisch
          </p>
        </div>
        {recent.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-200/80 bg-slate-50/40 px-4 py-6 text-sm text-slate-500">
            Noch keine Fälle bearbeitet.
          </div>
        ) : (
          <ul className="mt-6 space-y-3">
            {recent.map((r, i) => {
              const title = titleById.get(r.case_id) ?? r.case_id;
              const pct = pctOf(r);
              return (
                <li
                  key={`${r.case_id}-${i}`}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 shadow-sm transition hover:border-slate-300 hover:shadow-md"
                >
                  <div className="min-w-0">
                    <div className="truncate font-medium text-slate-900">{title}</div>
                    <div className="text-[11px] text-slate-500">
                      {r.updated_at
                        ? new Date(r.updated_at).toLocaleString("de-DE")
                        : "Zeitpunkt unbekannt"}
                    </div>
                  </div>
                  <MiniBar pct={pct} />
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}