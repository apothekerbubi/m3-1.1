import type { Case } from "@/lib/types";

export const brustschmerz_001: Case = {
  id: "brustschmerz_001",
  specialty: "Innere Medizin",
  subspecialty: "Kardiologie",
  title: "Brustschmerz mit Dyspnoe",
  shortTitle: "Brustschmerz 1",
  vignette: "65-jähriger Patient mit akuter Dyspnoe und Thoraxschmerz seit 3 Stunden...",
  leadSymptom: "Brustschmerz",
  pseudonym: "Brustschmerz 001",
  tags: ["Dyspnoe", "KHK", "Notfall"],
  difficulty: 2,
  steps: [
    { order: 1, prompt: "Erstverdacht?", hint: "ACS in Betracht ziehen" },
    { order: 2, prompt: "Welche Diagnostik?", hint: "EKG, Troponin, Echo" },
    { order: 3, prompt: "Therapie?", hint: "MONA, ggf. PCI" },
  ],
  rubric: {
    sections: [
      {
        name: "Diagnostik",
        maxPoints: 3,
        items: [
          { text: "EKG", points: 1, keywords: ["ekg"] },
          { text: "Troponin", points: 1, keywords: ["troponin"] },
          { text: "Echokardiographie", points: 1, keywords: ["echo", "echokardiographie"] },
        ]
      }
    ]
  }
};