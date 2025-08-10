"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { FolderIcon } from "@heroicons/react/24/outline";
import type { Case } from "@/lib/types";
import Badge from "@/components/Badge";

// Hilfsfunktionen
const uniq = (arr: string[]) => [...new Set(arr)].filter(Boolean);
const byAlpha = (a: string, b: string) => a.localeCompare(b, "de");

function SectionCard(props: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl bg-white border border-black/10 shadow-sm overflow-hidden">
      <header className="px-5 py-4">
        <h2 className="text-2xl font-semibold tracking-tight">{props.title}</h2>
      </header>
      <div className="divide-y divide-black/5">{props.children}</div>
    </section>
  );
}

function Row({
  label,
  selected,
  count,
  onClick,
}: {
  label: string;
  selected?: boolean;
  count?: number;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "w-full group flex items-center gap-3 px-5 py-4 text-left transition-colors",
        selected ? "bg-black/[.035]" : "hover:bg-black/[.03] focus:bg-black/[.045]",
      ].join(" ")}
    >
      <div
        className={[
          "shrink-0 rounded-lg border border-black/10 bg-white p-2",
          selected ? "text-gray-800" : "text-gray-500 group-hover:text-gray-700",
        ].join(" ")}
      >
        <FolderIcon className="h-5 w-5" />
      </div>
      <span className="text-[15px] leading-6 text-gray-800">{label}</span>
      {typeof count === "number" && (
        <span className="ml-auto inline-flex items-center rounded-full border border-black/10 bg-black/[.04] px-2 py-0.5 text-xs text-gray-600">
          {count}
        </span>
      )}
    </button>
  );
}

export default function SubjectsExplorer({ cases }: { cases: Case[] }) {
  // verfügbare Fächer + Kategorien aus Daten ableiten
  const subjects = useMemo(() => uniq(cases.map((c) => String((c as any).subject || ""))).sort(byAlpha), [cases]);

  // schöner Default: „Innere Medizin“ falls vorhanden, sonst erstes
  const defaultSubject = subjects.includes("Innere Medizin") ? "Innere Medizin" : subjects[0];

  const [subject, setSubject] = useState<string>(defaultSubject);
  const categories = useMemo(
    () =>
      uniq(
        cases
          .filter((c) => (c as any).subject === subject)
          .map((c) => String((c as any).category || ""))
      ).sort(byAlpha),
    [cases, subject]
  );

  const [category, setCategory] = useState<string>(categories[0]);

  // wenn Fach wechselt → erste Kategorie wählen
  useEffect(() => {
    setCategory(categories[0]);
  }, [categories]);

  // Zähler
  const countsBySubject = useMemo(() => {
    const acc: Record<string, number> = {};
    for (const c of cases) {
      const s = String((c as any).subject || "");
      if (!s) continue;
      acc[s] = (acc[s] || 0) + 1;
    }
    return acc;
  }, [cases]);

  const countsByCat = useMemo(() => {
    const acc: Record<string, number> = {};
    for (const c of cases) {
      const s = String((c as any).subject || "");
      const k = String((c as any).category || "");
      if (!s || !k) continue;
      acc[`${s}__${k}`] = (acc[`${s}__${k}`] || 0) + 1;
    }
    return acc;
  }, [cases]);

  // Fälle für rechte Spalte
  const visibleCases = useMemo(
    () => cases.filter((c) => (c as any).subject === subject && (c as any).category === category),
    [cases, subject, category]
  );

  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {/* Spalte 1: Fächer */}
      <SectionCard title="Fächer">
        {subjects.map((s) => (
          <Row
            key={s}
            label={s}
            count={countsBySubject[s] || 0}
            selected={subject === s}
            onClick={() => setSubject(s)}
          />
        ))}
      </SectionCard>

      {/* Spalte 2: Kategorien im gewählten Fach */}
      <SectionCard title={subject || "Unterfächer"}>
        {categories.length === 0 ? (
          <div className="px-5 py-4 text-sm text-gray-600">Keine Unterfächer vorhanden.</div>
        ) : (
          categories.map((cat) => (
            <Row
              key={cat}
              label={cat}
              count={countsByCat[`${subject}__${cat}`] || 0}
              selected={category === cat}
              onClick={() => setCategory(cat)}
            />
          ))
        )}
      </SectionCard>

      {/* Spalte 3: Fälle in der gewählten Kategorie */}
      <SectionCard title={category || "Fälle"}>
        {visibleCases.length === 0 ? (
          <div className="px-5 py-4 text-sm text-gray-600">Keine Fälle in dieser Kategorie.</div>
        ) : (
          <ul className="p-4 grid gap-4">
            {visibleCases.map((c) => (
              <li
                key={c.id}
                className="rounded-xl bg-[var(--panel)] border border-black/5 shadow-card p-4 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-medium leading-tight">{c.title}</h3>
                    <p className="mt-1 line-clamp-2 text-sm text-gray-600">{c.vignette}</p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {"difficulty" in c && typeof (c as any).difficulty !== "undefined" && (
                    <Badge>Schwierigkeit {(c as any).difficulty}</Badge>
                  )}
                  {c.tags?.map((t) => (
                    <Badge key={t}>{t}</Badge>
                  ))}
                </div>
                <div className="mt-4 flex gap-2">
                  <Link
                    href={`/cases/${c.id}`}
                    className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm hover:bg-black/[.04]"
                  >
                    Details
                  </Link>
                  <Link
                    href={`/exam/${c.id}`}
                    className="inline-flex items-center gap-1 rounded-md bg-brand-600 px-3 py-1.5 text-sm text-white hover:bg-brand-700"
                  >
                    Prüfungsmodus
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}