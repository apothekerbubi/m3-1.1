// src/app/api/profile/ensure/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const supabase = createClient();

  const { data: { user }, error: userErr } = await supabase.auth.getUser();
  if (userErr || !user) {
    return NextResponse.json({ ok: false, error: userErr?.message || "Not authenticated" }, { status: 401 });
  }

  // 1) Bestehendes Profil holen (kann null sein)
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  // 2) Metadaten robust auslesen (beide Varianten unterstützen)
  const md = (user.user_metadata || {}) as Record<string, unknown>;
  const mdFirst = (md.first_name as string) || null;
  const mdLast  = (md.last_name as string) || null;
  const mdSem   = (md.semester as string) || null;
  const mdHome  = (md.home_uni as string) || (md.home_uni as string) || null; // 👈 beide
  const mdPj    = (md.pj_wahlfach as string) || (md.pj_wahlfach as string) || null;     // 👈 beide
  const mdDate  = (md.exam_date as string) || null; // "YYYY-MM-DD" oder null

  // 3) Zusammenführen: vorhandenes Profil hat Vorrang; sonst Metadaten; sonst null
  const merged = {
    id: user.id,
    email: user.email,
    first_name: profile?.first_name ?? mdFirst ?? null,
    last_name:  profile?.last_name  ?? mdLast  ?? null,
    semester:   profile?.semester   ?? mdSem   ?? null,
    home_uni:   profile?.home_uni   ?? mdHome  ?? null,
    pj_wahlfach:profile?.pj_wahlfach?? mdPj    ?? null,
    exam_date:  profile?.exam_date  ?? mdDate  ?? null,
  };

  // 4) Upsert (legt an oder aktualisiert fehlende Werte)
  const { error } = await supabase
    .from("profiles")
    .upsert(merged, { onConflict: "id" });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, merged });
}