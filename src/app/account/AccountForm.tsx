// src/app/account/AccountForm.tsx
"use client";

import { useEffect, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/client";

type AccountInitial = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  semester: string;
  home_uni: string;
  pj_wahlfach: string;
  exam_date: string; // yyyy-mm-dd oder ""
};

type PgError = { message?: string; details?: string; hint?: string };

export default function AccountForm({ initial }: { initial: AccountInitial }) {
  const supabase = createBrowserSupabase();

  const [firstName, setFirstName] = useState(initial.first_name);
  const [lastName, setLastName] = useState(initial.last_name);
  const [semester, setSemester] = useState(initial.semester);
  const [homeUni, setHomeUni] = useState(initial.home_uni);
  const [pjWahlfach, setPjWahlfach] = useState(initial.pj_wahlfach);
  const [examDate, setExamDate] = useState(initial.exam_date || "");

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // Falls das Profil (noch) nicht existiert, hier sicherheitshalber anlegen
  useEffect(() => {
    (async () => {
      try {
        await fetch("/api/profile/ensure", { method: "POST" });
      } catch {
        // still go on; upsert fängt das in der Regel ebenfalls ab
      }
    })();
  }, []);

  async function save() {
    setSaving(true);
    setMsg(null);
    setErr(null);
    try {
      const { error } = await supabase.from("profiles").upsert(
        {
          id: initial.id,
          email: initial.email,
          first_name: firstName || null,
          last_name: lastName || null,
          semester: semester || null,
          home_uni: homeUni || null,
          pj_wahlfach: pjWahlfach || null,
          exam_date: examDate || null,
        },
        { onConflict: "id" }
      );

      if (error) {
        const e = error as PgError;
        throw new Error(e.message || e.details || e.hint || "Speichern fehlgeschlagen.");
      }

      setMsg("Gespeichert.");
    } catch (e: unknown) {
      const m =
        e instanceof Error
          ? e.message
          : (e as PgError)?.message || "Speichern fehlgeschlagen.";
      setErr(m);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void save();
      }}
      className="space-y-4"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs text-gray-600">E‑Mail</label>
          <input
            value={initial.email}
            readOnly
            className="w-full cursor-not-allowed rounded-md border border-black/10 bg-gray-50 px-3 py-2 text-sm text-gray-700"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs text-gray-600">Prüfungsdatum</label>
          <input
            type="date"
            value={examDate}
            onChange={(e) => setExamDate(e.target.value)}
            className="w-full rounded-md border border-black/10 bg-white px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs text-gray-600">Vorname</label>
          <input
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="w-full rounded-md border border-black/10 bg-white px-3 py-2 text-sm"
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-xs text-gray-600">Nachname</label>
          <input
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="w-full rounded-md border border-black/10 bg-white px-3 py-2 text-sm"
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-xs text-gray-600">Semester</label>
          <input
            value={semester}
            onChange={(e) => setSemester(e.target.value)}
            placeholder="z. B. 9. Semester"
            className="w-full rounded-md border border-black/10 bg-white px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs text-gray-600">Heimatuni</label>
          <input
            value={homeUni}
            onChange={(e) => setHomeUni(e.target.value)}
            placeholder="z. B. LMU München"
            className="w-full rounded-md border border-black/10 bg-white px-3 py-2 text-sm"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs text-gray-600">PJ‑Wahlfach</label>
          <input
            value={pjWahlfach}
            onChange={(e) => setPjWahlfach(e.target.value)}
            placeholder="z. B. Kardiologie"
            className="w-full rounded-md border border-black/10 bg-white px-3 py-2 text-sm"
          />
        </div>
      </div>

      {msg && <div className="rounded-md bg-green-50 p-2 text-sm text-green-700">{msg}</div>}
      {err && <div className="rounded-md bg-red-50 p-2 text-sm text-red-700">{err}</div>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "Speichere…" : "Speichern"}
        </button>
      </div>
    </form>
  );
}