// src/app/not-found.tsx
export default function NotFound() {
  return (
    <main className="mx-auto max-w-screen-md p-6">
      <h1 className="text-2xl font-semibold">Seite nicht gefunden</h1>
      <p className="mt-2 text-sm text-gray-600">
        Ups – die angeforderte Seite gibt’s hier nicht.
      </p>
      <a
        href="/subjects"
        className="mt-4 inline-block rounded-md border px-3 py-1.5 text-sm hover:bg-black/[.04]"
      >
        Zur Bibliothek
      </a>
    </main>
  );
}