// src/app/exam/summary/SummaryClient.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import ProgressBar from "@/components/ProgressBar";
import ScorePill from "@/components/ScorePill";
import { requireBrowserSupabase } from "@/lib/supabase/client";

type SeriesResultRow = {
  title: string;
  subject: string | null;
  category: string | null;
  score: number;
  maxScore: number;
  pct: number;
  completed: boolean;
};

type SeriesStore = {
  seriesId: string;
  startedAt?: string | null;
  endedAt?: string | null;
  caseIds?: string[];
  results?: Record<string, SeriesResultRow>;
};

export default function SummaryClient() {
  const params = useSearchParams();
  const sid = params.get("sid");
  const [data, setData] = useState<SeriesStore | null>(null);

  // 🔹 Lokal laden
  useEffect(() => {
    if (!sid || typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(`series:${sid}`);
      setData(raw ? (JSON.parse(raw) as SeriesStore) : null);
    } catch {
      setData(null);
    }
  }, [sid]);

  const flat = useMemo(() => {
    const arr: Array<{ caseId: string } & SeriesResultRow> = data?.results
      ? Object.entries(data.results).map(([caseId, r]) => ({ caseId, ...r }))
      : [];
    const totalScore = arr.reduce((a, r) => a + (r.score || 0), 0);
    const totalMax = arr.reduce((a, r) => a + (r.maxScore || 0), 0);

    const bySubject = new Map<string, { score: number; max: number; count: number }>();
    for (const r of arr) {
      const key = r.subject || "Unbekannt";
      const prev = bySubject.get(key) || { score: 0, max: 0, count: 0 };
      bySubject.set(key, {
        score: prev.score + r.score,
        max: prev.max + r.maxScore,
        count: prev.count + 1,
      });
    }
    const subjectRows = [...bySubject.entries()].map(([subject, o]) => ({
      subject,
      pct: o.max > 0 ? Math.round((o.score / o.max) * 100) : 0,
      score: o.score,
      max: o.max,
      count: o.count,
    }));
    subjectRows.sort((a, b) => b.pct - a.pct);

    const best = subjectRows[0];
    const worst = subjectRows[subjectRows.length - 1];

    return { arr, totalScore, totalMax, subjectRows, best, worst };
  }, [data]);

  // 🔹 Supabase speichern (nur Summary)
  useEffect(() => {
    if (!sid || !data) return;
    const supabase = requireBrowserSupabase();

    async function saveSeries() {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user) {
        console.warn("⚠️ Kein eingeloggter User – wird nicht gespeichert.");
        return;
      }

      const { error } = await supabase.from("series_results").upsert({
  user_id: userData.user.id,
  series_id: sid,
  total_score: flat.totalScore,
  total_max: flat.totalMax,
  started_at: data?.startedAt ?? new Date().toISOString(),
  ended_at: data?.endedAt ?? new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

      if (error) {
        console.error("❌ Fehler beim Speichern in series_results:", error);
      } else {
        console.log("✅ Simulationsergebnis gespeichert");
      }
    }

    saveSeries();
  }, [sid, data, flat]);

  // 🔹 Fallbacks
  if (!sid) {
    return (
      <main className="mx-auto max-w-3xl p-6">
        <h1 className="text-2xl font-semibold mb-2">Keine Serie gefunden</h1>
        <p className="text-sm text-gray-600">
          Es fehlt die Serien-ID (<code>sid</code>).
        </p>
        <Link href="/simulate" className="mt-3 inline-block rounded-md bg-blue-600 px-3 py-2 text-sm text-white">
          Neue Simulation starten
        </Link>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="mx-auto max-w-3xl p-6">
        <h1 className="text-2xl font-semibold mb-2">Ergebnis nicht verfügbar</h1>
        <p className="text-sm text-gray-600">Für diese Serie konnten keine Daten geladen werden.</p>
        <Link href="/simulate" className="mt-3 inline-block rounded-md bg-blue-600 px-3 py-2 text-sm text-white">
          Neue Simulation starten
        </Link>
      </main>
    );
  }

  // 🔹 Anzeige
  const totalPct = flat.totalMax > 0 ? Math.round((flat.totalScore / flat.totalMax) * 100) : 0;
  const improvements = flat.subjectRows.filter((r) => r.pct < 75).map((r) => r.subject);
  const badge =
    totalPct >= 90 ? "🥇 Exzellent" :
    totalPct >= 75 ? "🥈 Stark" :
    totalPct >= 60 ? "🥉 Solide" :
    "🚀 Auf Kurs";

  return (
    <main className="min-h-screen bg-slate-50 py-10 text-slate-900">
      <div className="mx-auto max-w-5xl px-6">
        <header className="relative mb-12 overflow-hidden rounded-3xl bg-gradient-to-br from-sky-500 via-indigo-500 to-fuchsia-500 p-[1px] shadow-2xl">
          <div className="rounded-[calc(1.5rem-1px)] bg-white/95 px-6 py-8 sm:px-10 sm:py-10">
            <span className="inline-flex items-center justify-center rounded-full border border-white/60 bg-white/80 px-4 py-1 text-xs font-semibold uppercase tracking-[0.4em] text-slate-500">
              Simulationsergebnis
            </span>
            <div className="mt-6 flex flex-wrap items-center gap-4 text-slate-900">
              <h1 className="text-3xl font-semibold tracking-tight">Dein Simulationsergebnis</h1>
              <ScorePill pct={totalPct} last={null} detail={`${flat.totalScore}/${flat.totalMax}`} />
              <span className="ml-auto inline-flex items-center rounded-full bg-slate-900/90 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white shadow-lg">
                {badge}
              </span>
            </div>
            <p className="mt-4 text-sm text-slate-600">
              Übersicht über deine komplette Examenssimulation mit Stärken, Schwächen und Empfehlungen.
            </p>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-white/60 bg-white/70 p-4 text-sm text-slate-700 shadow-lg shadow-sky-100/40 backdrop-blur">
                <div className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Gesamt-Score</div>
                <div className="mt-2 text-3xl font-semibold text-slate-900">{totalPct}%</div>
                <div className="text-xs text-slate-500">{flat.totalScore}/{flat.totalMax} Punkte</div>
              </div>
              <div className="rounded-2xl border border-white/60 bg-white/70 p-4 text-sm text-slate-700 shadow-lg shadow-indigo-100/40 backdrop-blur">
                <div className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Serie gestartet</div>
                <div className="mt-2 text-base text-slate-900">
                  {data.startedAt ? new Date(data.startedAt).toLocaleString("de-DE") : "–"}
                </div>
              </div>
              <div className="rounded-2xl border border-white/60 bg-white/70 p-4 text-sm text-slate-700 shadow-lg shadow-fuchsia-100/40 backdrop-blur">
                <div className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Serie beendet</div>
                <div className="mt-2 text-base text-slate-900">
                  {data.endedAt ? new Date(data.endedAt).toLocaleString("de-DE") : "–"}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* KPI-Reihe */}
        <div className="grid gap-5 md:grid-cols-3">
          {/* Gesamtleistung */}
          <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-lg shadow-sky-100/40">
            <h2 className="text-sm font-semibold text-slate-700">Gesamtleistung</h2>
            <div className="mt-2 text-sm text-slate-800">
              Score: <b>{totalPct}%</b>
              <span className="text-xs text-slate-500"> ({flat.totalScore}/{flat.totalMax})</span>
            </div>
            <div className="mt-3">
              <ProgressBar value={totalPct} />
              <div className="mt-1 text-xs text-slate-600">{totalPct}%</div>
            </div>
            <div className="mt-3 text-xs text-slate-500">
              {data.startedAt ? `Gestartet: ${new Date(data.startedAt).toLocaleString("de-DE")}` : ""}
              {data.endedAt ? ` • Beendet: ${new Date(data.endedAt).toLocaleString("de-DE")}` : ""}
            </div>
          </section>

          {/* Bester Bereich */}
          <section className="rounded-2xl border border-emerald-200/80 bg-emerald-50 p-5 shadow-lg shadow-emerald-200/40">
            <h2 className="text-sm font-semibold text-emerald-800">Stärkster Bereich</h2>
            {flat.best ? (
              <>
                <div className="mt-2 text-sm text-emerald-900">
                  <b>{flat.best.subject}</b>
                </div>
                <div className="mt-2">
                  <ProgressBar value={flat.best.pct} />
                  <div className="mt-1 text-xs text-emerald-800/80">
                    {flat.best.pct}% • {flat.best.score}/{flat.best.max}
                  </div>
                </div>
              </>
            ) : (
              <div className="mt-2 text-sm text-emerald-800/80">Noch keine Daten</div>
            )}
          </section>

          {/* Schwächster Bereich */}
          <section className="rounded-2xl border border-amber-200/80 bg-amber-50 p-5 shadow-lg shadow-amber-200/50">
            <h2 className="text-sm font-semibold text-amber-900">Verbesserungspotenzial</h2>
            {flat.worst ? (
              <>
                <div className="mt-2 text-sm text-amber-900">
                  <b>{flat.worst.subject}</b>
                </div>
                <div className="mt-2">
                  <ProgressBar value={flat.worst.pct} />
                  <div className="mt-1 text-xs text-amber-900/80">
                    {flat.worst.pct}% • {flat.worst.score}/{flat.worst.max}
                  </div>
                </div>
              </>
            ) : (
              <div className="mt-2 text-sm text-amber-900/70">Noch keine Daten</div>
            )}
          </section>
        </div>

        {/* Empfehlungen */}
        <section className="mt-8 rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-xl shadow-slate-200/60">
          <h2 className="mb-3 text-lg font-semibold text-slate-900">Empfehlungen</h2>
          {improvements.length === 0 ? (
            <div className="text-sm text-slate-600">
              Stark! Keine offensichtlichen Schwächen. Nimm dir Zeit für Feinschliff oder simuliere erneut.
            </div>
          ) : (
            <ul className="space-y-2 text-sm text-slate-700">
              {improvements.map((s) => (
                <li
                  key={s}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 shadow-inner"
                >
                  Mehr Training in <b>{s}</b> – starte dort gezielt neue Fälle.
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Fälle */}
        <section className="mt-8 rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-xl shadow-slate-200/60">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Fälle dieser Simulation</h2>
          {flat.arr.length === 0 ? (
            <div className="text-sm text-slate-600">Keine Fälle gefunden.</div>
          ) : (
            <ul className="space-y-3">
              {flat.arr.map((r) => (
                <li
                  key={r.caseId}
                  className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 shadow-inner sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="truncate text-base font-medium text-slate-900">{r.title}</div>
                    <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500">
                      {(r.subject || "Fach")} · {(r.category || "Kategorie")}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-3">
                    <div className="w-40">
                      <ProgressBar value={r.pct} />
                    </div>
                    <div className="w-10 text-right text-[11px] font-semibold text-slate-600">{r.pct}%</div>
                    <Link
                      href={`/exam/${r.caseId}`}
                      className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-700"
                      title="Diesen Fall erneut üben"
                    >
                      Wiederholen
                    </Link>
                    <Link
                      href={`/cases/${r.caseId}`}
                      className="hidden rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-white sm:inline-flex sm:items-center sm:gap-1"
                    >
                      Details
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Actions */}
        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href="/simulate"
            className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-sky-500 via-indigo-500 to-fuchsia-500 px-5 py-2 text-sm font-semibold text-white shadow-lg transition hover:from-sky-400 hover:via-indigo-500 hover:to-fuchsia-600"
          >
            Neue Simulation zusammenstellen
          </Link>
          <Link
            href="/subjects"
            className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Zur Bibliothek
          </Link>
          <button
            className="ml-auto inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            onClick={() => {
              if (!sid) return;
              localStorage.removeItem(`series:${sid}`);
              location.reload();
            }}
          >
            Ergebnis zurücksetzen
          </button>
        </div>
      </div>
    </main>
  );
}