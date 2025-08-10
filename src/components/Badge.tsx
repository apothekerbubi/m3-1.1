import { clsx } from "clsx";

export default function Badge({ children, tone = "default" }: { children: React.ReactNode; tone?: "default" | "brand" }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium",
        tone === "brand"
          ? "border-brand-200 bg-brand-50 text-brand-700"
          : "border-black/10 bg-white/70 text-gray-700"
      )}
    >
      {children}
    </span>
  );
}