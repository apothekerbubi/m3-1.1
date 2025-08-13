// src/lib/supabase/server.ts
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

// kleine, typsichere Wrapper-Interfaces (ohne `any`)
type CookieValue = { value?: string };
type CookieSetInput = { name: string; value: string } & Record<string, unknown>;
interface CookieStoreLike {
  get(name: string): CookieValue | undefined;
  set(options: CookieSetInput): void;
}

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      "Supabase ist nicht konfiguriert: Bitte NEXT_PUBLIC_SUPABASE_URL und NEXT_PUBLIC_SUPABASE_ANON_KEY setzen."
    );
  }

  // In einigen Next-Versionen wird `cookies()` unterschiedlich typisiert.
  // Zur Laufzeit ist es im Route/SSR-Kontext synchron nutzbar.
  const cookieStore = cookies() as unknown as CookieStoreLike;

  return createServerClient(url, anonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options?: Record<string, unknown>) {
        try {
          cookieStore.set({
            name,
            value,
            ...(options ?? {}),
          });
        } catch {
          // read-only Kontext (z. B. reine RSC) → ignorieren
        }
      },
      remove(name: string, options?: Record<string, unknown>) {
        try {
          cookieStore.set({
            name,
            value: "",
            ...(options ?? {}),
            maxAge: 0,
          });
        } catch {
          // read-only Kontext → ignorieren
        }
      },
    },
  });
}