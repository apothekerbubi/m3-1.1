"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase/client";
import LogoutButton from "@/components/LogoutButton";
import type { PostgrestError } from "@supabase/supabase-js";
import PageHero from "@/components/PageHero";

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
      <main className="space-y-12">
        <PageHero
          badge="Account"
          title="Verwalte deine persönlichen Daten."
          description="Hier kannst du deine Angaben aktualisieren und den Status deines Abos prüfen."
          bullets={[
            { text: "Profildaten jederzeit anpassbar", colorClass: "bg-sky-300" },
            { text: "Prüfungstermin im Blick", colorClass: "bg-amber-300" },
            { text: "Direkter Zugriff auf das Abo-Portal", colorClass: "bg-emerald-300" },
          ]}
        />
        <section className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="h-5 w-40 rounded bg-slate-200/80" />
          <div className="mt-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-11 rounded-xl border border-slate-200/60 bg-slate-50" />
            ))}
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="space-y-12">
      <PageHero
        badge="Account"
        title="Verwalte deine Daten und behalte dein Abo im Blick."
        description="Aktualisiere persönliche Informationen, passe deinen Prüfungstermin an und steuere dein ExaSim-Abo."
        bullets={[
          { text: "Profilangaben und Lernstatus synchronisiert", colorClass: "bg-emerald-300" },
          { text: "Prüfungstermin für Countdown und Planung", colorClass: "bg-amber-300" },
          { text: "Direkter Zugang zum Kundenportal", colorClass: "bg-sky-300" },
        ]}
      />

      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-slate-900">Dein Profil</h2>
              <p className="text-sm text-slate-600">Passe deine Angaben jederzeit an.</p>
            </div>
            <LogoutButton />
          </div>

          <div className="mt-6 grid gap-4">
            <div>
              <label className="text-xs uppercase tracking-[0.2em] text-slate-400">E-Mail</label>
              <div className="mt-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-800">
                {email}
              </div>
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
          </div>

          {message && (
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              {message}
            </div>
          )}

          <button
            onClick={saveProfile}
            disabled={saving}
            className="mt-6 w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {saving ? "Speichere..." : "Speichern"}
          </button>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold tracking-tight text-slate-900">Abo-Status</h2>
          {aboActive ? (
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <p className="flex items-center gap-2 text-emerald-600">
                <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" /> Aktiv bis {aboEnd?.toLocaleDateString()}
              </p>
              <p>Abo: {profile.abo_name ?? "Unbekannt"}</p>
              <button
                onClick={goToStripePortal}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                Abo verwalten
              </button>
            </div>
          ) : (
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <p className="flex items-center gap-2 text-rose-600">
                <span className="inline-flex h-2 w-2 rounded-full bg-rose-500" /> Kein aktives Abo
              </p>
              <a
                href="/shop"
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
              >
                Zum Shop
              </a>
            </div>
          )}
        </section>
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
      <label className="block text-xs uppercase tracking-[0.2em] text-slate-400">{label}</label>
      <input
        type={type}
        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
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