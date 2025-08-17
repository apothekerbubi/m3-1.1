"use client";

export default function GlobalSkeleton() {
  return (
    <main className="p-6 text-gray-900 bg-[var(--bg,#f7f9fc)]">
      <div className="h-8 w-44 rounded-md bg-gray-200 animate-pulse mb-6" />
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2].map((c) => (
          <section
            key={c}
            className="rounded-2xl border border-black/10 bg-white/80 p-4 shadow-sm"
          >
            <div className="h-6 w-48 rounded-md bg-gray-200 animate-pulse mb-4" />
            {[0, 1, 2].map((r) => (
              <div
                key={r}
                className="flex items-center justify-between rounded-lg border border-black/10 bg-white px-3 py-3 mb-2"
              >
                <div className="space-y-2">
                  <div className="h-4 w-40 rounded bg-gray-200 animate-pulse" />
                  <div className="h-2 w-28 rounded bg-gray-100 animate-pulse" />
                </div>
                <div className="h-6 w-20 rounded bg-gray-100 animate-pulse" />
              </div>
            ))}
          </section>
        ))}
      </div>
    </main>
  );
}