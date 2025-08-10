// src/lib/types.ts

// ---------- Scoring/Ergebnisse ----------
export type SectionScore = {
  name: string;
  got: number;
  max: number;
  missing: string[]; // fehlende Keywords (dedupliziert)
};

export type ScoreResult = {
  total: number;
  sections: SectionScore[];
};

// ---------- Ziele & Abschlussregeln ----------
export type Objective = {
  id: string;            // z.B. "ddx", "workup", "initial_tx"
  label: string;         // z.B. "2–3 plausible DD nennen"
  description?: string;
};

export type CompletionRules = {
  minObjectives: number;   // z.B. 3
  maxLLMTurns?: number;    // maximale Zahl von Prüfer-Fragen
  hardStopTurns?: number;  // absolute Obergrenze der Turns
};

// ---------- Rubriken (zwei Formate) ----------
export type RubricSectionSimple = {
  name: string;
  points: number;
  keywords: string[];
};
export type RubricSimple = {
  sections: RubricSectionSimple[];
};

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

export type Rubric = RubricSimple | RubricDetailed;

// ---------- Fälle ----------
export type Subject = "Innere Medizin" | "Chirurgie" | "Wahlfach";

export type CaseStep = {
  order: number;
  prompt: string;
  hint?: string;
  id?: string; // optional erlaubt
};

export type Case = {
  id: string;
  title: string;
  vignette: string;
  steps: CaseStep[];

  // optionale Metadaten
  tags?: string[];
  difficulty?: number;

  // für Bibliothek/Gliederung
  specialty?: string;     // z.B. "Innere Medizin"
  subspecialty?: string;  // z.B. "Kardiologie"
  category?: string;      // frei verwendbar
  subject?: Subject;      // falls du es zusätzlich nutzt
  shortTitle?: string;    // kompakter Anzeigename

  // optionale LLM-Regeln
  objectives?: Objective[];
  completion?: CompletionRules | null;

  // optional: Rubrik (für Simulation/Scoring)
  rubric?: Rubric;
};

// ---------- Versuche/History ----------
export type Attempt = {
  id: string;
  caseId: string;
  caseTitle: string;
  dateISO: string;
  answers: string[];
  result: ScoreResult;
};