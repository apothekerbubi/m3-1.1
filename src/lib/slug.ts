import type { Subject } from "./types";

export const SUBJECTS: { label: Subject; slug: string }[] = [
  { label: "Innere Medizin", slug: "innere" },
  { label: "Chirurgie", slug: "chirurgie" },
  { label: "Wahlfach", slug: "wahlfach" },
];

export function subjectFromSlug(slug: string): Subject | null {
  const m = SUBJECTS.find((s) => s.slug === slug);
  return m ? m.label : null;
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}