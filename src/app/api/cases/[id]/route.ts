import { NextResponse } from "next/server";
import { CASES } from "@/data/cases";

// In Next 15 müssen die params in Routes awaited werden
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const c = CASES.find((x) => x.id === id);
  if (!c) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(c);
}