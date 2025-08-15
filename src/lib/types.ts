// src/lib/types.ts – vereinheitlicht & erweitert (Points + Reveal)
// Dieses File ersetzt die bisherige, doppelt definierte Struktur (Case/CaseStep)
// und bringt sie in Einklang mit dem sequentiellen Prüfungsfall (inkl. points & reveal).

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

// ---------- Evaluation ----------
export type EvalMode =
  | "exact"
  | "anyOf"
  | "allOf"
  | "categories"
  | "numeric"
  | "regex";

export type StepRule = {
  mode: EvalMode;

  // Textbasierte Checks
  expected?: string[]; // exakte Ziele / Kanon
  synonyms?: Record<string, string[]>; // z.B. { "pankreatitis": ["akute pankreatitis", "entzündung der bauchspeicheldrüse"] }
  required?: string[]; // müssen vorkommen (beliebige Reihenfolge)
  optional?: string[]; // nice-to-have
  forbidden?: string[]; // sollte NICHT vorkommen (z.B. Appendizitis in diesem Kontext)
  minHits?: number; // wie viele expected/required mind. genannt werden müssen

  // Kategoriensets (für DD)
  categories?: {
    [catName: string]: string[]; // z.B. "gastrointestinal": ["pankreatitis","ulcus","cholezystitis",...]
  };
  minCategories?: number; // z.B. >=2 Kategorien nennen

  // Numeric / Ranges (Labore, Skalen)
  numeric?: { min?: number; max?: number; equals?: number };

  // Regex-Fälle (z.B. ICD-10 Codes)
  regex?: string;

  // Scoring-Gewichte (optional)
  weights?: {
    required?: number;
    optional?: number;
    forbidden?: number;
    category?: number;
  };

  // Hints ohne Spoiler (kategorial)
  hint_general?: string; // kurzer, spoilerfreier Tipp
};

// ---------- Ziele & Abschlussregeln ----------
export type Objective = {
  id: string; // z.B. "ddx", "workup", "initial_tx"
  label: string; // z.B. "2–3 plausible DD nennen"
  description?: string;
};

export type CompletionRules = {
  minObjectives: number; // z.B. 3
  maxLLMTurns?: number; // maximale Zahl von Prüfer-Fragen
  hardStopTurns?: number; // absolute Obergrenze der Turns
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

// Reveal-Mechanismus für schrittweises Freigeben von Befunden
export type RevealWhen = "after_answer" | "after_full" | "after_partial" | "always";
export type StepReveal<T = unknown> = {
  when: RevealWhen;
  content: T; // frei: z.B. Laborblock, Bildgebung, Textbausteine
};

export type CaseStep = {
  order: number;
  id?: string; // optional, stabil für Analytics
  prompt: string;
  hint?: string;

  // Punkte für diesen Schritt (volle Punktzahl bei Erfüllung der Regel)
  points?: number;

  // Ground Truth / Bewertung
  rule?: StepRule;

  // optionale Freigabe weiterer Infos nach der Antwort (z.B. Befunde nach Workup)
  reveal?: StepReveal;
};

export type Case = {
  id: string;
  title: string;
  shortTitle?: string; // kompakter Anzeigename
  vignette: string;

  steps: CaseStep[];

  // optionale Metadaten
  tags?: string[];
  difficulty?: number | string; // frei nutzbar (z.B. 1–5 oder "leicht/mittel/schwer")

  // für Bibliothek/Gliederung
  specialty?: string; // z.B. "Innere Medizin"
  subspecialty?: string; // z.B. "Gastroenterologie"
  category?: string; // frei verwendbar
  subject?: Subject; // falls zusätzlich genutzt

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
  answers: string[]; // freie Texteingaben pro Schritt
  result: ScoreResult;
};
