"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { Case } from "@/lib/types";
import { CASES } from "@/data/cases";

function slugify(s: string) {
  return encodeURIComponent(s.toLowerCase().trim().replace(/\s+/g, "-"));
}
function unslug(s: string) {
  try {
    return decodeURIComponent(s).replace(/-/g, " ").replace(/\s+/g, " ").trim();
  } catch {
    return s.replace(/-/g, " ").trim();
  }
}

export default function SubjectPage() {
  const params = useParams<{ subject: string }>();
  const subjectSlug = params.subject;
  const subjectLabel = unslug(subjectSlug); // z. B. "innere-medizin" -> "innere medizin"

  // Fälle nach specialty filtern (Fallback: leerer String, damit keine Crashes)
  const casesOfSubject = useMemo<Case[]>(
    () =>
      CASES.filter(
        (c) => (c.specialty ?? "").toLowerCase().trim() === subjectLabel.toLowerCase()
      ),
    [subjectLabel]
  );

  // Subfächer + Counts bauen (subspecialty kann fehlen → "Allgemein")
  const categories = useMemo(
    () => {
      const map = new Map<string, number>();
      for (const c of casesOfSubject) {
        const key = (c.subspecialty ?? "Allgemein").trim();
        if (!key) continue;
        map.set(key, (map.get(key) || 0) + 1);
      }
      return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0], "de"));
    },
    [casesOfSubject]
  );

  return (
    <main className="p-0">
      <h1 className="mb-4 text-3xl font-semibold tracking-tight">
        {subjectLabel.charAt(0).toUpperCase() + subjectLabel.slice(1)}
      </h1>

      {categories.length === 0 ? (
        <div className="text-sm text-gray-600">Keine Subfächer gefunden.</div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map(([cat, count]) => (
            <li
              key={cat}
              className="rounded-2xl border border-black/10 bg-white/80 p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="font-medium">{cat}</div>
                <span className="text-xs text-gray-600">{count}</span>
              </div>
              <Link
                href={`/subjects/${subjectSlug}/${slugify(cat)}`}
                className="mt-3 inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm hover:bg-black/[.04]"
              >
                Fälle ansehen
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}