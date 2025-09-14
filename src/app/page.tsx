import Link from "next/link";

export default function Home() {
  return (
    <main className="relative overflow-hidden bg-gradient-to-b from-[#0f1524] via-[#152033] to-[#1c2640] text-white">
      <section className="mx-auto max-w-4xl px-6 py-32 text-center">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Bereit fürs M3 – mit ExaSim
        </h1>
        <p className="mt-4 text-lg text-gray-300">
          Prüfungsnahe Fälle und Simulationen für eine moderne Vorbereitung.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link
            href="/register"
            className="rounded-md bg-blue-600 px-6 py-3 font-semibold text-white shadow hover:bg-blue-500"
          >
            Jetzt starten
          </Link>
          <Link
            href="/subjects"
            className="rounded-md border border-white/20 px-6 py-3 font-semibold text-white hover:bg-white/10"
          >
            Mehr erfahren
          </Link>
        </div>
      </section>
    </main>
  );
}

