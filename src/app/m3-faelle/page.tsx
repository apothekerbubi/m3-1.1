import type { Metadata } from "next";
import Link from "next/link";

// Falls du eine Domain hast, setz sie hier (für JSON-LD-URLs & Canonical)
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || ""; // z.B. "https://exasim.de"

export const metadata: Metadata = {
  title: "M3 Fälle: 100+ Fallbeispiele nach Leitsymptom | ExaSim",
  description:
    "Übe realistische M3-Fälle im Chat – mit Prüfer:in-Dialog, Pflichtbegriffen & Feedback. Starte mit 5 kostenlosen Fällen.",
  alternates: { canonical: "/m3-faelle" },
  openGraph: {
    title: "M3 Fälle: Fallbeispiele nach Leitsymptom | ExaSim",
    description:
      "Realistische Prüfungsdialoge, Pflichtbegriffe, DDx & Red Flags. 5 Fälle gratis.",
    url: SITE_URL ? `${SITE_URL}/m3-faelle` : undefined,
    type: "website",
  },
};

type CaseItem = {
  slug: string;
  name: string;
  desc: string;
  fach: "Innere" | "Chirurgie" | "Anästhesie/Intensiv" | "Neurologie" | "Notfall";
  tags: string[];
};

const CASES: CaseItem[] = [
  { slug: "akutes-abdomen", name: "Akutes Abdomen", desc: "Plötzlich starke Bauchschmerzen, Abwehrspannung, Peritonismus.", fach: "Chirurgie", tags: ["Red Flags", "Sono", "OP-Indikation"] },
  { slug: "dyspnoe", name: "Dyspnoe", desc: "Atemnot in Ruhe/Belastung – Differenzial: Asthma, COPD, Lungenembolie.", fach: "Innere", tags: ["ABCDE", "BGA", "PE-Risiko"] },
  { slug: "brustschmerz", name: "Brustschmerz", desc: "Thorakales Druckgefühl – AKS-Regelwerk & Ausschluss Differenzialdiagnosen.", fach: "Innere", tags: ["EKG", "Troponin", "MONA?"] },
  { slug: "synkope", name: "Synkope", desc: "Kurzzeitige Bewusstlosigkeit – kardial vs. vasovagal.", fach: "Innere", tags: ["Anamnese", "EKG", "RED Flags"] },
  { slug: "schlaganfall", name: "Schlaganfall", desc: "Akute fokale Neurodefizite – FAST, Thrombolyse-Fenster.", fach: "Neurologie", tags: ["CT cCT", "Stroke-Alarm", "Time is brain"] },
  { slug: "gi-blutung", name: "GI-Blutung", desc: "Hämatemesis/Melena – hämodynamisches Management zuerst.", fach: "Innere", tags: ["i.v.-Zugang", "Hb/Quick", "Endoskopie"] },
  { slug: "pneumothorax", name: "Spannungspneumothorax", desc: "Dyspnoe, gestaute Halsvenen, Hypotonie – Dekompression sofort.", fach: "Notfall", tags: ["Nadelthorako", "ABCDE", "Sono Lunge"] },
  { slug: "sepsis", name: "Sepsis", desc: "Infekt + Organdysfunktion – Bundles & frühe AB-Gabe.", fach: "Anästhesie/Intensiv", tags: ["qSOFA", "Laktat", "Antibiotika"] },
  { slug: "appendizitis", name: "Appendizitis", desc: "Rechtsunterbauchschmerz, Fieber, Loslassschmerz.", fach: "Chirurgie", tags: ["Sono", "CRP/Leuko", "OP-Aufklärung"] },
];

function jsonLdItemList() {
  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: CASES.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: SITE_URL ? `${SITE_URL}/m3-faelle/${c.slug}` : `/m3-faelle/${c.slug}`,
      name: c.name,
      description: c.desc,
    })),
  };
  return JSON.stringify(itemList);
}

function jsonLdFaq() {
  const faq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "Wie übe ich M3-Fälle am effektivsten?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Wähle ein Leitsymptom, simuliere das Gespräch im Chat, arbeite Pflichtbegriffe und Red Flags strukturiert ab und reflektiere das KI-Feedback."
        }
      },
      {
        "@type": "Question",
        "name": "Gibt es kostenlose Fälle?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Ja. Du kannst mit 5 kostenlosen Fällen starten und dir über Einladungen zusätzliche Fälle freischalten."
        }
      },
      {
        "@type": "Question",
        "name": "Sind die Inhalte examensnah?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Die Fälle orientieren sich an häufigen M3-Themen und Leitsymptomen. Offizielle IMPP-Fragen werden nicht reproduziert."
        }
      }
    ]
  };
  return JSON.stringify(faq);
}

