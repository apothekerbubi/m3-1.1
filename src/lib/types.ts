// src/lib/types.ts

// ---- Scoring-Ergebnis ----
export type SectionScore = {
  name: string;
  got: number;
  max: number;
  missing: string[]; // fehlende Keywords (dedupliziert)
};

// ✅ Ziele/Checkliste pro Fall (frei textlich, fürs LLM)
export type Objective = {
  id: string;           // z.B. "ddx", "workup", "initial_tx"
  label: string;        // z.B. "2–3 plausible DD nennen"
  description?: string; // optionale Details
};

// ✅ Regeln, wann der Fall „fertig“ ist
export type CompletionRules = {
  minObjectives: number;   // z.B. 3 (wie viele Ziele müssen erfüllt sein)
  maxLLMTurns?: number;    // optional: wie viele Prüfer-Fragen max.
  hardStopTurns?: number;  // optional: absolute Notbremse (Fragen-Anzahl)
};

// ⬇️ dein Case-Typ um optionale Felder ergänzen:
declare module "@/lib/types-augment" {} // (nur falls TS meckert; ignorier sonst)

export type { Case } from "./types"; // falls du einen zentralen Export hast

// Falls du deinen Case lokal definierst, erweitere ihn um:
export type Case = {
  id: string;
  title: string;
  subject: string;      // Innere / Chirurgie / Wahlfach ...
  category: string;     // Kardiologie / ...
  difficulty: number;
  tags: string[];
  vignette: string;
  steps: { order: number; prompt: string; hint?: string }[];

  // bereits vorhandene Rubric bleibt, egal in welcher Form

  // ⬇️ neu & optional:
  objectives?: Objective[];
  completion?: CompletionRules;
};

export type ScoreResult = {
  total: number;
  sections: SectionScore[];
};

// ---- Einfache Rubrik (flach) ----
// z. B. sections: [{ name, points, keywords: [...] }]
export type RubricSection = {
  name: string;
  points: number;
  keywords: string[];
};
export type RubricSimple = {
  sections: RubricSection[];
};

export type Subject = "Innere Medizin" | "Chirurgie" | "Wahlfach";

export type Case = {
  id: string;
  title: string;
  vignette: string;
  tags: string[];
  steps: CaseStep[];
  rubric: Rubric | RubricSection[] | RubricSectionDetailed[];
  specialty?: string;
  difficulty?: string | number;

  // NEU:
  subject: Subject;    // z. B. "Innere Medizin"
  category: string;    // z. B. "Kardiologie", "Hämatoonkologie"
};

// ---- Detaillierte Rubrik (mit Items) ----
// z. B. sections: [{ name, maxPoints, items: [{ text, points, keywords: [...] }] }]
export type RubricItem = {
  id?: string;
  text: string;
  points: number;
  keywords: string[];
};
export type RubricSectionDetailed = {
  id?: string;
  name: string;
  maxPoints: number;
  items: RubricItem[];
};
export type RubricDetailed = {
  sections: RubricSectionDetailed[];
};

export type CaseStep = { order: number; prompt: string; hint?: string };
export type Objective = { id: string; label: string; description?: string };
export type CompletionRules = { minObjectives: number; maxLLMTurns?: number; hardStopTurns?: number };

export type Case = {
  id: string;
  title: string;
  /** Kompakter Anzeigename wie „Brustschmerz“, „Hypertonie“ */
  shortTitle?: string;
  vignette: string;
  specialty?: string;
  subspecialty?: string;
  difficulty?: number;
  tags: string[];
  steps: CaseStep[];
  objectives?: Objective[];
  completion?: CompletionRules | null;
};

// Vereinheitlichte „Rubric“-Bezeichnung:
export type Rubric = RubricSimple | RubricDetailed;

// ---- Fall-Datenmodelle ----
export type CaseStep = {
  id?: string;        // optional erlaubt (deine Daten nutzen es)
  order: number;
  prompt: string;
  hint?: string;
};

export type Case = {
  id: string;
  title: string;
  vignette: string;
  tags: string[];
  steps: CaseStep[];
  rubric: Rubric | RubricSection[] | RubricSectionDetailed[]; // beide Formen ODER Array erlaubt
  specialty?: string;
  difficulty?: string | number;
};

// Für Attempts/Feedback
export type Attempt = {
  id: string;
  caseId: string;
  caseTitle: string;
  dateISO: string;
  answers: string[];
  result: ScoreResult;
};
