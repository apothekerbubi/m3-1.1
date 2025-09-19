import type { Case } from "@/lib/types";

export const vorhofflimmern_001: Case = {
  id: "vorhofflimmern_001",
  title: "Palpitationen",
  shortTitle: "Vorhofflimmern",
  leadSymptom: "Palpitationen",
  pseudonym: "CU_001",
  difficulty: 3,
  vignette:
    ".",


  steps: [
    {
      order: 1,
      points: 2,
      prompt: "Stellen Sie mir eine Blickdiagnose.",
      hint: "fehlende P-Welle, Tachykardie, unregelmäßige schmale QRS-Komplexe, Flimmerwellen",
      rule: {
        mode: "anyOf",
        expected: ["Tachykardes Vorhofflimmern"],
        minHits: 1,
      },
    },
    {
      order: 2,
      points: 2,
      prompt: "Wie machen Sie das denn anhand des EKGs fest?",
      rule: {
        mode: "anyOf",
        expected: [
          "Ich sehe keine P-Wellen, sondern Flimmerwellen mit einer Frequenz von >350/min. Des Weiteren sehe ich schmale und unregelmäßige QRS-Komplexe, mit einer Frequenz von etwa 130/min. Es handelt sich also um ein tachykardes Vorhofflimmern",
        ],
        minHits: 1,
      },
    },
    {
      order: 3,
      points: 2,
      prompt: "Wie würden Sie denn allgemein Vorhofflimmern definieren?",
      rule: {
        mode: "anyOf",
        expected: [
          "Vorhofflimmern ist eine Form der Arrhythmie, bei der es zu einer Erregung der Vorhöfe unabhängig vom Sinusknoten kommt und zu einer unregelmäßigen Weiterleitung auf die Kammern.",
        ],
        minHits: 1,
      },
    },
    {
      order: 4,
      points: 2,
      prompt: "Wie würden Sie Vorhofflimmern denn strukturiert in Kategorien klassifizieren?",
      rule: {
        mode: "anyOf",
        expected: [
          "Ich würde Vorhofflimmern entweder nach der resultierenden Kammerfrequenz in bradykardes, normokardes oder tachykardes Vorhofflimmern einteilen, oder nach dem zeitlichen Auftreten bzw. der Häufigkeit in anfallsartiges (paroxysmales) oder persistierendes Vorhofflimmern. Paroxysmales Vorhofflimmern hält nach Definition weniger als 7 Tage an, bevor es spontan (oder iatrogen) in einen Sinusrhythmus konvertiert, während persistierendes Vorhofflimmern länger als 7 Tage anhält.",
        ],
        minHits: 1,
      },
      image: {
        path: "Knochenmark/Plasmazellnester_Bsp.png",
        alt: "Knochenmarksausstrich mit Plasmazellnestern",
        caption: "Knochenmarksausstrich mit Plasmazellnestern.",
      },
    },
    // ❗ Falls du das Multiple-Myelom behalten willst, sollte das ein eigenes Case sein:
    /*
    {
      order: 5,
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
          "Osteolyse",
        ],
        minHits: 4,
      },
    },
    */
  ],
};