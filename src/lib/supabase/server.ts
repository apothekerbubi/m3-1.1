// src/lib/supabase/server.ts
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

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
 * Einheitlicher Server-Client (immer async, da cookies() ein Promise ist).
 * Verwendung: const supabase = await createClient();
 */
export async function createClient() {
  const { url, anonKey } = getEnv();
  const store = await cookies(); // <-- async in deiner Next-Version

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
          /* read-only Kontext ignorieren */
        }
      },
      remove(name: string, options?: CookieOptions): void {
        try {
          store.set(name, "", { ...options, maxAge: 0 });
        } catch {
          /* read-only Kontext ignorieren */
        }
      },
    },
  });
}

/** Alias, falls du irgendwo bereits createClientRoute importierst */
export const createClientRoute = createClient;
