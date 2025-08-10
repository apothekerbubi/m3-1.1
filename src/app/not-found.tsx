// src/app/not-found.tsx
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-xl p-6">
      <h1 className="text-2xl font-semibold mb-4">Seite nicht gefunden</h1>
      <p className="mb-6 text-gray-600">
        Die angeforderte Seite existiert nicht oder wurde verschoben.
      </p>
      <Link
        href="/subjects"
        className="rounded-md bg-brand-600 px-4 py-2 text-white hover:bg-brand-700"
      >
        Zur Bibliothek
      </Link>
    </main>
  );
}