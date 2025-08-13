import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  // Supabase erledigt das Session-Setzen per URL-Params automatisch,
  // danach an Startseite (oder /subjects) und Profil absichern.
  const url = new URL(req.url);
  const redirectTo = url.origin + "/post-auth";
  return NextResponse.redirect(redirectTo);
}