// src/app/account/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase/client";
import LogoutButton from "@/components/LogoutButton";

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

  useEffect(() => {
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace("/login");
        return;
      }

      setEmail(session.user.email || "");

      // user_metadata (falls du das in Supabase bei Registrierung speicherst)
      const md = session.user.user_metadata || {};
      setProfile({
        first_name: md.first_name ?? null,
        last_name: md.last_name ?? null,
        semester: md.semester ?? null,
        home_uni: md.home_uni ?? null,
        pj_wahlfach: md.pj_wahlfach ?? null,
        exam_date: md.exam_date ?? null,
      });

      setLoading(false);
    })();
  }, [router, supabase]);

  if (loading) {
    return <main className="mx-auto max-w-2xl p-6 text-sm text-gray-600">Lade Account…</main>;
  }

  return (
    <main className="mx-auto max-w-2xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dein Account</h1>
        <LogoutButton />
      </div>

      <div className="rounded-xl border border-black/10 bg-white p-4">
        <div className="mb-4">
          <div className="text-xs text-gray-500">E‑Mail</div>
          <div className="text-sm font-medium">{email}</div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Vorname" value={profile.first_name} />
          <Field label="Nachname" value={profile.last_name} />
          <Field label="Semester" value={profile.semester} />
          <Field label="Heimatuni" value={profile.home_uni} />
          <Field label="PJ‑Wahlfach" value={profile.pj_wahlfach} />
          <Field label="Prüfungsdatum" value={profile.exam_date} />
        </div>
      </div>
    </main>
  );
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-sm font-medium">{value || "—"}</div>
    </div>
  );
}