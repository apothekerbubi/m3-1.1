// src/app/cases/[id]/page.tsx
"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CASES } from "@/data/cases";
import type { Case } from "@/lib/types";
import CaseImagePublic from "@/components/CaseImagePublic"; // ✅ Bild-Komponente einbinden

type ExtendedCase = Case & {
  specialty?: string;     // Fach (legacy-kompatibel)
  subject?: string;
  subspecialty?: string;  // Subfach
  category?: string;
  difficulty?: number;
};

export default function CaseDetail() {
  const router = useRouter();
  const params = useParams<{ id: string | string[] }>();
  const rawId = params?.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;

  const c = CASES.find((x) => x.id === id) as ExtendedCase | undefined;

  if (!c) {
    return (
      <main className="mx-auto max-w-3xl p-6">
        <h2 className="mb-2 text-xl font-semibold">Fall nicht gefunden</h2>
        <Link href="/subjects" className="rounded-md border px-3 py-1 text-sm hover:bg-gray-50">
          Zur Bibliothek
        </Link>
      </main>
    );
  }

  // Anzeige-Werte defensiv
  const subject = (c.specialty ?? c.subject ?? "Allgemein").trim();
  const subspecialty = (c.subspecialty ?? c.category ?? "").trim() || null;
  const difficulty = typeof c.difficulty === "number" ? c.difficulty : null;
  const tags = Array.isArray(c.tags) ? c.tags : [];
  const steps = [...c.steps].sort((a, b) => a.order - b.order);

  // robuste Navigation (unabhängig von <Link>)
  const goStart = () => router.push(`/exam/${c.id}`);

  return (
    <main className="mx-auto max-w-3xl p-6">
      {/* Kopfzeile mit CTAs */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">{c.title}</h1>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={goStart}
            className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
          >
            Prüfung starten
          </button>
          <Link
            href="/subjects"
            className="inline-flex items-center rounded-md border border-black/10 bg-white px-4 py-2 text-sm hover:bg-black/[.04] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
          >
            Zur Übersicht
          </Link>
        </div>
      </div>

      {/* Vignette */}
      <p className="mb-4 text-sm text-gray-700">{c.vignette}</p>

      {/* Meta-Badges */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <span className="rounded-full border px-2 py-1 text-xs">
          {subject}{subspecialty ? ` · ${subspecialty}` : ""}
        </span>
        {difficulty !== null && (
          <span className="rounded-full border px-2 py-1 text-xs">Schwierigkeit {difficulty}</span>
        )}
        {tags.map((t) => (
          <span key={t} className="rounded-full border px-2 py-1 text-xs">{t}</span>
        ))}
      </div>

      {/* Schritte */}
      <section className="rounded-xl border border-black/10 bg-white/80 p-4">
        <h2 className="mb-2 font-medium">Prüfungs‑Schritte</h2>
        <ol className="list-decimal space-y-4 pl-5 text-sm">
          {steps.map((s) => (
            <li key={`${s.order}-${s.prompt}`}>
              <div className="font-medium">{s.prompt}</div>
              {s.hint && <div className="text-gray-600">– {s.hint}</div>}

              {/* ✅ Bild pro Schritt rendern, wenn vorhanden */}
              {s.image && (
                <div className="mt-2">
                  <CaseImagePublic
                    path={s.image.path}
                    alt={s.image.alt}
                    caption={s.image.caption}
                  />
                </div>
              )}
            </li>
          ))}
        </ol>
      </section>

      {/* Zweiter CTA unten */}
      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={goStart}
          className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
        >
          Prüfung starten
        </button>
        <Link
          href="/subjects"
          className="inline-flex items-center rounded-md border border-black/10 bg-white px-4 py-2 text-sm hover:bg-black/[.04] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
        >
          Zur Übersicht
        </Link>
      </div>
    </main>
  );
}