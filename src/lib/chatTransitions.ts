// src/lib/chatTransitions.ts

type TransitionContext = {
  previousPrompt?: string | null;
  fallbackPrompt?: string | null;
};

function normalizeForComparison(value: string): string {
  return value
    .toLowerCase()
    .replace(/[„“”«»‹›‚‘’"'`]/g, "")
    .replace(/[?!.,;:]+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function clean(value: string | null | undefined): string {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

function ensureQuestionMark(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return "";
  return /[?？]$/.test(trimmed) ? trimmed : `${trimmed}?`;
}

/**
 * Nutzt die vorgegebene Frage, ergänzt aber einen weichen Übergang,
 * sobald sie 1:1 aus dem Fragenkatalog übernommen wird.
 */
export function adaptNextQuestionToContext(
  nextQuestion: string,
  context: TransitionContext
): string {
  const actual = clean(nextQuestion);
  if (!actual) return "";

  const fallback = clean(context.fallbackPrompt);
  if (!fallback) return actual;

  const previousPrompt = clean(context.previousPrompt);
  if (!previousPrompt) {
    return ensureQuestionMark(actual);
  }

  const normActual = normalizeForComparison(actual);
  const normFallback = normalizeForComparison(fallback);

  if (!normActual || normActual !== normFallback) {
    return ensureQuestionMark(actual);
  }

  const previousTopic = previousPrompt.replace(/[?？]+$/g, "");
  const intro = previousTopic
    ? `Vielen Dank für Ihre Antwort zu „${previousTopic}“.`
    : "Vielen Dank für Ihre Antwort.";
  const question = ensureQuestionMark(fallback);

  return `${intro} Lassen Sie uns nun weitermachen. ${question}`.replace(/\s+/g, " ").trim();
}
