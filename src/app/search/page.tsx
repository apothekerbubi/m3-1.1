"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import type { Case } from "@/lib/types";
import { MagnifyingGlassIcon, ArrowRightIcon } from "@heroicons/react/24/outline";
import Badge from "@/components/Badge";

export default function SearchPage() {
  const search = useSearchParams();
  const router = useRouter();
  const initial = search.get("q") ?? "";
  const [q, setQ] = useState(initial);
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setQ(initial);
  }, [initial]);

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

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return cases;
    const parts = term.split(/\s+/).filter(Boolean);
    return cases.filter((c) => {
      const hay = [
        c.title,
        c.vignette,
        c.specialty,
        String(c.difficulty ?? ""),
        ...(c.tags ?? []),
      ]
        .join(" ")
        .toLowerCase();
      return parts.every((p) => hay.includes(p));
    });
  }, [q, cases]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    router.replace(`/search?q=${encodeURIComponent(q.trim())}`);
  }

  return (
    <main className="p-0">
      <div className="mb-6 flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Suche</h1>
          <p className="text-sm text-gray-600">Fälle & Kategorien durchsuchen</p>
        </div>
        <form onSubmit={onSubmit} className="hidden sm:block">
          <div className="relative">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="z. B. KHK, Appendizitis, Dyspnoe…"
              className="w-[300px] rounded-md border border-black/10 bg-white/90 pl-8 pr-3 py-1.5 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>
        </form>
      </div>

      {loading ? (
        <div className="text-sm text-gray-600">Lade…</div>
      ) : filtered.length === 0 ? (
        <div className="text-sm text-gray-600">Keine Treffer.</div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <li key={c.id} className="rounded-xl bg-[var(--panel)] border border-black/5 shadow-card p-4">
              <div className="mb-2">
                <h3 className="font-medium leading-tight">{c.title}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-gray-600">{c.vignette}</p>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {c.specialty && <Badge tone="brand">{c.specialty}</Badge>}
                {typeof c.difficulty !== "undefined" && <Badge>Schwierigkeit {c.difficulty}</Badge>}
                {c.tags?.slice(0, 3).map((t) => <Badge key={t}>{t}</Badge>)}
              </div>
              <div className="mt-4 flex gap-2">
                <Link href={`/cases/${c.id}`} className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm hover:bg-black/[.04]">
                  Details
                </Link>
                <Link href={`/exam/${c.id}`} className="inline-flex items-center gap-1 rounded-md bg-brand-600 px-3 py-1.5 text-sm text-white hover:bg-brand-700">
                  Prüfungsmodus <ArrowRightIcon className="h-4 w-4" />
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}