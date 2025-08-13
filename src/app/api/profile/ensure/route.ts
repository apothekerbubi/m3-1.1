import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  // Datenquelle: user_metadata (vom SignUp gesetzt)
  const meta = user.user_metadata || {};
  const payload = await req.json().catch(() => ({})); // erlaubt Überschreiben aus Client

  const upsertData = {
    id: user.id,
    email: user.email,
    first_name: payload.first_name ?? meta.first_name ?? null,
    last_name: payload.last_name ?? meta.last_name ?? null,
    semester: payload.semester ?? meta.semester ?? null,
    home_uni: payload.home_uni ?? meta.home_uni ?? null,
    pj_wahlfach: payload.pj_wahlfach ?? meta.pj_wahlfach ?? null,
    exam_date: payload.exam_date ?? meta.exam_date ?? null,
  };

  const { error } = await supabase
    .from("profiles")
    .upsert(upsertData, { onConflict: "id" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}