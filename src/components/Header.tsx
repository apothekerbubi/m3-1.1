// src/components/Header.tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation"; // ✅ nur EINMAL importieren
import { useState } from "react";
import {
  AcademicCapIcon,
  MagnifyingGlassIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import { createBrowserSupabase } from "@/lib/supabase/client";

// Optionales Abmelde-Menü (kannst du in der Header-Leiste einhängen, wenn gewünscht)
export function UserMenu() {
  const supabase = createBrowserSupabase();
  const router = useRouter();

  async function signOut() {
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <button
      onClick={signOut}
      className="rounded-md border border-black/10 bg-white/90 px-3 py-1 text-sm text-gray-900 hover:bg-black/[.04] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
      title="Abmelden"
      aria-label="Abmelden"
    >
      Abmelden
    </button>
  );
}

export default function Header() {
  const router = useRouter();
  const [q, setQ] = useState("");

  function onSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const query = q.trim();
    router.push(query ? `/search?q=${encodeURIComponent(query)}` : "/search");
  }

  return (
    <header className="sticky top-0 z-40 border-b border-black/10 bg-white/70 backdrop-blur supports-backdrop-blur:bg-white/60 dark:border-white/10 dark:bg-[#0f1524]/60">
      <div className="mx-auto max-w-screen-2xl px-6">
        <div className="flex h-14 items-center justify-between gap-3">
          {/* Logo -> Fächer */}
          <Link href="/subjects" className="flex items-center gap-2">
            <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
              <AcademicCapIcon className="h-5 w-5" />
            </div>
            <span className="font-semibold tracking-tight">M3 Mentor</span>
          </Link>

          {/* Suche + Account rechts */}
          <div className="flex items-center gap-3">
            {/* Suche (mobil versteckt, Desktop sichtbar) */}
            <form
              onSubmit={onSearch}
              className="hidden sm:block"
              role="search"
              aria-label="Fälle oder Kategorien suchen"
            >
              <div className="relative">
                <MagnifyingGlassIcon className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Fälle oder Kategorien suchen…"
                  autoComplete="off"
                  inputMode="search"
                  className={clsx(
                    "w-[260px] rounded-md border border-black/10 bg-white/90 pl-8 pr-3 py-1.5 text-sm text-gray-900",
                    "placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-400"
                  )}
                />
              </div>
            </form>

            {/* Mobile: nur Icon, öffnet /search */}
            <Link
              href="/search"
              className="inline-flex items-center justify-center rounded-md border border-black/10 bg-white/90 p-2 sm:hidden"
              aria-label="Suche öffnen"
              title="Suchen"
            >
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-700" />
            </Link>

            {/* Account */}
            <Link
              href="/account"
              className="inline-flex items-center justify-center rounded-full border border-black/10 bg-white/90 p-1.5 hover:bg-black/[.04]"
              aria-label="Account"
              title="Account"
            >
              <UserCircleIcon className="h-6 w-6 text-gray-700" />
            </Link>

            {/* Falls du den Abmelde-Button hier direkt willst, füge <UserMenu /> hinzu */}
            {/* <UserMenu /> */}
          </div>
        </div>
      </div>
    </header>
  );
}