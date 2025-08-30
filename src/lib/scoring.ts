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

/* ------------------------ Matching-Helpers ------------------------ */

// sanfte Normalisierung
function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9äöüß\s-]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Levenshtein-Distanz (klein & ohne any)
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  return dp[m][n];
}

/**
 * Erzeugt einen normalisierten "Haystack" und ein Token-Set für exakte & fuzzy-Matches.
 * - haystackStr: vollständiger, normalisierter Text (für mehrwortige Phrasen via substring-match)
 * - tokens: einzelne (einwortige) Tokens (für exakte/fuzzy Vergleiche)
 */
function makeHaystack(answerText: string): { haystackStr: string; tokens: Set<string> } {
  const haystackStr = normalize(answerText);
  const tokenArr = haystackStr.split(/[^a-z0-9äöüß-]+/g).filter(Boolean);
  return { haystackStr, tokens: new Set(tokenArr) };
}

/**
 * Prüft, ob ein Keyword (oder eine seiner Synonyme-Alternativen per "|") im Text vorkommt.
 * Regeln:
 * - Enthält die Alternative ein Leerzeichen (mehrwortig): substring-match im haystackStr.
 * - Einwortig: exakter Token-Treffer ODER Levenshtein <= 2 gegen irgendein Token.
 */
function keywordMatches(
  kwOrSynonyms: string,
  haystackStr: string,
  tokens: Set<string>,
  fuzzyDistance: number = 2
): boolean {
  const alts = kwOrSynonyms.split("|").map(k => normalize(k)).filter(Boolean);
  for (const alt of alts) {
    if (alt.includes(" ")) {
      // Mehrwort-Phrase ⇒ substring reicht hier meist
      if (haystackStr.includes(alt)) return true;
    } else {
      // Einwort-Keyword ⇒ exakte Token-Übereinstimmung oder fuzzy
      if (tokens.has(alt)) return true;
      // fuzzy: gegen alle Tokens (early exit, sobald <= fuzzyDistance)
      for (const t of tokens) {
        if (Math.abs(t.length - alt.length) > fuzzyDistance) continue;
        if (levenshtein(t, alt) <= fuzzyDistance) return true;
      }
    }
  }
  return false;
}

/* ------------------------ Scoring-Funktion ------------------------ */

/**
 * Scort eine freie Textantwort gegen eine Rubrik.
 *
 * Neu:
 * - `answer` kann jetzt auch ein Array von Strings sein (kumulative Versuche).
 * - Keywords können Synonyme per `"|"` enthalten (z. B. "acs|akutes koronar syndrom|herzinfarkt").
 * - Leichte Tippfehler werden toleriert (Levenshtein <= 2 bei Einwort-Keywords).
 *
 * Unterstützt:
 * - einfache Rubrik:  { sections: [{ name, points, keywords[] }] }
 * - detaillierte:     { sections: [{ name, maxPoints, items: [{ points, keywords[] }] }] }
 * - sowie direkt Arrays dieser Sections (simple oder detailed).
 */
export function scoreAnswer(
  answer: string | string[],
  rubric: Rubric | SimpleSection[] | DetailedSection[]
): ScoreResult {
  // Kumulieren, wenn mehrere Versuche übergeben wurden
  const combined = Array.isArray(answer) ? answer.join(" \n ") : answer;
  const { haystackStr, tokens } = makeHaystack(combined || "");

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
        const kws = (item.keywords || []);
        const hit = kws.some((kw) => keywordMatches(kw, haystackStr, tokens));
        if (hit) {
          got += item.points || 0;
        } else {
          // Für "missing" die rohen Keywords (inkl. Synonym-Gruppen) aufführen
          missingKeywords.push(...kws);
        }
      }

      const gotCapped = Math.min(got, max);
      total += gotCapped;

      return {
        name: String(sec.name ?? "Abschnitt"),
        got: gotCapped,
        max,
        // Duplikate entfernen
        missing: Array.from(new Set(missingKeywords)),
      };
    }

    // Einfache Section
    const kws = (sec.keywords || []);
    // Jeder Keyword-Eintrag (inkl. Synonyme) kann max. 1 Punkt geben
    let hits = 0;
    const missing: string[] = [];
    for (const kw of kws) {
      if (keywordMatches(kw, haystackStr, tokens)) {
        hits += 1;
      } else {
        missing.push(kw);
      }
    }

    const max = Number(sec.points) || 0;
    const got = Math.min(hits, max);

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