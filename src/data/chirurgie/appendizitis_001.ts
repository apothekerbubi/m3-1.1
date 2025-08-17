import type { Case } from "@/lib/types";

export const appendizitis_001: Case = {
  id: "appendizitis_001",
  specialty: "Chirurgie",
  subspecialty: "Allgemeinchirurgie",
  title: "Akute Appendizitis",
  shortTitle: "Appendizitis 1",
  vignette: "22-jähriger Patient mit seit 12 Stunden zunehmenden Schmerzen im rechten Unterbauch...",
  tags: ["Appendizitis", "Akutes Abdomen"],
  pseudonym: "Bauchschmerz 003",
  leadSymptom: "Bauchschmerz",
  difficulty: 1,
  steps: [
    { order: 1, prompt: "Wahrscheinlichste Diagnose?", hint: "Entzündung des Appendix" },
    { order: 2, prompt: "Wichtige klinische Zeichen?", hint: "McBurney, Loslassschmerz, Rovsing" },
    { order: 3, prompt: "Therapie?", hint: "Operativ, Appendektomie" },
  ],
  rubric: {
    sections: [
      {
        name: "Klinische Untersuchung",
        maxPoints: 3,
        items: [
          { text: "McBurney-Zeichen", points: 1, keywords: ["mcburney"] },
          { text: "Loslassschmerz", points: 1, keywords: ["loslass"] },
          { text: "Rovsing-Zeichen", points: 1, keywords: ["rovsing"] },
        ]
      }
    ]
  }
};