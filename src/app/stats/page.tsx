"use client";
import Link from "next/link";
import { listAttempts } from "@/lib/storage";

export default function StatsPage() {
  const attempts = listAttempts();
  const byCase = attempts.reduce<Record<string, { title: string; tries: number; best: number }>>((acc, a) => {
    const cur = acc[a.caseId] ?? { title: a.caseTitle, tries: 0, best: 0 };
    cur.tries += 1;
    cur.best = Math.max(cur.best, a.result.total);
    acc[a.caseId] = cur;
    return acc;
  }, {});

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h2 className="text-xl font-semibold mb-4">Statistik</h2>
      <ul className="space-y-2">
        {Object.entries(byCase).map(([caseId, s]) => (
          <li key={caseId} className="rounded-md border p-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{s.title}</div>
                <div className="text-sm text-gray-600">{s.tries} Versuche · Bestscore {s.best}</div>
              </div>
              <Link href={`/simulate/${caseId}`} className="rounded-md border px-3 py-1 text-sm hover:bg-gray-50">
                Üben
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}