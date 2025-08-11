// src/app/not-found.tsx
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-semibold tracking-tight mb-2">Seite nicht gefunden</h1>
      <p className="text-sm text-gray-600 mb-4">
        Die angeforderte Seite existiert nicht oder wurde verschoben.
      </p>
      <div className="flex gap-2">
        <Link
          href="/subjects"
          className="rounded-md border px-3 py-2 text-sm hover:bg-black/[.04]"
        >
          Zur Bibliothek
        </Link>
        <Link
          href="/"
          className="rounded-md bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700"
        >
          Startseite
        </Link>
      </div>
    </main>
  );
}