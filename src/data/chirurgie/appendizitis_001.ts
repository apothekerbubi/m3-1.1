// src/data/chirurgie/appendizitis_001.ts
import type { Case } from "@/lib/types";

export const appendizitis_001: Case = {
  id: "appendizitis_001",
  title: "Rechter Unterbauchschmerz",
  shortTitle: "Appendizitis",
  vignette:
    "19-jährige Person mit zunehmenden Schmerzen im rechten Unterbauch, Übelkeit und leichtem Fieber.",
  specialty: "Chirurgie",
  subspecialty: "Allgemeinchirurgie",
  difficulty: 1,
  tags: ["Appendizitis", "RUQ/RLQ", "Akutes Abdomen"],
  steps: [
    {
      order: 1,
      points: 2,
      prompt: "Wahrscheinlichste Diagnose?",
      hint: "Entzündung des Appendix",
      rule: {
        mode: "anyOf",
        expected: ["appendizitis", "appendicitis", "blinddarmentzündung"],
        minHits: 1,
      },
    },
    {
      order: 2,
      points: 2,
      prompt: "Wichtige klinische Zeichen?",
      hint: "McBurney, Loslassschmerz, Rovsing",
      rule: {
        mode: "anyOf",
        expected: [
          "mcburney",
          "loslassschmerz",
          "rovsing",
          "psoas",
          "obturator",
          "druckschmerz rechter unterbauch",
        ],
        minHits: 2,
      },
    },
    {
      order: 3,
      points: 2,
      prompt: "Therapie?",
      hint: "Operativ, Appendektomie",
      rule: {
        mode: "anyOf",
        expected: ["appendektomie", "operation", "chirurgisch", "antibiotika"],
        minHits: 1,
      },
    },
  ],
  objectives: [
    { id: "diagnose", label: "Appendizitis erkennen" },
    { id: "zeichen", label: "Klinische Zeichen benennen" },
    { id: "therapie", label: "Therapieoptionen kennen" },
  ],
  completion: { minObjectives: 2, maxLLMTurns: 12, hardStopTurns: 14 },
};