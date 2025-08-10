// src/lib/scoring.ts
import type {
  Rubric,
  RubricSection,
  RubricSectionDetailed,
  ScoreResult,
} from "@/lib/types";

// Type Guard für detaillierte Sections
function isDetailedSection(
  sec: RubricSection | RubricSectionDetailed
): sec is RubricSectionDetailed {
  return (sec as RubricSectionDetailed).items !== undefined;
}

/**
 * Scort eine freie Textantwort gegen eine Rubrik.
 * Unterstützt:
 * - einfache Rubrik: { sections: [{ name, points, keywords[] }] }
 * - detaillierte Rubrik: { sections: [{ name, maxPoints, items: [{ points, keywords[] }] }] }
 * - sowie direkt Arrays dieser Sections.
 */
export function scoreAnswer(
  answer: string,
  rubric: Rubric | RubricSection[] | RubricSectionDetailed[]
): ScoreResult {
  const text = (answer || "").toLowerCase();

  const sectionsArray =
    Array.isArray(rubric) ? rubric : rubric.sections;

  const sections = sectionsArray as Array<
    RubricSection | RubricSectionDetailed
  >;

  let total = 0;

  const scoredSections = sections.map((sec) => {
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

    // einfache Section
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
