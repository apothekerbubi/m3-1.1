"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { Case } from "@/lib/types";
import { useParams } from "next/navigation";

export default function CaseDetail() {
  const { id: raw } = useParams<{ id: string | string[] }>();
  const id = Array.isArray(raw) ? raw[0] : raw;
  const [c, setC] = useState<Case | null>(null);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/cases/${id}`).then(r => r.json()).then((d) => setC(d?.error ? null : d));
  }, [id]);

  if (!c) return <main className="mx-auto max-w-3xl p-6">Fall nicht gefunden.</main>;

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h2 className="text-xl font-semibold mb-2">{c.title}</h2>
      <p className="text-sm text-gray-600 mb-4">{c.vignette}</p>
      <div className="mb-6">
        <span className="text-xs rounded-full border px-2 py-1 mr-2">{c.specialty}</span>
        <span className="text-xs rounded-full border px-2 py-1 mr-2">Schwierigkeit {c.difficulty}</span>
        {c.tags.map((t) => (
          <span key={t} className="text-xs rounded-full border px-2 py-1 mr-2">{t}</span>
        ))}
      </div>
      <div className="flex gap-2">
        <Link href={`/exam/${c.id}`} className="rounded-lg border px-4 py-2 hover:bg-gray-50">
          Prüfungsmodus (KI)
        </Link>
      </div>
    </main>
  );
}