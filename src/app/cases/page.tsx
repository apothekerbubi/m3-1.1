"use client";

import { useEffect, useState } from "react";
import type { Case } from "@/lib/types";
import CaseMiniCard from "@/components/CaseMiniCard";

export default function CasesPage() {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/cases");
        const data = (await r.json()) as Case[];
        setCases(data);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <main className="p-0">
      <h1 className="text-2xl font-semibold tracking-tight mb-4">Fälle</h1>

      {loading ? (
        <div className="text-sm text-gray-600">Lade…</div>
      ) : (
        <ul className="space-y-3">
          {cases.map((c) => <CaseMiniCard key={c.id} c={c} />)}
        </ul>
      )}
    </main>
  );
}