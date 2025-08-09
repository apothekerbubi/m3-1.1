import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-semibold mb-2">M3 Mentor (MVP)</h1>
      <p className="text-sm text-gray-600 mb-6">
        Prüfungssimulation: Prof stellt Fallfragen, bewertet sofort und gibt Tipps.
      </p>
      <div className="flex gap-3">
        <Link href="/cases" className="rounded-lg border px-4 py-2 hover:bg-gray-50">
          Zu den Fällen
        </Link>
      </div>
    </main>
  );
}