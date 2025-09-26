"use client";

import Link from "next/link";
import Image from "next/image";
import ExaSim from "@/lib/Logo.png";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  MagnifyingGlassIcon,
  UserCircleIcon,
  Bars3Icon,
  XMarkIcon,
  
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import { createBrowserSupabase } from "@/lib/supabase/client";
import LogoutButton from "@/components/LogoutButton";

type HeaderProps = {
  navCollapsed: boolean;
  onToggleNav: () => void;
};

export default function Header({ navCollapsed, onToggleNav }: HeaderProps) {
  const router = useRouter();
  const supabaseRef = useRef<ReturnType<typeof createBrowserSupabase> | null>(
    null
  );
  supabaseRef.current = createBrowserSupabase();

  const [q, setQ] = useState("");
  const [hasSession, setHasSession] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const sb = supabaseRef.current;
    if (!sb) return;

    (async () => {
      const {
        data: { session },
      } = await sb.auth.getSession();
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

  const HEADER_H = "3.5rem";

  return (
    <header
     id="app-header"
      className="sticky top-0 z-50 border-b bg-white dark:bg-[#0f1524] shadow-sm"
      style={{ "--header-h": HEADER_H } as React.CSSProperties}
    >
      <div className="mx-auto max-w-screen-2xl px-6">
        <div className="flex h-14 items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onToggleNav}
              aria-controls="app-sidenav"
              aria-expanded={!navCollapsed}
              className="hidden md:inline-flex items-center justify-center rounded-md border border-black/10 bg-white/80 p-2 text-gray-700 shadow-sm transition hover:bg-black/[.03] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
            >
              {navCollapsed ? (
                <Bars3Icon className="h-5 w-5" aria-hidden />
              ) : (
                <Bars3Icon className="h-5 w-5" aria-hidden />
              )}
              <span className="sr-only">Navigation umschalten</span>
            </button>

            {/* Logo → Übersicht */}
            <Link
              href="/overview"
              className="flex items-center gap-2"
              aria-label="ExaSim – zur Übersicht"
              title="ExaSim"
            >
              <Image
                src={ExaSim}
                alt="ExaSim"
                priority
                className="h-12 w-auto sm:h-12 lg:h-14"
              />
              <span className="sr-only font-semibold tracking-tight">ExaSim</span>
            </Link>
          </div>

          {/* Suche + Account */}
          <div className="flex items-center gap-3">
            {/* Suche Desktop */}
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

            {/* Mobile Suche */}
            <Link
              href="/search"
              className="sm:hidden inline-flex items-center justify-center rounded-md border border-black/10 bg-white/90 p-2"
              aria-label="Suchen"
              title="Suchen"
            >
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-700" />
            </Link>

            {/* Desktop: Account */}
            <Link
              href="/account"
              className="hidden sm:inline-flex items-center justify-center rounded-full border border-black/10 bg-white/90 p-1.5 hover:bg-black/[.04]"
              aria-label="Account"
              title="Account"
            >
              <UserCircleIcon className="h-6 w-6 text-gray-700" />
            </Link>

            {hasSession ? (
              <div className="hidden sm:block">
                <LogoutButton />
              </div>
            ) : (
              <Link
                href="/login"
                className="hidden sm:block rounded-md border border-black/10 bg-white/90 px-3 py-1.5 text-sm hover:bg-black/[.04]"
              >
                Anmelden
              </Link>
            )}

            {/* Mobile: Hamburger */}
            <button
              className="sm:hidden inline-flex items-center justify-center rounded-md border border-black/10 bg-white/90 p-2"
              aria-label="Menü"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? (
                <XMarkIcon className="h-6 w-6 text-gray-700" />
              ) : (
                <Bars3Icon className="h-6 w-6 text-gray-700" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Overlay-Menü mobil */}
      {menuOpen && (
        <div className="sm:hidden absolute top-14 left-0 right-0 bg-white dark:bg-[#0f1524] border-t border-gray-200 shadow-md">
          <nav className="flex flex-col p-4 space-y-3 text-sm">
            <Link href="/overview" onClick={() => setMenuOpen(false)}>
              Übersicht
            </Link>
            <Link href="/subjects" onClick={() => setMenuOpen(false)}>
              Bibliothek
            </Link>
            <Link href="/cases" onClick={() => setMenuOpen(false)}>
              Leitsymptome
            </Link>
            <Link href="/simulate" onClick={() => setMenuOpen(false)}>
              Simulation
            </Link>
            <Link href="/account" onClick={() => setMenuOpen(false)}>
              Account
            </Link>
            <Link href="/shop" onClick={() => setMenuOpen(false)}>
              Shop
            </Link>
            <Link href="/info" onClick={() => setMenuOpen(false)}>
              Info
            </Link>
            {hasSession ? (
              <LogoutButton className="text-left" label="Abmelden" />
            ) : (
              <Link href="/login" onClick={() => setMenuOpen(false)}>
                Anmelden
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}