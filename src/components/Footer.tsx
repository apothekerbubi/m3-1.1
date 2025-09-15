// src/components/Footer.tsx
export default function Footer() {
  return (
    <footer id="app-footer" className="mt-16 border-t border-black/10 dark:border-white/10">
      <div className="mx-auto max-w-5xl px-4 py-6 text-xs text-gray-500">
        © {new Date().getFullYear()} ExaSim · Lernsimulation, keine medizinische Beratung.
      </div>
    </footer>
  );
}