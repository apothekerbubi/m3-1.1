import { NextResponse } from "next/server";
export const runtime = "nodejs";

export async function GET() {
  const v = process.env.OPENAI_API_KEY;
  return NextResponse.json({
    hasKey: Boolean(v),
    startsWithSk: v?.startsWith("sk-") ?? false,
    len: v ? v.length : 0,
    nodeVersion: process.version,
  });
}