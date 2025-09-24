"use client";

import {
  type CSSProperties,
  ReactNode,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import { Bars3Icon, ChevronLeftIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SideNav from "@/components/SideNav";
import GlobalSkeleton from "@/components/GlobalSkeleton";

type CSSPropertiesWithVars = CSSProperties & {
  [key: `--${string}`]: string | number;
};

const MARKETING_ROUTES = new Set(["/", "/landing"]);

function normalizePath(pathname: string | null): string {
  if (!pathname) return "/";
  if (pathname === "/") return pathname;
  return pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
}

function shouldStartCollapsed(pathname: string): boolean {
  return pathname.startsWith("/simulate") || pathname.startsWith("/exam");
}

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const normalized = useMemo(() => normalizePath(pathname), [pathname]);
  const hideAppChrome = MARKETING_ROUTES.has(normalized);

  const [navCollapsed, setNavCollapsed] = useState(() =>
    shouldStartCollapsed(normalized)
  );
  const prevPathRef = useRef<string | null>(null);

  const layoutStyle = useMemo(
    (): CSSPropertiesWithVars => ({
      "--nav-current-width": navCollapsed ? "0px" : "var(--nav-w)",
    }),
    [navCollapsed]
  );

  useEffect(() => {
    const shouldCollapse = shouldStartCollapsed(normalized);
    if (prevPathRef.current !== normalized) {
      prevPathRef.current = normalized;
      setNavCollapsed(shouldCollapse);
    }
  }, [normalized]);

  if (hideAppChrome) {
    return <>{children}</>;
  }

  return (
    <div id="app-shell" className="flex min-h-screen flex-col">
      <Header />

      <div className="mx-auto w-full max-w-screen-2xl px-6 py-6 flex-1">
        <div className="mb-4 flex justify-end md:justify-start">
          <button
            type="button"
            onClick={() => setNavCollapsed((value) => !value)}
            aria-controls="app-sidenav"
            aria-expanded={!navCollapsed}
            className="inline-flex items-center gap-2 rounded-md border border-black/10 bg-white/80 px-3 py-2 text-sm text-gray-700 shadow-sm transition hover:bg-black/[.03] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
          >
            {navCollapsed ? (
              <Bars3Icon className="h-5 w-5" aria-hidden />
            ) : (
              <ChevronLeftIcon className="h-5 w-5" aria-hidden />
            )}
            <span>{navCollapsed ? "Seitenleiste öffnen" : "Seitenleiste schließen"}</span>
          </button>
        </div>

        <div
          id="app-layout"
          className="grid grid-cols-1 items-start gap-4 md:grid-cols-[var(--nav-current-width)_1fr]"
          style={layoutStyle}
        >
          <aside
            id="app-sidenav-container"
            className={clsx(
              "hidden md:block overflow-hidden transition-[width,opacity] duration-200",
              navCollapsed
                ? "md:w-0 md:opacity-0 md:pointer-events-none"
                : "md:w-[var(--nav-w)] md:opacity-100"
            )}
            aria-hidden={navCollapsed}
          >
            <div className="sticky top-20">
              <SideNav />
            </div>
          </aside>

          <div>
            <Suspense fallback={<GlobalSkeleton />}>
              {children}
            </Suspense>
          </div>
        </div>
      </div>

      <div className="mt-auto">
        <Footer />
      </div>
    </div>
  );
}