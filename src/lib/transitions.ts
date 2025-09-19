type Correctness = "correct" | "partially_correct" | "incorrect";

export function normalizeForComparison(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").replace(/[.,;:!?]+$/g, "").trim();
}

export function buildTransitionQuestion(
  baseQuestion: string,
  opts: {
    correctness?: Correctness | null;
    attemptStage?: number | null;
    isFinalStep?: boolean;
  } = {}
): string {
  const trimmed = baseQuestion.trim();
  if (!trimmed) return "";

  const correctness = opts.correctness ?? null;
  const attemptStage = opts.attemptStage ?? null;
  const isFinal = Boolean(opts.isFinalStep);

  let lead: string;
  if (correctness === "correct") {
    lead = "Sehr gut";
  } else if (correctness === "partially_correct") {
    lead = "Danke für Ihre Einschätzung";
  } else if (typeof attemptStage === "number" && attemptStage >= 3) {
    lead = "Wir halten Ihre Angaben fest";
  } else {
    lead = "Alles klar";
  }

  if (isFinal) {
    return `${lead}, zum Abschluss habe ich noch folgende Frage: ${trimmed}`;
  }

  return `${lead}, aufbauend auf Ihre bisherigen Ausführungen geht es weiter: ${trimmed}`;
}
