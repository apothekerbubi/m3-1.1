import type { Case } from "@/lib/types";

export const vorhofflimmern_001: Case = {
  id: "vorhofflimmern_001",

  title: "Palpitationen",
  shortTitle: "Vorhofflimmern",
  leadSymptom: "Palpitationen",
  pseudonym: "CU_001",
  difficulty: 3,
  specialty: "Innere Medizin",
  subspecialty: "Kardiologie",
  vignette:
    "Nehmen Sie an, es handelt sich um eine 67-jährige Patientin in Ihrer Sprechstunde als Hausarzt. Sie berichten Episoden mit starkem Herzklopfen. Sie schreiben ein EKG.",
  tags: ["Vorhofflimmern", "Arrhythmie", "Tachykardie", "EKG"],

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
    {
      order: 5,
      points: 2,
      prompt:
        "Die Patientin berichtet über Episoden mit starkem Herzklopfen. Was würden Sie neben dem EKG noch veranlassen?",
      rule: {
        mode: "anyOf",
        expected: [
          "Labor abnehmen, insbesondere Serumelektrolyte (Kalium) und TSH-Wert zum Ausschluss einer Schilddrüsenüberfunktion.",
          "Bestimmung der Gerinnungsparameter, falls im Verlauf eine antikoagulative Therapie begonnen werden soll.",
          "Eventuell ein Langzeit-EKG.",
        ],
        minHits: 1,
      },
    },
    {
      order: 6,
      points: 2,
      prompt: "Wie würden Sie die Therapie des Vorhofflimmerns grundsätzlich strukturiert beschreiben?",
      rule: {
        mode: "anyOf",
        expected: [
          "Es gibt eine antikoagulative Therapie je nach Thromboembolierisiko (CHA2DS2-VASc-Score) sowie eine antiarrhythmische Therapie (Frequenz- oder Rhythmuskontrolle). Zusätzlich sollten Komorbiditäten kontrolliert und Lifestyle-modifizierende Faktoren berücksichtigt werden (Upstream-Therapie).",
        ],
        minHits: 1,
      },
    },
    {
      order: 7,
      points: 2,
      prompt: "Warum bedarf es denn einer Antikoagulation als Therapie? Können Sie das pathophysiologisch erklären?",
      rule: {
        mode: "anyOf",
        expected: [
          "Durch die Flimmerkontraktionen ist der Blutfluss, insbesondere in den Vorhöfen, kompromittiert (Stase). Durch die Stase kann es zur Bildung von Thromben kommen, die dann in den Körperkreislauf gelangen können.",
        ],
        minHits: 1,
      },
    },
    {
      order: 8,
      points: 2,
      prompt: "Wo gibt es besondere Prädilektionsstellen für die Thrombenbildung?",
      rule: {
        mode: "anyOf",
        expected: [
          "Im linken Vorhofohr, einer embryonalen Ausstülpung des linken Vorhofes, da dieses bei Flimmern nicht mehr entleert wird und es dort zu einer Stase kommt.",
        ],
        minHits: 1,
      },
    },
    {
      order: 9,
      points: 2,
      prompt: "Wann wäre es indiziert, das Vorhofohr zu verschließen?",
      rule: {
        mode: "anyOf",
        expected: [
          "Wenn eine Antikoagulation kontraindiziert ist oder trotz Antikoagulation weiterhin thromboembolische Ereignisse auftreten.",
        ],
        minHits: 1,
      },
    },
    {
      order: 10,
      points: 2,
      prompt:
        "Welche Klassen von oralen Antikoagulanzien kennen Sie und welche würden Sie hier einsetzen?",
      rule: {
        mode: "anyOf",
        expected: [
          "Vitamin-K-Antagonisten wie Marcumar.",
          "Direkte orale Antikoagulanzien (DOAKs) wie Dabigatran oder Rivaroxaban.",
          "In diesem Fall würde ich, sofern keine Kontraindikationen vorliegen, ein DOAK wie Dabigatran oder Rivaroxaban einsetzen.",
        ],
        minHits: 1,
      },
    },
    {
      order: 11,
      points: 2,
      prompt: "Wie wirken DOAKs und warum ziehen Sie diese einem Vitamin-K-Antagonisten vor?",
      rule: {
        mode: "anyOf",
        expected: [
          "Dabigatran hemmt Faktor II, Rivaroxaban oder Apixaban hemmen Faktor X.",
          "DOAKs haben ein geringeres Risiko insbesondere für cerebrale Blutungen.",
          "Sie sind einfacher zu dosieren, da sie nach festem Schema verordnet werden und keine INR-Kontrolle erfordern.",
        ],
        minHits: 1,
      },
    },
    {
      order: 12,
      points: 2,
      prompt:
        "Die Patientin leidet stark unter Palpitationen. Welche Medikamente stehen Ihnen zur Symptomkontrolle zur Verfügung und was würden Sie vorziehen?",
      rule: {
        mode: "anyOf",
        expected: [
          "Frequenzkontrolle mit Betablockern oder Calciumkanalantagonisten vom Verapamil-Typ.",
          "Rhythmuskontrolle bei unzureichender Symptomkontrolle, z. B. mit Flecainid.",
          "Zunächst Frequenzkontrolle aufgrund geringerer Nebenwirkungen.",
          "Eine Rhythmuskontrolle würde ich erwägen, wenn Frequenzkontrolle nicht ausreicht oder Bradykardien auftreten.",
        ],
        minHits: 1,
      },
    },
    {
      order: 13,
      points: 2,
      prompt: "Was wäre eine Indikation zur elektrischen Kardioversion?",
      rule: {
        mode: "anyOf",
        expected: [
          "Eine hämodynamische Instabilität, also eine Notfallsituation.",
          "Wichtig ist auch die Analgosedierung.",
          "Eine antiarrhythmische medikamentöse Therapie erhöht die Erfolgsaussichten.",
        ],
        minHits: 1,
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