// src/app/feedback/[id]/page.tsx
"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { getAttempt } from "@/lib/storage";
import type { Attempt, AttemptSection } from "@/lib/types";

export default function FeedbackPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  const a: Attempt | null = id ? getAttempt(id) : null;

  if (!a) {
    return (
      <main className="mx-auto max-w-3xl p-6">
        <h2 className="mb-2 text-xl font-semibold">Feedback</h2>
        <p className="mb-4 text-sm text-gray-600">
          Versuch nicht gefunden. Hast du die Simulation gerade erst neu geladen?
        </p>
        <div className="flex gap-2">
          <Link href="/cases" className="rounded-md border px-3 py-1 text-sm hover:bg-gray-50">
            Zu den Fällen
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h2 className="mb-2 text-xl font-semibold">Feedback: {a.caseTitle}</h2>
      <p className="mb-4 text-sm text-gray-600">
        Versuch vom {new Date(a.dateISO).toLocaleString()}
      </p>

      <div className="mb-4 rounded-lg border bg-gray-50 p-4">
        <p>
          Gesamtpunkte: <b>{a.result.total}</b>
        </p>
      </div>

      <ul className="space-y-2">
        {a.result.sections.map((s: AttemptSection) => (
          <li key={s.name} className="rounded-md border bg-white p-3">
            <div className="flex items-center justify-between">
              <span className="font-medium">{s.name}</span>
              <span className="text-sm text-gray-600">
                {s.got} / {s.max}
              </span>
            </div>

            {s.missing.length > 0 && (
              <div className="mt-2 text-sm">
                <span className="text-gray-600">Es fehlte:</span>
                <ul className="ml-5 list-disc">
                  {s.missing.map((m) => (
                    <li key={m}>{m}</li>
                  ))}
                </ul>
              </div>
            )}
          </li>
        ))}
      </ul>

      <div className="mt-6 flex gap-2">
        <Link href="/cases" className="rounded-md border px-3 py-1 text-sm hover:bg-gray-50">
          Weitere Fälle
        </Link>
        <Link
          href={`/simulate/${a.caseId}`}
          className="rounded-md border px-3 py-1 text-sm hover:bg-gray-50"
        >
          Nochmal üben
        </Link>
      </div>
    </main>
  );
}