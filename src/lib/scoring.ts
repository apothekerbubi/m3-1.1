// src/lib/scoring.ts
import type { Rubric, ScoreResult } from "@/lib/types";

/** Lokale Typen für beide Rubrik-Varianten */
type SimpleSection = {
  name: string;
  points: number;           // max Punkte in diesem Abschnitt
  keywords: string[];       // Schlüsselwörter, 1 Hit = 1 Punkt (bis max points)
};
type DetailedItem = {
  text: string;
  points: number;
  keywords: string[];
};
type DetailedSection = {
  id?: string;
  name: string;
  maxPoints: number;        // max Punkte in diesem Abschnitt
  items: DetailedItem[];    // jede Item-Teilanforderung gibt Punkte
};
type RubricSimple = { sections: SimpleSection[] };
type RubricDetailed = { sections: DetailedSection[] };

/** Type Guards */
function isDetailedRubric(r: RubricSimple | RubricDetailed): r is RubricDetailed {
  const first = (r as RubricDetailed)?.sections?.[0] as DetailedSection | undefined;
  return !!first && Array.isArray(first.items);
}
function isDetailedSection(sec: SimpleSection | DetailedSection): sec is DetailedSection {
  return (sec as DetailedSection).items !== undefined;
}

/**
 * Scort eine freie Textantwort gegen eine Rubrik.
 * Unterstützt:
 * - einfache Rubrik:  { sections: [{ name, points, keywords[] }] }
 * - detaillierte:     { sections: [{ name, maxPoints, items: [{ points, keywords[] }] }] }
 * - sowie direkt Arrays dieser Sections (simple oder detailed).
 */
export function scoreAnswer(
  answer: string,
  rubric: Rubric | SimpleSection[] | DetailedSection[]
): ScoreResult {
  const text = (answer || "").toLowerCase();

  // Normiere Eingabe auf ein Array von Sections
  const sectionsArray: Array<SimpleSection | DetailedSection> = Array.isArray(rubric)
    ? (rubric as Array<SimpleSection | DetailedSection>)
    : isDetailedRubric(rubric as RubricSimple | RubricDetailed)
      ? (rubric as RubricDetailed).sections
      : (rubric as RubricSimple).sections;

  let total = 0;

  const scoredSections = sectionsArray.map((sec) => {
    // Detaillierte Section
    if (isDetailedSection(sec)) {
      const max = typeof sec.maxPoints === "number" ? sec.maxPoints : 0;
      let got = 0;
      const missingKeywords: string[] = [];

      for (const item of sec.items) {
        const kws = (item.keywords || []).map((k) => k.toLowerCase());
        const hit = kws.some((kw) => text.includes(kw));
        if (hit) {
          got += item.points || 0;
        } else {
          missingKeywords.push(...kws);
        }
      }

      const gotCapped = Math.min(got, max);
      total += gotCapped;

      return {
        name: String(sec.name ?? "Abschnitt"),
        got: gotCapped,
        max,
        missing: Array.from(new Set(missingKeywords)),
      };
    }

    // Einfache Section
    const kws = (sec.keywords || []).map((k) => k.toLowerCase());
    const hits = kws.reduce((acc, kw) => acc + (text.includes(kw) ? 1 : 0), 0);
    const max = Number(sec.points) || 0;
    const got = Math.min(hits, max);
    const missing = kws.filter((kw) => !text.includes(kw));

    total += got;

    return {
      name: String(sec.name ?? "Abschnitt"),
      got,
      max,
      missing: Array.from(new Set(missing)),
    };
  });

  return { total, sections: scoredSections };
}