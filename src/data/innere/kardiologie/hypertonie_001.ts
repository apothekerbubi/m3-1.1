import type { Case } from "@/lib/types";

export const hypertonie_001: Case = {
  id: "hypertonie_001",
  title:
    "Hypertonie – Definition, Ursachen, Messfehler, Basismaßnahmen, Organschäden",
  shortTitle: "Hypertonie",
  vignette:
    "54-jähriger Patient, wiederholt erhöhte Praxiswerte bis 160/95 mmHg. Gelegentlich Kopfdruck morgens, BMI 30 kg/m²; sitzt viel im Büro. Keine bekannten Vorerkrankungen. Familienanamnese: Vater Schlaganfall mit 62.",
  // ✅ nur diese beiden für die Bibliothek verwenden:
  specialty: "Innere Medizin",
  subspecialty: "Kardiologie",

  difficulty: 2,
  tags: ["Hypertonie", "Kardiologie", "Anamnese", "Basismaßnahmen", "Sekundäre Hypertonie"],

  steps: [
    {
      order: 1,
      prompt:
        "Wie definieren Sie die arterielle Hypertonie im deutschsprachigen/europäischen Raum? Und wie unterscheidet sich das von US-Definitionen?",
      hint: "ESC/ESH vs. AHA/ACC (140/90 vs. 130/80).",
    },
    {
      order: 2,
      prompt: "Nennen Sie häufige Ursachen einer sekundären Hypertonie.",
      hint: "Renal, endokrin (Hyperaldosteronismus), Schlafapnoe, Medikamente …",
    },
    {
      order: 3,
      prompt: "Welche Fehlerquellen bei der Blutdruckmessung kennen Sie?",
      hint: "Manschettengröße, Ruhezeit, Herzhöhe, Wiederholungen …",
    },
    {
      order: 4,
      prompt:
        "Welche Basismaßnahmen sollten VOR Einleitung einer medikamentösen Therapie erfolgen?",
      hint: "Lebensstil, Monitoring, Endorganschäden screenen …",
    },
    {
      order: 5,
      prompt:
        "Welche Organsysteme können in welcher Weise von Komplikationen der Hypertonie betroffen sein?",
      hint: "Herz, Hirn, Niere, Auge, Gefäße.",
    },
  ],

  objectives: [
    { id: "def", label: "Definition korrekt nennen" },
    { id: "sec", label: "Sekundäre Ursachen benennen" },
    { id: "bp", label: "Messfehler aufzählen" },
    { id: "lifestyle", label: "Basismaßnahmen nennen" },
    { id: "organs", label: "Organschäden/Komplikationen benennen" },
  ],

  completion: {
    minObjectives: 3,      // ab 3 erfüllten Zielen darf der Fall enden
    maxLLMTurns: 8,        // weiches Limit
    hardStopTurns: 10,     // absolutes Limit
  },
};