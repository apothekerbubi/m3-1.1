"use client";

import { useRef, useState } from "react";
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
  const supabaseRef = useRef<ReturnType<typeof createBrowserSupabase> | null>(null);
  supabaseRef.current = createBrowserSupabase();

  const [loading, setLoading] = useState(false);

  async function onLogout() {
    const sb = supabaseRef.current;
    if (!sb) return; // falls ENV fehlt

    setLoading(true);
    try {
      await sb.auth.signOut();
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