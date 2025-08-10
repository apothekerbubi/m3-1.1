"use client";

import Link from "next/link";
import { FolderIcon, ArrowRightIcon } from "@heroicons/react/24/outline";
import type { Case } from "@/lib/types";

function deriveShort(title: string) {
  // nimmt Teil vor –/—/- oder kürzt sanft
  const first = title.split(/[–—-]/)[0].trim();
  const t = first.length > 28 ? first.slice(0, 28) + "…" : first;
  return t || title;
}

export default function CaseMiniCard({ c }: { c: Case }) {
  const name = c.shortTitle?.trim() || deriveShort(c.title);
  return (
    <li className="group flex items-center justify-between gap-3 rounded-xl border border-black/10 bg-white/80 px-4 py-3 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex min-w-0 items-center gap-3">
        <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-black/[.04] text-gray-700">
          <FolderIcon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="truncate font-medium">{name}</div>
          <div className="mt-0.5 flex flex-wrap gap-2 text-[11px] text-gray-600">
            {typeof c.difficulty !== "undefined" && (
              <span className="rounded-full border px-2 py-[2px]">Schwierigkeit {c.difficulty}</span>
            )}
            {c.tags?.slice(0, 2).map((t) => (
              <span key={t} className="rounded-full border px-2 py-[2px]">{t}</span>
            ))}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Link
          href={`/cases/${c.id}`}
          className="hidden sm:inline-flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-sm hover:bg-black/[.04]"
        >
          Details
        </Link>
        <Link
          href={`/exam/${c.id}`}
          className="inline-flex items-center gap-1 rounded-md bg-brand-600 px-2.5 py-1.5 text-sm text-white hover:bg-brand-700"
          title="Prüfungsmodus"
        >
          Prüfen <ArrowRightIcon className="h-4 w-4" />
        </Link>
      </div>
    </li>
  );
}