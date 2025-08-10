"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { CASES } from "@/data/cases";
import type { Case } from "@/lib/types";

type ExtendedCase = Case & {
  // einige Fälle benutzen andere Feldnamen – optional erlauben
  specialty?: string;
  subject?: string;
  subspecialty?: string;
  category?: string;
  difficulty?: number;
};

export default function CaseDetail() {
  const params = useParams<{ id: string | string[] }>();
  const rawId = params?.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;

  const c = CASES.find((x) => x.id === id) as ExtendedCase | undefined;

  if (!c) {
    return (
      <main className="mx-auto max-w-3xl p-6">
        <h2 className="text-xl font-semibold mb-2">Fall nicht gefunden</h2>
        <Link href="/cases" className="rounded-md border px-3 py-1 text-sm hover:bg-gray-50">
          Zur Fallliste
        </Link>
      </main>
    );
  }

  // Anzeige-Werte defensiv bestimmen – ohne any
  const subject = c.specialty ?? c.subject ?? "Allgemein";
  const subspecialty = c.subspecialty ?? c.category ?? null;
  const difficulty = typeof c.difficulty === "number" ? c.difficulty : null;
  const tags = Array.isArray(c.tags) ? c.tags : [];

  const steps = [...c.steps].sort((a, b) => a.order - b.order);

  return (
    <main className="mx-auto max-w-3xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">{c.title}</h1>
        <div className="flex gap-2">
          <Link
            href={`/exam/${c.id}`}
            className="rounded-md bg-brand-600 px-3 py-1.5 text-sm text-white hover:bg-brand-700"
          >
            Prüfungsmodus
          </Link>
          <Link
            href="/cases"
            className="rounded-md border px-3 py-1.5 text-sm hover:bg-black/[.04]"
          >
            Zur Übersicht
          </Link>
        </div>
      </div>

      <p className="text-sm text-gray-700 mb-4">{c.vignette}</p>

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <span className="text-xs rounded-full border px-2 py-1">
          {subject}
          {subspecialty ? ` · ${subspecialty}` : ""}
        </span>
        {difficulty !== null && (
          <span className="text-xs rounded-full border px-2 py-1">
            Schwierigkeit {difficulty}
          </span>
        )}
        {tags.map((t) => (
          <span key={t} className="text-xs rounded-full border px-2 py-1">
            {t}
          </span>
        ))}
      </div>

      <section className="rounded-xl border border-black/10 bg-white/80 p-4">
        <h2 className="font-medium mb-2">Prüfungs-Schritte</h2>
        <ol className="list-decimal pl-5 space-y-1 text-sm">
          {steps.map((s) => (
            <li key={`${s.order}-${s.prompt}`}>
              <span className="font-medium">{s.prompt}</span>
              {s.hint && <span className="text-gray-600"> – {s.hint}</span>}
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}