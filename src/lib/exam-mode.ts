// src/lib/exam-mode.ts
import type { ExamModeAction, ExamModeCase } from "./types";

export type ExamModeState = {
  unlocked: Set<string>;
  completed: Set<string>;
  finished: boolean;
  activeAction: string | null;
  queue: string[];
};

export type ExamModeEvaluation =
  | {
      kind: "success";
      actionKey: string;
      action: ExamModeAction;
      hits: string[];
      finished: boolean;
    }
  | {
      kind: "needs_more";
      actionKey: string;
      action: ExamModeAction;
      hits: string[];
    }
  | { kind: "unknown" };

function normalizeText(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function createInitialExamModeState(caseData: ExamModeCase): ExamModeState {
  const uniqueStart = Array.from(new Set(caseData.startActions));
  const [first, ...rest] = uniqueStart;

  return {
    unlocked: new Set(uniqueStart),
    completed: new Set<string>(),
    finished: false,
    activeAction: first ?? null,
    queue: rest,
  };
}

export function evaluateExamModeInput(
  caseData: ExamModeCase,
  state: ExamModeState,
  rawInput: string
): { evaluation: ExamModeEvaluation; nextState: ExamModeState } {
  if (!state.activeAction) {
    return { evaluation: { kind: "unknown" }, nextState: state };
  }

  const normalized = normalizeText(rawInput || "");
  const actionKey = state.activeAction;
  const action = caseData.actions[actionKey];

  if (!action) {
    return { evaluation: { kind: "unknown" }, nextState: state };
  }

  const hits = action.expected.filter((expected) => {
    const normalizedExpected = normalizeText(expected);
    return normalized.includes(normalizedExpected);
  });

  const minHits = action.minHits ?? (action.expected.length > 0 ? 1 : 0);

  if (hits.length < minHits) {
    return {
      evaluation: {
        kind: "needs_more",
        actionKey,
        action,
        hits,
      },
      nextState: state,
    };
  }

  const nextUnlocked = new Set(state.unlocked);
  const nextCompleted = new Set(state.completed);
  nextCompleted.add(actionKey);

  const nextQueue = [...state.queue];

  if (Array.isArray(action.unlocks)) {
    for (const unlockKey of action.unlocks) {
      if (!nextUnlocked.has(unlockKey)) {
        nextUnlocked.add(unlockKey);
        nextQueue.push(unlockKey);
      } else if (!nextQueue.includes(unlockKey) && !nextCompleted.has(unlockKey)) {
        nextQueue.push(unlockKey);
      }
    }
  }

  let nextActive: string | null = null;
  const remainingQueue = [] as string[];
  for (const candidate of nextQueue) {
    if (!nextCompleted.has(candidate) && nextActive === null) {
      nextActive = candidate;
    } else if (!nextCompleted.has(candidate)) {
      remainingQueue.push(candidate);
    }
  }

  const completionActions = caseData.completionActions;
  const finishedByAction = completionActions
    ? completionActions.every((key) => nextCompleted.has(key))
    : nextActive === null;

  const nextState: ExamModeState = {
    unlocked: nextUnlocked,
    completed: nextCompleted,
    finished: state.finished || finishedByAction,
    activeAction: nextActive,
    queue: remainingQueue,
  };

  return {
    evaluation: {
      kind: "success",
      actionKey,
      action,
      hits,
      finished: nextState.finished,
    },
    nextState,
  };
}
