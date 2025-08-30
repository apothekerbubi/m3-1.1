import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Speichert oder aktualisiert eine Examenssimulation (Serie).
 * Wird z.B. beim Abschluss eines Falls oder am Ende einer Serie aufgerufen.
 */
export async function POST(req: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      seriesId,
      totalScore,
      totalMax,
      startedAt,
      endedAt,
    } = body as {
      seriesId: string;
      totalScore: number;
      totalMax: number;
      startedAt?: string;
      endedAt?: string;
    };

    if (!seriesId) {
      return NextResponse.json({ error: "seriesId missing" }, { status: 400 });
    }

    const { error } = await supabase.from("series_results").upsert({
      user_id: user.id,
      series_id: seriesId,
      total_score: totalScore,
      total_max: totalMax,
      started_at: startedAt ?? new Date().toISOString(),
      ended_at: endedAt ?? null,
      updated_at: new Date().toISOString(),
    });

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Save error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}