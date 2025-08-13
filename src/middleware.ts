// src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient, type CookieMethodsServer } from "@supabase/ssr";

const PROTECTED_PATHS = ["/exam", "/simulate", "/cases", "/subjects", "/account"];

export async function middleware(req: NextRequest) {
  const { pathname, origin } = req.nextUrl;

  // ❗ API & statische Assets NICHT prüfen
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml"
  ) {
    return NextResponse.next();
  }

  // Nur geschützte Seiten prüfen
  const needsAuth = PROTECTED_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (!needsAuth) return NextResponse.next();

  const res = NextResponse.next();

  // Supabase‑Client mit Cookie‑Brücke
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => req.cookies.get(name)?.value,
        set: (name: string, value: string, options?: Parameters<CookieMethodsServer["set"]>[2]) =>
          res.cookies.set({ name, value, ...options }),
        remove: (name: string, options?: Parameters<CookieMethodsServer["set"]>[2]) =>
          res.cookies.set({ name, value: "", ...options }),
      },
    }
  );

  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    const loginUrl = new URL("/login", origin);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return res;
}

export const config = {
  // Middleware läuft überall, aber wir verlassen früh bei /api|/_next|… (s.o.)
  matcher: ["/((?!.*).*)"],
};