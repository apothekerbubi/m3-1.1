// src/lib/interactive-engine.ts
import type { Case, InteractiveAction, InteractiveFlow } from "./types";

export type InteractiveEvalSuccess = {
  type: "success";
  actionId: string;
  response: string;
  image?: InteractiveAction["image"];
  newlyUnlocked: string[];
  finished: boolean;
  completionMessage?: string;
};

export type InteractiveEvalLocked = {
  type: "locked";
  actionId: string;
  message?: string;
};

export type InteractiveEvalUnknown = {
  type: "unknown";
  message?: string;
};

export type InteractiveEvalFinished = {
  type: "finished";
  message?: string;
};

export type InteractiveEvalResult =
  | InteractiveEvalSuccess
  | InteractiveEvalLocked
  | InteractiveEvalUnknown
  | InteractiveEvalFinished;

export class InteractiveCaseEngine {
  private readonly flow: InteractiveFlow;
  private readonly unlocked: Set<string>;
  private completed: boolean;

  constructor(caseData: Case) {
    if (!caseData.interactive) {
      throw new Error("Case does not provide an interactive flow");
    }
    this.flow = caseData.interactive;
    this.unlocked = new Set(this.flow.initial && this.flow.initial.length ? this.flow.initial : []);
    this.completed = false;
  }

  getIntro(): string | null {
    return this.flow.intro ?? null;
  }

  handleInput(input: string): InteractiveEvalResult {
    if (this.completed) {
      return {
        type: "finished",
        message: this.flow.fallbacks?.finished,
      };
    }

    const normalized = input.toLowerCase();

    for (const [id, action] of Object.entries(this.flow.actions)) {
      const hit = action.keywords.some((kw) => normalized.includes(kw.toLowerCase()));
      if (!hit) continue;

      if (!this.unlocked.has(id)) {
        return {
          type: "locked",
          actionId: id,
          message: this.flow.fallbacks?.locked,
        };
      }

      const newlyUnlocked = Array.from(new Set(action.unlocks ?? []));
      for (const next of newlyUnlocked) this.unlocked.add(next);

      const finished = Boolean(this.flow.completion?.afterActions?.includes(id));
      if (finished) {
        this.completed = true;
      }

      return {
        type: "success",
        actionId: id,
        response: action.response,
        image: action.image,
        newlyUnlocked,
        finished,
        completionMessage: finished ? this.flow.completion?.message : undefined,
      };
    }

    return {
      type: "unknown",
      message: this.flow.fallbacks?.unknown,
    };
  }

  reset(): void {
    this.unlocked.clear();
    if (this.flow.initial) {
      for (const it of this.flow.initial) {
        this.unlocked.add(it);
      }
    }
    this.completed = false;
  }
}
