"use client";
import type { Attempt } from "@/lib/types";
const KEY = "m3_attempts_v1";

function readAll(): Attempt[] {
  if (typeof window === "undefined") return [];
  try { const raw = localStorage.getItem(KEY); return raw ? JSON.parse(raw) as Attempt[] : []; } catch { return []; }
}
function writeAll(list: Attempt[]) { localStorage.setItem(KEY, JSON.stringify(list)); }

export function saveAttempt(a: Attempt) { const list = readAll(); list.unshift(a); writeAll(list.slice(0, 200)); }
export function getAttempt(id: string) { return readAll().find((x) => x.id === id) ?? null; }
export function listAttempts() { return readAll(); }