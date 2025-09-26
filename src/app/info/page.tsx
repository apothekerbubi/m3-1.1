import Link from "next/link";
import PageHero from "@/components/PageHero";

const LINKS = [
  {
    title: "Kontakt",
    description: "Schreibe uns bei Fragen oder Feedback rund um ExaSim.",
    href: "/kontakt",
  },
  {
    title: "Impressum",
    description: "Rechtliche Angaben und Verantwortlichkeiten im Überblick.",
    href: "/impressum",
  },
  {
    title: "Datenschutz",
    description: "Alles zu unserem Umgang mit personenbezogenen Daten.",
    href: "/datenschutz",
  },
  {
    title: "AGB",
    description: "Allgemeine Geschäftsbedingungen von ExaSim.",
    href: "/agb",
  },
  {
    title: "Widerruf",
    description: "Informationen zu deinem Widerrufsrecht.",
    href: "/widerruf",
  },
  {
    title: "Haftungsbeschränkung",
    description: "Hinweise zur Haftung für Inhalte und Links.",
    href: "/haftung",
  },
];

export default function InfoPage() {
  return (
    <main className="space-y-12">
      <PageHero
        badge="Info"
        title="Alle rechtlichen Hinweise & Kontaktoptionen an einem Ort."
        description="Hier findest du Kontaktdaten, Impressum, Datenschutz und weitere Pflichtangaben zu ExaSim."
        bullets={[
          { text: "Schneller Zugriff auf alle Dokumente", colorClass: "bg-sky-300" },
          { text: "Transparente Informationen für dich", colorClass: "bg-emerald-300" },
        ]}
      />

      <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-slate-300 hover:shadow-md"
          >
            <div className="absolute -top-16 -right-12 h-32 w-32 rounded-full bg-slate-100 blur-3xl" />
            <div className="relative z-10 space-y-3">
              <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
                {link.title}
              </span>
              <h3 className="text-lg font-semibold tracking-tight text-slate-900">{link.title}</h3>
              <p className="text-sm text-slate-600">{link.description}</p>
              <span className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                Mehr erfahren
                <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
              </span>
            </div>
          </Link>
        ))}
      </section>
    </main>
  );
}