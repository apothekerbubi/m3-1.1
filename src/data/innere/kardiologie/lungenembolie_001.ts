import type { Case } from "@/lib/types";

export const lungenembolie_001: Case = {
  id: "lungenembolie_001",

  title: "Plötzlich auftretende Dyspnoe und Thoraxschmerz",
  shortTitle: "Lungenembolie",
  leadSymptom: "Akute Atemnot",
  pseudonym: "Lungenembolie_001",
  vignette:
    "Sie arbeiten als Assistenzarzt in der Zentralen Notaufnahme. Eine 42-jährige Patientin wird mit akuter Luftnot und atemabhängigen Thoraxschmerzen eingeliefert. Sie gibt an, dass die Beschwerden vor etwa einer Stunde plötzlich aufgetreten sind. Die 42-jährige Patientin ist Nichtraucherin. Zwei Wochen zuvor erfolgte eine Knie-Totalendoprothese rechts, seither besteht eine deutliche Einschränkung der Mobilität. Eine medikamentöse Thromboseprophylaxe war postoperativ für 7 Tage durchgeführt worden, wurde dann jedoch von der Patientin eigenmächtig abgesetzt. Weitere Risikofaktoren wie orale Kontrazeption oder bekannte Tumorerkrankungen liegen nicht vor. In der Familienanamnese berichtet sie, dass ihr Vater im Alter von 60 Jahren eine tiefe Beinvenenthrombose erlitten hatte. Seit einigen Tagen bemerkt die Patientin eine zunehmende Schwellung und Spannungsgefühle im rechten Unterschenkel, die sie bislang nicht weiter beachtet hat.",

  specialty: "Innere Medizin",
  subspecialty: "Kardiologie",
  difficulty: 4,
  tags: ["Lungenembolie", "Dyspnoe", "Thrombose", "Notfallmedizin"],

  steps: [
    {
      order: 1,
      points: 2,
      prompt:
        "Sie übernehmen die Patientin. Welche initialen diagnostischen und therapeutischen Maßnahmen leiten Sie in der Notaufnahme ein?",
      rule: {
        mode: "anyOf",
        expected: [
          "Strukturierte Antwort: Basismaßnahmen wie Monitoring (EKG, SpO₂, RR), Sicherung des Zugangs, Sauerstoffgabe bei Hypoxie, Anamnese mit Fokus auf Risikofaktoren (Operation, Immobilisation, Thromboseanamnese), körperliche Untersuchung (Auskultation, Inspektion Halsvenen, Beinschwellung). Erste Labordiagnostik inkl. Blutgasanalyse und D-Dimer-Bestimmung, Troponin, BNP. Einschätzung der klinischen Wahrscheinlichkeit (Wells-Score).",
        ],
        minHits: 1,
      },
    },
    {
      order: 2,
      points: 3,
      prompt:
        "Der Blutgasbefund der Patientin liegt vor. Interpretieren Sie die Werte und leiten Sie daraus mögliche pathophysiologische Ursachen ab.",
      image: {
        path: "Labor/Lungenembolie_BGA.png",
        alt: "Blutgas mit erniedrigtem pO₂ und erniedrigtem pCO₂",
        caption: "Arterielle BGA: Hypoxämie, Hypokapnie durch Hyperventilation.",
      },
      rule: {
        mode: "anyOf",
        expected: [
          "Die BGA zeigt eine Hypoxämie mit erniedrigtem pO₂ (54 mmHg) sowie eine Hypokapnie durch Hyperventilation (pCO₂ 28 mmHg). Der pH ist leicht alkalisch (7,49), was für eine respiratorische Alkalose spricht. Die Sauerstoffsättigung ist deutlich reduziert (88 %). Diese Konstellation weist auf eine akute Störung des Gasaustauschs mit Ventilations-Perfusions-Mismatch hin. Als mögliche Ursachen kommen akute Erkrankungen wie Pneumonie, Pneumothorax, Asthmaanfall oder eine Lungenembolie infrage.",
        ],
        minHits: 1,
      },
    },
    {
      order: 3,
      points: 3,
      prompt:
        "Sie schreiben folgendes ein EKG. Beschreiben Sie die typischen Veränderungen und deren Bedeutung.",
      image: {
        path: "EKG/Lungenembolie_SIQIII.png",
        alt: "EKG mit SIQIII-Typ",
        caption: "Typisches EKG bei akuter Rechtsherzbelastung.",
      },
      rule: {
        mode: "anyOf",
        expected: [
          "12-Kanal-EKG mit Sinusrhythmus und S1Q3-Muster (S-Zacke in Ableitung I, Q-Zacke in Ableitung III). Zusätzlich zeigen sich T-Negativierungen in den rechtspräkordialen Ableitungen (V1–V3) sowie ST-Streckensenkungen in den inferioren Ableitungen. Das Muster ist vereinbar mit einer akuten Rechtsherzbelastung, wie sie beispielsweise bei akuter Lungenembolie auftreten kann.",
        ],
        minHits: 1,
      },
    },
    {
      order: 4,
      points: 3,
      prompt:
        "Bei der körperlichen Untersuchung fällt eine Schwellung des rechten Unterschenkels auf, und die Patientin weist eine Herzfrequenz von 106/min auf. Erheben Sie den vereinfachten Wells-Score, listen Sie alle zugehörigen Parameter auf und schlussfolgern Sie, wie hoch die Wahrscheinlichkeit für eine Lungenembolie ist und welche diagnostische Konsequenz daraus folgt.",
      rule: {
        mode: "anyOf",
        expected: [
          "Vereinfachter Wells-Score: Klinische Zeichen einer tiefen Venenthrombose (1 Punkt), Lungenembolie wahrscheinlicher als alternative Diagnose (1 Punkt), Herzfrequenz >100/min (1 Punkt), Immobilisation/Operation in den letzten 4 Wochen (1 Punkt), frühere TVT/LE (1 Punkt), Hämoptysen (1 Punkt), Malignom (1 Punkt).",
          "Bewertung: In diesem Fall 4 Punkte (TVT-Zeichen, LE wahrscheinlicher, Operation, Tachykardie). Damit gilt eine Lungenembolie als wahrscheinlich.",
          "Konsequenz: Bei erhöhter Wahrscheinlichkeit ist unmittelbar eine CT-Pulmonalisangiographie indiziert, ohne vorherigen D-Dimer-Test.",
        ],
        minHits: 1,
      },
    },
    {
      order: 5,
      points: 3,
      prompt:
        "Sie veranlassen eine CT-Pulmonalisangiographie. Beschreiben Sie die gezeigten Auffälligkeiten und ordnen Sie diese in den klinischen Kontext ein. Geben Sie eine erste Einschätzung zur vermuteten Diagnose.",
      image: {
        path: "CT/Lungenembolie_CTPA.png",
        alt: "CT-Pulmonalisangiographie mit Sattelembolus",
        caption:
          "CT-Pulmonalisangiographie: Sattelembolus in der Bifurkation der Pulmonalarterien mit ausgeprägter Thrombuslast in den Lappenästen beider Hauptlungenarterien.",
      },
      rule: {
        mode: "anyOf",
        expected: [
          "CT-Pulmonalisangiographie mit Nachweis eines Sattelembolus in der Bifurkation der Pulmonalarterien sowie ausgeprägter Thrombuslast in den Lappenästen beider Hauptlungenarterien (koronare Rekonstruktion oben, axiale Schicht unten).",
        ],
        minHits: 1,
      },
    },
    {
      order: 6,
      points: 3,
      prompt:
        "Die Patientin zeigt Anzeichen hämodynamischer Instabilität. Welche spezifische Therapieoption kommt in dieser Situation infrage und was sind die Kontraindikationen?",
      rule: {
        mode: "anyOf",
        expected: [
          "Spezifische Therapieoption: Systemische Lysetherapie mit rt-PA (z. B. Alteplase). Indikation: hämodynamisch instabile oder reanimationspflichtige Patienten. Kontraindikationen: frische Operationen, zerebrale Blutungen, schwere unkontrollierte Hypertonie.",
        ],
        minHits: 1,
      },
    },
    {
      order: 7,
      points: 2,
      prompt:
        "Die Patientin stabilisiert sich unter Therapie. Welche Maßnahmen zur Sekundärprophylaxe einer erneuten Lungenembolie sind notwendig?",
      rule: {
        mode: "anyOf",
        expected: [
          "Sekundärprophylaxe: Dauerhafte Antikoagulation (3–6 Monate, länger je nach Risiko), bevorzugt mit DOAKs oder Vitamin-K-Antagonisten. Thrombophilie- oder Malignomsuche. Mobilisation fördern und weitere Risikofaktoren reduzieren.",
        ],
        minHits: 1,
      },
    },
  ],

  objectives: [
    { id: "diagnose", label: "Lungenembolie diagnostizieren" },
    { id: "pathophysio", label: "Pathophysiologische Mechanismen erklären" },
    { id: "notfall", label: "Akute Therapieoptionen anwenden" },
    { id: "prophylaxe", label: "Sekundärprophylaxe planen" },
  ],

  completion: { minObjectives: 4, maxLLMTurns: 20, hardStopTurns: 20 },
};