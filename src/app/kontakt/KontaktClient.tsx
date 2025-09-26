import PageHero from "@/components/PageHero";

export const metadata = {
  title: "Kontakt",
};

export default function KontaktPage() {
  return (
    <main className="space-y-12">
      <PageHero
        badge="Kontakt"
        title="Wir freuen uns über deine Nachricht."
        description="Erreiche uns für Support, Feedback oder rechtliche Anliegen über die folgenden Kanäle."
        bullets={[
          { text: "Antwort innerhalb von 48 Stunden", colorClass: "bg-emerald-300" },
          { text: "Direkter Draht zum ExaSim-Team", colorClass: "bg-sky-300" },
        ]}
      />

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold tracking-tight text-slate-900">ExaSim GmbH</h2>
        <p className="mt-2 text-sm text-slate-600">
          Donaublick 12<br />
          94575 Windorf
        </p>

        <div className="mt-4 text-sm text-slate-700">
          E-Mail:{" "}
          <a className="font-medium text-slate-900 underline" href="mailto:webmaster@exasim.de">
            webmaster@exasim.de
          </a>
        </div>

        <p className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
          Bitte nutze diese E-Mail-Adresse für Support, Feedback oder rechtliche Anliegen. Wir melden uns so schnell wie möglich bei dir.
        </p>
      </section>
    </main>
  );
}