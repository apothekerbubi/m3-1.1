"use client";

import Link from "next/link";
import type { Case } from "@/lib/types";  
import { useEffect, useMemo, useState } from "react";
import { slugify, subjectFromSlug } from "@/lib/slug";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";

export default function CategoryCasesPage() {
  const params = useParams<{ subject: string; category: string }>();
  const subject = subjectFromSlug(params.subject);
  const [allCases, setAllCases] = useState<Case[]>([]);

  useEffect(() => {
    fetch("/api/cases").then(r => r.json()).then(setAllCases).catch(console.error);
  }, []);

  const { labelCategory, items } = useMemo(() => {
    if (!subject) return { labelCategory: "", items: [] as Case[] };
    const filtered = allCases.filter(
      c => !!c.category && c.subject === subject && slugify(c.category) === params.category
    );
    const label = filtered[0]?.category || "";
    return { labelCategory: label, items: filtered };
  }, [allCases, params.category, subject]);

  if (!subject) {
    return <main><p className="text-sm text-red-700">Unbekanntes Fach.</p></main>;
  }

  return (
    <main>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">
          {subject} · {labelCategory || "Kategorie"}
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          {items.length} Fall{items.length === 1 ? "" : "e"} gefunden.
        </p>
      </div>

      <ul className="grid gap-4 sm:grid-cols-2">
        {items.map((c) => (
          <motion.li
            key={c.id}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="rounded-xl bg-[var(--panel)] border border-black/5 shadow-card p-4 hover:shadow-lg transition-shadow"
          >
            <h3 className="font-medium">{c.title}</h3>
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">{c.vignette}</p>
            <div className="mt-3 flex gap-2">
              <Link href={`/cases/${c.id}`} className="rounded-md border px-3 py-1.5 text-sm hover:bg-black/[.04]">
                Details
              </Link>
              <Link href={`/exam/${c.id}`} className="rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700">
                Prüfungsmodus
              </Link>
            </div>
          </motion.li>
        ))}
        {items.length === 0 && (
          <div className="text-sm text-gray-600">Keine Fälle in dieser Kategorie.</div>
        )}
      </ul>
    </main>
  );
}