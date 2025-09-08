import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "M3 Vorbereitung: kompletter Guide, Checklisten & Beispiel-Dialog | ExaSim",
  description:
    "Zeitplan, häufige Themen, typische Fehler und Beispiel-Dialog. Plus: 5 kostenlose Fälle als Simulation.",
};

export default function M3VorbereitungPage() {
  return (
    <main className="p-0">
      <h1 className="mb-6 text-3xl font-semibold tracking-tight">
        Der komplette Guide zur M3-Vorbereitung
      </h1>

      <section className="mb-8">
        <h2 className="mb-2 text-xl font-semibold">
          Zeitplan: 6–8 Wochen bis zur M3
        </h2>
        <ol className="list-decimal space-y-1 pl-5 text-gray-700">
          <li>Woche 1–2: Grundlagen wiederholen und Prüfungstermine fixieren.</li>
          <li>
            Woche 3–4: Fälle nach Leitsymptom trainieren, Checklisten
            verinnerlichen.
          </li>
          <li>Woche 5–6: Prüfungsgespräche simulieren und Feedback einholen.</li>
          <li>Woche 7–8: Feinschliff, Protokolle lesen, Ruhe bewahren.</li>
        </ol>
      </section>

      <section className="mb-8">
        <h2 className="mb-2 text-xl font-semibold">
          Checklisten für Anamnese &amp; Untersuchung
        </h2>
        <ul className="list-disc space-y-1 pl-5 text-gray-700">
          <li>Anamnese: OPQRST, Vorerkrankungen, Medikamente, Allergien.</li>
          <li>
            Körperliche Untersuchung: Händedesinfektion, Inspektion, Palpation,
            Auskultation.
          </li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="mb-2 text-xl font-semibold">Häufige Prüffehler</h2>
        <ul className="list-disc space-y-1 pl-5 text-gray-700">
          <li>Unstrukturierte Anamnese ohne Zusammenfassung.</li>
          <li>Red Flags werden nicht aktiv abgefragt.</li>
          <li>Keine Laut denken bei Diagnostik und Therapie.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="mb-2 text-xl font-semibold">Beispiel-Dialog (60 Sekunden)</h2>
        <div className="rounded-xl border border-black/10 bg-white p-4 shadow-sm">
          <p className="text-sm">
            <b>Prüfer:</b> „Stellen Sie sich bitte kurz vor und beginnen Sie mit
            der Anamnese.“
          </p>
          <p className="text-sm">
            <b>Sie:</b> „Guten Tag, mein Name ist ... Wie kann ich Ihnen helfen?“
          </p>
          <p className="text-sm">
            <b>Patient:</b> „Ich habe seit gestern starke Bauchschmerzen.“
          </p>
          <p className="text-sm">
            <b>Sie:</b> „Wo genau sitzen die Schmerzen und seit wann bestehen
            sie?“
          </p>
          <p className="text-sm">
            <b>Prüfer:</b> „Welche Differenzialdiagnosen erwägen Sie?“
          </p>
          <p className="text-sm">
            <b>Sie:</b> „Appendizitis, Cholezystitis, Ileus ...“
          </p>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="mb-2 text-xl font-semibold">
          Starte jetzt mit 5 kostenlosen Fällen
        </h2>
        <p className="text-gray-700">
          Teste dein Wissen in der{" "}
          <Link href="/simulate" className="text-blue-600 hover:underline">
            interaktiven Simulation
          </Link>{" "}
          oder stöbere in der{" "}
          <Link href="/m3-faelle" className="text-blue-600 hover:underline">
            Fallbibliothek
          </Link>
          .
        </p>
      </section>
    </main>
  );
}