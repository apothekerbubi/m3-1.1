// src/app/account/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase/client";
import LogoutButton from "@/components/LogoutButton";
import type { PostgrestError } from "@supabase/supabase-js";

type Profile = {
  first_name?: string | null;
  last_name?: string | null;
  semester?: string | null;
  home_uni?: string | null;
  pj_wahlfach?: string | null;
  exam_date?: string | null;
};

export default function AccountPage() {
  const supabase = createBrowserSupabase();
  const router = useRouter();

  const [email, setEmail] = useState<string>("");
  const [profile, setProfile] = useState<Profile>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Daten beim Laden holen
  useEffect(() => {
    (async () => {
      if (!supabase) return;

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        console.error("Session Error:", sessionError);
        setLoading(false);
        return;
      }

      if (!session) {
        router.replace("/login");
        return;
      }

      setEmail(session.user.email || "");

      // Metadaten aus Auth
      const md = session.user.user_metadata || {};

      // Profile aus Tabelle
      const { data, error } = await supabase
        .from("profiles")
        .select("first_name,last_name,semester,home_uni,pj_wahlfach,exam_date")
        .eq("id", session.user.id)
        .maybeSingle();

      if (error) {
        console.error("DB Error (load):", error);
      }

      setProfile({
        first_name: data?.first_name ?? md.first_name ?? "",
        last_name: data?.last_name ?? md.last_name ?? "",
        semester: data?.semester ?? md.semester ?? "",
        home_uni: data?.home_uni ?? md.home_uni ?? "",
        pj_wahlfach: data?.pj_wahlfach ?? md.pj_wahlfach ?? "",
        exam_date: data?.exam_date ?? md.exam_date ?? "",
      });

      setLoading(false);
    })();
  }, [router, supabase]);

  async function saveProfile() {
    if (!supabase) return;
    setSaving(true);
    setMessage(null);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;
      if (!user) {
        router.replace("/login");
        return;
      }

      // Auth-Metadaten aktualisieren
      const { error: metaError } = await supabase.auth.updateUser({
        data: profile,
      });
      if (metaError) throw metaError;

      // Tabelle "profiles" upsert
      const { error: dbError } = await supabase.from("profiles").upsert(
        {
          id: user.id,
          ...profile,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );
      if (dbError) throw dbError;

      setMessage("Profil erfolgreich gespeichert ✅");
    } catch (err) {
      if (isPostgrestError(err)) {
        console.error("Postgrest Error:", err);
        setMessage(err.message || "Fehler beim Speichern ❌");
      } else if (err instanceof Error) {
        console.error("Error:", err);
        setMessage(err.message);
      } else {
        console.error("Unbekannter Fehler:", err);
        setMessage("Fehler beim Speichern ❌");
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-2xl p-6 text-sm text-gray-600">
        Lade Account…
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dein Account</h1>
        <LogoutButton />
      </div>

      <div className="rounded-xl border border-black/10 bg-white p-4 space-y-4">
        <div>
          <label className="text-xs text-gray-500">E-Mail</label>
          <div className="text-sm font-medium">{email}</div>
        </div>

        <Field
          label="Vorname"
          value={profile.first_name}
          onChange={(v) => setProfile({ ...profile, first_name: v })}
        />
        <Field
          label="Nachname"
          value={profile.last_name}
          onChange={(v) => setProfile({ ...profile, last_name: v })}
        />
        <Field
          label="Semester"
          value={profile.semester}
          onChange={(v) => setProfile({ ...profile, semester: v })}
        />
        <Field
          label="Heimatuni"
          value={profile.home_uni}
          onChange={(v) => setProfile({ ...profile, home_uni: v })}
        />
        <Field
          label="PJ-Wahlfach"
          value={profile.pj_wahlfach}
          onChange={(v) => setProfile({ ...profile, pj_wahlfach: v })}
        />
        <Field
          label="Prüfungsdatum"
          type="date"
          value={profile.exam_date || ""}
          onChange={(v) => setProfile({ ...profile, exam_date: v })}
        />

        {message && <div className="text-sm text-gray-700">{message}</div>}

        <button
          onClick={saveProfile}
          disabled={saving}
          className="w-full rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "Speichere..." : "Speichern"}
        </button>
      </div>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value?: string | null;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-xs text-gray-600 mb-1">{label}</label>
      <input
        type={type}
        className="w-full rounded-md border border-black/10 px-3 py-2 text-sm"
        value={value || ""}
        onChange={(e) => onChange(e.currentTarget.value)}
      />
    </div>
  );
}

// Type Guard für PostgrestError
function isPostgrestError(err: unknown): err is PostgrestError {
  return typeof err === "object" && err !== null && "message" in err && "code" in err;
}