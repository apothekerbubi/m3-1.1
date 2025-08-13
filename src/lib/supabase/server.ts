// src/lib/supabase/server.ts
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export function createClient() {
  const cookieStore = cookies();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Supabase ist nicht konfiguriert: Bitte NEXT_PUBLIC_SUPABASE_URL und NEXT_PUBLIC_SUPABASE_ANON_KEY setzen."
    );
  }

  // Ohne generischen Typ -> kein ./types Import nötig
  return createServerClient(url, anonKey, {
    cookies: {
      get(name: string) {
        // Next.js cookies() ist im RSC-Kontext read-only → nur Wert zurückgeben
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options?: Parameters<typeof cookieStore.set>[0]) {
        // In Route-Handlern/Server Actions ist Setzen erlaubt; in reinen RSC ggf. no-op
        try {
          // cookieStore.set akzeptiert ein Objekt; wir mappen name/value hinein
          cookieStore.set({
            // @ts-expect-error – Next-Types sind hier etwas strikt; zur Laufzeit funktioniert es
            name,
            value,
            ...(options ?? {}),
          });
        } catch {
          // no-op in read-only Kontexten
        }
      },
      remove(name: string, options?: Parameters<typeof cookieStore.set>[0]) {
        try {
          cookieStore.set({
            // @ts-expect-error wie oben
            name,
            value: "",
            ...(options ?? {}),
            maxAge: 0,
          });
        } catch {
          // no-op
        }
      },
    },
  });
}