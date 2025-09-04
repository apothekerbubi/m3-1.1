import { supabaseAdmin } from "@/lib/supabase/admin";

export async function hasActiveSubscription(userId: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from("subscriptions")
    .select("status, current_period_end")
    .eq("user_id", userId);

  if (error || !data) return false;

  const now = new Date();
  return data.some(row => {
    const active = row.status === "active" || row.status === "trialing";
    const notExpired = !row.current_period_end || new Date(row.current_period_end) > now;
    return active && notExpired;
  });
}

