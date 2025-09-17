// src/lib/exam-mode.ts
import type { ExamModeAction, ExamModeCase } from "./types";

export type ExamModeState = {
  unlocked: Set<string>;
  completed: Set<string>;
  finished: boolean;
};

export type ExamModeEvaluation =
  | {
      kind: "success";
      actionKey: string;
      action: ExamModeAction;
      newlyUnlocked: string[];
      finished: boolean;
    }
  | {
      kind: "repeat";
      actionKey: string;
      action: ExamModeAction;
    }
  | { kind: "locked"; actionKey: string }
  | { kind: "unknown" };

export function createInitialExamModeState(caseData: ExamModeCase): ExamModeState {
  return {
    unlocked: new Set(caseData.startActions),
    completed: new Set<string>(),
    finished: false,
  };
}

export function evaluateExamModeInput(
  caseData: ExamModeCase,
  state: ExamModeState,
  rawInput: string
): { evaluation: ExamModeEvaluation; nextState: ExamModeState } {
  const normalized = (rawInput || "").toLowerCase();
  const entries = Object.entries(caseData.actions);

  for (const [key, action] of entries) {
    const hits = action.keywords.some((kw) => normalized.includes(kw.toLowerCase()));
    if (!hits) continue;

    if (!state.unlocked.has(key)) {
      return {
        evaluation: { kind: "locked", actionKey: key },
        nextState: state,
      };
    }

    const nextUnlocked = new Set(state.unlocked);
    const nextCompleted = new Set(state.completed);
    const alreadyDone = nextCompleted.has(key);

    let newlyUnlocked: string[] = [];

    if (!alreadyDone) {
      if (Array.isArray(action.unlocks) && action.unlocks.length) {
        newlyUnlocked = action.unlocks.filter((u) => !nextUnlocked.has(u));
        for (const u of action.unlocks) {
          nextUnlocked.add(u);
        }
      }
      nextCompleted.add(key);
    }

    const completesCase = !alreadyDone && caseData.completionActions?.includes(key);

    const nextState: ExamModeState = {
      unlocked: nextUnlocked,
      completed: nextCompleted,
      finished: state.finished || Boolean(completesCase),
    };

    if (alreadyDone) {
      return {
        evaluation: { kind: "repeat", actionKey: key, action },
        nextState,
      };
    }

    return {
      evaluation: {
        kind: "success",
        actionKey: key,
        action,
        newlyUnlocked,
        finished: nextState.finished,
      },
      nextState,
    };
  }

  return {
    evaluation: { kind: "unknown" },
    nextState: state,
  };
}
