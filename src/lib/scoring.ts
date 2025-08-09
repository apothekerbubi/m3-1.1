import type { RubricSection } from "@/lib/types";

const normalize = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "").replace(/[^a-z0-9\s]/gi, " ").replace(/\s+/g, " ").trim();

function levenshtein(a: string, b: string) {
  const m = a.length, n = b.length;
  if (m === 0) return n; if (n === 0) return m;
  const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 1; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) {
    const cost = a[i - 1] === b[j - 1] ? 0 : 1;
    dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
  }
  return dp[m][n];
}

function containsFuzzy(haystack: string, needle: string) {
  const H = normalize(haystack), N = normalize(needle);
  if (!N) return false;
  if (H.includes(N)) return true;
  for (const w of H.split(" ")) if (Math.abs(w.length - N.length) <= 2 && levenshtein(w, N) <= 1) return true;
  return false;
}

export function scoreAnswer(answer: string, rubric: RubricSection[]) {
  const res = { total: 0, sections: [] as { name: string; got: number; max: number; missing: string[] }[] };
  for (const sec of rubric) {
    let got = 0; const missing: string[] = [];
    for (const item of sec.items) {
      const hit = item.keywords.some((k) => containsFuzzy(answer, k));
      if (hit) got += item.points; else missing.push(item.text);
    }
    got = Math.min(got, sec.maxPoints);
    res.total += got; res.sections.push({ name: sec.name, got, max: sec.maxPoints, missing });
  }
  return res;
}