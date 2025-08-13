"use client";

import { useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/client";

export default function RegisterPage() {
  const supabase = createBrowserSupabase();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Zusätzliche Felder
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [semester, setSemester] = useState("");
  const [homeUni, setHomeUni] = useState("");
  const [pjWahlfach, setPjWahlfach] = useState("");
  const [examDate, setExamDate] = useState(""); // yyyy-mm-dd

  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const origin = window.location.origin;

      // Wichtig: zusätzliche Felder in user_metadata mitgeben
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${origin}/auth/callback`,
          data: {
            first_name: firstName,
            last_name: lastName,
            semester,
            home_uni: homeUni,
            pj_wahlfach: pjWahlfach,
            exam_date: examDate || null,
          },
        },
      });

      if (signUpError) throw signUpError;

      setDone(true);
    } catch (err: any) {
      setError(err.message || "Registrierung fehlgeschlagen.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <main className="mx-auto max-w-md p-6">
        <h1 className="mb-2 text-xl font-semibold">Bestätige deine E‑Mail</h1>
        <p className="text-sm text-gray-700">
          Wir haben dir eine E‑Mail geschickt. <b>Bitte bestätige deine Registrierung</b>. 
          Danach kannst du dich ganz normal einloggen.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="mb-4 text-2xl font-semibold">Registrieren</h1>

      <div className="mb-3 rounded-md border border-blue-100 bg-blue-50 p-3 text-sm text-blue-800">
        Nach der Registrierung erhältst du eine <b>Bestätigungs‑E‑Mail</b>.
        Erst danach kannst du dich anmelden.
      </div>

      <form onSubmit={onSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-600">Vorname</label>
            <input
              className="w-full rounded-md border border-black/10 px-3 py-2 text-sm"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600">Nachname</label>
            <input
              className="w-full rounded-md border border-black/10 px-3 py-2 text-sm"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs text-gray-600">Semester</label>
          <input
            className="w-full rounded-md border border-black/10 px-3 py-2 text-sm"
            placeholder="z. B. 9. Semester"
            value={semester}
            onChange={(e) => setSemester(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-xs text-gray-600">Heimatuni</label>
          <input
            className="w-full rounded-md border border-black/10 px-3 py-2 text-sm"
            placeholder="z. B. LMU München"
            value={homeUni}
            onChange={(e) => setHomeUni(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-xs text-gray-600">PJ‑Wahlfach</label>
          <input
            className="w-full rounded-md border border-black/10 px-3 py-2 text-sm"
            placeholder="z. B. Kardiologie"
            value={pjWahlfach}
            onChange={(e) => setPjWahlfach(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-xs text-gray-600">Prüfungsdatum</label>
          <input
            type="date"
            className="w-full rounded-md border border-black/10 px-3 py-2 text-sm"
            value={examDate}
            onChange={(e) => setExamDate(e.target.value)}
          />
        </div>

        <div className="pt-1">
          <label className="block text-xs text-gray-600">E‑Mail</label>
          <input
            type="email"
            className="w-full rounded-md border border-black/10 px-3 py-2 text-sm"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-600">Passwort</label>
          <input
            type="password"
            className="w-full rounded-md border border-black/10 px-3 py-2 text-sm"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
          />
        </div>

        {error && <div className="rounded-md bg-red-50 p-2 text-sm text-red-700">{error}</div>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? "Sende..." : "Registrieren"}
        </button>

        <p className="text-center text-xs text-gray-600">
          Mit der Registrierung stimmst du unseren AGB & Datenschutz zu.
        </p>
      </form>
    </main>
  );
}