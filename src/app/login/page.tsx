"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase/client";

export default function LoginPage() {
  const supabase = createBrowserSupabase();
  const router = useRouter();
  const sp = useSearchParams();
  const redirectTo = sp.get("next") || "/subjects";

  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"login"|"register">("login");
  const [error, setError] = useState<string>("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password: pw });
        if (error) throw error;
      }
      router.replace(redirectTo);
      router.refresh();
    } catch (err: any) {
      setError(err?.message || "Login fehlgeschlagen");
    } finally {
      setLoading(false);
    }
  }

  async function magicLink() {
    setLoading(true);
    setError("");
    try {
      const { error } = await supabase.auth.signInWithOtp({ email });
      if (error) throw error;
      alert("Magic Link gesendet – bitte E-Mail prüfen.");
    } catch (err: any) {
      setError(err?.message || "Fehler beim Senden");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-sm p-6">
      <h1 className="mb-4 text-2xl font-semibold">{mode === "login" ? "Anmelden" : "Konto erstellen"}</h1>

      <form onSubmit={onSubmit} className="space-y-3">
        <input
          type="email"
          placeholder="E-Mail"
          className="w-full rounded-md border border-black/10 px-3 py-2"
          value={email}
          onChange={(e)=>setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Passwort"
          className="w-full rounded-md border border-black/10 px-3 py-2"
          value={pw}
          onChange={(e)=>setPw(e.target.value)}
          required={mode==="login" || mode==="register"}
        />

        {error && <div className="text-sm text-red-600">{error}</div>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-blue-600 px-3 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "…" : (mode === "login" ? "Anmelden" : "Registrieren")}
        </button>

        <button
          type="button"
          onClick={magicLink}
          disabled={loading || !email}
          className="w-full rounded-md border px-3 py-2"
          title="Login per Magic Link"
        >
          Magic Link senden
        </button>

        <div className="text-sm">
          {mode === "login" ? (
            <>Noch kein Konto?{" "}
              <button type="button" onClick={()=>setMode("register")} className="underline">
                Jetzt registrieren
              </button>
            </>
          ) : (
            <>Schon ein Konto?{" "}
              <button type="button" onClick={()=>setMode("login")} className="underline">
                Zur Anmeldung
              </button>
            </>
          )}
        </div>
      </form>
    </main>
  );
}