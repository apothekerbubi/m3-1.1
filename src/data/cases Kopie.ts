import type { Case } from "@/lib/types";

export const CASES: Case[] = [
  {
    id: "brustschmerz_001",
    title: "Belastungsabhängiger retrosternaler Schmerz",
    vignette: "58-jährige Patientin mit retrosternalem Schmerz bei Belastung, EKG/Troponin initial unauffällig.",
    tags: ["KHK", "ACS-Diff"],
    steps: [
      { order: 1, prompt: "Erstverdacht? Begründen.", hint: "Stabile KHK vs. ACS ohne Troponin-Anstieg." },
      { order: 2, prompt: "Welche Diagnostik veranlassen Sie?", hint: "CT-Angio/Ergometrie, Echo, ggf. Katheter." },
      { order: 3, prompt: "Therapieoptionen?", hint: "TT-AH, Statin, ggf. PCI; Sekundärprophylaxe." },
    ],
    rubric: {
      sections: [
        { name: "DD-Denken", points: 3, keywords: ["khk", "angina", "belastung", "ergometrie"] },
        { name: "Diagnostik", points: 4, keywords: ["ct", "ct-angio", "myokardszinti", "herzkatheter"] },
        { name: "Therapie", points: 3, keywords: ["ass", "statin", "prasugrel", "clopidogrel", "pci"] },
      ],
    },
    subject: "Innere Medizin",
    category: "Kardiologie",
    specialty: "Kardiologie",
    difficulty: "mittel",
  },
  {
    id: "pneumonie_001",
    title: "Dyspnoe mit bilateralen Verschattungen",
    vignette: "65-jähriger Patient mit Dyspnoe seit 3 Tagen, wenig Auswurf, subfebril. RG basal bds., Röntgen: bilaterale Verschattungen.",
    tags: ["Dyspnoe", "Pneumonie"],
    steps: [
      { order: 1, prompt: "Erstverdacht? Begründen.", hint: "Infektiös vs. kardial denken." },
      { order: 2, prompt: "Welche Diagnostik veranlassen Sie?", hint: "Labor, BGA, Bildgebung, Mikro." },
      { order: 3, prompt: "Initiale Therapie?", hint: "AB kalkuliert + Supportiv." },
    ],
    rubric: {
      sections: [
        { name: "Diagnostik", points: 4, keywords: ["bga","blutgasanalyse","blutkultur","röntgen","ct","mikrobiologie"] },
        { name: "Therapie", points: 3, keywords: ["antibiotikum","antibiotika","ab","sauerstoff","supportiv"] },
        { name: "DD", points: 3, keywords: ["lungenödem","lungenoedem","ile","interstitielle","kardial"] },
      ],
    },
    subject: "Innere Medizin",
    category: "Pneumologie",
    specialty: "Pneumologie",
    difficulty: "leicht",
  },
];