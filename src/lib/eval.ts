// src/lib/scoring.ts

// ---- Exporte (für Pages/Components importierbar) ----
export type Rubric = RubricSimple | RubricDetailed;

export type ScoreSection = {
  name: string;
  got: number;
  max: number;
  missing: string[]; // deduplizierte fehlende Keywords/Titel
};

export type ScoreResult = {
  total: number;
  sections: ScoreSection[];
};

// ---- Interne Rubrik-Modelle ----
// Simple: eine Ebene mit Keywords + Punkte pro Sektion
type SimpleSection = {
  name: string;
  points: number;
  keywords: string[];
};
type RubricSimple = {
  sections: SimpleSection[];
};

// Detailed: Sektion mit Items (je Item Punkte + Keywords) und Sektion-Maximum
type RubricItem = { text: string; points: number; keywords: string[] };
type DetailedSection = { name: string; maxPoints: number; items: RubricItem[] };
type RubricDetailed = { sections: DetailedSection[] };

// ---- Utils ----
function normalizeDe(s: string): string {
  return (s || "")
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .normalize("NFD")
    .replace(/\p{Diacritic}+/gu, "")
    .replace(/[^\p{L}\p{N}\s%+./-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function includesNorm(hayNorm: string, needle: string): boolean {
  const n = normalizeDe(needle);
  return !!n && hayNorm.includes(n);
}

// ---- Scoring ----
export function scoreAnswer(answerRaw: string, rubric: Rubric): ScoreResult {
  const hay = normalizeDe(answerRaw || "");

  if (isDetailed(rubric)) {
    const sections: ScoreSection[] = rubric.sections.map((sec): ScoreSection => {
      let got = 0;
      const missingLabels: string[] = [];

      for (const it of sec.items) {
        const hit = it.keywords.some((k) => includesNorm(hay, k));
        if (hit) {
          got += it.points;
        } else {
          // für „missing“ bevorzugt den Item‑Titel, sonst alle Keywords
          missingLabels.push(it.text || it.keywords[0] || "");
        }
      }

      // Sektion deckeln
      const max = Math.max(0, sec.maxPoints);
      got = Math.min(got, max);

      // fehlende deduplizieren + leere entfernen
      const missing = Array.from(new Set(missingLabels.filter(Boolean)));

      return { name: sec.name, got, max, missing };
    });

    const total = sections.reduce((a, s) => a + s.got, 0);
    return { total, sections };
  }

  // Simple rubric
  const sections: ScoreSection[] = rubric.sections.map((sec): ScoreSection => {
    const hit = sec.keywords.some((k) => includesNorm(hay, k));
    const got = hit ? sec.points : 0;
    const max = sec.points;

    // bei „nicht getroffen“ alle Keywords als fehlend anzeigen
    const missing = hit ? [] : Array.from(new Set(sec.keywords.filter(Boolean)));

    return { name: sec.name, got, max, missing };
  });

  const total = sections.reduce((a, s) => a + s.got, 0);
  return { total, sections };
}

// Type guards
function isDetailed(r: Rubric): r is RubricDetailed {
  // Heuristik: Detailed hat Sektionen mit "items" und "maxPoints"
  const anySec = (r as RubricDetailed)?.sections?.[0];
  return !!anySec && Array.isArray((anySec as DetailedSection).items);
}