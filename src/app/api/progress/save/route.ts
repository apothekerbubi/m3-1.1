// src/app/api/progress/save/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { caseId, score, maxScore, completed } = body as {
      caseId: string; score: number; maxScore: number; completed: boolean;
    };

    if (!caseId) return NextResponse.json({ error: "caseId missing" }, { status: 400 });

    const { error } = await supabase
      .from("progress")
      .upsert({
        user_id: user.id,
        case_id: caseId,
        score,
        max_score: maxScore,
        completed,
        completed_at: completed ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      });

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Save error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}