export default function M3FaellePage() {
  // einfache Gruppierung nach Fachgebiet (für Anker-Navigation)
  const byFach = CASES.reduce<Record<string, CaseItem[]>>((acc, c) => {
    acc[c.fach] = acc[c.fach] || [];
    acc[c.fach].push(c);
    return acc;
  }, {});

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      {/* JSON-LD (ItemList + FAQ) */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdItemList() }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdFaq() }} />

      {/* Hero */}
      <header className="mb-8">
        <nav className="mb-3 text-sm text-gray-500">
          <Link href="/" className="hover:underline">Start</Link>
          <span className="mx-1">/</span>
          <span className="text-gray-700">M3-Fälle</span>
        </nav>
        <h1 className="mb-2 text-3xl font-semibold tracking-tight">
          M3-Fälle: realistische Prüfungsbeispiele
        </h1>
        <p className="max-w-2xl text-gray-700">
          Übe das mündlich-praktische Prüfungsgespräch: Leitsymptom wählen, strukturiert
          argumentieren, Pflichtbegriffe treffen, Red Flags erkennen – mit sofortigem KI-Feedback.
          Starte mit <strong>5 kostenlosen Fällen</strong>.
        </p>

        {/* Quick-Links */}
        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          <a href="#leitsymptom" className="rounded-full border px-3 py-1 hover:bg-gray-50">Nach Leitsymptom</a>
          <a href="#fachgebiet" className="rounded-full border px-3 py-1 hover:bg-gray-50">Nach Fachgebiet</a>
          <a href="#howto" className="rounded-full border px-3 py-1 hover:bg-gray-50">So trainierst du</a>
          <a href="#faq" className="rounded-full border px-3 py-1 hover:bg-gray-50">FAQ</a>
        </div>
      </header>

      {/* Nach Leitsymptom */}
      <section id="leitsymptom" className="mb-12">
        <h2 className="mb-3 text-xl font-semibold">Nach Leitsymptom</h2>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CASES.map((c) => (
            <li key={c.slug} className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
              <h3 className="font-semibold">{c.name}</h3>
              <p className="mt-1 text-sm text-gray-700">{c.desc}</p>
              {/* Chips */}
              <div className="mt-2 flex flex-wrap gap-2">
                {c.tags.slice(0, 3).map((t) => (
                  <span key={t} className="rounded-full border px-2 py-0.5 text-xs text-gray-700">{t}</span>
                ))}
              </div>
              <div className="mt-3">
                <Link
                  href={`/m3-faelle/${c.slug}`}
                  className="inline-flex items-center text-sm text-blue-600 hover:underline"
                >
                  Zum Fall
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Nach Fachgebiet */}
      <section id="fachgebiet" className="mb-12">
        <h2 className="mb-3 text-xl font-semibold">Nach Fachgebiet</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(byFach).map(([fach, items]) => (
            <div key={fach} className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
              <h3 className="mb-2 font-semibold">{fach}</h3>
              <ul className="space-y-1 text-sm">
                {items.map((c) => (
                  <li key={c.slug}>
                    <Link href={`/m3-faelle/${c.slug}`} className="text-blue-600 hover:underline">
                      {c.name}
                    </Link>
                    <span className="text-gray-500"> – {c.desc}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* How-to / Trainingshinweise */}
      <section id="howto" className="mb-12">
        <h2 className="mb-3 text-xl font-semibold">So trainierst du das Prüfungsgespräch</h2>
        <ol className="list-decimal space-y-1 pl-5 text-gray-700">
          <li>Wähle ein Leitsymptom und starte die Simulation.</li>
          <li>Strukturiere laut: Anamnese → DDx → Diagnostik → Therapieplan.</li>
          <li>Arbeite <em>Pflichtbegriffe</em> und <em>Red Flags</em> aktiv ab – nicht nur nennen, sondern begründen.</li>
          <li>Nutze das KI-Feedback, um typische Fehler zu vermeiden und deine Argumentation zu schärfen.</li>
        </ol>
        <div className="mt-4">
          <Link
            href="/m3-vorbereitung"
            className="text-blue-600 hover:underline"
          >
            Zum M3-Vorbereitungsguide
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="mb-14">
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6">
          <h3 className="text-lg font-semibold">Jetzt üben – 5 Fälle gratis</h3>
          <p className="mt-1 text-gray-700">
            Starte mit einem freien Fall, sieh sofort dein Feedback und schalte weitere Fälle im Sprint frei.
          </p>
          <div className="mt-3">
            <Link
              href="/login"
              className="inline-flex items-center rounded-full border border-blue-600 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-600 hover:text-white"
            >
              Interaktive Simulation starten
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ (sichtbar + JSON-LD oben) */}
      <section id="faq" className="mb-6">
        <h2 className="mb-3 text-xl font-semibold">FAQ</h2>
        <details className="rounded-lg border p-4">
          <summary className="cursor-pointer font-medium">Wie übe ich M3-Fälle am effektivsten?</summary>
          <p className="mt-2 text-gray-700">
            Wähle ein Leitsymptom, simuliere das Gespräch im Chat und arbeite Pflichtbegriffe/Red Flags strukturiert ab.
            Wiederhole Fälle mit Varianten, bis du flüssig argumentierst.
          </p>
        </details>
        <details className="mt-3 rounded-lg border p-4">
          <summary className="cursor-pointer font-medium">Gibt es kostenlose Fälle?</summary>
          <p className="mt-2 text-gray-700">
            Ja, du startest mit 5 kostenlosen Fällen. Über Einladungen kannst du zusätzliche Fälle freischalten.
          </p>
        </details>
        <details className="mt-3 rounded-lg border p-4">
          <summary className="cursor-pointer font-medium">Sind die Inhalte examensnah?</summary>
          <p className="mt-2 text-gray-700">
            Die Fälle sind leitsymptombasiert und decken häufige M3-Themen ab. Offizielle IMPP-Fragen werden nicht reproduziert.
          </p>
        </details>
      </section>
    </main>
  );
}