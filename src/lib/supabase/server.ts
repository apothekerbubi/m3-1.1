// src/lib/supabase/server.ts
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

function makeClient(cookieStore: any) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      "Supabase ist nicht konfiguriert: Bitte NEXT_PUBLIC_SUPABASE_URL und NEXT_PUBLIC_SUPABASE_ANON_KEY setzen."
    );
  }

  return createServerClient(url, anonKey, {
    cookies: {
      get(name: string) {
        try {
          return cookieStore?.get?.(name)?.value;
        } catch {
          return undefined;
        }
      },
      set(name: string, value: string, options?: CookieOptions) {
        try {
          // In RSC ist set nicht erlaubt → Fehler ignorieren
          cookieStore?.set?.(name, value, options);
        } catch {
          /* no-op */
        }
      },
      remove(name: string, options?: CookieOptions) {
        try {
          cookieStore?.set?.(name, "", { ...options, maxAge: 0 });
        } catch {
          /* no-op */
        }
      },
    },
  });
}

/**
 * Für Server Components / Layouts / Pages (synchrones cookies()).
 */
export function createClient() {
  const store = cookies() as any; // in RSC synchron
  return makeClient(store);
}

/**
 * Für Route Handlers (app/api/*) – asynchrones cookies().
 * In API-Routen **immer diese** Version verwenden: const supabase = await createClientRoute()
 */
export async function createClientRoute() {
  const store = (await cookies()) as any; // in Route Handlers async
  return makeClient(store);
}
