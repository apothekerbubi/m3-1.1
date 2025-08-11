"use client";

import { Suspense } from "react";
import SubjectsPageInner from "./subjects-inner";

export default function SubjectsPage() {
  return (
    <Suspense fallback={<main className="p-6 text-sm text-gray-600">Lade Bibliothek…</main>}>
      <SubjectsPageInner />
    </Suspense>
  );
}