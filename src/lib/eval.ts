// src/lib/eval.ts
import type { StepRule, SynonymsMap } from "@/lib/types";

/** Ergebnis-Typ für die Auswertung */
export type EvalCorrectness = "correct" | "partially_correct" | "incorrect";
export type EvalResult = {
  correctness: EvalCorrectness;
  hits?: string[];
  missing?: string[];
  forbidden?: string[];
  categoriesHit?: Record<string, string[]>;
};

// ---------- Lokale Rule-Typen (für Narrowing) ----------
type CategoriesRuleX = Extract<StepRule, { mode: "categories" }>;
type AllOfRuleX     = Extract<StepRule, { mode: "allOf" }>;
type AnyOfRuleX     = Extract<StepRule, { mode: "anyOf" }>;

// Optional unterstützte Modi (falls außerhalb von StepRule verwendet)
type ExactRule  = { mode: "exact"; expected?: string[]; synonyms?: SynonymsMap; forbidden?: string[] };
type NumericCfg = { min?: number; max?: number; equals?: number };
type NumericRule = { mode: "numeric"; numeric?: NumericCfg };
type RegexRule = { mode: "regex"; regex?: string };

// ---------- Normalisierung & Helpers ----------
export function normalizeDe(s: string): string {
  const x = (s || "")
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
  return x;
}

function includesNorm(hayNorm: string, needleRaw: string): boolean {
  if (!needleRaw) return false;
  const n = normalizeDe(needleRaw);
  if (!n) return false;
  return hayNorm.includes(n);
}

function expandWithSynonyms(list: string[] | undefined, synonyms: Record<string, string[]> | undefined): string[] {
  if (!list || list.length === 0) return [];
  const out = new Set<string>();
  for (const keyRaw of list) {
    const key = keyRaw || "";
    out.add(key);
    const syns = synonyms?.[key];
    if (Array.isArray(syns)) {
      for (const s of syns) out.add(s);
    }
  }
  return Array.from(out);
}

function requiredGroups(required: string[] | undefined, synonyms: Record<string, string[]> | undefined): string[][] {
  if (!required || required.length === 0) return [];
  return required.map((r) => {
    const set = new Set<string>([r]);
    const syns = synonyms?.[r];
    if (Array.isArray(syns)) syns.forEach((s) => set.add(s));
    return Array.from(set);
  });
}

function countRequiredHits(
  hayNorm: string,
  groups: string[][],
  canonical: string[]
): { hitCount: number; hitCanonicals: string[] } {
  let hitCount = 0;
  const hitCanon: string[] = [];
  groups.forEach((alts, idx) => {
    const ok = alts.some((a) => includesNorm(hayNorm, a));
    if (ok) {
      hitCount += 1;
      hitCanon.push(canonical[idx] ?? "");
    }
  });
  return { hitCount, hitCanonicals: hitCanon.filter(Boolean) };
}

function countExpectedHits(hayNorm: string, expected: string[], synonyms: Record<string, string[]> | undefined) {
  const expanded: Array<{ canonical: string; needle: string }> = [];
  expected.forEach((e) => {
    expanded.push({ canonical: e, needle: e });
    const syns = synonyms?.[e];
    if (Array.isArray(syns)) syns.forEach((s) => expanded.push({ canonical: e, needle: s }));
  });

  const hitCanon = new Set<string>();
  for (const { canonical, needle } of expanded) {
    if (includesNorm(hayNorm, needle)) hitCanon.add(canonical);
  }
  return Array.from(hitCanon);
}

function findForbidden(hayNorm: string, forbidden: string[] | undefined, synonyms: Record<string, string[]> | undefined) {
  if (!forbidden || forbidden.length === 0) return [];
  const all = expandWithSynonyms(forbidden, synonyms);
  return all.filter((f) => includesNorm(hayNorm, f));
}

// ---------- Evaluatoren ----------
function evalCategories(hayNorm: string, rule: CategoriesRuleX): EvalResult {
  const cats = rule.categories ?? {};
  const minCats = typeof rule.minCategories === "number" ? rule.minCategories : 1;
  const minHits = typeof rule.minHits === "number" ? rule.minHits : 0;

  const categoriesHit: Record<string, string[]> = {};
  let totalItemsHit = 0;

  for (const catName of Object.keys(cats)) {
    const needles = cats[catName] || [];
    const hits: string[] = [];
    for (const n of needles) {
      if (includesNorm(hayNorm, n)) hits.push(n);
    }
    if (hits.length > 0) {
      categoriesHit[catName] = hits;
      totalItemsHit += hits.length;
    }
  }

  const nCatsHit = Object.keys(categoriesHit).length;

  // CategoriesRule besitzt kein synonyms-Feld → undefined übergeben
  const forb = findForbidden(hayNorm, rule.forbidden, undefined);

  const catsOk = nCatsHit >= minCats;
  const hitsOk = minHits > 0 ? totalItemsHit >= minHits : totalItemsHit > 0;

  let correctness: EvalCorrectness;
  if (catsOk && hitsOk) correctness = "correct";
  else if (catsOk || hitsOk) correctness = "partially_correct";
  else correctness = "incorrect";

  if (forb.length > 0) {
    correctness = correctness === "correct" ? "partially_correct" : "incorrect";
  }

  return { correctness, categoriesHit, forbidden: forb };
}

