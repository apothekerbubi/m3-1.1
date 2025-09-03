// src/app/login/page.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase/client";

type Mode = "login" | "register";

export default function LoginPage() {
  const router = useRouter();

  // Supabase-Client sicher in einem Ref halten (kann null sein)
  const supabaseRef = useRef<ReturnType<typeof createBrowserSupabase> | null>(null);

  // Redirect-Ziel ohne useSearchParams (vermeidet Suspense-Warnung)
  const [nextUrl, setNextUrl] = useState("/subjects");
  useEffect(() => {
    if (typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search);
      setNextUrl(sp.get("next") || "/subjects");
    }
  }, []);

  const [mode, setMode] = useState<Mode>("login");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // gemeinsame Felder
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Registrierungs-Felder
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [semester, setSemester] = useState("");
  const [homeUni, setHomeUni] = useState("");
  const [pjTrack, setPjTrack] = useState("");
  const [examDate, setExamDate] = useState(""); // yyyy-mm-dd

  // Supabase initialisieren + „bereits eingeloggt?” prüfen
  useEffect(() => {
    let alive = true;

    (async () => {
      supabaseRef.current = createBrowserSupabase();
      const sb = supabaseRef.current;

      // Falls ENV fehlen / Client nicht erstellt werden kann → UI-Hinweis
      if (!sb) {
        if (alive) {
          setError("Login momentan nicht verfügbar (Konfiguration fehlt).");
        }
        return;
      }

      const { data, error: sessErr } = await sb.auth.getSession();
      if (!alive) return;

      if (!sessErr && data?.session) {
        router.replace("/overview");
        router.refresh();
      }
    })();

    return () => {
      alive = false;
    };
  }, [router, nextUrl]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const sb = supabaseRef.current;
      if (!sb) {
        throw new Error("Login/Registrierung nicht möglich (Konfiguration fehlt).");
      }

      if (mode === "login") {
        const { error: signInError } = await sb.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;

        // Profil sicherstellen (legt profiles an/füllt Metadaten)
        await fetch("/api/profile/ensure", { method: "POST" });

       router.replace("/overview");
        router.refresh();
        return;
      }

      // mode === "register"
      const { data, error: signUpError } = await sb.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo:
            typeof window !== "undefined"
              ? `${window.location.origin}/login?next=${encodeURIComponent(nextUrl)}`
              : undefined,
          data: {
            first_name: firstName,
            last_name: lastName,
            semester,
            home_uni: homeUni,
            pj_wahlfach: pjTrack,
            exam_date: examDate, // "YYYY-MM-DD"
          },
        },
      });
      if (signUpError) {
        if (signUpError.message.toLowerCase().includes("already registered")) {
          throw new Error("Diese E-Mail-Adresse ist bereits registriert.");
        }
        throw signUpError;
      }

      if (data.user && !data.user.identities?.length) {
        throw new Error("Diese E-Mail-Adresse ist bereits registriert.");
      }

      alert("Registrierung erfolgreich! Bitte bestätige die E-Mail und melde dich dann an.");
      setMode("login");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Vorgang fehlgeschlagen.");
    } finally {
      setSubmitting(false);
    }
  }

  // Passwort-Reset per E-Mail
  async function onForgotPassword() {
    setSubmitting(true);
    setError(null);
    try {
      const sb = supabaseRef.current;
      if (!sb) throw new Error("Passwort-Reset nicht möglich (Konfiguration fehlt).");
      if (!email) throw new Error("Bitte gib zuerst deine E-Mail-Adresse ein.");

      const { error: resetError } = await sb.auth.resetPasswordForEmail(email, {
        redirectTo:
          typeof window !== "undefined"
            ? `${window.location.origin}/reset-password`
            : undefined,
      });
      if (resetError) throw resetError;
      alert("Wir haben dir einen Link zum Zurücksetzen des Passworts geschickt.");
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Senden des Reset-Links ist fehlgeschlagen."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="mb-2 text-2xl font-semibold">
        {mode === "login" ? "Anmelden" : "Konto erstellen"}
      </h1>

      {mode === "login" ? (
        <div className="mb-3 rounded-md border border-amber-100 bg-amber-50 p-3 text-sm text-amber-800">
          Nach erstmaliger Registrierung <b>bitte deine E-Mail bestätigen</b>. Danach kannst du dich
          hier ganz normal anmelden.
        </div>
      ) : (
        <div className="mb-3 rounded-md border border-blue-100 bg-blue-50 p-3 text-sm text-blue-800">
          Nach der Registrierung schicken wir dir eine <b>Bestätigungs-E-Mail</b>. Erst nach Klick
          auf den Link kannst du dich anmelden.
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-3">
        {/* E-Mail & Passwort */}
        <div>
          <label className="block text-xs text-gray-600">E-Mail</label>
          <input
            type="email"
            className="w-full rounded-md border border-black/10 px-3 py-2 text-sm"
            value={email}
            onChange={(e) => setEmail(e.currentTarget.value)}
            required
            autoComplete={mode === "login" ? "email" : "new-email"}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-600">Passwort</label>
          <input
            type="password"
            className="w-full rounded-md border border-black/10 px-3 py-2 text-sm"
            value={password}
            onChange={(e) => setPassword(e.currentTarget.value)}
            required
            autoComplete={mode === "login" ? "current-password" : "new-password"}
          />
        </div>

        {/* Registrierungsfelder */}
        {mode === "register" && (
          <div className="grid grid-cols-1 gap-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs text-gray-600">Vorname</label>
                <input
                  className="w-full rounded-md border border-black/10 px-3 py-2 text-sm"
                  value={firstName}
                  onChange={(e) => setFirstName(e.currentTarget.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600">Nachname</label>
                <input
                  className="w-full rounded-md border border-black/10 px-3 py-2 text-sm"
                  value={lastName}
                  onChange={(e) => setLastName(e.currentTarget.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-600">Semester</label>
              <input
                className="w-full rounded-md border border-black/10 px-3 py-2 text-sm"
                placeholder="z. B. 10"
                value={semester}
                onChange={(e) => setSemester(e.currentTarget.value)}
              />
            </div>

            <div>
              <label className="block text-xs text-gray-600">Heimatuni</label>
              <input
                className="w-full rounded-md border border-black/10 px-3 py-2 text-sm"
                placeholder="z. B. LMU München"
                value={homeUni}
                onChange={(e) => setHomeUni(e.currentTarget.value)}
              />
            </div>

            <div>
              <label className="block text-xs text-gray-600">PJ-Wahlfach</label>
              <input
                className="w-full rounded-md border border-black/10 px-3 py-2 text-sm"
                placeholder="z. B. Innere Medizin"
                value={pjTrack}
                onChange={(e) => setPjTrack(e.currentTarget.value)}
              />
            </div>

            <div>
              <label className="block text-xs text-gray-600">Prüfungsdatum</label>
              <input
                type="date"
                className="w-full rounded-md border border-black/10 px-3 py-2 text-sm"
                value={examDate}
                onChange={(e) => setExamDate(e.currentTarget.value)}
              />
            </div>
          </div>
        )}

        {error && <div className="rounded-md bg-red-50 p-2 text-sm text-red-700">{error}</div>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? "Bitte warten…" : mode === "login" ? "Anmelden" : "Registrieren"}
        </button>

        {mode === "login" && (
          <button
            type="button"
            onClick={onForgotPassword}
            disabled={submitting || !email}
            className="w-full rounded-md border px-3 py-2 text-sm"
            title="Passwort zurücksetzen"
          >
            Passwort vergessen?
          </button>
        )}

        <div className="text-sm">
          {mode === "login" ? (
            <>
              Noch kein Konto?{" "}
              <button type="button" onClick={() => setMode("register")} className="underline">
                Jetzt registrieren
              </button>
            </>
          ) : (
            <>
              Schon ein Konto?{" "}
              <button type="button" onClick={() => setMode("login")} className="underline">
                Zur Anmeldung
              </button>
            </>
          )}
        </div>
      </form>
    </main>
  );
}
