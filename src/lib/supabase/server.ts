// src/lib/supabase/server.ts
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

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
      get(name: string) {
        const store = cookies();
        return store.get(name)?.value;
      },
      set(name: string, value: string, options?: CookieOptions) {
        const store = cookies();
        store.set(name, value, options);
      },
      remove(name: string, options?: CookieOptions) {
        const store = cookies();
        store.set(name, "", { ...options, maxAge: 0 });
      },
    },
  });
}