function evalAllOf(hayNorm: string, rule: AllOfRuleX): EvalResult {
  const required = rule.required ?? [];
  const minHits = typeof rule.minHits === "number" ? rule.minHits : required.length;

  const groups = requiredGroups(required, rule.synonyms);
  const { hitCount, hitCanonicals } = countRequiredHits(hayNorm, groups, required);

  const missing = required.filter((r) => !hitCanonicals.includes(r));
  const forb = findForbidden(hayNorm, rule.forbidden, rule.synonyms);

  let correctness: EvalCorrectness;
  if (hitCount >= required.length) correctness = "correct";
  else if (hitCount >= Math.max(1, Math.min(minHits, required.length))) correctness = "partially_correct";
  else correctness = "incorrect";

  if (forb.length > 0) {
    correctness = correctness === "correct" ? "partially_correct" : "incorrect";
  }

  return { correctness, hits: hitCanonicals, missing, forbidden: forb };
}

function evalAnyOf(hayNorm: string, rule: AnyOfRuleX): EvalResult {
  const expected = rule.expected ?? [];
  const minHits = typeof rule.minHits === "number" ? rule.minHits : 1;

  const hitCanonicals = countExpectedHits(hayNorm, expected, rule.synonyms);
  const forb = findForbidden(hayNorm, rule.forbidden, rule.synonyms);

  const n = hitCanonicals.length;

  let correctness: EvalCorrectness;
  if (n >= minHits) correctness = "correct";
  else if (n > 0) correctness = "partially_correct";
  else correctness = "incorrect";

  if (forb.length > 0) {
    correctness = correctness === "correct" ? "partially_correct" : "incorrect";
  }

  const missing = expected.filter((e) => !hitCanonicals.includes(e));

  return { correctness, hits: hitCanonicals, missing, forbidden: forb };
}

function evalExact(hayNorm: string, rule: ExactRule): EvalResult {
  const expected = rule.expected ?? [];
  if (expected.length === 0) return { correctness: "correct" };

  const groups = requiredGroups(expected, rule.synonyms);
  const { hitCount, hitCanonicals } = countRequiredHits(hayNorm, groups, expected);

  const forb = findForbidden(hayNorm, rule.forbidden, rule.synonyms);

  let correctness: EvalCorrectness;
  if (hitCount >= expected.length) correctness = "correct";
  else if (hitCount > 0) correctness = "partially_correct";
  else correctness = "incorrect";

  if (forb.length > 0) {
    correctness = correctness === "correct" ? "partially_correct" : "incorrect";
  }

  const missing = expected.filter((e) => !hitCanonicals.includes(e));
  return { correctness, hits: hitCanonicals, missing, forbidden: forb };
}

function evalNumeric(answerNorm: string, rule: NumericRule): EvalResult {
  const num = rule.numeric ?? {};
  const m = answerNorm.match(/-?\d+(?:[.,]\d+)?/);
  if (!m) return { correctness: "incorrect" };
  const val = parseFloat(m[0].replace(",", "."));
  if (Number.isNaN(val)) return { correctness: "incorrect" };

  const { min, max, equals } = num;

  let ok = true;
  if (typeof equals === "number") ok = ok && Math.abs(val - equals) < 1e-9;
  if (typeof min === "number") ok = ok && val >= min;
  if (typeof max === "number") ok = ok && val <= max;

  return { correctness: ok ? "correct" : "incorrect" };
}

function evalRegex(answerNorm: string, rule: RegexRule): EvalResult {
  const pattern = rule.regex;
  if (!pattern) return { correctness: "incorrect" };
  try {
    const re = new RegExp(pattern, "i");
    return { correctness: re.test(answerNorm) ? "correct" : "incorrect" };
  } catch {
    return { correctness: "incorrect" };
  }
}

// ---------- Öffentliche Hauptfunktion ----------
export function evaluateAnswer(answer: string, rule?: StepRule): EvalResult {
  if (!rule) return { correctness: "correct" };
  const a = normalizeDe(answer);

  // Wichtig: nicht direkt auf das enge Union switchen → generischen Mode extrahieren
  const mode = (rule as { mode: string }).mode;

  switch (mode) {
    case "categories":
      return evalCategories(a, rule as CategoriesRuleX);
    case "allOf":
      return evalAllOf(a, rule as AllOfRuleX);
    case "anyOf":
      return evalAnyOf(a, rule as AnyOfRuleX);
    case "exact":
      return evalExact(a, rule as unknown as ExactRule);
    case "numeric":
      return evalNumeric(a, rule as unknown as NumericRule);
    case "regex":
      return evalRegex(a, rule as unknown as RegexRule);
    default:
      return { correctness: "incorrect" };
  }
}