// src/app/account/page.tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AccountForm from "./AccountForm";

export default async function AccountPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Profil laden (kann beim ersten Login noch nicht existieren)
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user!.id)
    .single();

  // Email aus auth, Rest aus profiles
  const initial = {
    id: user!.id,
    email: user!.email ?? "",
    first_name: profile?.first_name ?? "",
    last_name: profile?.last_name ?? "",
    semester: profile?.semester ?? "",
    home_uni: profile?.home_uni ?? "",
    pj_wahlfach: profile?.pj_wahlfach ?? "",
    exam_date: profile?.exam_date ?? "", // ISO yyyy-mm-dd
  };

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="mb-2 text-2xl font-semibold">Account</h1>
      <p className="mb-6 text-sm text-gray-600">
        Hier kannst du deine Profildaten verwalten. Änderungen werden sofort gespeichert.
      </p>
      {/* Client-Form */}
      <AccountForm initial={initial} />
    </main>
  );
}