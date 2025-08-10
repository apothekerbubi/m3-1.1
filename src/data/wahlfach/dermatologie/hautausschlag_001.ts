import type { Case } from "@/lib/types";

export const hautausschlag_001: Case = {
  id: "hautausschlag_001",
  sspecialty: "Wahlfach",
  subspecialty: "Dermatologie",
  title: "Akuter Hautausschlag",
  shortTitle: "Ausschlag",
  vignette: "35-jährige Patientin mit juckendem, rötlichem Hautausschlag seit 3 Tagen. Keine neuen Medikamente, keine bekannten Allergien.",
  tags: ["Dermatologie", "Exanthem"],
  difficulty: 1,
  steps: [
    { order: 1, prompt: "Differentialdiagnosen?", hint: "Allergisch, infektiös, autoimmun" },
    { order: 2, prompt: "Wichtige Anamnese-Fragen?", hint: "Medikamente, Kontakte, Begleitsymptome" },
    { order: 3, prompt: "Therapie?", hint: "Symptomatisch oder gezielt je nach Ursache" },
  ],
  rubric: {
    sections: [
      {
        name: "Anamnese",
        maxPoints: 3,
        items: [
          { text: "Medikamentenanamnese", points: 1, keywords: ["medikament"] },
          { text: "Infektanamnese", points: 1, keywords: ["infekt"] },
          { text: "Allergieanamnese", points: 1, keywords: ["allergie"] },
        ]
      },
      {
        name: "Körperliche Untersuchung",
        maxPoints: 2,
        items: [
          { text: "Beschreibung des Exanthems", points: 1, keywords: ["exanthem", "ausschlag"] },
          { text: "Verteilung dokumentieren", points: 1, keywords: ["verteilung", "lokalisation"] },
        ]
      }
    ]
  }
};