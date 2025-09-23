// src/data/gastroenterologie/aszites_001.ts

import type { Case } from "@/lib/types";

export const aszites_001: Case = {
  id: "aszites_001",
  title: "Bauchumfangszunahme und Dyspnoe",
  shortTitle: "Aszites",
  leadSymptom: "Abdominelle Schwellung",
  pseudonym: "Aszites_001",
  vignette:
    "Sie sind Arzt in der Notaufnahme. Ein 58-jähriger Patient stellt sich bei Ihnen vor. Er berichtet über einen seit Wochen zunehmenden Bauchumfang, Spannungsgefühl im Abdomen und Belastungsdyspnoe.",

  specialty: "Innere Medizin",
  subspecialty: "Gastroenterologie",
  difficulty: 3,
  tags: ["Aszites", "Portale Hypertension", "Leberzirrhose", "Ösophagusvarizen"],

  steps: [
    {
      order: 1,
      points: 2,
      prompt:
        "Sie übernehmen die Betreuung des Patienten. Legen Sie Ihr weiteres Vorgehen strukturiert dar. Nennen Sie die angedachten Maßnahmen und beschreiben Sie diese sowie das genaue Vorgehen präzise.",
      hint: "",
      rule: {
        mode: "anyOf",
        expected: [
          "Der Prüfling soll strukturiert antworten. Die initialen Basismaßnahmen bestehen aus Anamnese, Laboruntersuchung des Blutes sowie körperlicher Untersuchung. Im Weiteren Verlauf kann dann eine orientierende Sonographie erfolgen. Im Spezielleren sollte die Anamnese Fokus auf allgemeinen Aspekten wie Dauer, Art und Verlauf der Symptome, die Frage nach Schmerzen, Vorerkrankungen, momentan eingenommene Medikation und Familienanamnese abzielen. Bei der körperlichen sollte orientierend das Abdomen untersucht werden sowie inspektorisch auf periphere Ödeme und die allgemeine körperlichen Befund des Patienten geachtet werden (Blässe, Schwere Atmung etc.). Die Laboruntersuchung sollte ein kleines Blutbild enthalten, sowie Nieren- und Leberparameter, Gerinnungsparameter untersuchen und die Elektrolytsituation darstellen."
        ],
        minHits: 1,
      },
    },
    {
      order: 2,
      points: 3,
      prompt:
        "Bei der körperlichen Untersuchung zeigt sich ein übergewichtig wirkender Mann (BMI 28), wach und orientiert. Er ist blass, die Haut wirkt leicht ikterisch. Am Abdomen imponiert ein deutlich vergrößerter Umfang mit prall-elastischer Konsistenz. Beim Beklopfen besteht eine Shifting Dullness sowie eine tastbare Flüssigkeitswelle. Folgender Laborbefund ist eingetroffen. Beschreiben Sie die Ursache der Veränderung der Laborparameter in Verbindung mit einer passenden Differentialdiagnose.",
      rule: {
        mode: "anyOf",
        expected: [
          "Der Prüfling soll die Laborwerte strukturiert interpretieren und diese schlüssig mit der dafür ursächlichen Leberzirrhose verknüpfen."
        ],
        minHits: 1,
      },
      image: {
        path: "Labor/Leberzirrhose.png",
        alt: "Laborbefund mit erhöhten Transaminasen und erniedrigtem Albumin",
        caption: "Typischer Laborbefund bei fortgeschrittener Leberzirrhose.",
      },
    },
    {
      order: 3,
      points: 3,
      prompt:
        "Sie entschließen sich, eine Abdomensonografie durchzuführen. Dabei ergibt sich folgendes Bild. Beschreiben Sie zuerst das gezeigte Bild und gehen Sie auf die gezeigten Pathologien ein.",
      rule: {
        mode: "anyOf",
        expected: [
          "Der Prüfling soll strukturiert die wesentlichen Objekte im Bild benennen und beschreiben (Leber, Flüssigkeitsansammlung um die Leber, Gallenblase, Vena cava). Dabei soll der Nachweis der Flüssigkeit um die Leber als Aszites und die echoreichere Leber als Hinweis auf Leberzirrhose gedeutet werden."
        ],
        minHits: 1,
      },
      image: {
        path: "Ultraschall/Aszites.JPG",
        alt: "Sonografie mit freier Flüssigkeit im Abdomen",
        caption: "Sonografie des Abdomens: Nachweis von Aszites (freie Flüssigkeit).",
      },
    },
    {
      order: 4,
      points: 2,
      prompt:
        "In welchen Fällen führt man eine diagnostische Aszitespunktion durch und welche Laborparameter der Probe sind von Interesse?",
      rule: {
        mode: "anyOf",
        expected: [
          "Der Prüfling soll rekapitulieren, dass jeder neu diagnostizierte Aszites diagnostisch punktiert werden sollte. Wichtig sind dabei die Leukozytenzahl, der Eiweißgehalt und die mikrobiologische Untersuchung des Probenmaterials."
        ],
        minHits: 1,
      },
    },
    {
      order: 5,
      points: 3,
      prompt:
        "Welche Ursachen einer portalen Hypertension kennen Sie? Nennen Sie die Ihnen bekannten Ursachen und teilen Sie diese systemisch ein.",
      hint: "Prä-, intra- und posthepatisch unterscheiden",
      rule: {
        mode: "anyOf",
        expected: [
          "Die Ursachen der portalen Hypertension lassen sich in prähepatische, intrahepatische und posthepatische Formen einteilen: Prähepatisch z. B. Pfortaderthrombose; intrahepatisch vor allem die Leberzirrhose, seltener Schistosomiasis oder ein sinusoidales Okklusionssyndrom; posthepatisch Budd-Chiari-Syndrom, Rechtsherzinsuffizienz oder eine konstriktive Perikarditis."
        ],
        minHits: 1,
      },
    },
    {
      order: 6,
      points: 2,
      prompt:
        "Der Patient klagt plötzlich über Schwindel, wird blass und beginnt Blut zu erbrechen. Worauf deuten die Symptome in Zusammenschau mit den bisherigen Befunden des Patienten hin?",
      rule: {
        mode: "anyOf",
        expected: [
          "Die Symptome deuten auf eine akute obere gastrointestinale Blutung hin, am wahrscheinlichsten eine Ösophagusvarizenblutung im Rahmen der bekannten portalen Hypertension. Dafür sprechen die Hämatemesis in Kombination mit den Schockzeichen wie Schwindel, Blässe und Hypotonie."
        ],
        minHits: 1,
      },
    },
    {
      order: 7,
      points: 3,
      prompt: "Welche sofortigen Maßnahmen zur Kreislaufstabilisierung leiten Sie ein?",
      rule: {
        mode: "anyOf",
        expected: [
          "Zunächst bringe ich den Patienten in Schocklage und verabreiche Sauerstoff zur Sicherung der Oxygenierung. Parallel lege ich zwei großlumige periphere i.v.-Zugänge, beginne mit einer Volumentherapie unter engmaschiger Kreislaufüberwachung und bereite die Gabe von Blutprodukten vor. Zusätzlich würde ich die Anlage eines Monitorings (EKG, Blutdruck, SpO₂) veranlassen und frühzeitig den Notfall-Laborstatus einschließlich Kreuzblut abnehmen."
        ],
        minHits: 1,
      },
    },
    {
      order: 8,
      points: 3,
      prompt:
        "Sie leiten umgehend die Notfallversorgung ein. Welches Verfahren ist hier abgebildet? Welche Alternativen hierzu gibt es in der Akutsituation?",
      rule: {
        mode: "anyOf",
        expected: [
          "Das abgebildete Verfahren ist die endoskopische Varizenligatur, bei der Ösophagusvarizen mit Gummibändern abgebunden werden, um die Blutung direkt zu stillen. Sie gilt als Standardverfahren in der Akutsituation. Als Alternativen stehen die endoskopische Sklerotherapie, die medikamentöse Therapie mit vasoaktiven Substanzen wie Terlipressin oder Somatostatin/Octreotid sowie in seltenen Notfällen die Ballontamponade mittels Sengstaken-Blakemore-Sonde zur Verfügung."
        ],
        minHits: 1,
      },
      image: {
        path: "Endoskopie/Oesophagusvarizenligatur.png",
        alt: "Endoskopische Varizenligatur",
        caption: "Endoskopische Varizenligatur bei Ösophagusvarizenblutung.",
      },
    },
    {
      order: 9,
      points: 2,
      prompt:
        "Sie wollen nach erfolgreicher Intervention Ihren Patienten nach Hause entlassen. Welche Maßnahmen ergreifen Sie zur Sekundärprophylaxe nach einer überstandenen Varizenblutung?",
      rule: {
        mode: "anyOf",
        expected: [
          "Zur Sekundärprophylaxe nach einer überstandenen Varizenblutung setze ich nicht-selektive Betablocker wie Propranolol ein, führe regelmäßige endoskopische Ligaturen der verbliebenen Varizen durch und empfehle eine strikte Alkoholkarenz. Bei rezidivierenden Blutungen kann ein TIPS erwogen werden; zudem behandle ich konsequent die zugrunde liegende Leberzirrhose."
        ],
        minHits: 1,
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