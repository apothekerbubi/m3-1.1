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
    <main className="mx-auto max-w-5xl p-6">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Dein Simulationsergebnis</h1>
         <ScorePill pct={totalPct} last={null} detail={`${flat.totalScore}/${flat.totalMax}`} />
        <span className="ml-auto rounded-full border px-2.5 py-1 text-xs">{badge}</span>
      </div>

      {/* KPI-Reihe */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Gesamtleistung */}
        <section className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700">Gesamtleistung</h2>
          <div className="mt-2 text-sm text-gray-800">
             Score: <b>{totalPct}%</b>
            <span className="text-xs text-gray-500"> ({flat.totalScore}/{flat.totalMax})</span>
          </div>
          <div className="mt-2">
            <ProgressBar value={totalPct} />
            <div className="mt-1 text-xs text-gray-600">{totalPct}%</div>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            {data.startedAt ? `Gestartet: ${new Date(data.startedAt).toLocaleString("de-DE")}` : ""}
            {data.endedAt ? ` • Beendet: ${new Date(data.endedAt).toLocaleString("de-DE")}` : ""}
          </div>
        </section>

        {/* Bester Bereich */}
        <section className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700">Stärkster Bereich</h2>
          {flat.best ? (
            <>
              <div className="mt-2 text-sm">
                <b>{flat.best.subject}</b>
              </div>
              <div className="mt-2">
                <ProgressBar value={flat.best.pct} />
                <div className="mt-1 text-xs text-gray-600">
                  {flat.best.pct}% • {flat.best.score}/{flat.best.max}
                </div>
              </div>
            </>
          ) : (
            <div className="text-sm text-gray-600 mt-2">Noch keine Daten</div>
          )}
        </section>

        {/* Schwächster Bereich */}
        <section className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700">Verbesserungspotenzial</h2>
          {flat.worst ? (
            <>
              <div className="mt-2 text-sm">
                <b>{flat.worst.subject}</b>
              </div>
              <div className="mt-2">
                <ProgressBar value={flat.worst.pct} />
                <div className="mt-1 text-xs text-gray-600">
                  {flat.worst.pct}% • {flat.worst.score}/{flat.worst.max}
                </div>
              </div>
            </>
          ) : (
            <div className="text-sm text-gray-600 mt-2">Noch keine Daten</div>
          )}
        </section>
      </div>

      {/* Empfehlungen */}
      <section className="mt-4 rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
        <h2 className="mb-2 text-lg font-semibold">Empfehlungen</h2>
        {improvements.length === 0 ? (
          <div className="text-sm text-gray-600">
            Stark! Keine offensichtlichen Schwächen. Nimm dir Zeit für Feinschliff oder simuliere erneut.
          </div>
        ) : (
          <ul className="list-disc pl-5 text-sm text-gray-700">
            {improvements.map((s) => (
              <li key={s}>
                Mehr Training in <b>{s}</b> – starte dort gezielt neue Fälle.
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Fälle */}
<section className="mt-4 rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
  <h2 className="mb-3 text-lg font-semibold">Fälle dieser Simulation</h2>
  {flat.arr.length === 0 ? (
    <div className="text-sm text-gray-600">Keine Fälle gefunden.</div>
  ) : (
    <ul className="space-y-2">
      {flat.arr.map((r) => (
        <li
          key={r.caseId}
          className="flex items-center justify-between gap-3 rounded-xl border border-black/10 bg-white/80 px-3 py-2"
        >
          <div className="min-w-0">
            <div className="truncate font-medium">{r.title}</div>
            <div className="text-[11px] text-gray-600">
              {(r.subject || "Fach")} · {(r.category || "Kategorie")}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <div className="w-40">
              <ProgressBar value={r.pct} />
            </div>
            <div className="text-[11px] text-gray-600 w-10 text-right">
              {r.pct}%
            </div>
            <Link
              href={`/exam/${r.caseId}`}
              className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-2.5 py-1.5 text-sm text-white hover:bg-blue-700"
              title="Diesen Fall erneut üben"
            >
              Wiederholen
            </Link>
            <Link
              href={`/cases/${r.caseId}`}
              className="hidden sm:inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs hover:bg-black/[.04]"
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
      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href="/simulate"
          className="rounded-md bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700"
        >
          Neue Simulation zusammenstellen
        </Link>
        <Link
          href="/subjects"
          className="rounded-md border px-3 py-2 text-sm hover:bg-black/[.04]"
        >
          Zur Bibliothek
        </Link>
        <button
          className="ml-auto rounded-md border px-3 py-2 text-sm hover:bg-black/[.04]"
          onClick={() => {
            if (!sid) return;
            localStorage.removeItem(`series:${sid}`);
            location.reload();
          }}
        >
          Ergebnis zurücksetzen
        </button>
      </div>
    </main>
  );
}