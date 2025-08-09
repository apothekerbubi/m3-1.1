export type RubricItem = { id: string; text: string; points: number; keywords: string[] };
export type RubricSection = { id: string; name: string; maxPoints: number; items: RubricItem[] };
export type CaseStep = { id: string; order: number; prompt: string; hint?: string };
export type Case = {
  id: string; title: string; specialty: string; difficulty: number; vignette: string;
  tags: string[]; steps: CaseStep[]; rubric: RubricSection[];
};

// Für alte Simulation/Stats (optional)
export type SectionScore = { name: string; got: number; max: number; missing: string[] };
export type ScoreResult = { total: number; sections: SectionScore[] };
export type Attempt = {
  id: string; caseId: string; caseTitle: string; dateISO: string; answers: string[]; result: ScoreResult;
};

export type Attempt = {
  id: string;            // z.B. crypto.randomUUID()
  caseId: string;
  caseTitle: string;
  dateISO: string;       // new Date().toISOString()
  answers: string[];     // pro Step
  result: ScoreResult;   // aus scoring.ts
};