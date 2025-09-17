import Link from "next/link";
import { CASES } from "@/data/cases";

export const metadata = {
  title: "Prüfungsmodus – ExaSim",
  description:
    "Trainiere dynamische M3-Fallgespräche mit frei wählbaren Maßnahmen und unmittelbarem Tutor-Feedback.",
};

export default function PruefungOverviewPage() {
  const interactiveCases = CASES.filter((c) => c.interactive);

  return (
    <main className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Prüfungsmodus</h1>
        <p className="max-w-3xl text-sm text-gray-600">
          Spiele mündliche Prüfungssituationen Schritt für Schritt nach. Du steuerst den Ablauf, der Tutor reagiert
          ausschließlich auf deine Eingaben und nutzt nur die hinterlegten Falldaten.
        </p>
      </header>

      {interactiveCases.length === 0 ? (
        <p className="text-sm text-gray-600">Aktuell sind keine Fälle für den Prüfungsmodus verfügbar.</p>
      ) : (
        <ul className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(320px,1fr))]">
          {interactiveCases.map((c) => (
            <li key={c.id} className="rounded-2xl border border-black/10 bg-white/80 p-4 shadow-sm">
              <div className="space-y-1">
                <h2 className="text-lg font-semibold text-gray-900">{c.title}</h2>
                <p className="text-sm text-gray-600">{c.vignette}</p>
                <dl className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                  {c.leadSymptom && (
                    <div>
                      <dt className="font-medium text-gray-700">Leitsymptom</dt>
                      <dd>{c.leadSymptom}</dd>
                    </div>
                  )}
                  {c.specialty && (
                    <div>
                      <dt className="font-medium text-gray-700">Fach</dt>
                      <dd>{c.specialty}</dd>
                    </div>
                  )}
                </dl>
              </div>
              <div className="mt-4">
                <Link
                  href={`/pruefung/${c.id}`}
                  className="inline-flex items-center rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
                >
                  Fall starten
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
