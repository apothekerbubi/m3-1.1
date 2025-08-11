"use client";

import { Suspense } from "react";
import SubjectsPageInner from "./subjects-inner";

export default function SubjectsPage() {
  return (
    <Suspense
      fallback={
        <main className="p-6 text-sm text-gray-900 bg-[var(--bg,#f7f9fc)]">
          Lade Bibliothek…
        </main>
      }
    >
      {/* Sicherstellen, dass der gesamte Inhalt dunklen Text bekommt */}
      <main className="text-gray-900 bg-[var(--bg,#f7f9fc)]">
        <SubjectsPageInner />
      </main>
    </Suspense>
  );
}