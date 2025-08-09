import type { Case } from "@/lib/types";

export const CASES: Case[] = [
  {
    id: "pneumonie_001",
    title: "Dyspnoe mit bilateralen Verschattungen",
    specialty: "Innere",
    difficulty: 2,
    vignette:
      "65-jähriger Patient mit Dyspnoe seit 3 Tagen, wenig Auswurf, subfebril. Feuchte RG basal bds. Röntgen: bilaterale Verschattungen.",
    tags: ["Dyspnoe", "Pneumonie"],
    steps: [
      { id: "s1", order: 1, prompt: "Erstverdacht? Begründen.", hint: "Infektiös vs. kardial denken." },
      { id: "s2", order: 2, prompt: "Welche Diagnostik veranlassen Sie?", hint: "Labor, BGA, Bildgebung, Mikro." },
      { id: "s3", order: 3, prompt: "Initiale Therapie?", hint: "AB kalkuliert + Supportiv." }
    ],
    rubric: [
      { id: "r1", name: "Diagnostik", maxPoints: 6, items: [
        { id: "r1i1", text: "BGA nennen", points: 1, keywords: ["bga","blutgasanalyse"] },
        { id: "r1i2", text: "Blutkulturen vor AB", points: 1, keywords: ["blutkultur","blutkulturen"] }
      ]},
      { id: "r2", name: "Therapie", maxPoints: 4, items: [
        { id: "r2i1", text: "AB kalkuliert", points: 2, keywords: ["amoxicillin","ampicillin","makrolid","moxifloxacin"] },
        { id: "r2i2", text: "O2 bei Hypoxie", points: 1, keywords: ["sauerstoff","o2"] }
      ]}
    ]
  },
  {
    id: "brustschmerz_001",
    title: "Belastungsabhängiger Brustschmerz",
    specialty: "Innere",
    difficulty: 2,
    vignette: "58-jährige Patientin mit retrosternalem Schmerz bei Belastung, EKG/Troponin initial unauffällig.",
    tags: ["KHK", "Brustschmerz"],
    steps: [
      { id: "s1", order: 1, prompt: "Wahrscheinlichste Diagnose?", hint: "Stabile Angina?" },
      { id: "s2", order: 2, prompt: "Weiteres Vorgehen?", hint: "Belastungsdiagnostik / CT-Koronar?" }
    ],
    rubric: [
      { id: "r1", name: "Differenzialdiagnose", maxPoints: 3, items: [
        { id: "r1i1", text: "KHK/Angina benennen", points: 2, keywords: ["angina","khk","koronare"] }
      ]}
    ]
  }
];