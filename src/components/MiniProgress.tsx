// src/components/MiniProgress.tsx
"use client";
export default function MiniProgress({ value, size = "sm" }: { value: number; size?: "sm"|"md" }) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  const h = size === "sm" ? "h-1.5" : "h-2";
  return (
    <div className={`w-full rounded-full bg-gray-200 ${h}`}>
      <div
        className={`rounded-full bg-blue-600 ${h}`}
        style={{ width: `${pct}%` }}
        aria-label={`Fortschritt ${pct}%`}
      />
    </div>
  );
}