"use client";

import { ReactNode, Suspense, useMemo } from "react";
import { usePathname } from "next/navigation";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SideNav from "@/components/SideNav";
import GlobalSkeleton from "@/components/GlobalSkeleton";

const MARKETING_ROUTES = new Set(["/", "/landing"]);

function normalizePath(pathname: string | null): string {
  if (!pathname) return "/";
  if (pathname === "/") return pathname;
  return pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
}

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const normalized = useMemo(() => normalizePath(pathname), [pathname]);
  const hideAppChrome = MARKETING_ROUTES.has(normalized);

  if (hideAppChrome) {
    return <>{children}</>;
  }

  return (
    <div id="app-shell" className="flex min-h-screen flex-col">
      <Header />

      <div className="mx-auto w-full max-w-screen-2xl px-6 py-6 flex-1">
        <div id="app-layout" className="grid grid-cols-1 gap-4 md:grid-cols-[var(--nav-w)_1fr] items-start">
          <aside id="app-sidenav-container" className="hidden md:block">
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