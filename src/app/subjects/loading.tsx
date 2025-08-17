// src/app/subjects/loading.tsx
"use client";

import { useEffect, useState } from "react";

export default function SubjectsLoading() {
  // prevent flash if load completes very fast
  const [show, setShow] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShow(true), 120); // ~1/8s
    return () => clearTimeout(t);
  }, []);

  if (!show) return null;

  return (
    <main className="p-6 text-gray-900 bg-[var(--bg,#f7f9fc)]">
      <div className="max-w-screen-2xl mx-auto">
        <div className="h-8 w-56 rounded-md bg-gray-200 animate-pulse mb-6" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {[0, 1, 2].map((col) => (
            <section
              key={col}
              className="rounded-xl border border-black/10 bg-white/80 p-4 shadow-sm"
            >
              <div className="h-6 w-48 rounded-md bg-gray-200 animate-pulse mb-4" />
              {[0, 1, 2].map((row) => (
                <div
                  key={row}
                  className="flex items-center justify-between rounded-lg border border-black/10 bg-white px-4 py-3 mb-2"
                >
                  <div className="space-y-2">
                    <div className="h-4 w-52 rounded bg-gray-200 animate-pulse" />
                    <div className="h-2 w-40 rounded bg-gray-100 animate-pulse" />
                    <div className="h-2 w-24 rounded bg-gray-100 animate-pulse" />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-20 rounded bg-gray-100 animate-pulse" />
                    <div className="h-8 w-24 rounded bg-gray-100 animate-pulse" />
                  </div>
                </div>
              ))}
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}