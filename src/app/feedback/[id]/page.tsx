"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { getAttempt } from "@/lib/storage";

export default function FeedbackPage() {
  // In Client Components: params via useParams()
  const params = useParams<{ id: string | string[] }>();
  const rawId = params?.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;

  const a = id ? getAttempt(id) : null;

  if (!a) {
    return (
      <main className="mx-auto max-w-3xl p-6">
        <h2 className="text-xl font-semibold mb-2">Feedback</h2>
        <p className="text-sm text-gray-600 mb-4">
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
      <h2 className="text-xl font-semibold mb-2">Feedback: {a.caseTitle}</h2>
      <p className="text-sm text-gray-600 mb-4">
        Versuch vom {new Date(a.dateISO).toLocaleString()}
      </p>

      <div className="rounded-lg border p-4 bg-gray-50 mb-4">
        <p>
          Gesamtpunkte: <b>{a.result.total}</b>
        </p>
      </div>

      <ul className="space-y-2">
        {a.result.sections.map((s) => (
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
                <ul className="list-disc ml-5">
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
        <Link href={`/simulate/${a.caseId}`} className="rounded-md border px-3 py-1 text-sm hover:bg-gray-50">
          Nochmal üben
        </Link>
      </div>
    </main>
  );
}