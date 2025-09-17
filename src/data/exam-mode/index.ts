import { aszites_001_exam } from "../innere/gastroenterologie/aszites_001";
import type { ExamModeCase } from "@/lib/types";

export const EXAM_MODE_CASES: ExamModeCase[] = [aszites_001_exam];

const EXAM_MODE_CASE_MAP = new Map(EXAM_MODE_CASES.map((c) => [c.id, c] as const));

export function getExamModeCase(id: string | null | undefined): ExamModeCase | null {
  if (!id) return null;
  return EXAM_MODE_CASE_MAP.get(id) ?? null;
}

export function hasExamModeCase(id: string | null | undefined): boolean {
  if (!id) return false;
  return EXAM_MODE_CASE_MAP.has(id);
}
