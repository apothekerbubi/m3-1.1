// src/app/api/progress/list/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ items: [] });

    const { data, error } = await supabase
      .from("progress")
      .select("case_id, score, max_score, completed, completed_at, updated_at")
      .order("updated_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json({ items: data ?? [] });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "List error";
    return NextResponse.json({ error: msg, items: [] }, { status: 500 });
  }
}