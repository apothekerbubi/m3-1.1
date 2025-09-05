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
  abo_start?: string | null;
  abo_name?: string | null;
  abo_price_id?: string | null;
};

export default function AccountClient() {
  const supabase = createBrowserSupabase();
  const router = useRouter();

  const [email, setEmail] = useState<string>("");
  const [profile, setProfile] = useState<Profile>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Abo-Status
  const [aboActive, setAboActive] = useState(false);
  const [aboStart, setAboStart] = useState<Date | null>(null);
  const [aboEnd, setAboEnd] = useState<Date | null>(null);

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

      const md = session.user.user_metadata || {};

      const { data, error } = await supabase
        .from("profiles")
        .select(
          "first_name,last_name,semester,home_uni,pj_wahlfach,exam_date,abo_start,abo_name,abo_price_id"
        )
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
        abo_start: data?.abo_start ?? null,
        abo_name: data?.abo_name ?? null,
        abo_price_id: data?.abo_price_id ?? null,
      });

      // Abo prüfen
      if (data?.abo_start) {
        const start = new Date(data.abo_start);
        const end = new Date(start);
        end.setMonth(end.getMonth() + 1);

        setAboStart(start);
        setAboEnd(end);
        setAboActive(new Date() < end);
      }

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

      const { error: metaError } = await supabase.auth.updateUser({
        data: profile,
      });
      if (metaError) throw metaError;

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

  async function goToStripePortal() {
    const res = await fetch("/api/stripe/portal", { method: "POST" });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
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

      <div className="mt-6 rounded-xl border border-black/10 bg-white p-4">
        <h2 className="text-lg font-semibold mb-2">Abo</h2>
        {aboActive ? (
          <>
            <p className="text-sm text-green-600">
              ✅ Aktiv bis {aboEnd?.toLocaleDateString()}
            </p>
            <p className="text-sm text-gray-600">
              Abo: {profile.abo_name ?? "Unbekannt"}
            </p>
            <button
              onClick={goToStripePortal}
              className="mt-2 rounded-md bg-gray-100 px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-200"
            >
              Abo verwalten
            </button>
          </>
        ) : (
          <>
            <p className="text-sm text-red-600">❌ Kein aktives Abo</p>
            <a
              href="/shop"
              className="mt-2 inline-block rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Zum Shop
            </a>
          </>
        )}
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

function isPostgrestError(err: unknown): err is PostgrestError {
  return (
    typeof err === "object" &&
    err !== null &&
    "message" in err &&
    "code" in err
  );
}