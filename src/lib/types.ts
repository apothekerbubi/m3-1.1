// src/lib/types.ts
// ---------- Hilfstypen ----------
export type Subject = string; 
export type SynonymsMap = Record<string, string[]>;
export type CategoriesMap = Record<string, string[]>;

// ---------- Medien ----------
export type StepImage = {
  path: string;          // Pfad innerhalb des (öffentlichen) Buckets, z. B. "Roentgen/Spannungspneumothorax.png"
  alt: string;           // Barrierefreier Alternativtext
  caption?: string;      // optionale Bildunterschrift
};

// ---------- Regeln (Auswertung) ----------
export type CategoriesRule = {
  mode: "categories";
  categories: CategoriesMap;
  minCategories: number; // mind. so viele Kategorien müssen getroffen werden
  minHits: number;       // mind. so viele Gesamt-Treffer
  forbidden?: string[];
  hint_general?: string;
  synonyms?: Record<string, string[]>;
};

export type AllOfRule = {
  mode: "allOf";
  required: string[];        // müssen vorkommen
  optional?: string[];       // nice-to-have
  synonyms?: SynonymsMap;    // Normalisierung (z. B. "MI" -> "myokardinfarkt")
  forbidden?: string[];
  minHits?: number;          // wie viele Nennungen insgesamt (required+optional) mind. nötig sind
  hint_general?: string;
};

export type AnyOfRule = {
  mode: "anyOf";
  expected: string[];        // irgendeine dieser Nennungen reicht
  synonyms?: SynonymsMap;
  forbidden?: string[];
  minHits?: number;          // wie viele davon mind. nötig sind
  hint_general?: string;
};

// Union über alle Regelvarianten:
export type StepRule = CategoriesRule | AllOfRule | AnyOfRule;

// ---------- Reveal (Befundpakete/Zusatzinfos) ----------
export type StepRevealWhen =
  | "on_enter"      // beim Öffnen des Schritts
  | "on_submit"     // nach Abgabe/Eingabe
  | "always";       // immer sichtbar

export type StepRevealVitals = {
  rr?: string;                       // z. B. "120/70 mmHg"
  puls?: number | string;
  temp?: number | string;
  spo2?: number | string;
};

export type StepRevealLabEntry =
  | { wert?: number | string; einheit?: string; referenz?: string }
  | number
  | string;

// ✅ NEU: Gruppen erlauben (z. B. bga: { ph: {...}, pco2: {...} })
export type StepRevealLabGroup = Record<string, StepRevealLabEntry>;

export type StepRevealImaging = {
  lungensonografie?: string;
  roentgen?: string;
  ct?: string;
  mrt?: string;
};

export type StepRevealContent = {
  befundpaketTitel?: string;
  vitalparameter?: StepRevealVitals;

  // einzelne Werte ODER Gruppen sind erlaubt
  labor?: Record<string, StepRevealLabEntry | StepRevealLabGroup>;

  bildgebung?: StepRevealImaging;
  interpretationKurz?: string;
  // offen für zukünftige Felder:
  [k: string]: unknown;
};

export type StepReveal = {
  when: StepRevealWhen;
  content?: StepRevealContent;
};

// ---------- Schritt / Lernziel / Abschluss ----------
export type Step = {
  order: number;          // 1..n
  points: number;         // Punktzahl für den Schritt
  prompt: string;         // Aufgabenstellung
  hint?: string;          // optionaler Hinweis (spoilerfrei)
  rule: StepRule;         // Bewertungslogik
  image?: StepImage;      // optionales Bild zum Schritt
  reveal?: StepReveal;    // optionale Zusatzinfos
};

export type LearningObjective = {
  id: string;             // z. B. "ddx", "therapie"
  label: string;          // UI-Text
  description?: string;   // optional
};

export type CompletionConfig = {
  minObjectives: number;  // wie viele Lernziele mind. erreicht sein sollen
  maxLLMTurns: number;    // optionales Limit für Interaktionen
  hardStopTurns: number;  // absoluter Stopp
};

// ---------- Fall ----------
export type Case = {
  id: string;                 // z. B. "spannungspneumothorax_001"
  title: string;              // Volltitel
  shortTitle?: string;        // Kurztitel (optional)
  vignette: string;           // Einleitende Fallvignette

  // Klassifikation/Metadaten
  specialty: string;          // Fach (z. B. "Notfallmedizin")
  subspecialty?: string;      // Subfach (optional)
  subject?: string;           // legacy/alternativ
  category?: string;          // legacy/alternativ
  leadSymptom?: string;       // z. B. "Akute Dyspnoe"
  pseudonym?: string;         // interne Bezeichnung
  difficulty: number;         // 1..5 oder ähnlich
  tags: string[];             // Freitags
  relatedCases?: string[];    // IDs verwandter Fälle

  // Inhalt
  steps: Step[];              // die einzelnen Prüfungs-/Lernschritte

  // Lernziele/Abschluss
  objectives: LearningObjective[];
  completion: CompletionConfig;
};

// ---------- Versuche / Feedback ----------
export type AttemptSection = {
  name: string;
  got: number;
  max: number;
  missing: string[]; // fehlende Keywords (dedupliziert)
};

export type AttemptResult = {
  total: number;
  sections: AttemptSection[];
};

export type Attempt = {
  id: string;        // interne ID des Versuchs (z. B. UUID)
  caseId: string;
  caseTitle: string;
  dateISO: string;   // ISO-String des Zeitpunkts
  result: AttemptResult;
};

// ---------- Scoring / Rubrics ----------
export type RubricSimpleSection = {
  name: string;
  points: number;
  keywords: string[];
};

export type RubricDetailedItem = {
  text: string;
  points: number;
  keywords: string[];
};

export type RubricDetailedSection = {
  id?: string;
  name: string;
  maxPoints: number;
  items: RubricDetailedItem[];
};

/**
 * Eine Rubrik ist entweder "einfach" (sections: SimpleSection[])
 * oder "detailliert" (sections: DetailedSection[]).
 */
export type Rubric =
  | { sections: RubricSimpleSection[] }
  | { sections: RubricDetailedSection[] };

/** Ergebnisstruktur fürs Scoring (Alias zu AttemptResult) */
export type ScoreSection = AttemptSection;
export type ScoreResult = AttemptResult;