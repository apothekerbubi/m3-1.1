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

// ---------- Regeln / Auswertung ----------
export type EvalMode = "exact" | "anyOf" | "allOf" | "categories" | "numeric" | "regex";

export type StepRule = {
  mode: EvalMode;

  // Textbasierte Checks
  expected?: string[];                 // exakte Ziele / Kanon
  synonyms?: Record<string, string[]>; // "pankreatitis": ["akute pankreatitis", ...]
  required?: string[];                 // müssen vorkommen (beliebige Reihenfolge)
  optional?: string[];                 // nice-to-have
  forbidden?: string[];                // sollte NICHT vorkommen
  minHits?: number;                    // wie viele expected/required mind. genannt werden müssen

  // Kategoriensets (für DD)
  categories?: { [catName: string]: string[] }; // z.B. "gastrointestinal": [...]
  minCategories?: number;                        // z.B. >=2 Kategorien nennen

  // Numeric / Ranges (Labore, Skalen)
  numeric?: { min?: number; max?: number; equals?: number };

  // Regex-Fälle (z.B. ICD-10 Codes)
  regex?: string;

  // Scoring-Gewichte
  weights?: { required?: number; optional?: number; forbidden?: number; category?: number };

  // Hints ohne Spoiler
  hint_general?: string; // kurzer, spoilerfreier Tipp
};

// ---------- Reveal (Befunde/Zusatzinfos) ----------
export type StepRevealWhen =
  | "on_enter"       // direkt beim Öffnen des Schritts
  | "always"         // immer anzeigen
  | "after_answer"   // nach irgendeiner Bewertung/Lösung
  | "after_full"     // nur bei "correct"
  | "after_partial"; // bei "partially_correct" oder "correct"

export type StepRevealVitals = {
  rr?: string;
  puls?: number | string;
  temp?: number | string;
  spo2?: number | string;
};

export type StepRevealLabEntry =
  | { wert?: number | string; einheit?: string; referenz?: string }
  | string
  | number;

export type StepRevealImaging = { ultraschall?: string; ct?: string; mrt?: string };

export type StepRevealContent = {
  befundpaketTitel?: string;
  vitalparameter?: StepRevealVitals;
  labor?: Record<string, StepRevealLabEntry>;
  bildgebung?: StepRevealImaging;
  interpretationKurz?: string;
  [k: string]: unknown; // tolerant für zukünftige Felder
};

export type StepReveal = {
  when: StepRevealWhen;
  content?: StepRevealContent;
};

// ---------- Fälle / Schritte ----------
export type CaseStep = {
  order: number;
  prompt: string;
  hint?: string;
  id?: string;

  // Bewertung
  rule?: StepRule;

  // Punkte/Reveal (optional)
  points?: number;
  reveal?: StepReveal | null;
};

export type Objective = {
  id: string;            // z.B. "ddx", "workup", "initial_tx"
  label: string;         // z.B. "2–3 plausible DD nennen"
  description?: string;
};

export type CompletionRules = {
  minObjectives: number;
  maxLLMTurns?: number;
  hardStopTurns?: number;
};

// Rubriken (optional)
export type RubricSectionSimple = { name: string; points: number; keywords: string[] };
export type RubricSimple = { sections: RubricSectionSimple[] };

export type RubricItem = { id?: string; text: string; points: number; keywords: string[] };
export type RubricSectionDetailed = { id?: string; name: string; maxPoints: number; items: RubricItem[] };
export type RubricDetailed = { sections: RubricSectionDetailed[] };
export type Rubric = RubricSimple | RubricDetailed;

// ---------- Case ----------
export type Subject = "Innere Medizin" | "Chirurgie" | "Wahlfach";

export type Case = {
  id: string;
  title: string;
  vignette: string;
  steps: CaseStep[];

  // optionale Metadaten
  tags?: string[];
  difficulty?: string | number;
  specialty?: string;
  subspecialty?: string;
  category?: string;
  subject?: Subject;
  shortTitle?: string;

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