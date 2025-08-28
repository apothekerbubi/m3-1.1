// src/components/Header.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import symptaiLogo from "@/lib/Logo.png"; // <- dein Logo liegt in src/lib/Logo.png
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { MagnifyingGlassIcon, UserCircleIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { createBrowserSupabase } from "@/lib/supabase/client";
import LogoutButton from "@/components/LogoutButton";

export default function Header() {
  const router = useRouter();
  const supabaseRef = useRef<ReturnType<typeof createBrowserSupabase> | null>(null);
  supabaseRef.current = createBrowserSupabase();

  const [q, setQ] = useState("");
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const sb = supabaseRef.current;
    if (!sb) return;

    (async () => {
      const { data: { session } } = await sb.auth.getSession();
      if (isMounted) setHasSession(Boolean(session));
    })();

    const { data: authSub } = sb.auth.onAuthStateChange((_evt, session) => {
      setHasSession(Boolean(session));
    });

    return () => {
      isMounted = false;
      authSub.subscription.unsubscribe();
    };
  }, []);

  function onSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const query = q.trim();
    router.push(query ? `/search?q=${encodeURIComponent(query)}` : "/search");
  }

  // Höhe des Headers (h-14 = 3.5rem) als CSS-Variable bereitstellen
  const HEADER_H = "3.5rem";

  return (
    <header
      className="sticky top-0 z-50 border-b bg-white dark:bg-[#0f1524] shadow-sm"
      style={{ "--header-h": HEADER_H } as React.CSSProperties }
    >
      <div className="mx-auto max-w-screen-2xl px-6">
        <div className="flex h-14 items-center justify-between gap-3">
          {/* Logo → Übersicht */}
          <Link
            href="/overview"
            className="flex items-center gap-2"
            aria-label="SymptAI – zur Übersicht"
            title="SymptAI"
          >
            {/* Statischer Import: Next kennt Breite/Höhe automatisch */}
            <Image
              src={symptaiLogo}
              alt="SymptAI"
              priority
              className="h-12 w-auto sm:h-12 lg:h-14"  // größer
            />
            <span className="sr-only font-semibold tracking-tight">SymptAI</span>
          </Link>

          {/* Suche + Account */}
          <div className="flex items-center gap-3">
            <form onSubmit={onSearch} className="hidden sm:block">
              <div className="relative">
                <MagnifyingGlassIcon className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.currentTarget.value)}
                  placeholder="Fälle oder Kategorien suchen…"
                  className={clsx(
                    "w-[260px] rounded-md border border-black/10 bg-white/90 pl-8 pr-3 py-1.5 text-sm",
                    "placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-400"
                  )}
                />
              </div>
            </form>

            {/* Mobile: nur Icon */}
            <Link
              href="/search"
              className="sm:hidden inline-flex items-center justify-center rounded-md border border-black/10 bg-white/90 p-2"
              aria-label="Suchen"
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

            {hasSession ? (
              <LogoutButton />
            ) : (
              <Link
                href="/login"
                className="rounded-md border border-black/10 bg-white/90 px-3 py-1.5 text-sm hover:bg-black/[.04]"
              >
                Anmelden
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}