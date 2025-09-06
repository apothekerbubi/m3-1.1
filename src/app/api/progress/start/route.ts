import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { caseId } = body as { caseId: string };

    if (!caseId) {
      return NextResponse.json({ error: "caseId missing" }, { status: 400 });
    }

    // Schon mal gestartet?
    const { data: existing } = await supabase
      .from("progress")
      .select("case_id")
      .eq("user_id", user.id)
      .eq("case_id", caseId)
      .maybeSingle();

    // Wenn nicht vorhanden → Progress-Eintrag anlegen
    if (!existing) {
      await supabase.from("progress").insert({
        user_id: user.id,
        case_id: caseId,
        completed: false,
        updated_at: new Date().toISOString(),
      });

      // cases_started +1
      const { data: profile } = await supabase
        .from("profiles")
        .select("cases_started")
        .eq("id", user.id)
        .maybeSingle();

      const started = (profile?.cases_started ?? 0) + 1;
      await supabase.from("profiles").update({ cases_started: started }).eq("id", user.id);
    }

    // cases_played immer +1
    const { data: profile2 } = await supabase
      .from("profiles")
      .select("cases_played")
      .eq("id", user.id)
      .maybeSingle();

    const played = (profile2?.cases_played ?? 0) + 1;
    await supabase.from("profiles").update({ cases_played: played }).eq("id", user.id);

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("❌ Progress Start Error:", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "Start error" }, { status: 500 });
  }
}