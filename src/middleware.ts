// src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const PROTECTED_PATHS = ["/exam", "/simulate", "/cases", "/subjects"];

export async function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const path = url.pathname;

  // Nur schützen, wenn Pfad darunterfällt
  const needsAuth =
    PROTECTED_PATHS.some((p) => path === p || path.startsWith(`${p}/`));
  if (!needsAuth) return NextResponse.next();

  // Response für Cookie-Setzen vorbereiten
  const res = NextResponse.next();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  // Cookie-Adapter für @supabase/ssr – typsicher ohne `any`
  const cookieAdapter = {
    get(name: string) {
      return req.cookies.get(name)?.value;
    },
    set(
      name: string,
      value: string,
      options?: { [key: string]: unknown } // generisches Options-Objekt
    ) {
      // NextResponse.cookies.set akzeptiert Objektform
      res.cookies.set({ name, value, ...(options ?? {}) });
    },
    remove(name: string, options?: { [key: string]: unknown }) {
      res.cookies.set({ name, value: "", ...(options ?? {}) });
    },
  };

  // ⚠️ Manche Versionen typisieren `cookies` etwas anders.
  // Wir casten das Gesamt-Optionsobjekt auf den erwarteten Parametertyp.
  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnon,
    { cookies: cookieAdapter } as unknown as Parameters<typeof createServerClient>[2]
  );

  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) {
    const login = new URL("/login", req.url);
    login.searchParams.set("next", path);
    return NextResponse.redirect(login);
  }

  return res;
}

// Alles ausliefern, außer statischen Next-Ressourcen & deiner offenen API-Route
export const config = {
  matcher: ["/((?!_next|api/exam/turn|favicon.ico|robots.txt|sitemap.xml).*)"],
};