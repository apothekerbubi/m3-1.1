// src/app/cases/loading.tsx
"use client";

import { useEffect, useState } from "react";

export default function CasesLoading() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShow(true), 120);
    return () => clearTimeout(t);
  }, []);
  if (!show) return null;

  return (
    <main className="p-6 text-gray-900 bg-[var(--bg,#f7f9fc)]">
      <div className="max-w-screen-2xl mx-auto">
        <div className="h-8 w-64 rounded-md bg-gray-200 animate-pulse mb-6" />
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between rounded-xl border border-black/10 bg-white p-4 shadow-sm mb-3"
          >
            <div className="space-y-2">
              <div className="h-5 w-72 rounded bg-gray-200 animate-pulse" />
              <div className="h-2 w-56 rounded bg-gray-100 animate-pulse" />
              <div className="h-2 w-32 rounded bg-gray-100 animate-pulse" />
            </div>
            <div className="flex items-center gap-2">
              <div className="h-6 w-28 rounded bg-gray-100 animate-pulse" />
              <div className="h-9 w-24 rounded bg-gray-100 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}