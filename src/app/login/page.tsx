// src/app/login/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase/client";

type Mode = "login" | "register";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createBrowserSupabase();

  // ?next= Ziel (aus URL, ohne useSearchParams → kein Suspense nötig)
  const [nextUrl, setNextUrl] = useState<string>("/subjects");

  const [mode, setMode] = useState<Mode>("login");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // gemeinsame Felder
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  // Registrierungs-Felder
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [semester, setSemester] = useState<string>("");
  const [home_uni, setHomeUni] = useState<string>("");
  const [pjTrack, setPjTrack] = useState<string>("");
  const [examDate, setExamDate] = useState<string>(""); // yyyy-mm-dd

  // next-Param aus URL lesen
  useEffect(() => {
    if (typeof window !== "undefined") {
      const u = new URL(window.location.href);
      const nxt = u.searchParams.get("next");
      if (nxt) setNextUrl(nxt);
    }
  }, []);

  // Bereits eingeloggt? -> weiter
  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.replace(nextUrl);
        router.refresh();
      }
    })();
  }, [router, supabase, nextUrl]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      if (mode === "login") {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;

        // optional: Profil anlegen/aktualisieren
        await fetch("/api/profile/ensure", { method: "POST" });

        router.replace(nextUrl);
        router.refresh();
        return;
      }

      // mode === "register"
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // Bestätigungs-Mail & Rücksprung nach Klick
          emailRedirectTo:
            typeof window !== "undefined"
              ? `${window.location.origin}/login?next=${encodeURIComponent(nextUrl)}`
              : undefined,
          // user_metadata:
          data: {
            first_name: firstName,
            last_name: lastName,
            semester,
            home_university: homeUni,
            pj_track: pjTrack,
            exam_date: examDate, // string im Format YYYY-MM-DD
          },
        },
      });
      if (signUpError) throw signUpError;

      alert("Registrierung erfolgreich! Bitte bestätige die E‑Mail und melde dich dann an.");
      setMode("login");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Vorgang fehlgeschlagen.");
    } finally {
      setSubmitting(false);
    }
  }

  async function onMagicLink() {
    setSubmitting(true);
    setError(null);

    try {
      const redirect =
        typeof window !== "undefined"
          ? `${window.location.origin}${nextUrl || "/subjects"}`
          : undefined;

      const { error: otpError } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: redirect },
      });
      if (otpError) throw otpError;

      alert("Magic Link gesendet – bitte E‑Mail prüfen.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Senden des Magic Links fehlgeschlagen.");
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
          Nach erstmaliger Registrierung <b>bitte deine E‑Mail bestätigen</b>. Danach kannst du dich
          hier ganz normal anmelden.
        </div>
      ) : (
        <div className="mb-3 rounded-md border border-blue-100 bg-blue-50 p-3 text-sm text-blue-800">
          Nach der Registrierung schicken wir dir eine <b>Bestätigungs‑E‑Mail</b>. Erst nach Klick
          auf den Link kannst du dich anmelden.
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-3">
        {/* E-Mail & Passwort */}
        <div>
          <label className="block text-xs text-gray-600">E‑Mail</label>
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
                placeholder="z. B. 10"
                value={semester}
                onChange={(e) => setSemester(e.currentTarget.value)}
              />
            </div>

            <div>
              <label className="block text-xs text-gray-600">Heimatuni</label>
              <input
                className="w-full rounded-md border border-black/10 px-3 py-2 text-sm"
                placeholder="z. B. LMU München"
                value={homeUni}
                onChange={(e) => setHomeUni(e.currentTarget.value)}
              />
            </div>

            <div>
              <label className="block text-xs text-gray-600">PJ‑Wahlfach</label>
              <input
                className="w-full rounded-md border border-black/10 px-3 py-2 text-sm"
                placeholder="z. B. Innere Medizin"
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

        {error && (
          <div className="rounded-md bg-red-50 p-2 text-sm text-red-700">{error}</div>
        )}

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
            onClick={onMagicLink}
            disabled={submitting || !email}
            className="w-full rounded-md border px-3 py-2 text-sm"
            title="Login per Magic Link"
          >
            Magic Link senden
          </button>
        )}

        <div className="text-sm">
          {mode === "login" ? (
            <>
              Noch kein Konto?{" "}
              <button
                type="button"
                onClick={() => setMode("register")}
                className="underline"
              >
                Jetzt registrieren
              </button>
            </>
          ) : (
            <>
              Schon ein Konto?{" "}
              <button
                type="button"
                onClick={() => setMode("login")}
                className="underline"
              >
                Zur Anmeldung
              </button>
            </>
          )}
        </div>
      </form>
    </main>
  );
}