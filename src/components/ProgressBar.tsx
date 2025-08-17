// src/components/MiniProgress.tsx
export default function MiniProgress({ value }: { value: number }) {
  const v = Math.max(0, Math.min(100, Math.round(value || 0)));
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-40 rounded-full bg-gray-100" aria-label={`Fortschritt ${v}%`}>
        <div
          className="h-2 rounded-full bg-emerald-600 transition-[width] duration-300"
          style={{ width: `${v}%` }}
        />
      </div>
      <span className="text-[11px] tabular-nums text-gray-600">{v}%</span>
    </div>
  );
}