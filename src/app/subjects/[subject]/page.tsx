"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Case } from "@/lib/types"; //
import { slugify, subjectFromSlug } from "@/lib/slug";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";

export default function SubjectPage() {
  const params = useParams<{ subject: string }>();
  const subject = subjectFromSlug(params.subject);
  const [allCases, setAllCases] = useState<Case[]>([]);

  useEffect(() => {
    fetch("/api/cases").then(r => r.json()).then(setAllCases).catch(console.error);
  }, []);

  const categories = useMemo(() => {
    if (!subject) return [];
    const catSet = new Map<string, number>();
    allCases.filter(c => c.subject === subject).forEach(c => {
      const key = c.category.trim();
      catSet.set(key, (catSet.get(key) || 0) + 1);
    });
    return Array.from(catSet.entries()).sort((a,b)=>a[0].localeCompare(b[0]));
  }, [allCases, subject]);

  if (!subject) {
    return <main><p className="text-sm text-red-700">Unbekanntes Fach.</p></main>;
  }

  return (
    <main>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">{subject}</h1>
        <p className="text-sm text-gray-600 mt-1">Kategorien in {subject}.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {categories.map(([cat, count]) => (
          <motion.div
            key={cat}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="rounded-xl bg-[var(--panel)] border border-black/5 shadow-card p-4"
          >
            <div className="flex items-center justify-between">
              <div className="font-medium">{cat}</div>
              <div className="text-xs text-gray-500">{count} Fälle</div>
            </div>
            <Link
              href={`/subjects/${params.subject}/${slugify(cat)}`}
              className="mt-3 inline-flex rounded-md border px-3 py-1.5 text-sm hover:bg-black/[.04]"
            >
              Fälle ansehen
            </Link>
          </motion.div>
        ))}
        {categories.length === 0 && (
          <div className="text-sm text-gray-600">Noch keine Fälle.</div>
        )}
      </div>
    </main>
  );
}