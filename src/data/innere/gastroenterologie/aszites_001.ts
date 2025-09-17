import type { Case, ExamModeCase } from "@/lib/types";

const ID = "aszites_001";
const TITLE = "Bauchumfangszunahme und Dyspnoe";
const SHORT_TITLE = "Aszites";
const LEAD_SYMPTOM = "Abdominelle Schwellung";
const VIGNETTE =
  "Sie sind Arzt in der Notaufnahme. Ein 58-jähriger Patient stellt sich bei Ihnen vor. Er berichtet über einen seit Wochen zunehmenden Bauchumfang, Spannungsgefühl im Abdomen und Belastungsdyspnoe.";

export const aszites_001: Case = {
  id: ID,
  title: TITLE,
  shortTitle: SHORT_TITLE,
  leadSymptom: LEAD_SYMPTOM,
  pseudonym: "Aszites_001",
  vignette: VIGNETTE + " Welche anamnestischen Fragen stellen Sie?",

  specialty: "Innere Medizin",
  subspecialty: "Gastroenterologie",
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
          "Alkoholkonsum",
          "Risikofaktoren",
          "Rauchen",
          "Vorerkrankungen",
          "(Vor-) Operationen",
          "B-Symptomatik (Gewichtsverlust, Schwitzen, Fieber)",
          "Medikation",
        ],
        minHits: 2,
      },
    },
    {
      order: 2,
      points: 2,
      prompt:
        "Sie wollen nun den Patienten körperlich untersuchen, auf was achten Sie im Speziellen?",
      rule: {
        mode: "anyOf",
        expected: [
          "Bauchumfang vergrößert",
          "prall gefüllter Bauch",
          "Aszites nachweisbar (Flüssigkeitswelle, shifting dullness)",
          "Ödeme",
          "Splenomegalie",
          "Ikterus",
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
          "Aszitespunktion (Untersuchung Eiweiß, Zellzahl, Mikrobiologie)",
        ],
        minHits: 2,
      },
    },
    {
      order: 4,
      points: 3,
      prompt:
        "Sie entschließen sich, eine Abdomensonografie durchzuführen. Dabei ergibt sich folgendes Bild. Beschreiben Sie:",
      rule: {
        mode: "anyOf",
        expected: ["Aszites", "Echoleere Flüssigkeit um die Leber", "Hinweis auf Leberzirrhose"],
        minHits: 2,
      },
      image: {
        path: "Ultraschall/Aszites.JPG",
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
        "Inzwischen ist auch folgender Laborbefund des Blutes eingetroffen. Interpretieren Sie erst die Ergebnisse und äußern Sie eine dazu passende Differentialdiagnose.",
      rule: {
        mode: "anyOf",
        expected: [
          "Erhöhte Transaminasen",
          "Hypoalbuminämie",
          "Erhöhte INR / Gerinnungsstörung",
          "Leberzirrhose",
          "Erhöhte Leberwerte",
          "erhöhte cholestasewerte",
          "Lebersynthesefunktion eingeschränkt",
          "Gerinnungsstörung",
        ],
        minHits: 3,
      },
      image: {
        path: "Labor/Leberzirrhose.png",
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
          "(Rechts)herzinsuffizienz",
          "Pericarditis constrictiva",
          "Leber(teil)resektion",
        ],
        minHits: 3,
      },
    },
    {
      order: 8,
      points: 2,
      prompt:
        "Während Sie die Laborwerte interpretieren, klagt der Patient plötzlich über Schwindel, wird blass und beginnt Blut zu erbrechen. Welche Symptome deuten auf eine akute Varizenblutung hin?",
      rule: {
        mode: "anyOf",
        expected: [
          "Hämatemesis",
          "Schockzeichen (Tachykardie, Hypotonie, Blässe, Kaltschweißigkeit)",
          "Schwindel",
          "Synkope",
          "Frischblutiges Erbrechen",
        ],
        minHits: 2,
      },
    },
    {
      order: 9,
      points: 3,
      prompt: "Welche sofortigen Maßnahmen zur Kreislaufstabilisierung leiten Sie ein?",
      rule: {
        mode: "anyOf",
        expected: [
          "Schocklage",
          "Bluttransfusion je nach Schwere",
          "Magensonde",
          "Absaugen Blut",
          "Schutzintubation als Aspirationsprophylaxe",
          "Sauerstoffgabe",
          "Volumentherapie",
          "Anlage von großlumigen Zugängen",
          "Vorbereitung einer Bluttransfusion",
        ],
        minHits: 2,
      },
    },
    {
      order: 10,
      points: 3,
      prompt: "Sie leiten umgehend die Notfallversorgung ein. Welches Verfahren ist hier abgebildet?",
      rule: {
        mode: "anyOf",
        expected: ["Ösophagusvarizenligatur", "Gummibandligatur", "Endoskopische Ligatur"],
        minHits: 1,
      },
      image: {
        path: "Endoskopie/Oesophagusvarizenligatur.png",
        alt: "Sonografie mit freier Flüssigkeit im Abdomen",
        caption: "Sonografie des Abdomens: Nachweis von Aszites (freie Flüssigkeit).",
      },
    },
    {
      order: 11,
      points: 3,
      prompt:
        "Welche spezifischen Therapien zur Blutstillung bei Ösophagusvarizenblutung kommen außerdem infrage ?",
      rule: {
        mode: "anyOf",
        expected: [
          "Terlipressin oder Somatostatin/Octreotid",
          "Sklerotherapie (falls Ligatur nicht möglich)",
          "Ballontamponade (Sengstaken-Blakemore-Sonde) als Notfallmaßnahme",
          "Stenting Ösophagus",
          "TIPS",
        ],
        minHits: 1,
      },
    },
    {
      order: 12,
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

export const aszites_001_exam: ExamModeCase = {
  id: ID,
  title: TITLE,
  vignette: VIGNETTE,
  startActions: ["anamnese"],
  completionActions: ["sekundaerprophylaxe"],
  completionMessage:
    "Sehr gut, Sie haben den kompletten Fall von der Erstvorstellung bis zur Sekundärprophylaxe begleitet.",
  unknownMessage: "Ich habe Sie nicht verstanden. Bitte antworten Sie auf die aktuelle Frage.",
  needsMoreMessage: "Nennen Sie bitte weitere Aspekte.",
  actions: {
    anamnese: {
      question: "Welche anamnestischen Fragen stellen Sie?",
      expected: [
        "Alkoholkonsum",
        "Risikofaktoren",
        "Vorerkrankungen",
        "(Vor-) Operationen",
        "Medikamente",
        "B-Symptomatik",
      ],
      minHits: 2,
      response:
        "Typischerweise erfragen Sie Alkoholkonsum, Risikofaktoren für Lebererkrankungen, relevante Vorerkrankungen inklusive Voroperationen, Dauermedikation und B-Symptomatik (Gewichtsverlust, Nachtschweiß, Fieber).",
      hint: "Denken Sie an Lebererkrankungen, Blutungszeichen und Risikofaktoren.",
      unlocks: ["koerperliche_untersuchung"],
    },
    koerperliche_untersuchung: {
      question: "Sie untersuchen den Patienten. Welche Befunde erwarten Sie?",
      expected: [
        "Bauchumfang vergrößert",
        "prall gefüllter Bauch",
        "Aszites",
        "Ödeme",
        "Splenomegalie",
        "Ikterus",
      ],
      minHits: 2,
      response:
        "Der klinische Status zeigt meist einen vergrößerten, prall gespannten Bauch mit nachweisbarem Aszites (Flüssigkeitswelle, shifting dullness), periphere Ödeme sowie Zeichen der portalen Hypertension wie Splenomegalie und Ikterus.",
      hint: "Nennen Sie typische Zeichen eines ausgeprägten Aszites.",
      unlocks: ["initialdiagnostik"],
    },
    initialdiagnostik: {
      question: "Welche initiale Diagnostik veranlassen Sie?",
      expected: [
        "Sonografie des Abdomens",
        "Labor",
        "Gerinnung",
        "Aszitespunktion",
      ],
      minHits: 2,
      response:
        "Sie veranlassen eine Abdomensonografie, umfassende Laboranalysen inklusive Leber- und Gerinnungswerte sowie eine diagnostische Aszitespunktion zur weiteren Einordnung.",
      hint: "Bildgebung, Labor und Punktion helfen bei der Ursachenklärung.",
      unlocks: ["sonografie_befund"],
    },
    sonografie_befund: {
      question: "Die Sonografie liegt vor. Wie beschreiben Sie den Befund?",
      expected: ["Aszites", "freie Flüssigkeit", "echoleer", "Leberzirrhose"],
      minHits: 2,
      response:
        "Die Sonografie zeigt eine echoleere Flüssigkeitsansammlung um die Leber mit freiem Aszites im Abdomen – typisch bei portaler Hypertension infolge einer Leberzirrhose.",
      image: {
        path: "Ultraschall/Aszites.JPG",
        alt: "Sonografie mit freier Flüssigkeit im Abdomen",
        caption: "Sonografie des Abdomens",
      },
      hint: "Beschreiben Sie Lage und Charakter der Flüssigkeit.",
      unlocks: ["aszitespunktion_parameter"],
    },
    aszitespunktion_parameter: {
      question: "Welche Parameter lassen Sie aus dem Aszitespunktat untersuchen?",
      expected: ["Zellzahl", "Eiweiß", "Mikrobiologie", "Albumin", "SAAG"],
      minHits: 2,
      response:
        "Aus dem Punktat bestimmen Sie Zellzahl und Differenzierung, den Eiweißgehalt (z. B. SAAG) sowie mikrobiologische Untersuchungen zum Ausschluss einer spontanen bakteriellen Peritonitis.",
      hint: "Denken Sie an Entzündungs- und Eiweißparameter.",
      unlocks: ["labor_befund"],
    },
    labor_befund: {
      question: "Das Laborergebnis des Blutes ist da. Welche Auffälligkeiten erkennen Sie?",
      expected: [
        "Transaminasen",
        "Hypoalbuminämie",
        "INR",
        "Gerinnung",
        "Leberwerte",
        "Cholestasewerte",
      ],
      minHits: 3,
      response:
        "Typisch finden sich erhöhte Transaminasen und Cholestaseparameter, eine Hypoalbuminämie sowie eine verlängerte INR als Zeichen einer eingeschränkten Lebersyntheseleistung bei Zirrhose.",
      image: {
        path: "Labor/Leberzirrhose.png",
        alt: "Laborbefund mit eingeschränkter Lebersynthese",
        caption: "Laborbefund mit eingeschränkter Leberfunktion",
      },
      hint: "Achten Sie auf Synthese- und Cholestaseparameter.",
      unlocks: ["ursachen_portale_hypertension"],
    },
    ursachen_portale_hypertension: {
      question: "Welche typischen Ursachen einer portalen Hypertension kennen Sie?",
      expected: [
        "Leberzirrhose",
        "Pfortaderthrombose",
        "Schistosomiasis",
        "Budd-Chiari-Syndrom",
        "Rechtsherzinsuffizienz",
        "Pericarditis constrictiva",
        "Sinusoidales Okklusionssyndrom",
      ],
      minHits: 3,
      response:
        "Die häufigste Ursache ist die intrahepatische Leberzirrhose. Prähepatisch kommen etwa Pfortaderthrombosen oder Schistosomiasis in Betracht, posthepatisch Budd-Chiari-Syndrom oder eine schwere Rechtsherzinsuffizienz bis hin zur Pericarditis constrictiva.",
      hint: "Denken Sie an prä-, intra- und posthepatische Ursachen.",
      unlocks: ["varizenblutung_symptome"],
    },
    varizenblutung_symptome: {
      question: "Der Patient verschlechtert sich akut. Welche Symptome sprechen für eine Varizenblutung?",
      expected: [
        "Hämatemesis",
        "Schockzeichen",
        "Schwindel",
        "Synkope",
        "frisches Blut",
      ],
      minHits: 2,
      response:
        "Eine akute Ösophagusvarizenblutung zeigt sich durch Hämatemesis mit frischblutigem Erbrechen, Kreislaufinstabilität bis hin zum Schock sowie begleitenden Schwindel oder Synkopen.",
      hint: "Achten Sie auf hämodynamische Zeichen und das Erbrochene.",
      unlocks: ["notfall_massnahmen"],
    },
    notfall_massnahmen: {
      question: "Welche Maßnahmen zur Kreislaufstabilisierung leiten Sie sofort ein?",
      expected: [
        "Schocklage",
        "Volumentherapie",
        "Sauerstoff",
        "großlumige Zugänge",
        "Magensonde",
        "Absaugen",
        "Schutzintubation",
        "Bluttransfusion",
      ],
      minHits: 2,
      response:
        "Sie legen großlumige Zugänge, beginnen eine Volumen- und ggf. Bluttransfusion, geben Sauerstoff, sichern mit Magensonde und Absaugen die Atemwege und erwägen eine Schutzintubation – begleitet von Schocklagerung.",
      hint: "Denken Sie an Kreislaufstützung, Atemwegssicherung und Blutprodukte.",
      unlocks: ["endoskopie_verfahren"],
    },
    endoskopie_verfahren: {
      question: "Welches Verfahren wird endoskopisch zur akuten Blutstillung eingesetzt?",
      expected: ["Ösophagusvarizenligatur", "Gummibandligatur", "Ligatur"],
      minHits: 1,
      response: "Endoskopisch erfolgt eine Gummibandligatur der Ösophagusvarizen zur akuten Blutstillung.",
      image: {
        path: "Endoskopie/Oesophagusvarizenligatur.png",
        alt: "Endoskopische Ligatur von Ösophagusvarizen",
        caption: "Endoskopische Ligatur",
      },
      unlocks: ["blutstillung_optionen"],
    },
    blutstillung_optionen: {
      question: "Welche weiteren spezifischen Therapien zur Blutstillung setzen Sie ein?",
      expected: ["Terlipressin", "Somatostatin", "Octreotid", "Sklerotherapie", "Ballontamponade", "Stent", "TIPS"],
      minHits: 1,
      response:
        "Zusätzlich geben Sie vasoaktive Substanzen wie Terlipressin oder Somatostatin/Octreotid. Falls nötig folgen Sklerotherapie, Ballontamponade (Sengstaken-Blakemore), Ösophagus-Stent oder als definitive Maßnahme ein TIPS.",
      hint: "Nennen Sie Pharmakotherapie und invasive Alternativen.",
      unlocks: ["sekundaerprophylaxe"],
    },
    sekundaerprophylaxe: {
      question: "Welche Maßnahmen ergreifen Sie zur Sekundärprophylaxe?",
      expected: [
        "Nicht-selektive Betablocker",
        "endoskopische Ligatur",
        "TIPS",
        "Alkoholkarenz",
        "Therapie der Grunderkrankung",
      ],
      minHits: 2,
      response:
        "Zur Sekundärprophylaxe gehören nicht-selektive Betablocker (z. B. Propranolol), regelmäßige endoskopische Ligaturen, bei Rezidiven ein TIPS sowie konsequente Alkoholkarenz und Behandlung der Leberzirrhose.",
      hint: "Kombinieren Sie medikamentöse, endoskopische und ursächliche Ansätze.",
    },
  },
};
