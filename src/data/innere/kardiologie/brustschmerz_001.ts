// src/data/kardiologie/brustschmerz_001.ts

import type { Case } from "@/lib/types";

export const brustschmerz_001: Case = {
  id: "Brustschmerz_001",
  title: "Belastungsdyspnoe und Herzgeräusch",
  shortTitle: "Aortenklappenstenose",
  leadSymptom: "Belastungsdyspnoe",
  pseudonym: "Brustschmerz_001",
  vignette:
    "Ein 68-jähriger Patient stellt sich wegen seit Monaten zunehmender Belastungsdyspnoe und Schwindelattacken vor. Zudem berichtet er über gelegentliche Brustschmerzen bei körperlicher Anstrengung.",
  specialty: "Innere Medizin",
  subspecialty: "Kardiologie",
  difficulty: 3,
  tags: ["Herzklappenerkrankung", "Aortenklappenstenose", "Dyspnoe", "Synkope", "Angina pectoris"],
  steps: [
    {
      order: 1,
      points: 2,
      prompt: "Welche anamnestischen Fragen stellen Sie zusätzlich?",
      hint: "Belastbarkeit, Synkopen, Angina pectoris, Herzinsuffizienzsymptome",
      rule: {
        mode: "anyOf",
        expected: [
          "Belastbarkeit",
          "Synkopen",
          "Thorakale Schmerzen",
          "Herzinsuffizienzsymptome",
          "Ödeme",
          "Orthopnoe",
          "Palpitationen"
        ],
        minHits: 3,
      },
    },
    {
      order: 2,
      points: 2,
      prompt: "Sie führen eine körperliche Untersuchung durch. Welche wichtigen Auskultationspunkte am Herzen kennen Sie?",
      hint: "Aorten-, Pulmonal-, Trikuspidal- und Mitralpunkt",
      rule: {
        mode: "anyOf",
        expected: [
          "Aortenklappe: 2. ICR rechts parasternal",
          "Pulmonalklappe: 2. ICR links parasternal",
          "Trikuspidalklappe: 4. ICR rechts parasternal",
          "Mitralklappe: 5. ICR links medioklavikulär",
          "Erb-Punkt: 3. ICR links parasternal"
        ],
        minHits: 3,
    }
    },
    {
      order: 3,
      points: 2,
      prompt: "Angenommen Ihr Patient hat eine Aortenklappenstenose, welchen auskultatorischen Befund erwarten Sie?",
      rule: {
        mode: "anyOf",
        expected: [
          "Spindelförmiges systolisches Geräusch",
          "2. ICR rechts parasternal",
          "Fortleitung in die Karotiden",
          "Ejektionsklick"
        ],
        minHits: 2,
      },
    
    },
    {
      order: 4,
      points: 3,
      prompt: "Sie fertigen folgendes EKG an. Welche Veränderungen können Sie in folgendem Ausschnitt erkennen?",
      hint: "Linksherzbelastung, Hypertrophiezeichen",
      rule: {
        mode: "anyOf",
        expected: [
          "verbreiterte P-Welle durch Linksatrialbelastung",
          "Hohe R-Zacke als Ausdruck einer Linksherzhypertrophie",
          "T-Negativierung / ST-Senkung bei Druckbelastung des linken Ventrikels."
        ],
        minHits: 2,
      },
      image: {
        path: "EKG/Aortenklappenstenose.jpg",
        alt: "EKG mit Zeichen einer Aortenklappenstenose",
        caption: "EKG: Typische Veränderungen bei Aortenklappenstenose (Linksherzhypertrophie, Linkslagetyp).",
      },
    },
    {
      order: 5,
      points: 2,
      prompt: "Auf Grundlage der Anamnese, der körperlichen Untersuchung und des EKG-Befundes: Welche Verdachtsdiagnose stellen Sie?",
      hint: "Typische Trias: Dyspnoe, Synkope, Angina pectoris",
      rule: {
        mode: "anyOf",
        expected: ["Aortenklappenstenose", "Aortenstenose"],
        minHits: 1,
      },
    },
    {
      order: 6,
      points: 2,
      prompt: "Sie wollen die Diagnose über ein bildgebendes Verfahren sichern. Welches wählen Sie?",
      hint: "Nicht-invasiv, Standardverfahren",
      rule: {
        mode: "anyOf",
        expected: ["Echokardiografie", "Herzecho", "Transthorakale Echokardiografie"],
        minHits: 1,
      },
    },
    {
      order: 7,
      points: 3,
      prompt: "Während des Echokardiogramms wird der Patient langsam ungeduldig und fragt immer wieder, was Sie sehen können. Welche typischen Befunde erkennen Sie?",
      hint: "Verkalkte Klappe, Druckgradient, reduzierte Klappenöffnungsfläche",
      rule: {
        mode: "anyOf",
        expected: [
          "Verkalkte Aortenklappe",
          "Reduzierte Klappenöffnungsfläche",
          "Erhöhter Druckgradient",
          "Linksventrikuläre Hypertrophie"
        ],
        minHits: 2,
      },
      image: {
        path: "videos/Aortenklappenstenose.mov",
        alt: "Echokardiografie einer Aortenklappenstenose, CardioNetworks: E00122.avi J. Vleugels, AMC, The Netherlands",
        caption: "Echo: Verkalkte, eingeengte Aortenklappe mit reduzierter Öffnungsfläche.",
      },
    },
    {
      order: 8,
      points: 2,
      prompt: "Erschüttert von der gestellten Diagnose fragt der Patient, ob es denn nicht auch etwas anderes sein könnte. Welche Differenzialdiagnosen ziehen Sie grundsätzlich bei einer Aortenklappenstenose in Betracht?",
      rule: {
        mode: "anyOf",
        expected: ["Hypertrophe Kardiomyopathie", "Mitralklappeninsuffizienz", "Pulmonalklappenstenose"],
        minHits: 2,
      },
    },
    {
      order: 9,
      points: 3,
      prompt: "Nachdem Sie sich Ihrer Diagnose sicher sind, möchten Sie mit dem Patienten über mögliche Therapieoptionen sprechen. Welche Therapieoptionen kommen bei einer symptomatischen Aortenklappenstenose infrage?",
      hint: "Interventionell vs. operativ",
      rule: {
        mode: "anyOf",
        expected: [
          "Chirurgischer Klappenersatz",
          "TAVI",
          "Ballonvalvuloplastie",
          "Symptomatische Therapie"
        ],
        minHits: 2,
      },
      image: {
        path: "Kardiologie/TAVI.png",
        alt: "TAVI-Prozedur",
        caption: "Kathetergestützter Aortenklappenersatz (TAVI).",
      },
    },
    {
      order: 10,
      points: 3,
      prompt: "Der Patient ist unsicher, ob er sich für einen chirurgischen oder einen interventionellen Aortenklappenersatz entscheiden soll. Wie unterscheiden sich die beiden Verfahren in ihren Vor- und Nachteilen?",
      hint: "Operation vs. Katheterverfahren (TAVI)",
      rule: {
        mode: "anyOf",
        expected: [
          "Chirurgischer Klappenersatz: längere Haltbarkeit, aber höhere perioperative Risiken",
          "Interventioneller Klappenersatz (TAVI): geringeres Operationsrisiko, aber höhere Rate an Reinterventionen",
          "Chirurgisch: geeignet für jüngere, fittere Patienten",
          "TAVI: bevorzugt bei älteren, multimorbiden Patienten",
          "Unterschiedliche Anforderungen an Antikoagulation"
        ],
        minHits: 2,
      },
      image: {
        path: "Kardiologie/TAVI.png",
        alt: "Darstellung eines kathetergestützten Aortenklappenersatzes (TAVI)",
        caption: "TAVI: Minimal-invasiver Klappenersatz im Vergleich zum chirurgischen Verfahren.",
      },
    },
    {
      order: 11,
      points: 2,
      prompt: "Der Patient möchte wissen, aus welchem Material die Herzklappenprothesen bestehen. Welche Optionen gibt es und was sind deren Besonderheiten?",
      hint: "Mechanische vs. biologische Prothesen",
      rule: {
        mode: "anyOf",
        expected: [
          "Mechanische Klappen: aus Metall/Carbonlegierungen, sehr langlebig, aber lebenslange Antikoagulation notwendig",
          "Biologische Klappen: aus Schweine- oder Rinderperikard, kürzere Haltbarkeit, aber meist keine dauerhafte Antikoagulation erforderlich"
        ],
        minHits: 2,
      },
      image: {
        path: "Kardiologie/Klappenprothesen.png",
        alt: "Mechanische und biologische Herzklappenprothesen",
        caption: "Herzklappenprothesen: Mechanische (links) vs. biologische (rechts).",
      },
    },
    {
      order: 12,
      points: 2,
      prompt: "Der Patient fragt Sie: 'Muss ich nach dem Klappenersatz dauerhaft Medikamente einnehmen?' Erklären Sie ihm die Unterschiede in der Notwendigkeit einer Antikoagulation bei mechanischen und biologischen Prothesen.",
      hint: "Dauerhafte Antikoagulation nur bei mechanischen Klappen notwendig",
      rule: {
        mode: "anyOf",
        expected: [
          "Mechanische Klappen: lebenslange Antikoagulation erforderlich",
          "Biologische Klappen: meist nur vorübergehende Antikoagulation (ca. 3 Monate), danach oft keine Dauertherapie notwendig",
          "Mechanische Klappen: Cumarine erforderlich",
          "Biologische Klappen: Vorteil für Patienten mit erhöhtem Blutungsrisiko"
        ],
        minHits: 2,
      },
      image: {
        path: "Kardiologie/Antikoagulation.png",
        alt: "Schematische Darstellung der Antikoagulation bei Herzklappenersatz",
        caption: "Antikoagulation: Lebenslang bei mechanischer Klappe, nur vorübergehend bei biologischer Klappe.",
      },
    },
  ],
  objectives: [
    { id: "diagnose", label: "Aortenklappenstenose diagnostizieren" },
    { id: "auskultation", label: "Typisches Geräusch erkennen" },
    { id: "ekg", label: "Linksherzhypertrophie im EKG interpretieren" },
    { id: "echo", label: "Echokardiographische Diagnose sichern" },
    { id: "therapie", label: "Therapieoptionen benennen" },
  ],
  completion: { minObjectives: 5, maxLLMTurns: 20, hardStopTurns: 20 },
};
