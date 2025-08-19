// src/lib/scoring.ts

// --------- Lokale, eigenständige Typen (kein Import aus "@/lib/types") ---------
export type ScoreSection = {
  name: string;
  got: number;
  max: number;
  missing?: string[];
};

export type ScoreResult = {
  total: number;
  sections: ScoreSection[];
};

// Einfache Rubrik (flach)
type SimpleSection = {
  name: string;
  points: number;
  keywords: string[];
};
type SimpleRubric = { sections: SimpleSection[] };

// Detaillierte Rubrik (mit Items)
type DetailedItem = {
  id?: string;
  text: string;
  points: number;
  keywords: string[];
};
type DetailedSection = {
  id?: string;
  name: string;
  maxPoints: number;
  items: DetailedItem[];
};
type DetailedRubric = { sections: DetailedSection[] };

// Vereinheitlichter Rubrik-Typ
export type Rubric = SimpleRubric | DetailedRubric;

// --------- Utilities ---------
function normalizeDe(s: string): string {
  return (s || "")
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .normalize("NFD")
    .replace(/\p{Diacritic}+/gu, "")
    .replace(/[^\p{L}\p{N}\s%+./-]/gu, " ") // nur sinnvolle Zeichen
    .replace(/\s+/g, " ")
    .trim();
}

function includesAny(hayNorm: string, needles: string[]): boolean {
  for (const n of needles) {
    const nn = normalizeDe(n);
    if (nn && hayNorm.includes(nn)) return true;
  }
  return false;
}

// --------- Scoring für einfache Rubrik ---------
function scoreSimple(answerNorm: string, rubric: SimpleRubric): ScoreResult {
  const sections: ScoreSection[] = rubric.sections.map((sec) => {
    const hit = includesAny(answerNorm, sec.keywords);
    const got = hit ? sec.points : 0;
    const max = sec.points;

    const missing = hit ? [] : sec.keywords.slice(0, 3); // optional: erste paar als Hinweis

    return { name: sec.name, got, max, missing };
  });

  const total = sections.reduce((a, s) => a + s.got, 0);
  return { total, sections };
}

// --------- Scoring für detaillierte Rubrik ---------
function scoreDetailed(answerNorm: string, rubric: DetailedRubric): ScoreResult {
  const sections: ScoreSection[] = rubric.sections.map((sec) => {
    let got = 0;
    const max = sec.maxPoints;
    const missingLabels: string[] = [];

    for (const it of sec.items) {
      const hit = includesAny(answerNorm, it.keywords);
      if (hit) {
        got += it.points;
      } else {
        // Als “fehlend” werten wir die Item-Beschreibung
        if (it.text) missingLabels.push(it.text);
      }
    }

    // Hart auf max deckeln
    got = Math.min(got, max);

    return {
      name: sec.name,
      got,
      max,
      missing: missingLabels,
    };
  });

  const total = sections.reduce((a, s) => a + s.got, 0);
  return { total, sections };
}

// --------- Public API ---------
/**
 * Scort eine Freitext-Antwort gegen eine Rubrik (einfach oder detailliert).
 * Gibt immer ein ScoreResult zurück.
 */
export function scoreAnswer(answer: string, rubric: Rubric): ScoreResult {
  const aNorm = normalizeDe(answer);

  // Heuristik: Wenn das erste Section-Objekt "items" hat, ist es die detaillierte Rubrik
  const first = (rubric as DetailedRubric).sections?.[0] as DetailedSection | undefined;
  const isDetailed = first && Array.isArray(first.items);

  if (isDetailed) {
    return scoreDetailed(aNorm, rubric as DetailedRubric);
  }
  return scoreSimple(aNorm, rubric as SimpleRubric);
}