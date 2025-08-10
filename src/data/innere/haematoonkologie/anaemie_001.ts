import type { Case } from "@/lib/types";

export const anaemie_001: Case = {
  id: "anaemie_001",
  specialty: "Innere Medizin",
  subspecialty: "Hämatoonkologie",
  title: "Anämie unklarer Genese",
  shortTitle: "Anämie",
  vignette: "78-jährige Patientin mit zunehmender Müdigkeit, Blässe und Leistungsminderung...",
  tags: ["Anämie", "Hämatologie"],
  difficulty: 1,
  steps: [
    { order: 1, prompt: "Differentialdiagnosen?", hint: "Eisenmangel, chronische Erkrankung, Knochenmarkserkrankung" },
    { order: 2, prompt: "Diagnostik?", hint: "BB, Ferritin, CRP, Retis" },
  ],
  rubric: {
    sections: [
      {
        name: "Labor",
        maxPoints: 2,
        items: [
          { text: "BB", points: 1, keywords: ["blutbild", "bb"] },
          { text: "Ferritin", points: 1, keywords: ["ferritin"] }
        ]
      }
    ]
  }
};