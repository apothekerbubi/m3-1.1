import Link from "next/link";
import { Suspense } from "react";
import NotFoundClient from "./NotFoundClient";

export default function NotFoundPage() {
  return (
    <main className="mx-auto max-w-xl p-6">
      <h1 className="mb-2 text-2xl font-semibold">Seite nicht gefunden</h1>
      <p className="mb-4 text-sm text-gray-600">
        Uff — die Seite gibt’s nicht. Vielleicht suchst du einen Fall?
      </p>

      {/* 👉 alles, was useSearchParams/usePathname nutzt, hier rein */}
      <Suspense fallback={null}>
        <NotFoundClient />
      </Suspense>

      <div className="mt-6">
        <Link
          href="/subjects"
          className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm hover:bg-black/[.04]"
        >
          Zur Bibliothek
        </Link>
      </div>
    </main>
  );
}