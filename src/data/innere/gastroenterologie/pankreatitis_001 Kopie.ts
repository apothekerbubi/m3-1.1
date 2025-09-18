// src/data/gastroenterologie/aszites_001.ts

import type { Case } from "@/lib/types";

export const aszites_001: Case = {
  id: "aszites_001",
  title: "Bauchumfangszunahme und Dyspnoe",
  shortTitle: "Aszites",
  leadSymptom: "Abdominelle Schwellung",
  pseudonym: "Aszites_001",
  vignette:
    "Sie sind Arzt in der Notaufnahme. Ein 58-jähriger Patient stellt sich bei Ihnen vor. Er berichtet über einen seit Wochen zunehmenden Bauchumfang, Spannungsgefühl im Abdomen und Belastungsdyspnoe. Welche anamnestischen Fragen stellen Sie?",

  specialty: "Innere Medizin",
  subspecialty: "Hepatologie",
  difficulty: 3,
  tags: ["Aszites", "Portale Hypertension", "Leberzirrhose", "Ösophagusvarizen"],

  steps: [
    {
      order: 1,
      points: 2,
      prompt: "Welche anamnestischen Fragen stellen Sie?",
      hint: "Lebererkrankung, Blutungen, Risikofaktoren, B-Symptomatik",
      rule: {
        mode: "anyOf",
        expected: [
          "Dauer der Beschwerden",
          "Alkoholkonsum, Risikofaktoren, Rauchen",
          "Vorbekannte Lebererkrankungen",
          "B-Symptomatik",
        ],
        minHits: 3,
      },
    },
    {
      order: 2,
      points: 2,
      prompt: "Welche körperlichen Untersuchungsbefunde erwarten Sie?",
      rule: {
        mode: "anyOf",
        expected: [
          "Bauchumfang vergrößert",
          "prall gefüllter Bauch",
          "Aszites nachweisbar (Flüssigkeitswelle, shifting dullness)",
          "Caput medusae",
          "Splenomegalie",
          "Spider naevi oder Palmarerythem",
        ],
        minHits: 2,
      },
    },
    {
      order: 3,
      points: 2,
      prompt: "Welche initiale Diagnostik ist indiziert?",
      rule: {
        mode: "anyOf",
        expected: [
          "Sonografie des Abdomens",
          "Labor (Leberwerte, Gerinnung, Kreatinin, Elektrolyte)",
          "Aszitespunktion",
        ],
        minHits: 3,
      },
    },
    {
      order: 4,
      points: 3,
      prompt:
        "Sie entschließen sich, eine Abdomensonografie durchzuführen. Dabei ergibt sich folgendes Bild. Beschreiben Sie:",
      rule: {
        mode: "anyOf",
        expected: [
          "Aszites",
          "Hinweis auf Leberzirrhose",
          "Erweiterung der Pfortader",
        ],
        minHits: 2,
      },
      image: {
        path: "Hepatologie/Aszites_Sono.png",
        alt: "Sonografie mit freier Flüssigkeit im Abdomen",
        caption: "Sonografie des Abdomens: Nachweis von Aszites (freie Flüssigkeit).",
      },
    },
    {
      order: 5,
      points: 2,
      prompt:
        "Sie haben die anschließende diagnostische Aszitespunktion erfolgreich durchgeführt und wollen nun eine Probe davon zum Labor schicken. Welche Laborparameter sind dabei von besonderem Interesse?",
      rule: {
        mode: "anyOf",
        expected: ["Zellzahl", "Eiweißgehalt", "Mikrobiologische Untersuchung"],
        minHits: 2,
      },
    },
    {
      order: 6,
      points: 3,
      prompt:
        "Inzwischen ist auch folgender Laborbefund eingetroffen. Analysieren Sie erst, welche der Parameter erhöht oder erniedrigt sind, und äußern Sie eine dazu passende Differentialdiagnose.",
      rule: {
        mode: "anyOf",
        expected: [
          "Erhöhte Transaminasen",
          "Hypoalbuminämie",
          "Erhöhte INR / Gerinnungsstörung",
          "Leberzirrhose",
        ],
        minHits: 2,
      },
      image: {
        path: "Hepatologie/Laborbefund_Leberzirrhose.png",
        alt: "Laborbefund mit erhöhten Transaminasen und erniedrigtem Albumin",
        caption: "Typischer Laborbefund bei fortgeschrittener Leberzirrhose.",
      },
    },
    {
      order: 7,
      points: 3,
      prompt: "Welche typischen Ursachen einer portalen Hypertension kennen Sie?",
      hint: "Prä-, intra- und posthepatisch unterscheiden",
      rule: {
        mode: "anyOf",
        expected: [
          "Pfortaderthrombose",
          "Leberzirrhose",
          "Schistosomiasis",
          "Sinusoidales Okklusionssyndrom",
          "Budd-Chiari-Syndrom",
          "Rechtsherzinsuffizienz",
          "Pericarditis constrictiva",
        ],
        minHits: 3,
      },
    },

    // 🔥 Akute Notfallsituation
    {
      order: 12,
      points: 2,
      prompt:
        "Während Sie die Laborwerte interpretieren, klagt der Patient plötzlich über Schwindel, wird blass und beginnt Blut zu erbrechen. Welche Symptome deuten auf eine akute Varizenblutung hin?",
      rule: {
        mode: "anyOf",
        expected: [
          "Hämatemesis",
          "Schockzeichen (Tachykardie, Hypotonie, Blässe, Kaltschweißigkeit)",
          "Schwindel oder Synkope",
          "Meläna",
        ],
        minHits: 2,
      },
    },
    {
      order: 13,
      points: 3,
      prompt: "Welche sofortigen Maßnahmen zur Kreislaufstabilisierung leiten Sie ein?",
      rule: {
        mode: "anyOf",
        expected: [
          "Schocklage",
          "Sauerstoffgabe",
          "Volumentherapie",
          "Anlage von großlumigen Zugängen",
          "Vorbereitung einer Bluttransfusion",
        ],
        minHits: 3,
      },
    },
    {
      order: 4,
      points: 3,
      prompt:
        "Sie leiten umgehend die Notfallversorgung ein. Welches Verfahren ist hier abgebildet?",
      rule: {
        mode: "anyOf",
        expected: [
          "Ösophagusvarizenligatur", 
          "Gummibandligatur",
          "Endoskopische Ligatur",
        ],
        minHits: 1,
      },
      image: {
        path: "Hepatologie/Aszites_Sono.png",
        alt: "Sonografie mit freier Flüssigkeit im Abdomen",
        caption: "Sonografie des Abdomens: Nachweis von Aszites (freie Flüssigkeit).",
      },
    },

    {
      order: 14,
      points: 3,
      prompt:
        "Welche spezifischen Therapien zur Blutstillung bei Ösophagusvarizenblutung kommen außerdem infrage ?",
      rule: {
        mode: "anyOf",
        expected: [
          "Terlipressin oder Somatostatin/Octreotid",
          "Sklerotherapie (falls Ligatur nicht möglich)",
          "Ballontamponade (Sengstaken-Blakemore-Sonde) als Notfallmaßnahme",
        ],
        minHits: 1,
      },
    },
    {
      order: 15,
      points: 2,
      prompt:
        "Welche Maßnahmen ergreifen Sie zur Sekundärprophylaxe nach einer überstandenen Varizenblutung?",
      rule: {
        mode: "anyOf",
        expected: [
          "Nicht-selektive Betablocker (z.B. Propranolol)",
          "Regelmäßige endoskopische Ligatur",
          "TIPS bei rezidivierender Blutung",
          "Alkoholkarenz",
          "Therapie der Grunderkrankung (Leberzirrhose)",
        ],
        minHits: 2,
      },
    },
  ],

  objectives: [
    { id: "diagnose", label: "Aszites diagnostizieren" },
    { id: "ursachen", label: "Ätiologie der portalen Hypertension benennen" },
    { id: "notfall", label: "Akute Varizenblutung erkennen und behandeln" },
    { id: "therapie", label: "Therapieoptionen und Prophylaxe darstellen" },
  ],

  completion: { minObjectives: 4, maxLLMTurns: 20, hardStopTurns: 20 },
};
