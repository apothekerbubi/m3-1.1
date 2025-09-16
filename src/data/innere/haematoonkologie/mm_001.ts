// src/data/haematoonkologie/mm_001.ts
import type { Case } from "@/lib/types";

export const mm_001: Case = {
  id: "mm_001",
  title: "Schmerzen, Schwäche und Laborauffälligkeiten",
  shortTitle: "Multiples Myelom",
  leadSymptom:"Anaemie",
  pseudonym: "Anamie_002",
  vignette:
    "Ein 72-jähriger Patient stellt sich in Ihrer Hausarztpraxis vor. Er berichtet über zunehmende Schwäche, ungewollten Gewichtsverlust von etwa 6kg im letzten Halbjahr. Zudem berichtet er über seit Wochen bestehende Schmerzen in den Beinen. Nach kurzem Überlegen stellen Sie ihm welche weiteren Fragen?",
  specialty: "Innere Medizin",
  subspecialty: "Hämatoonkologie",
  difficulty: 3,
  tags: ["Multiples Myelom", "Plasmazellneoplasie", "Osteolysen", "B-Symptomatik"],
  steps: [
    {
      order: 1,
      points: 2,
      prompt: "Welche anamnestischen Fragen stellen Sie zusätzlich?",
      hint: "Symptome, Dauer, Lokalisation, B-Symptome",
      rule: {
        mode: "anyOf",
        expected: [
          "Dauer der Symptome",
          "Genauer Ort und Art der Schmerzen",
          "Nach weiteren Symptomen fragen",
          "B-Symptomatik",
           "Fieber", "Nachtschweiß", "Gewichtsverlust",
        ],
        minHits: 3,
      },
    },
    {
      order: 2,
      points: 2,
      prompt: "Die anschließende körperliche Untersuchung bleibt unauffällig. Sie nehmen eine orientierende Labor- sowie Urinuntersuchung vor. Die Ergebnisse erhalten Sie allerdings erst am nächsten Tag. Welche akute Diagnostik können Sie heute noch anstellen?",
      rule: {
        mode: "anyOf",
        expected: ["Ultraschall", "EKG", "Vitalparameter"],
        minHits: 2,
      },
      },
    {
      order: 3,
      points: 3,
      prompt: "Das EKG zeigt folgendes Bild. Beschreiben Sie Lagetyp, Rhythums, Überleitungszeit, mögliche Blockbilder?",
      rule: {
        mode: "anyOf",
        expected: ["Sinusrhythmus", "Linkstyp", "regelrechte Überleitung","kein Blockbild", "kein Block"],
        minHits: 3,
      },
    image: {
        path: "EKG/unauffaelliges_EKG.jpeg",
        alt: "Unauffälliges EKG",
        caption: "Rodhullandemu, Public domain, via Wikimedia Commons",
      },
      },
    {
      order: 3,
      points: 3,
      prompt: "Am Folgetag liegen Labor- und Urinergebnisse vor. Wie interpretieren Sie diese Befunde?",
      rule: {
        mode: "anyOf",
        expected: [
          
          "Panzytopenie",
          "Hyperkalzämie",
          "Nierenfunktionsstörung",
          "Hyperproteinämie",
          "Proteinurie",
          "Paraproteinämie"
        ],
        minHits: 3,
      },
      image: {
        path: "Onkologie/Laborbefund.png",
        alt: "Hyperkalziämie, Eiweiß im Urin",
        caption: "Laborbefund",
      },
    },
    {
      order: 4,
      points: 2,
      prompt: "Welche weiteren einfachen Untersuchungen veranlassen Sie?",
      rule: {
        mode: "anyOf",
        expected: [
          "Serumelektrophorese",
          "Immunfixation",
          "24h-Urin-Eiweißelektrophorese",
          "Nachweis von Bence-Jones-Proteinen",
          "Low-dose CT"
        ],
        minHits: 2,
      },
    },
    {
      order: 5,
      points: 2,
      prompt: "Die Immunfixation zeigt eine monoklonale Gammopathie. Was bedeutet das auf zellulärer Ebene? Zudem ist das Ergebnis der Serumelektrophorese angekommen, welche Besonderheit sehen Sie und was bedeutet das?",
      rule: {
        mode: "anyOf",
        expected: ["M-Gradient", "Monoklonale Gammopathie", "Hinweis auf multiples Myelom", "vermehrte Produktion Immunglobuline", "Produktion einer Art von Antikörpern", "klonale Vermehrung der Plasmazellen"],
        minHits: 2,
      },
      image: {
        path: "Onkologie/Serumelektrophorese mit M Gradient.png",
        alt: "Serumelektrophorese mit M-Gradient",
        caption: "Nachweis einer monoklonalen Gammopathie (M-Gradient).",
      },
    },
    {
      order: 6,
      points: 2,
      prompt: "Welches bildgebende Verfahren dient zur Diagnosesicherung und was möchten Sie dort sehen?",
      rule: {
        mode: "anyOf",
        expected: ["Low-dose Ganzkörper-CT", "Osteolysen"],
        minHits: 2,
      },
    },
    {
      order: 7,
      points: 2,
      prompt: "Was sehen Sie in der Knochenmarksuntersuchung. Wie interpretieren Sie das?",
      rule: {
        mode: "anyOf",
        expected: ["Plasmazellnester", "vermehrte Plasmazellen", "Bestätigung multiples Myelom"],
        minHits: 2,
      },
      image: {
        path: "Onkologie/Plasmazellnester.png",
        alt: "Knochenmarksausstrich mit Plasmazellnestern",
        caption: "Knochenmarksausstrich mit Plasmazellnestern.",
      },
    },
   {
  order: 8,
  points: 3,
  prompt: "Welche Diagnosekriterien müssen für die Sicherung eines Multiplen Myeloms erfüllt sein?",
  hint: "2 Kriterien: monoklonale Plasmazellen + mindestens ein SLiM-CRAB-Kriterium",
  rule: {
    mode: "anyOf",
    expected: [
      "≥10% monoklonale Plasmazellen im Knochenmark",
      "bioptisch gesichertes Plasmozytom",
      "SLiM-Kriterien: ≥60% Plasmazellen im Knochenmark",
      "freie Leichtketten ≥100 mg/L mit pathologischem Quotienten",
      "≥2 fokale Läsionen in der MRT",
      "CRAB-Kriterien: Hyperkalzämie",
      "Nierenfunktionsstörung",
      "Anämie",
      "Osteolyse"
    ],
    minHits: 3,
  },
},
    {
      order: 8,
      points: 3,
      prompt: "Welche Therapieoptionen für das multiple Myelom kennen Sie?",
      hint: "Medikamente, Transplantation, Supportivmaßnahmen",
      rule: {
        mode: "anyOf",
        expected: [
          "Proteasom-Inhibitoren: Bortezomib, Carfilzomib",
          "Anti-CD38-Antikörper: Daratumumab, Isatuximab",
          "IMiDs: Thalidomid, Lenalidomid",
          "Glukokortikoide: Dexamethason, Prednisolon",
          "Zytostatika: Melphalan, Cyclophosphamid",
          "Autologe Stammzelltransplantation",
          "Strahlentherapie",
          "Bisphosphonate oder RANKL-Inhibitor"
        ],
        minHits: 3,
      },
    },
  ],
  objectives: [
    { id: "diagnose", label: "Multiples Myelom diagnostizieren" },
    { id: "labor", label: "Typische Laborauffälligkeiten interpretieren" },
    { id: "elektrophorese", label: "M-Gradient erkennen" },
    { id: "knochenmark", label: "Plasmazellnester im Knochenmark erkennen" },
    { id: "therapie", label: "Therapieoptionen benennen" },
  ],
  completion: { minObjectives: 5, maxLLMTurns: 20, hardStopTurns: 20 },
};
