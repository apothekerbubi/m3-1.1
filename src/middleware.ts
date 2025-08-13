import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const PROTECTED_PATHS = ["/exam", "/simulate", "/cases", "/subjects"];

export async function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const path = url.pathname;

  const needsAuth = PROTECTED_PATHS.some((p) => path === p || path.startsWith(`${p}/`));
  if (!needsAuth) return NextResponse.next();

  const res = NextResponse.next();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => req.cookies.get(name)?.value,
        set: (name, value, options) => res.cookies.set({ name, value, ...options }),
        remove: (name, options) => res.cookies.set({ name, value: "", ...options }),
      },
    }
  );

  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    const login = new URL("/login", req.url);
    login.searchParams.set("next", path);
    return NextResponse.redirect(login);
  }

  return res;
}

export const config = {
  matcher: ["/((?!_next|api/exam/turn|favicon.ico|robots.txt|sitemap.xml).*)"],
};