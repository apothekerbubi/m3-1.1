import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-24 gap-24">
      <section className="text-center max-w-2xl space-y-6">
        <h1 className="text-5xl font-bold">ExaSim neu erleben</h1>
        <p className="text-xl text-slate-600">
          Moderne Vorbereitung mit Fokus auf das Wesentliche.
        </p>
        <div className="flex justify-center gap-4">
          <Link href="#" role="button">
            Jetzt starten
          </Link>
          <Link href="#" role="button">
            Mehr erfahren
          </Link>
        </div>
      </section>

      <section className="grid w-full max-w-5xl gap-6 md:grid-cols-3">
        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="mb-2 text-lg font-semibold">Realistische Fälle</h3>
          <p className="text-slate-600 text-sm">
            Dummy-Inhalt: Beschreibe hier das herausragende Feature.
          </p>
        </div>
        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="mb-2 text-lg font-semibold">Intuitive Oberfläche</h3>
          <p className="text-slate-600 text-sm">
            Dummy-Inhalt: Moderne UI für effizientes Lernen.
          </p>
        </div>
        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="mb-2 text-lg font-semibold">Individuelle Auswertung</h3>
          <p className="text-slate-600 text-sm">
            Dummy-Inhalt: Fortschritt auf einen Blick.
          </p>
        </div>
      </section>
    </div>
  );
}