// src/data/chirurgie/schock_001.ts
import type { Case } from "@/lib/types";

export const schock_001: Case = {
  id: "schock_001",
  title: "Hypovolämischer Schock",
  shortTitle: "Schock",
  vignette:
    "45-jährige Person nach Verkehrsunfall mit blasser Haut, Tachykardie und Hypotonie.",
  specialty: "Chirurgie",
  subspecialty: "Notfallchirurgie",
  difficulty: 2,
  tags: ["Schock", "Notfall", "Trauma"],
  steps: [
    {
      order: 1,
      points: 2,
      prompt: "Wahrscheinlichster Schocktyp?",
      hint: "Volumenverlust",
      rule: {
        mode: "anyOf",
        expected: ["hypovolämischer schock", "blutverlust", "volumenmangel"],
        minHits: 1,
      },
    },
    {
      order: 2,
      points: 2,
      prompt: "Welche initiale Diagnostik ist wichtig?",
      hint: "Vitalparameter und Ultraschall",
      rule: {
        mode: "anyOf",
        expected: ["blutdruck", "puls", "sonografie", "fast", "labor"],
        minHits: 2,
      },
    },
    {
      order: 3,
      points: 2,
      prompt: "Primäre Therapie?",
      hint: "Volumengabe",
      rule: {
        mode: "anyOf",
        expected: ["volumen", "transfusion", "körperlage", "operation", "blutstillung"],
        minHits: 1,
      },
    },
  ],
  objectives: [
    { id: "typ", label: "Schocktyp erkennen" },
    { id: "diagnostik", label: "Basisdiagnostik nennen" },
    { id: "therapie", label: "Therapie einleiten" },
  ],
  completion: { minObjectives: 2, maxLLMTurns: 12, hardStopTurns: 14 },
};
