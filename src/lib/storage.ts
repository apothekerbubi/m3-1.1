"use client";

import type { Attempt } from "@/lib/types";

const KEY = "m3_attempts_v1";

// Alle Versuche laden
function readAll(): Attempt[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    // Type Guard: sicherstellen, dass es wirklich ein Array ist
    return Array.isArray(parsed) ? (parsed as Attempt[]) : [];
  } catch {
    return [];
  }
}

// Alle Versuche schreiben
function writeAll(list: Attempt[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    // Fails silently (z. B. wenn Speicher voll)
  }
}

// Neuen Versuch speichern (max 200 in History)
export function saveAttempt(a: Attempt) {
  const list = readAll();
  list.unshift(a);
  writeAll(list.slice(0, 200));
}

// Einzelnen Versuch finden
export function getAttempt(id: string): Attempt | null {
  return readAll().find((x) => x.id === id) ?? null;
}

// Alle bisherigen Versuche auflisten
export function listAttempts(): Attempt[] {
  return readAll();
}
