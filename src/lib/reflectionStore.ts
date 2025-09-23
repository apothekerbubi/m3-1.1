export type ReflectionTurn = { role: "examiner" | "student"; text: string };

export type ReflectionStepSnapshot = {
  order: number;
  prompt: string;
  bestScore: number;
  transcript: ReflectionTurn[];
  solutionText: string;
  studentUnion: string[];
  rule?: unknown;
};

export type ReflectionSnapshot = {
  caseId: string;
  caseTitle: string;
  vignette: string;
  totalScore: number;
  maxScore: number;
  completedAt: string;
  steps: ReflectionStepSnapshot[];
  series?: {
    ids: string[];
    index: number;
    sid: string | null;
  };
};

function storageKey(caseId: string): string {
  return `exam:reflection:${caseId}`;
}

export function saveReflectionSnapshot(caseId: string, snapshot: ReflectionSnapshot): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(storageKey(caseId), JSON.stringify(snapshot));
  } catch {
    // ignore storage errors (quota, private mode, ...)
  }
}

export function readReflectionSnapshot(caseId: string): ReflectionSnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(storageKey(caseId));
    if (!raw) return null;
    return JSON.parse(raw) as ReflectionSnapshot;
  } catch {
    return null;
  }
}

export function clearReflectionSnapshot(caseId: string): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(storageKey(caseId));
  } catch {
    // ignore
  }
}