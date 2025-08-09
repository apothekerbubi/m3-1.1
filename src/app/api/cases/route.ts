import { NextResponse } from "next/server";
import { CASES } from "@/data/cases";
export async function GET() { return NextResponse.json(CASES); }