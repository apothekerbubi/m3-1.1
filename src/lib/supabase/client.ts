// src/lib/supabase/client.ts
// Client‑seitiger Supabase Client (für Login/Registrierung etc.)
import { createBrowserClient } from "@supabase/ssr";

export function createBrowserSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Fehlende Supabase Umgebungsvariablen: NEXT_PUBLIC_SUPABASE_URL und/oder NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }

  // Type-Parameter ist optional – so vermeiden wir einen fehlenden ./types-Import
  return createBrowserClient(url, anonKey);
}