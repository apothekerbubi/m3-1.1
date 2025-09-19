// src/data/gastroenterologie/colitis_ulcerosa_001.ts

import type { Case } from "@/lib/types";

export const colitis_ulcerosa_001: Case = {
  id: "colitis_ulcerosa_001",
  title: "Blutige Durchfälle und Bauchschmerzen",
  shortTitle: "Colitis ulcerosa",
  leadSymptom: "Blutige Diarrhö",
  pseudonym: "CU_001",

  vignette:
    "Eine 27-jährige Studentin stellt sich in Ihrer hausärztlichen Praxis vor. Seit etwa zwei Wochen leidet sie unter zunehmende Durchfällen und krampfartigen Bauchschmerzen im linken Unterbauch. Sie berichtet zudem über Fieber bis 38,5 °C und ein ausgeprägtes Krankheitsgefühl. Wie gehen Sie weiter vor?",

  specialty: "Innere Medizin",
  subspecialty: "Gastroenterologie",
  difficulty: 3,
  tags: ["Colitis ulcerosa", "CED", "Blutige Diarrhö", "Endoskopie", "Immunsuppression"],

  steps: [
    {
      order: 1,
      points: 2,
      prompt: "Welche anamnestischen Fragen stellen Sie zusätzlich?",
      hint: "Familienanamnese, Infektionsrisiken, extraintestinale Manifestationen",
      rule: {
        mode: "anyOf",
        expected: [
          "Dauer, Beginn und Häufigkeit der Durchfälle",
          "Blut- und Schleimbeimengung",
          "Fieber oder Gewichtsverlust",
          "Reiseanamnese",
          "Medikamentenanamnese (NSAR, Antibiotika)",
          "Familienanamnese",
          "Fragen nach Gelenk-, Haut- oder Augenbeschwerden",
          "Vorerkrankungen, Voroperationen",
        ],
        minHits: 3,
      },
    },
    {
      order: 2,
      points: 2,
      prompt: "Wie gehen Sie vor?",
      rule: {
        mode: "anyOf",
        expected: ["Labor", "Körperliche Untersuchung", "Sonographie"],
        minHits: 1,
      },
    },
    {
      order: 3,
      points: 3,
      prompt: "Was machen Sie als Nächstes?",
      rule: {
        mode: "anyOf",
        expected: ["Labor"],
        minHits: 1,
      },
    },
    {
      order: 4,
      points: 3,
      prompt: "Welche Laborparameter sind dabei für Sie von Interesse?",
      rule: {
        mode: "anyOf",
        expected: [
          "Entzündungsparameter (CRP, BSG)",
          "Blutbild (Leukozytose, Anämie)",
          "Stuhldiagnostik (Calprotectin)",
          "Elektolyte",
        ],
        minHits: 2,
      },
    },
    {
      order: 5,
      points: 3,
      prompt:
        "Wie interpretieren Sie folgendes Ergebnis. Welche weitere Untersuchungen durchführen?",
      rule: {
        mode: "anyOf",
        expected: ["Leukozytose", "Entzündungszeichen (CRP, Leukos, BSG)","Elektrolytverlust", "Hyponatriämie", "Hypokaliämie", "Anämie"],
        minHits: 1,
      },
      image: {
        path: "Labor/Laborbefund_CU.png",
        alt: "Laborbefund bei Colitis ulcerosa",
        caption: "Laborbefund bei Colitis Ulcerosa.",
      },
    },
    {
      order: 6,
      points: 2,
      prompt: "Sie sehen folgenden Sonographie-Befund des Kolons, Interpretation?",
      rule: {
        mode: "anyOf",
        expected: ["erhöhte Wandverdickung", "vollständigen Aufhebung der Wandschichtung"],
        minHits: 1, // angepasst
      },
      image: {
        path: "Ultraschall/US_CU.png",
        alt: "Laborbefund bei Colitis ulcerosa",
        caption: "Laborbefund bei Colitis Ulcerosa.",
      },
    },
    
    {
      order: 7,
      points: 3,
      prompt:
        "Die körperliche Untersuchung ergibt folgenden Befund: Allgemeinbefund: Blasser, leicht reduzierter Allgemeinzustand, leicht febril, Tachykardie\n\nAbdomen: Leicht gebläht, weich bis mäßig druckschmerzhaft, v. a. im linken Unterbauch, Keine Abwehrspannung, keine Peritonitiszeichen, „plätschernde“ Darmgeräusche\n\nRektale Untersuchung: Schmerzhaft, Blut- oder Schleimauflagerungen am Fingerling.\n\nWelche Differentialdiagnosen ziehen Sie in Betracht?",
      rule: {
        mode: "anyOf",
        expected: [
          "Morbus Crohn",
          "GI Blutung",
          "Infektiöse Kolitis (Infekt)",
          "Divertikulitis",
          "Appendizitis",
          "Ischämische Kolitis",
          "Exsudativ-entzündliche Diarrhoe",
        ],
        minHits: 3,
      },
    },
    {
      order: 8,
      points: 2,
      prompt: "Wie grenzen Sie die Colitis ulcerosa vom Morbus Crohn ab?",
      rule: {
        mode: "anyOf",
        expected: [
          "Beginn im Rektum mit kontinuierlicher Ausbreitung",
          "Keine diskontinuierlichen Entzündungsherde",
          "Keine transmuralen Fisteln",
          "Keine typischen perianalen Veränderungen",
        ],
        minHits: 2,
      },
    },
    {
      order: 9,
      points: 3,
      prompt: "Wie therapieren Sie einen leichten bis mittelschweren Schub?",
      rule: {
        mode: "anyOf",
        expected: [
          "5-ASA (Mesalazin) lokal oder systemisch",
          "Topische Steroide",
          "Systemische Steroide",
        ],
        minHits: 2,
      },
    },
    {
      order: 10,
      points: 3,
      prompt: "Wie sieht die Therapie bei einem schweren Schub aus?",
      rule: {
        mode: "anyOf",
        expected: [
          "Systemische Steroide (z.B. Prednisolon i.v.)",
          "TNF-α-Blocker",
          "Ciclosporin",
          "Vedolizumab",
          "Chirurgische Therapie bei Therapieversagen",
        ],
        minHits: 2,
      },
    },
    {
      order: 11,
      points: 2,
      prompt:
        "Welche operativen Optionen bestehen bei therapierefraktärer Colitis ulcerosa?",
      rule: {
        mode: "anyOf",
        expected: [
          "Restaurative Proktokolektomie, Proktokolektomie mit ileoanaler Pouch-Anastomose",
          "Proktokolektomie mit terminalem Ileostoma oder Kock Pouch",
          "Subtotal-Kolektomie (im Notfall)",
        ],
        minHits: 2,
      },
    },
    {
      order: 12,
      points: 2,
      prompt: "Welche langfristigen Maßnahmen sind notwendig?",
      rule: {
        mode: "anyOf",
        expected: [
          "Regelmäßige Kontrollkoloskopien wegen erhöhtem Karzinomrisiko",
          "Erhaltungstherapie mit niedrigwirksamen Medikamente wie Mesalazin oder Azathioprin oder Infliximab",
          "Aufklärung über extraintestinale Manifestationen",
          "Lebensstilberatung (Stress, Ernährung, Nikotinverzicht)",
          "Reduktion von Steroiden",
        ],
        minHits: 2,
      },
    },
  ],

  objectives: [
    { id: "diagnose", label: "Colitis ulcerosa diagnostizieren" },
    { id: "differenzial", label: "Von Morbus Crohn abgrenzen" },
    { id: "therapie", label: "Therapieoptionen für leichte und schwere Schübe darstellen" },
    { id: "chirurgie", label: "Operative Therapieoptionen benennen" },
    { id: "langfristig", label: "Langfristige Nachsorge und Karzinomprophylaxe erklären" },
  ],

  completion: { minObjectives: 4, maxLLMTurns: 20, hardStopTurns: 20 },
}; 
