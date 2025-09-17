import type { Case } from "@/lib/types";

export const aszites_001: Case = {
  id: "aszites_001",
  title: "Bauchumfangszunahme und Varizenblutung",
  shortTitle: "Dekompensierte Leberzirrhose",
  vignette:
    "Sie übernehmen in der Notaufnahme einen 58-jährigen Patienten mit progredientem Bauchumfang und Belastungsdyspnoe. Sie führen ein strukturiertes Gespräch, das sich wie eine echte Prüfung anfühlt.",
  specialty: "Innere Medizin",
  subspecialty: "Gastroenterologie",
  leadSymptom: "Bauchumfangszunahme",
  pseudonym: "Aszites_001",
  difficulty: 3,
  tags: ["Aszites", "Leberzirrhose", "Varizenblutung", "Notfall"],
  steps: [
    {
      order: 1,
      points: 3,
      prompt:
        "Sie begrüßen den Patienten, greifen seine Sorge über den gespannter werdenden Bauch auf und leiten ein offenes Gespräch ein. Welche Themen sprechen Sie in der Anamnese unbedingt an, während Sie das Gespräch flüssig halten?",
      hint: "Denke an Leberrisikofaktoren, Komorbiditäten und Symptome der Dekompensation.",
      rule: {
        mode: "allOf",
        required: ["alkoholanamnese", "vorerkrankungen", "medikamente", "operationen", "b-symptomatik"],
        synonyms: {
          alkoholanamnese: ["alkoholkonsum", "alkohol", "trinkgewohnheiten", "alkoholabusus"],
          vorerkrankungen: ["vorerkrankungen", "lebererkrankungen", "chronische erkrankungen", "hepatitiden"],
          medikamente: ["medikation", "medikamente", "hepatotoxische medikamente"],
          operationen: ["voroperationen", "bauchoperationen", "op-vorgeschichte"],
          "b-symptomatik": ["fieber", "nachtschweiß", "gewichtsverlust", "b symptome"],
        },
        optional: ["reiseanamnese", "thromboembolische ereignisse"],
        hint_general: "Auch scheinbar nebensächliche Angaben können die Diagnose lenken.",
      },
      reveal: {
        when: "on_submit",
        content: {
          befundpaketTitel: "Anamnestische Antworten",
          interpretationKurz:
            "Der Patient berichtet über langjährigen Alkoholkonsum, bekannte Leberzirrhose, keine relevanten Operationen, aktuell keine Medikamente außer Diuretika; er bestätigt Müdigkeit, Gewichtsverlust und Nachtschweiß.",
        },
      },
    },
    {
      order: 2,
      points: 3,
      prompt:
        "Nachdem Sie die wichtigsten Punkte gesammelt haben, erklären Sie, dass Sie den Bauch genau untersuchen. Welche Aspekte der körperlichen Untersuchung sprechen Sie an und was demonstrieren Sie dem Patienten als typische Befunde?",
      hint: "Achte auf Zeichen des Aszites und der portalen Hypertension.",
      rule: {
        mode: "allOf",
        required: ["bauchinspektion", "flüssigkeitswelle", "shifting dullness", "ödeme", "ikterus"],
        synonyms: {
          bauchinspektion: ["bauchumfang", "bauch inspizieren", "inspektion abdomen"],
          flüssigkeitswelle: ["flüssigkeitswellenzeichen", "flüssigkeitswelle auslösen"],
          "shifting dullness": ["perkussion", "verschiebliche dämpfung"],
          "ödeme": ["periphere ödem", "beinödeme", "knöchelödeme"],
          ikterus: ["gelbfärbung", "sklerenikterus", "leberhautzeichen"],
        },
        optional: ["splenomegalie", "caput medusae"],
        hint_general: "Zeige, dass du die klassische Untersuchung des Aszites beherrschst.",
      },
      reveal: {
        when: "on_submit",
        content: {
          befundpaketTitel: "Körperliche Untersuchung",
          vitalparameter: { rr: "110/70 mmHg", puls: 96, temp: 37.6, spo2: "96%" },
          interpretationKurz:
            "Der Bauch ist prall gespannt mit deutlicher Flüssigkeitswelle und verschieblicher Dämpfung; es finden sich Unterschenkelödeme, ein diskreter Sklerenikterus und prominente Bauchvenen.",
        },
      },
    },
    {
      order: 3,
      points: 3,
      prompt:
        "Im Gespräch bedanken Sie sich für das Vertrauen und schildern, welche Untersuchungen Sie jetzt parallel veranlassen, während Sie weiter moderieren. Welche diagnostischen Schritte gehören dazu und welche typischen Resultate kommunizieren Sie?",
      hint: "Strukturiere nach Basisdiagnostik bei portaler Hypertension.",
      rule: {
        mode: "allOf",
        required: ["sonografie", "labor", "aszitespunktion"],
        synonyms: {
          sonografie: ["ultraschall", "sono", "bildgebung abdomen"],
          labor: ["laborwerte", "blutbild", "leberwerte"],
          aszitespunktion: ["punktion", "diagnostische punktion", "bauchpunktion"],
        },
        optional: ["bildgebung thorax", "ekg"],
        hint_general: "Erläutere dem Patienten, warum jede Maßnahme wichtig ist.",
      },
      reveal: {
        when: "on_submit",
        content: {
          befundpaketTitel: "Veranlasste Diagnostik",
          bildgebung: {
            lungensonografie: "Abdominalsonografie zeigt echoleere freie Flüssigkeit um die Leber, grobknotige Leberoberfläche und dilatierte Pfortader.",
          },
          labor: {
            basis: {
              ast_got: { wert: 68, einheit: "U/L", referenz: "<35" },
              alt_gpt: { wert: 54, einheit: "U/L", referenz: "<45" },
              ggt: { wert: 210, einheit: "U/L", referenz: "<60" },
              inr: { wert: 1.6, referenz: "0.8-1.2" },
              albumin: { wert: 2.8, einheit: "g/dL", referenz: "3.5-5.2" },
            },
          },
          interpretationKurz:
            "Die unmittelbare Rückmeldung lautet: freie Aszitesflüssigkeit, eingeschränkte Syntheseleistung der Leber und Hinweise auf portale Hypertension.",
        },
      },
    },
    {
      order: 4,
      points: 3,
      prompt:
        "Während die Ergebnisse eintreffen, erläutern Sie sie dem Patienten in vollständigen Sätzen. Welche Kernaussagen treffen Sie zu Labor, Sonografie und der Punktionsanalyse?",
      hint: "Verbinde typische Befunde mit deren Bedeutung.",
      rule: {
        mode: "allOf",
        required: ["transaminasen", "albumin erniedrigt", "inr erhöht", "serum-ascites-albumin", "zellzahl"],
        synonyms: {
          transaminasen: ["ast", "alt", "leberwerte erhöht"],
          "albumin erniedrigt": ["hypoalbuminämie", "albumin niedrig"],
          "inr erhöht": ["quick erniedrigt", "gerinnung gestört"],
          "serum-ascites-albumin": ["saag", "albumindifferenz"],
          zellzahl: ["zellzahlanalyse", "neutrophile", "spontan bakterielle peritonitis ausschließen"],
        },
        optional: ["protein gesamt", "kulturen"],
        hint_general: "Zeige, dass du die Pathophysiologie verstehst.",
      },
      reveal: {
        when: "on_submit",
        content: {
          labor: {
            punktat: {
              eiweiß: { wert: "<25 g/L", referenz: "<25" },
              zellzahl: { wert: 180, einheit: "/µL", referenz: "<250" },
              kultur: "Kein Keimnachweis",
            },
          },
          interpretationKurz:
            "Sie erklären: Transaminasen moderat erhöht, Albumin erniedrigt, INR verlängert; das Serum-Aszites-Albumin-Gap ist >1,1 g/dL und spricht für portale Hypertension, die Zellzahl liegt unter 250/µL.",
        },
      },
    },
    {
      order: 5,
      points: 3,
      prompt:
        "Der Patient fragt nach möglichen Ursachen und möchte, dass Sie gemeinsam strukturieren. Welche zentralen Differenzialdiagnosen der portalen Hypertension führen Sie im Gespräch an?",
      hint: "Nenne Ursachen vor und nach der Leber sowie seltenere Auslöser.",
      rule: {
        mode: "categories",
        categories: {
          intrahepatisch: ["leberzirrhose", "alkoholtoxische lebererkrankung", "nichtalkoholische steatohepatitis", "schistosomiasis"],
          praehepatisch: ["pfortaderthrombose"],
          posthepatisch: ["budd-chiari-syndrom", "rechtsherzinsuffizienz", "pericarditis constrictiva"],
        },
        minCategories: 3,
        minHits: 4,
        forbidden: ["appendizitis"],
        synonyms: {
          "leberzirrhose": ["zirrhose", "dekompensierte leberzirrhose"],
          "alkoholtoxische lebererkrankung": ["alkoholschäden", "alkoholtoxisch"],
          schistosomiasis: ["bilharziose"],
          pfortaderthrombose: ["portalvenenthrombose"],
          "budd-chiari-syndrom": ["budd chiari", "hepatische venenthrombose"],
          rechtsherzinsuffizienz: ["right heart failure", "rechtsherzversagen"],
          "pericarditis constrictiva": ["perikarditis constrictiva", "panzerherz"],
        },
        hint_general: "Deckungsgleich mit Lehrbuch: vor der Leber, in der Leber, hinter der Leber.",
      },
    },
    {
      order: 6,
      points: 4,
      prompt:
        "Während Sie mögliche Ursachen erklären, klagt der Patient plötzlich über Schwindel und erbricht helles Blut. Sie bleiben ruhig und kommentieren jeden Schritt laut, damit der Prüfling Ihr Vorgehen nachvollziehen kann. Welche Sofortmaßnahmen leiten Sie ein?",
      hint: "Versorge A- und B-Wege, stabilisiere den Kreislauf und sichere den Zugang zur definitiven Therapie.",
      rule: {
        mode: "allOf",
        required: ["schocklage", "großlumige zugänge", "volumentherapie", "sauerstoff", "magensonde"],
        synonyms: {
          schocklage: ["beine hoch", "schockposition"],
          "großlumige zugänge": ["zwei großlumige zugänge", "venenverweilkanüle", "zwei zugänge"],
          volumentherapie: ["kristalloide", "infusion", "flüssigkeitsgabe"],
          sauerstoff: ["o2", "sauerstoffgabe"],
          magensonde: ["magendrainage", "absaugen", "magenschlauch"],
        },
        optional: ["schutzintubation", "blutkonserven", "transfusion", "antibiotika"],
        hint_general: "Denke an ABC, hämodynamische Stabilisierung und Vorbereitung auf definitive Maßnahmen.",
      },
      reveal: {
        when: "on_submit",
        content: {
          interpretationKurz:
            "Der Patient wird in Schocklage gebracht, erhält zwei großlumige Zugänge, kristalloide Volumengabe, Sauerstoff über Maske und eine Magensonde zum Absaugen; parallel werden Blutprodukte und Intubationsbereitschaft vorbereitet.",
        },
      },
    },
    {
      order: 7,
      points: 2,
      prompt:
        "Nachdem Sie den Patienten stabilisiert haben, erläutern Sie ruhig den nächsten Schritt. Welche endoskopische Therapie planen Sie unmittelbar und wie begründen Sie das?",
      hint: "Standardtherapie bei variköser Blutung nennen.",
      rule: {
        mode: "anyOf",
        expected: ["ösophagusvarizenligatur", "gummibandligatur", "endoskopische ligatur"],
        synonyms: {
          "ösophagusvarizenligatur": ["oesophagusvarizenligatur", "bandligatur"],
          "gummibandligatur": ["ligaturband", "gummiband"],
        },
        minHits: 1,
        hint_general: "Die erste Wahl ist eine Ligaturbehandlung der Varizen.",
      },
      reveal: {
        when: "on_submit",
        content: {
          interpretationKurz:
            "Sie schildern, dass eine endoskopische Gummibandligatur der Ösophagusvarizen vorbereitet wird, um die Blutung zu stillen.",
        },
      },
    },
    {
      order: 8,
      points: 3,
      prompt:
        "Parallel zur Endoskopie erläutern Sie die begleitende medikamentöse Therapie. Welche Substanzen ordnen Sie an und welche Alternativen halten Sie bereit?",
      hint: "Vasokonstriktoren plus weitere Eskalationsoptionen.",
      rule: {
        mode: "allOf",
        required: ["terlipressin", "somatostatin", "tips-option"],
        synonyms: {
          terlipressin: ["vasopressin-analog", "terli"],
          somatostatin: ["octreotid", "somatostatin analog", "somatostatin/octreotid"],
          "tips-option": ["tips", "transjugulärer intrahepatischer portosystemischer shunt"],
        },
        optional: ["sklerotherapie", "ballontamponade", "stent"],
        hint_general: "Nenne Erstlinientherapie und Eskalationen klar.",
      },
      reveal: {
        when: "on_submit",
        content: {
          interpretationKurz:
            "Sie geben Terlipressin i.v., beginnen eine Somatostatin- bzw. Octreotid-Infusion und halten bei Persistenz der Blutung Sklerotherapie, Ballontamponade oder TIPS bereit.",
        },
      },
    },
    {
      order: 9,
      points: 3,
      prompt:
        "Nachdem die Akutsituation unter Kontrolle ist, führen Sie das Gespräch auf die Zukunft. Welche Maßnahmen schlagen Sie dem Patienten als Sekundärprophylaxe vor und wie erklären Sie deren Ziel?",
      hint: "Dauerhafte Blutungsprophylaxe und Behandlung der Ursache.",
      rule: {
        mode: "allOf",
        required: ["betablocker", "kontrollendoskopie", "tips", "alkoholkarenz", "grunderkrankung"],
        synonyms: {
          betablocker: ["nichtselektive betablocker", "propranolol", "carvedilol"],
          kontrollendoskopie: ["regelmäßige ligatur", "endoskopische nachsorge"],
          tips: ["transjugulärer portosystemischer shunt", "tips-verfahren"],
          alkoholkarenz: ["alkoholverzicht", "alkoholabstinenz"],
          grunderkrankung: ["therapie der leberzirrhose", "ursachenbehandlung"],
        },
        optional: ["impfungen", "ernährungsberatung"],
        hint_general: "Vermeide Rezidive durch Medikamente, endoskopische Kontrollen und Ursachenbehandlung.",
      },
      reveal: {
        when: "on_submit",
        content: {
          interpretationKurz:
            "Sie empfehlen nicht-selektive Betablocker, engmaschige Kontrollligaturen, ggf. einen TIPS bei Rezidivblutung, strikte Alkoholkarenz und die konsequente Therapie der Leberzirrhose.",
        },
      },
    },
  ],
  objectives: [
    { id: "anamnese", label: "Anamnese bei Aszites strukturiert führen" },
    { id: "untersuchung", label: "Körperliche Befunde bei portaler Hypertension beschreiben" },
    { id: "diagnostik", label: "Diagnostisches Vorgehen bei Aszites erläutern" },
    { id: "befunddeutung", label: "Labor- und Punktionsbefunde korrekt interpretieren" },
    { id: "ddx", label: "Wichtige Differenzialdiagnosen der portalen Hypertension nennen" },
    { id: "notfall", label: "Varizenblutung im Notfall managen" },
    { id: "therapie", label: "Endoskopische und medikamentöse Therapie kombinieren" },
    { id: "prophylaxe", label: "Sekundärprophylaxe bei Leberzirrhose planen" },
  ],
  completion: { minObjectives: 5, maxLLMTurns: 14, hardStopTurns: 16 },
};
