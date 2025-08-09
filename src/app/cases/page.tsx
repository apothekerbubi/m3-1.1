"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { Case } from "@/lib/types";

export default function CasesPage() {
  const [cases, setCases] = useState<Case[]>([]);
  useEffect(() => { fetch("/api/cases").then(r => r.json()).then(setCases).catch(console.error); }, []);

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h2 className="text-xl font-semibold mb-4">Fälle</h2>
      <ul className="space-y-3">
        {cases.map((c) => (
          <li key={c.id} className="rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">{c.title}</h3>
                <p className="text-sm text-gray-600">
                  {c.specialty} · Schwierigkeit {c.difficulty} · {c.tags.join(", ")}
                </p>
              </div>
              <div className="flex gap-2">
                <Link href={`/cases/${c.id}`} className="rounded-md border px-3 py-1 text-sm hover:bg-gray-50">
                  Details
                </Link>
                <Link href={`/exam/${c.id}`} className="rounded-md border px-3 py-1 text-sm hover:bg-gray-50">
                  Prüfungsmodus (KI)
                </Link>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}