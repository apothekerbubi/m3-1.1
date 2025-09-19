import type { Case } from "@/lib/types";

export const vorhofflimmern_001: Case = {
  id: "vorhofflimmern_001",
  title: "Palpitationen und Leistungsknick",
  shortTitle: "Vorhofflimmern",
  leadSymptom: "Palpitationen",
  pseudonym: "CU_001",
  specialty: "Innere Medizin",
  subspecialty: "Kardiologie",
  difficulty: 3,
  tags: ["Vorhofflimmern", "Arrhythmie", "Tachykardie", "EKG"],
  vignette:
    "Ein 74-jähriger Patient stellt sich in der Notaufnahme wegen seit dem Morgen bestehender Herzstolperer, Luftnot bei Belastung und allgemeiner Schwäche vor. Er berichtet über Hypertonie und Diabetes mellitus, nimmt aber seine Medikamente unregelmäßig ein.",

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
        path: "EKG/Vorhofflimmern.png",
        alt: "EKG mit unregelmäßigem RR-Abstand und fehlenden P-Wellen",
        caption: "Typisches EKG bei tachykardem Vorhofflimmern mit fehlenden P-Wellen und unregelmäßigem Kammerrhythmus.",
      },
    },
  ],
  objectives: [
    { id: "diagnose", label: "Vorhofflimmern anhand des EKG erkennen" },
    { id: "definition", label: "Vorhofflimmern definieren und klassifizieren" },
    { id: "therapie", label: "Therapieprinzipien und weiterführende Schritte erläutern" },
  ],
  completion: { minObjectives: 3, maxLLMTurns: 20, hardStopTurns: 20 },
};
