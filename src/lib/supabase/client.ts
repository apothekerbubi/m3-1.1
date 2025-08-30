// src/lib/supabase/client.ts
"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

export function hasSupabaseEnv(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

/**
 * Liefert einen gecachten Supabase-Browser-Client, falls ENV vorhanden.
 * Gibt andernfalls `null` zurück (wirft NICHT).
 */
export function createBrowserSupabase(): SupabaseClient | null {
  if (!hasSupabaseEnv()) return null;
  if (_client) return _client;

  _client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
    {
      // ⚡ wichtig, damit Session/Token im Browser erhalten bleiben
      auth: { persistSession: true },
    }
  );
  return _client;
}

/**
 * Variante mit Fehler, falls ENV fehlt.
 */
export function requireBrowserSupabase(): SupabaseClient {
  const c = createBrowserSupabase();
  if (!c) {
    throw new Error(
      "Supabase Env fehlt. Bitte NEXT_PUBLIC_SUPABASE_URL und NEXT_PUBLIC_SUPABASE_ANON_KEY setzen."
    );
  }
  return c;
}