import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ items: [], counters: null });

    // 👉 1. Fälle laden
    const { data, error } = await supabase
      .from("progress")
      .select("case_id, score, max_score, completed, completed_at, updated_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (error) throw error;

    // 👉 2. Counter aus profiles laden
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("cases_started, cases_played")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) throw profileError;

    return NextResponse.json({
      items: data ?? [],
      counters: {
        cases_started: profile?.cases_started ?? 0,
        cases_played: profile?.cases_played ?? 0,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "List error";
    return NextResponse.json(
      { error: msg, items: [], counters: null },
      { status: 500 }
    );
  }
}