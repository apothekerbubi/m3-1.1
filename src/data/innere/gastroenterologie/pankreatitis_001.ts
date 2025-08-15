// src/data/cases/pankreatitis_001.ts
import type { Case } from "@/lib/types";

export const pankreatitis_001: Case = {
  id: "pankreatitis_001",
  title: "Oberbauchschmerzen",
  shortTitle: "Akute Pankreatitis",
  vignette:
    "48-jähriger Patient mit starken epigastrischen Schmerzen mit Ausstrahlung in den Rücken, Übelkeit und Erbrechen kommt in die Notaufnahme. Beginn vor ca. 6 Stunden, Symptomatik progredient. Anamnestisch regelmäßiger Alkoholkonsum.",
  specialty: "Innere Medizin",
  subspecialty: "Gastroenterologie",

  difficulty: 3,
  tags: ["Pankreatitis", "Bauchschmerz", "Oberbauchschmerz"],

  steps: [
    // 1) DDx
    {
      order: 1,
      points: 3,
      prompt:
        "Welche 3 differenzialdiagnostisch wichtigen Ursachen aus mind. zwei verschiednen Organsystemen ziehen Sie bei akuten epigastrischen Schmerzen mit Rückenausstrahlung in Betracht?",
      hint: "Denke an Erkrankungen die mit Schmerzausstrahlung in den Rücken einhergehen können",
      rule: {
        mode: "categories",
        categories: {
          gastrointestinal: [
            "pankreatitis",
            "ulcus",
            "perforation",
            "gastritis",
            "cholezystitis",
            "choledocholithiasis",
          ],
          kardial: ["akutes koronares syndrom", "myokardinfarkt", "acs"],
          vaskulär: ["aortendissektion", "abdominelles aortenaneurysma", "aaa"],
          urologisch: ["pyelonephritis", "nierenkolik", "nierenstein", "harnleiterstein"],
        },
        minCategories: 2,
        minHits: 3,
        forbidden: ["appendizitis"],
        hint_general: "Häufig + zeitkritisch priorisieren: GI, kardial, große Gefäße.",
      },
    },

    // 2) Diagnostisches Vorgehen (KEIN Reveal hier!)
    {
      order: 2,
      points: 3,
      prompt: "Wie gehen Sie in der Akutdiagnostik strukturiert vor?",
      hint: "Denke an das übliche Vorgehen in der Diagnostik und welche Diagnostik hier besonders gefragt ist",
      rule: {
        mode: "allOf",
        required: ["körperliche untersuchung", "labor", "bildgebung"],
        synonyms: {
          labor: [
            "blutuntersuchung",
            "lipase",
            "amylase",
            "blutbild",
            "leberwerte",
            "bilirubin",
            "ast",
            "alt",
            "gpt",
            "got",
            "crp",
            "pankreasenzyme",
          ],
          bildgebung: ["ultraschall", "sono", "ct", "mrt", "mrcp", "endosonografie", "eus"],
        },
        minHits: 2,
        hint_general:
          "Denke an das übliche Vorgehen in der Diagnostik und welche Diagnostik hier besonders gefragt ist",
      },
    },

    // 3) Diagnose — Reveal direkt zum Start dieser Frage
    {
      order: 3,
      points: 2,
      prompt:
        "Was ist auf Basis von Anamnese, Untersuchung und Befunden die wahrscheinlichste Diagnose?",
      hint: "Leitsymptome + Lipase/Amylase ≥3× ULN + Sono-Befund zusammenführen.",
      rule: {
        mode: "anyOf",
        expected: ["akute pankreatitis", "pankreatitis"],
        synonyms: {
          "akute pankreatitis": [
            "entzündung der bauchspeicheldrüse",
            "akute entzündung des pankreas",
          ],
        },
        forbidden: ["appendizitis"],
        hint_general: "≥2 der 3 Diagnostikkriterien erfüllt.",
      },
      reveal: {
        when: "on_enter", // ⬅️ NEU: beim Öffnen von Frage 3 anzeigen
        content: {
          befundpaketTitel: "Ergebnis der initialen Diagnostik",
          vitalparameter: { rr: "135/82 mmHg", puls: 98, temp: 37.9, spo2: "97%" },
          labor: {
            lipase: { wert: 820, einheit: "U/L", referenz: "<60" },
            amylase: { wert: 650, einheit: "U/L", referenz: "<100" },
            crp: { wert: 120, einheit: "mg/L", referenz: "<5" },
            leukozyten: { wert: 14.2, einheit: "G/L", referenz: "3.9–10.5" },
            bilirubin: { wert: 1.0, einheit: "mg/dL", referenz: "<1.2" },
            ast_got: { wert: 42, einheit: "U/L", referenz: "<35" },
            alt_gpt: { wert: 45, einheit: "U/L", referenz: "<45" },
            ggt: { wert: 180, einheit: "U/L", referenz: "<60" },
          },
          bildgebung: {
            ultraschall:
              "Vergrößertes, echoarmes Pankreas; peripankreatische Flüssigkeit; kein DHC-Stein, keine dilatierten Gallenwege.",
          },
          interpretationKurz:
            "Konstellation vereinbar mit akuter interstitieller ödematöser Pankreatitis, eher alkoholtoxisch als biliär.",
        },
      },
    },

    // 4) Initiale Therapie
    {
      order: 4,
      points: 4,
      prompt: "Welche initialen Therapiemaßnahmen leiten Sie ein?",
      hint: "Flüssigkeit, Analgesie, frühe enterale Ernährung, Monitoring; kein prophylaktisches AB.",
      rule: {
        mode: "allOf",
        required: ["volumentherapie", "analgesie", "enterale ernährung", "monitoring"],
        optional: [
          "antiemetika",
          "sauerstoff",
          "ursachentherapie",
          "ercp",
          "cholezystektomie",
          "alkoholabstinenz",
          "intensivüberwachung",
        ],
        synonyms: {
          volumentherapie: ["ringer", "ringer-laktat", "iv-flüssigkeit", "flüssigkeitsgabe", "iv-fluide"],
          analgesie: ["opioid", "opiatanalgesie", "schmerztherapie", "pethidin"],
          "enterale ernährung": [
            "frühe enterale ernährung",
            "orale nahrung",
            "nasojejunale sonde",
            "nahrung nach verträglichkeit",
          ],
          monitoring: ["überwachung", "engmaschig", "telemetrie", "bilanzierung", "urinmenge"],
          ursachentherapie: ["ursache behandeln", "alkoholentzug", "cholezystektomie", "ercp"],
          ercp: ["endoskopische steinextraktion", "papillotomie"],
          cholezystektomie: ["laparoskopische cholezystektomie"],
        },
        forbidden: ["prophylaktische antibiotika", "prophylaktisches antibiotikum"],
        hint_general: "Supportiv + zielgerichtet. AB nur bei infizierter Nekrose/Cholangitis.",
      },
    },

    // 5+) Vertiefung …
    {
      order: 5,
      points: 1,
      prompt: "Welche Kriterien sichern die Diagnose \"akute Pankreatitis\"?",
      hint: "International üblich: 2 von 3 Kriterien.",
      rule: {
        mode: "allOf",
        required: ["typischer schmerz", "lipase ≥3×", "bildgebung vereinbar"],
        synonyms: {
          "typischer schmerz": ["epigastrischer schmerz", "rücken", "starke oberbauchschmerzen"],
          "lipase ≥3×": ["lipase über dreifach", "amylase ≥3×", ">3x ulno", ">3x ul"],
          "bildgebung vereinbar": ["sono vereinbar", "ct vereinbar", "mrt vereinbar", "befund vereinbar"],
        },
      },
    },
    {
      order: 6,
      points: 1,
      prompt: "Nennen Sie häufige Ätiologien der akuten Pankreatitis in strukturierter Form.",
      hint: "Z.B. I GET SMASHED / deutschsprachige Merkhilfen; v.a. biliär & Alkohol.",
      rule: {
        mode: "anyOf",
        expected: [
          "biliär",
          "alkohol",
          "hypertriglyzeridämie",
          "medikamente",
          "iatrogen",
          "post-ercp",
          "trauma",
          "genetisch",
          "autoimmun",
          "infektiös",
          "hyperkalzämie",
        ],
        minHits: 3,
      },
    },
    {
      order: 7,
      points: 1,
      prompt: "Wie ordnen Sie den Schweregrad nach revidierter Atlanta-Klassifikation ein?",
      hint: "mild (keine Organdysfunktion), moderat (vorübergehende OF/Komplikationen), schwer (anhaltende OF).",
      rule: {
        mode: "anyOf",
        expected: ["mild", "moderat", "schwer", "revidierte atlanta", "organversagen", "persistierend", "of"],
        hint_general: "Begriffe + Definitionen nennen.",
      },
    },
    {
      order: 8,
      points: 1,
      prompt: "Welche lokalen und systemischen Komplikationen kennen Sie?",
      hint: "Früh vs. spät; lokal: Nekrose, Pseudozyste; systemisch: SIRS/OF.",
      rule: {
        mode: "anyOf",
        expected: [
          "nekrose",
          "infizierte nekrose",
          "pankreaspseudozyste",
          "walled-off nekrose",
          "abzess",
          "sirs",
          "ards",
          "akutes nierenversagen",
          "organversagen",
          "sepsis",
        ],
        minHits: 3,
      },
    },
    {
      order: 9,
      points: 1,
      prompt: "Welche spezifischen Indikationen für eine zeitnahe ERCP bestehen bei Pankreatitis?",
      hint: "Cholangitis oder cholestatischer Ikterus mit DHC-Verdacht.",
      rule: {
        mode: "allOf",
        required: ["cholangitis", "cholestase", "dilatierte gallenwege"],
        synonyms: {
          cholestase: ["cholestatischer ikterus", "ikterus", "bilirubin hoch"],
          "dilatierte gallenwege": ["dilatiert", "erweiterte gallenwege", "dil DHC", "weite DHC"],
        },
        minHits: 1,
        hint_general: "Nur bei klarer biliärer Komplikation frühzeitig.",
      },
    },
  ],

  objectives: [
    { id: "ddx", label: "Differenzialdiagnosen bei Oberbauchschmerz nennen" },
    { id: "vorgehen", label: "Strukturiertes diagnostisches Vorgehen benennen" },
    { id: "diagnose", label: "Wahrscheinlichste Diagnose korrekt identifizieren" },
    { id: "therapie", label: "Initiale Therapie korrekt nennen" },
    { id: "kriterien", label: "Diagnosekriterien korrekt benennen" },
    { id: "ätiologie", label: "Häufige Ursachen der Pankreatitis benennen" },
    { id: "schweregrad", label: "Schweregrade richtig einordnen" },
    { id: "komplikationen", label: "Komplikationen der Pankreatitis aufzählen" },
  ],

  completion: { minObjectives: 5, maxLLMTurns: 12, hardStopTurns: 14 },
};