// ./lib/eval.ts
export function normalizeDe(s: string): string {
  return (s || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function expandWithSynonyms(tokens: string[], syn?: Record<string,string[]>) {
  if (!syn) return new Set(tokens);
  const set = new Set(tokens);
  for (const [k, arr] of Object.entries(syn)) {
    const base = normalizeDe(k);
    if (tokens.some(t => t.includes(base))) {
      for (const alt of arr) set.add(normalizeDe(alt));
    }
  }
  return set;
}

function containsAny(text: string, terms: string[], syn?: Record<string,string[]>) {
  const t = normalizeDe(text);
  const all = terms.flatMap(x => [normalizeDe(x), ...(syn?.[x] || []).map(normalizeDe)]);
  return all.some(term => t.includes(term));
}

export type EvalResult = {
  correctness: "correct"|"partially_correct"|"incorrect";
  hits?: string[];
  misses?: string[];
  forbiddenHits?: string[];
  categoriesHit?: string[];
};

export function evaluateAnswer(answer: string, rule?: StepRule): EvalResult {
  if (!rule) return { correctness: "correct" }; // fallback
  const a = normalizeDe(answer);

  // Forbidden?
  const forbiddenHits = (rule.forbidden || []).filter(x => containsAny(a,[x],rule.synonyms));

  // Mode handling
  if (rule.mode === "numeric" && rule.numeric) {
    const num = parseFloat(a.replace(",", ".").match(/-?\d+(\.\d+)?/)?.[0] || "NaN");
    const ok = !isNaN(num) && (
      (rule.numeric.equals !== undefined ? num === rule.numeric.equals : true) &&
      (rule.numeric.min !== undefined ? num >= rule.numeric.min : true) &&
      (rule.numeric.max !== undefined ? num <= rule.numeric.max : true)
    );
    return { correctness: ok ? "correct" : "incorrect", forbiddenHits };
  }

  if (rule.mode === "regex" && rule.regex) {
    const re = new RegExp(rule.regex, "i");
    const ok = re.test(answer);
    return { correctness: ok ? "correct" : "incorrect", forbiddenHits };
  }

  // Text / set logic
  const required = rule.required || [];
  const expected = rule.expected || [];
  const optional = rule.optional || [];
  const minHits = rule.minHits ?? (rule.mode === "anyOf" ? 1 : required.length);

  const reqHits = required.filter(x => containsAny(a,[x],rule.synonyms));
  const expHits = expected.filter(x => containsAny(a,[x],rule.synonyms));
  const optHits = optional.filter(x => containsAny(a,[x],rule.synonyms));

  if (rule.mode === "categories" && rule.categories) {
    const catHits: string[] = [];
    for (const [cat, items] of Object.entries(rule.categories)) {
      if (items.some(item => containsAny(a,[item],rule.synonyms))) catHits.push(cat);
    }
    const okCats = (rule.minCategories ?? 1);
    const correctness =
      forbiddenHits.length ? "incorrect" :
      (catHits.length >= okCats ? "correct" :
      (catHits.length ? "partially_correct" : "incorrect"));
    return { correctness, categoriesHit: catHits, forbiddenHits };
  }

  // exact/anyOf/allOf (als Heuristik)
  let correctness: EvalResult["correctness"] = "incorrect";
  if (rule.mode === "allOf") {
    const okRequired = reqHits.length >= (required.length ? required.length : minHits);
    correctness = forbiddenHits.length ? "incorrect" : okRequired ? "correct" : (reqHits.length ? "partially_correct" : "incorrect");
  } else if (rule.mode === "anyOf") {
    const okAny = (expHits.length + reqHits.length) >= minHits;
    correctness = forbiddenHits.length ? "incorrect" : (okAny ? "correct" : (optHits.length ? "partially_correct" : "incorrect"));
  } else if (rule.mode === "exact") {
    const ok = expected.length > 0 && containsAny(a, expected, rule.synonyms);
    correctness = forbiddenHits.length ? "incorrect" : ok ? "correct" : "incorrect";
  } else {
    // fallback
    const okAny = (expHits.length + reqHits.length) >= minHits;
    correctness = forbiddenHits.length ? "incorrect" : okAny ? "correct" : (optHits.length ? "partially_correct" : "incorrect");
  }

  return {
    correctness,
    hits: [...reqHits, ...expHits, ...optHits],
    forbiddenHits
  };
}