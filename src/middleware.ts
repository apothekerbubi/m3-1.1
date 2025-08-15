// src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const PROTECTED_PATHS = ["/exam", "/simulate", "/cases", "/subjects"];

export async function middleware(req: NextRequest) {
  const { pathname, origin } = req.nextUrl;

  // Nur für geschützte Pfade Auth prüfen
  const needsAuth = PROTECTED_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
  if (!needsAuth) return NextResponse.next();

  // Response-Objekt anlegen (wichtig, wenn wir Cookies setzen/aktualisieren)
  const res = NextResponse.next();

  // Supabase-Client mit Cookie-Bridge (typsicher, ohne Fremdtypen)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // string | undefined zurückgeben (kein .value erzwingen)
        get: (name: string) => req.cookies.get(name)?.value,
        // In Middleware darf man auf der Response Cookies setzen
        set: (name: string, value: string, options?: Parameters<typeof res.cookies.set>[2]) => {
          res.cookies.set(name, value, options);
        },
        remove: (name: string, options?: Parameters<typeof res.cookies.set>[2]) => {
          // Löschen durch Setzen mit maxAge: 0
          res.cookies.set(name, "", { ...options, maxAge: 0 });
        },
      },
    }
  );

  // User aus Session lesen
  const { data: { user } } = await supabase.auth.getUser();

  // Nicht eingeloggt → auf Login leiten (mit next-Param)
  if (!user) {
    const loginUrl = new URL("/login", origin);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Eingeloggt → Request normal weiterreichen (inkl. evtl. aktualisierter Cookies)
  return res;
}

// Matcher: Middleware nur dort ausführen, wo sinnvoll (API & Next-Assets ausschließen)
export const config = {
  matcher: [
    // alles außer Next intern & statische Dateien
    "/((?!_next/|static/|favicon.ico|robots.txt|sitemap.xml|api/).*)",
  ],
};