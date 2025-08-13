// src/components/LogoutButton.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase/client";

export default function LogoutButton({
  className = "rounded-md border px-3 py-1.5 text-sm hover:bg-black/[.04]",
  label = "Abmelden",
}: {
  className?: string;
  label?: string;
}) {
  const router = useRouter();
  const supabase = createBrowserSupabase();
  const [loading, setLoading] = useState(false);

  async function onLogout() {
    setLoading(true);
    try {
      await supabase.auth.signOut();
      router.replace("/login");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button onClick={onLogout} disabled={loading} className={className}>
      {loading ? "…" : label}
    </button>
  );
}