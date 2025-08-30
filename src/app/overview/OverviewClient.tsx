// src/app/overview/page.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { CASES } from "@/data/cases";
import Link from "next/link";

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
        className="h-1.5 w-36 sm:w-40 shrink-0 rounded-full bg-gray-200"
        aria-label={`Fortschritt ${v}%`}
      >
        <div className="h-1.5 rounded-full bg-blue-600" style={{ width: `${v}%` }} />
      </div>
      <span className="text-[11px] tabular-nums text-gray-600">{v}%</span>
    </div>
  );
}

function OverviewSkeleton() {
  return (
    <main className="p-0 animate-pulse">
      <div className="h-8 w-48 rounded bg-gray-200 mb-4" />
      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-2xl border border-black/10 bg-white/80 p-4 shadow-sm">
          <div className="h-5 w-40 rounded bg-gray-200 mb-3" />
          <div className="h-4 w-56 rounded bg-gray-200 mb-2" />
          <div className="h-4 w-40 rounded bg-gray-200" />
        </section>
        <section className="rounded-2xl border border-black/10 bg-white/80 p-4 shadow-sm">
          <div className="h-5 w-52 rounded bg-gray-200 mb-3" />
          <div className="h-4 w-40 rounded bg-gray-200" />
        </section>
      </div>
      <section className="mt-4 rounded-2xl border border-black/10 bg-white/80 p-4 shadow-sm">
        <div className="h-5 w-56 rounded bg-gray-200 mb-3" />
        <ul className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <li
              key={i}
              className="flex items-center justify-between rounded-xl border border-black/10 bg-white/90 px-3 py-2"
            >
              <div className="h-4 w-64 rounded bg-gray-200" />
              <div className="h-3 w-40 rounded bg-gray-200" />
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
    <main className="p-0">
      {/* Überschrift wie auf „Bibliothek“ */}
      <h1 className="mb-4 text-3xl font-semibold tracking-tight">Übersicht</h1>

      <div className="grid gap-4 md:grid-cols-2">
        {/* KPI-Karte mit Progress-Bar */}
        <section className="rounded-2xl border border-black/10 bg-white/80 p-4 shadow-sm">
          <h2 className="mb-2 text-lg font-semibold">Dein Stand</h2>
          <div className="text-sm text-gray-800">
            Bearbeitete Fälle: <b>{workedCount}</b> von <b>{totalCases}</b>
          </div>
          <div className="mt-1">
            <MiniBar pct={overallPct} />
          </div>
          <div className="mt-2 text-sm text-gray-800">
            Durchschnittliche Punktzahl: <b>{avgPct}%</b>
          </div>
        </section>

        {/* Examens-Termin */}
        <section className="rounded-2xl border border-black/10 bg-white/80 p-4 shadow-sm">
          <h2 className="mb-2 text-lg font-semibold">Examens­termin</h2>
          <div className="text-sm text-gray-800">
            Datum: <b>{examDateStr}</b>
          </div>
          {daysLeft !== null && (
            <div className="text-sm text-gray-600">
              Verbleibende Tage: <b>{daysLeft}</b>
            </div>
          )}
          <div className="mt-3">
            <Link
              href="/account"
              className="inline-flex items-center rounded-md border border-black/10 bg-white px-2.5 py-1.5 text-sm text-gray-900 hover:bg-black/[.04]"
            >
              Termin bearbeiten
            </Link>
          </div>
        </section>
      </div>

      {/* Letzte bearbeitete Fälle */}
      <section className="mt-4 rounded-2xl border border-black/10 bg-white/80 p-4 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold">Letzte bearbeitete Fälle</h2>
        {recent.length === 0 ? (
          <div className="text-sm text-gray-600">Noch keine Fälle bearbeitet.</div>
        ) : (
          <ul className="space-y-2">
            {recent.map((r, i) => {
              const title = titleById.get(r.case_id) ?? r.case_id;
              const pct = pctOf(r);
              return (
                <li
                  key={`${r.case_id}-${i}`}
                  className="flex items-center justify-between gap-3 rounded-xl border border-black/10 bg-white/90 px-3 py-2"
                >
                  <div className="min-w-0">
                    <div className="truncate font-medium">{title}</div>
                    <div className="text-[11px] text-gray-600">
                      {r.updated_at
                        ? new Date(r.updated_at).toLocaleString("de-DE")
                        : "Zeitpunkt unbekannt"}
                    </div>
                  </div>
                  {/* Einheitliche Breite durch shrink-0 + feste Breite in MiniBar */}
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