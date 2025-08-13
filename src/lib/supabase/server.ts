// server-side Supabase Client (App Router, cookies-basiert)
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "./types"; // optional: generics, kannst du später ergänzen

export function createClient() {
  const cookieStore = cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set() {
          // no-op: Next handles in middleware/route handlers
        },
        remove() {
          // no-op
        },
      },
    }
  );
}