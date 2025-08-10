import Link from "next/link";

export default function NotFound() {
  return (
    <main className="p-6 text-center">
      <h1 className="text-2xl font-bold mb-4">Seite nicht gefunden</h1>
      <p className="mb-6">Die angeforderte Seite existiert nicht.</p>
      <Link
        href="/subjects/"
        className="inline-block rounded-md bg-brand-600 px-4 py-2 text-white hover:bg-brand-700"
      >
        Zur Bibliothek
      </Link>
    </main>
  );
}