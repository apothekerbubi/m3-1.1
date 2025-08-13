"use client";

import { useEffect } from "react";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function PostAuthPage() {
  const supabase = createBrowserSupabase();
  const router = useRouter();

  useEffect(() => {
    (async () => {
      // Profile anlegen/aktualisieren
      await fetch("/api/profile/ensure", { method: "POST" });
      router.replace("/subjects");
    })();
  }, []);

  return (
    <main className="mx-auto max-w-md p-6">
      <p className="text-sm text-gray-700">Anmeldung erfolgreich. Einen Moment…</p>
    </main>
  );
}