// src/data/cases/spannungspneumothorax_001.ts
import type { Case } from "@/lib/types";

export const spannungspneumothorax_001: Case = {
  id: "spannungspneumothorax_001",
  title: "Akute Atemnot und Thoraxschmerz",
  shortTitle: "Spannungspneumothorax",
  vignette:
    "27-jähriger Mann, schlank, bisher gesund, kommt mit plötzlich einsetzender starker Atemnot und stechenden rechtsseitigen Thoraxschmerzen in die Notaufnahme. Beginn vor ca. 30 Minuten beim Treppensteigen. Er ist ängstlich, tachypnoisch, kaltschweißig. Anamnestisch Raucher, kein Trauma.",
  specialty: "Chirurgie",
  subspecialty: "Thoraxchirurgie",
  pseudonym: "Atemnot 001",
  leadSymptom: "Akute Dyspnoe",

  difficulty: 3,
  tags: ["Spannungspneumothorax", "Pneumothorax", "Dyspnoe", "Thoraxschmerz"],

  steps: [
    // 1) DDx
    {
      order: 1,
      points: 3,
      prompt:
        "Welche 3 differenzialdiagnostisch wichtigen Ursachen aus mind. zwei verschiedenen Organsystemen ziehen Sie bei akuter Dyspnoe mit Thoraxschmerz in Betracht?",
      hint: "Zeitkritische Notfälle zuerst: Spannungspneumothorax, Lungenembolie, ACS/Aortendissektion, Asthma-Status.",
      rule: {
        mode: "categories",
        categories: {
          pulmonal: [
            "spannungspneumothorax",
            "pneumothorax",
            "lungenembolie",
            "pe",
            "status asthmaticus",
            "asthmaanfall",
            "pneumonie",
          ],
          kardial: ["akutes koronares syndrom", "myokardinfarkt", "acs"],
          vaskulär: ["aortendissektion", "lungenödem", "lungenoedem"],
          gastroösophageal: ["oesophagusriss", "boerhaave", "reflux", "oesophagitis"],
        },
        minCategories: 2,
        minHits: 3,
        forbidden: ["appendizitis"],
        hint_general: "Atemnot + Thoraxschmerz: Pulmonal, kardial und große Gefäße priorisieren.",
      },
       // 👇 hier das Bild
      image: {
        path: "Roentgen/Spannungspneumothorax.png", // Pfad im öffentlichen Bucket
        alt: "Thoraxaufnahme mit Spannungspneumothorax",
        caption: "AP-Röntgen: Spannungspneumothorax mit Mediastinalverlagerung.",
      },
    },

    // 2) Akutvorgehen (KEIN Reveal hier!)
    {
      order: 2,
      points: 3,
      prompt: "Wie gehen Sie in der Akutversorgung strukturiert vor?",
      hint: "ABCDE/Primary Survey, sofortige Entlastung bei klinischem Verdacht, Monitoring; Bildgebung darf die Therapie nicht verzögern.",
      rule: {
        mode: "allOf",
        required: ["abcde", "sofortentlastung", "monitoring"],
        optional: ["sauerstoff", "analgesie", "bildgebung", "labor"],
        synonyms: {
          abcde: [
            "primary survey",
            "atls",
            "airway",
            "breathing",
            "circulation",
            "abc",
            "initiale notfallversorgung",
          ],
          sofortentlastung: [
            "nadeldekompression",
            "entlastungspunktion",
            "dekompression",
            "needle thoracostomy",
            "heimlichventil",
          ],
          monitoring: ["überwachung", "engmaschig", "telemetrie", "sättigung", "ekg", "blutdruck"],
          sauerstoff: ["o2", "oxygen", "sauerstoffgabe"],
          analgesie: ["schmerztherapie", "opioid", "opiatanalgesie"],
          bildgebung: [
            "ultraschall",
            "lungensonografie",
            "sono",
            "röntgen thorax",
            "thorax röntgen",
            "ct",
            "ct thorax",
            "fast",
            "efast",
          ],
          labor: ["blutgas", "bga", "arterielle blutgasanalyse", "lactat", "blutbild", "d-dimer"],
        },
        hint_general:
          "Bei klinischem Verdacht auf Spannungspneumothorax: sofortige Entlastung vor Bildgebung.",
      },
    },

    // 3) Diagnose — Reveal direkt zum Start dieser Frage
    {
      order: 3,
      points: 2,
      prompt:
        "Was ist auf Basis von Anamnese, Untersuchung und Befunden die wahrscheinlichste Diagnose?",
      hint: "Akute Dyspnoe, ipsilateral fehlendes Atemgeräusch, Trachealverlagerung, Hypotonie → Spannungspneumothorax.",
      rule: {
        mode: "anyOf",
        expected: ["spannungspneumothorax", "tension pneumothorax", "ventilpneumothorax"],
        synonyms: {
          spannungspneumothorax: ["ventilpneumothorax", "tension pneumothorax"],
        },
        forbidden: ["appendizitis"],
        hint_general: "Die Klinik reicht; Bildgebung darf Therapie nicht verzögern.",
      },
      reveal: {
        when: "on_enter",
        content: {
          befundpaketTitel: "Ergebnis der initialen Notfalluntersuchung",
          vitalparameter: { rr: "85/50 mmHg", puls: 132, temp: 36.8, spo2: "84% (RA)" },
          untersuchung:
            "Deutlich reduzierte Atemexkursion rechts, hypersonorer Klopfschall rechts, fehlendes Atemgeräusch rechts, gestaute Halsvenen, Trachea nach links verlagert, ausgeprägte Atemnot.",
          labor: {
            bga: {
              ph: { wert: 7.47, einheit: "", referenz: "7.35–7.45" },
              pco2: { wert: 32, einheit: "mmHg", referenz: "35–45" },
              po2: { wert: 55, einheit: "mmHg", referenz: "75–100" },
              lactat: { wert: 3.5, einheit: "mmol/L", referenz: "<2.0" },
            },
            hb: { wert: 14.5, einheit: "g/dL", referenz: "13.5–17.5" },
            leukozyten: { wert: 9.8, einheit: "G/L", referenz: "3.9–10.5" },
          },
          bildgebung: {
            lungensonografie:
              "Rechts kein Lung Sliding, kein Seashore-, sondern Barcode/Stratosphere-Zeichen; kein Lung Point darstellbar.",
            roentgen:
              "Post-Entlastung empfohlen: vor Entlastung klinisch instabil, daher keine Verzögerung durch Bildgebung.",
          },
          interpretationKurz:
            "Konstellation hochgradig vereinbar mit Spannungspneumothorax rechts mit hämodynamischer Beeinträchtigung.",
        },
      },
    },

    // 4) Initiale Therapie
    {
      order: 4,
      points: 4,
      prompt:
        "Welche initialen Therapiemaßnahmen leiten Sie unmittelbar ein (M3, praktische Prüfung)?",
      hint: "Sofortige Nadeldekompression, dann definitive Thoraxdrainage; O₂, Monitoring, Analgesie.",
      rule: {
        mode: "allOf",
        required: ["sofortentlastung", "thoraxdrainage", "sauerstoff", "monitoring"],
        optional: ["analgesie", "ursachentherapie", "beatmung"],
        synonyms: {
          sofortentlastung: [
            "nadeldekompression",
            "entlastungspunktion",
            "needle thoracostomy",
            "dekompression",
          ],
          thoraxdrainage: [
            "pleuradrainage",
            "thoraxdrainage",
            "bülau",
            "interkostaldrainage",
            "icd",
          ],
          sauerstoff: ["o2", "oxygen", "sauerstoffgabe", "hochfluss o2", "non rebreather"],
          monitoring: ["überwachung", "telemetrie", "ekg", "blutdruck", "sättigung", "bilanzierung"],
          ursachentherapie: ["rauchstopp", "operatives stapling bei bullae", "rezidivprophylaxe"],
          beatmung: ["intubation nach entlastung", "lungenschonend"],
        },
        forbidden: [
          "cpap",
          "niv",
          "nicht-invasive beatmung",
          "nur bildgebung abwarten",
          "verzögern",
          "thrombolyse",
        ],
        hint_general:
          "Entlastung FIRST. NIV/CPAP ohne vorherige Entlastung kann die Situation verschlimmern.",
      },
    },

    // 5) Klinische Zeichen des Spannungspneumothorax
    {
      order: 5,
      points: 1,
      prompt:
        "Welche klinischen Zeichen sprechen für einen Spannungspneumothorax (prüfungsrelevant)?",
      hint: "Instabiler Patient: fehlendes Atemgeräusch, Hypersonorität, Trachealverlagerung, Halsvenenstauung, Hypotonie.",
      rule: {
        mode: "anyOf",
        expected: [
          "fehlendes atemgeräusch",
          "hypersonorer klopfschall",
          "trachealverlagerung",
          "halsvenenstauung",
          "hypotonie",
          "tachykardie",
          "dyspnoe",
          "zyanose",
          "einseitig reduzierte atemexkursion",
          "subkutanes emphysem",
        ],
        minHits: 3,
      },
    },

    // 6) Ätiologie/Risikofaktoren
    {
      order: 6,
      points: 1,
      prompt: "Nennen Sie häufige Ätiologien bzw. Risikofaktoren des Pneumothorax.",
      hint: "Primär spontan (jung, schlank, Rauchen), sekundär (z. B. COPD), traumatisch, iatrogen.",
      rule: {
        mode: "anyOf",
        expected: [
          "primär spontan",
          "sekundär spontan",
          "copd",
          "emphysem",
          "cystische fibrose",
          "trauma",
          "penetrierend",
          "stumpf",
          "iatrogen",
          "zentralvenenkatheter",
          "biopsie",
          "barotrauma",
          "beatmung",
          "bullae",
          "raucher",
        ],
        minHits: 3,
      },
    },

    // 7) Schweregrad / Stabilität
    {
      order: 7,
      points: 1,
      prompt:
        "Wie ordnen Sie den Schweregrad ein (stabil vs. instabil) und welche Konsequenzen hat das Management?",
      hint: "Instabil → sofortige Dekompression; stabil → Bildgebung und dann Drainage je nach Größe.",
      rule: {
        mode: "anyOf",
        expected: [
          "instabil",
          "stabil",
          "klinische instabilität",
          "hypotonie",
          "tachykardie",
          "hypoxie",
          "groß",
          "klein",
          "spannungs",
          "drainage",
          "nadeldekompression",
        ],
        hint_general: "Klinik entscheidet das Vorgehen.",
      },
    },

    // 8) Komplikationen
    {
      order: 8,
      points: 1,
      prompt: "Welche lokalen und systemischen Komplikationen kennen Sie?",
      hint: "Reexpansionsödem, Empyem/Infektion, Blutung, Fehlanlage, Rezidiv.",
      rule: {
        mode: "anyOf",
        expected: [
          "reexpansionsödem",
          "empyem",
          "infektion",
          "blutung",
          "verletzung von gefäßen",
          "organverletzung",
          "subkutanes emphysem",
          "rezidiv",
          "persistierendes luftleck",
          "spannungsrezidiv",
        ],
        minHits: 3,
      },
    },

    // 9) Indikationen für umgehende Dekompression/Drainage
    {
      order: 9,
      points: 1,
      prompt:
        "Welche spezifischen Indikationen bestehen für die umgehende Dekompression/Thoraxdrainage ohne Verzögerung durch Bildgebung?",
      hint: "Klinisch instabiler Patient mit Verdacht auf Spannungspneumothorax; Beatmung mit Positivdruck.",
      rule: {
        mode: "allOf",
        required: ["spannungspneumothorax", "instabil", "beatmung"],
        synonyms: {
          instabil: ["kreislaufinstabilität", "hypotonie", "schock", "respiratorische insuffizienz"],
          beatmung: [
            "positivdruck",
            "mechanische beatmung",
            "cpap",
            "niv",
            "positive pressure ventilation",
          ],
        },
        minHits: 1,
        hint_general: "Klinik vor Bildgebung: Dekompression zuerst.",
      },
    },
  ],

  objectives: [
    { id: "ddx", label: "Differenzialdiagnosen bei akuter Dyspnoe/Thoraxschmerz nennen" },
    { id: "vorgehen", label: "Strukturiertes Notfallvorgehen (ABCDE) benennen" },
    { id: "diagnose", label: "Wahrscheinlichste Diagnose korrekt identifizieren" },
    { id: "therapie", label: "Akuttherapie (Entlastung + Drainage) korrekt nennen" },
    { id: "kriterien", label: "Klinische Zeichen des Spannungspneumothorax benennen" },
    { id: "ätiologie", label: "Häufige Ursachen/Risikofaktoren benennen" },
    { id: "schweregrad", label: "Stabil/instabil richtig einordnen" },
    { id: "komplikationen", label: "Komplikationen des Pneumothorax aufzählen" },
  ],

  completion: { minObjectives: 5, maxLLMTurns: 12, hardStopTurns: 14 },
};