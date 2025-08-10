// src/app/not-found.tsx
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="p-6 text-center">
      <h1 className="text-2xl font-bold mb-2">Seite nicht gefunden</h1>
      <p className="text-sm text-gray-600 mb-6">
        Die angeforderte Seite existiert nicht oder wurde verschoben.
      </p>
      <Link
        href="/subjects"
        className="inline-block rounded-md bg-brand-600 px-4 py-2 text-white hover:bg-brand-700"
      >
        Zur Bibliothek
      </Link>
    </main>
  );
}