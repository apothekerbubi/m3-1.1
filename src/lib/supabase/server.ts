// src/lib/supabase/server.ts
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies as nextCookies } from "next/headers";

function getEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      "Supabase ist nicht konfiguriert: Bitte NEXT_PUBLIC_SUPABASE_URL und NEXT_PUBLIC_SUPABASE_ANON_KEY setzen."
    );
  }
  return { url, anonKey };
}

/**
 * Für Server Components / Layouts (synchrones cookies()).
 */
export function createClient() {
  const { url, anonKey } = getEnv();
  const store = nextCookies(); // synchron in RSC/Layouts

  return createServerClient(url, anonKey, {
    cookies: {
      get(name: string): string | undefined {
        try {
          return store.get(name)?.value;
        } catch {
          return undefined;
        }
      },
      set(name: string, value: string, options?: CookieOptions): void {
        try {
          // In RSC ist .set i.d.R. nicht erlaubt → Fehler abfangen
          nextCookies().set(name, value, options);
        } catch {
          /* no-op in read-only Kontext */
        }
      },
      remove(name: string, options?: CookieOptions): void {
        try {
          nextCookies().set(name, "", { ...options, maxAge: 0 });
        } catch {
          /* no-op in read-only Kontext */
        }
      },
    },
  });
}

/**
 * Für Route Handlers (app/api/*) – asynchrones cookies().
 * In API-Routen **diese** Version nutzen:
 *   const supabase = await createClientRoute();
 */
export async function createClientRoute() {
  const { url, anonKey } = getEnv();
  const store = await nextCookies(); // async in Route Handlers

  return createServerClient(url, anonKey, {
    cookies: {
      get(name: string): string | undefined {
        try {
          return store.get(name)?.value;
        } catch {
          return undefined;
        }
      },
      set(name: string, value: string, options?: CookieOptions): void {
        try {
          store.set(name, value, options);
        } catch {
          /* no-op falls nicht erlaubt */
        }
      },
      remove(name: string, options?: CookieOptions): void {
        try {
          store.set(name, "", { ...options, maxAge: 0 });
        } catch {
          /* no-op */
        }
      },
    },
  });
}
