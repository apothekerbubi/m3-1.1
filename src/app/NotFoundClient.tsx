// src/app/NotFoundClient.tsx
"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function NotFoundClient() {
  const search = useSearchParams();
  const q = search.get("q");

  return (
    <main className="mx-auto max-w-xl p-6">
      <h1 className="text-2xl font-semibold mb-4">Seite nicht gefunden</h1>
      {q && <p className="mb-4 text-gray-600">Gesucht: {q}</p>}
      <Link
        href="/subjects"
        className="rounded-md bg-brand-600 px-4 py-2 text-white hover:bg-brand-700"
      >
        Zur Bibliothek
      </Link>
    </main>
  );
}