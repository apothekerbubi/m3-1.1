// src/lib/supabase/server.ts
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies, headers } from "next/headers";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      "Supabase ist nicht konfiguriert: Bitte NEXT_PUBLIC_SUPABASE_URL und NEXT_PUBLIC_SUPABASE_ANON_KEY setzen."
    );
  }

  return createServerClient(url, anonKey, {
    cookies: {
      get: async (name: string) => {
        const store = await cookies();
        return store.get(name)?.value;
      },
      set: async (name: string, value: string, options?: CookieOptions) => {
        const store = await cookies();
        store.set(name, value, options);
      },
      remove: async (name: string, options?: CookieOptions) => {
        const store = await cookies();
        store.set(name, "", { ...options, maxAge: 0 });
      },
    },
    headers: {
      get: (key: string) => headers().get(key) ?? undefined,
    },
  });
}