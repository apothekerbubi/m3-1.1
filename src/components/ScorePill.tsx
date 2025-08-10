"use client";

import { CheckCircleIcon, ExclamationTriangleIcon } from "@heroicons/react/24/solid";

type Props = {
  points: number;         // kann jetzt auch Dezimalwert sein (z. B. 1.5)
  maxPoints: number;
  last: "correct" | "partially_correct" | "incorrect" | null;
};

export default function ScorePill({ points, maxPoints, last }: Props) {
  const pct = maxPoints > 0 ? Math.round((points / maxPoints) * 100) : 0;
  const fmt = (n: number) => (Number.isInteger(n) ? n.toString() : n.toFixed(1));

  const tone =
    last === "correct" ? "bg-green-100 text-green-800 border-green-200" :
    last === "partially_correct" ? "bg-yellow-100 text-yellow-800 border-yellow-200" :
    last === "incorrect" ? "bg-red-100 text-red-800 border-red-200" :
    "bg-gray-100 text-gray-800 border-gray-200";

  return (
    <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs ${tone}`}>
      {last === "correct" ? <CheckCircleIcon className="h-4 w-4" /> :
       last ? <ExclamationTriangleIcon className="h-4 w-4" /> : null}
      <span className="font-medium">Score</span>
      <span className="tabular-nums">{fmt(points)}/{fmt(maxPoints)}</span>
      <span className="opacity-70">({pct}%)</span>
    </div>
  );
}