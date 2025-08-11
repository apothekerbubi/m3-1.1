// src/app/not-found.tsx
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-semibold tracking-tight">Seite nicht gefunden</h1>
      <p className="mt-2 text-sm text-gray-600">
        Die angeforderte Seite existiert nicht oder wurde verschoben.
      </p>
      <div className="mt-4 flex gap-2">
        <Link href="/subjects" className="rounded-md border px-3 py-2 text-sm hover:bg-black/[.04]">
          Zur Bibliothek
        </Link>
        <Link href="/" className="rounded-md border px-3 py-2 text-sm hover:bg-black/[.04]">
          Startseite
        </Link>
      </div>
    </main>
  );
}