// src/data/chirurgie/appendizitis_001.ts
import type { Case } from "@/lib/types";

export const appendizitis_001: Case = {
  id: "appendizitis_001",
  title: "Rechter Unterbauchschmerz",
  shortTitle: "Appendizitis",
  vignette:
    "Eine 32-jähriger Patientin stellt sich in der Notaufnahme mit seit 12 Stunden zunehmenden Bauchschmerzen vor.",
  specialty: "Chirurgie",
  subspecialty: "Allgemeinchirurgie",
  pseudonym: "Unterbauchschmerz_001",
  difficulty: 1,
  tags: ["Appendizitis", "Unterbauchschmerz", "Akutes Abdomen"],
  steps: [
    {
      order: 1,
      points: 2,
      prompt: "Welche weiteren anamnestischen Informationen erfragen Sie?",
      hint: "Schmerzlokalisation, vorbekannte Traumen, weitere Symptome",
      rule: {
        mode: "anyOf",
        expected: [
          "Schmerzlokalisation", "Trauma", "Vorerkrankungen", "weitere Symptome"
        ],
        minHits: 2,
      },
    },

    {
      order: 2,
      points: 2,
      prompt: "Die Patientin gibt an, dass die Schmerzen vor etwa 12 Stunden begonnen hätten, zuerst im Oberbauch, im Verlauf dann im rechten Unterbauch. An welche drei häufigen Differentialdiagnosen denken Sie?",
      hint: "",
      rule: {
        mode: "anyOf",
        expected: ["Appendizitis",
 "Cholezystitis", "Gallenblasenentzündung",
 "Cholelithiasis", "Gallensteine",
 "Akute Pankreatitis", "Bauchspeicheldrüsenentzündung",
 "Sigmadivertikulitis", "Divertikelentzündung",
 "Ileus", "Darmverschluss",
 "Perforiertes Ulkus", "Durchbruch eines Magen- oder Darmgeschwürs",
 "Mesenterialinfarkt", "Darminfarkt",
 "Rupturiertes Aortenaneurysma", "Geplatztes Bauchaortenaneurysma",
 "Ektopische Schwangerschaft", "Bauchhöhlenschwangerschaft",
 "Ovarialtorsion", "Eierstockdrehung",
 "Pyelonephritis", "Nierenbeckenentzündung",
 "Harnleiterstein", "Nierenstein", "Ureterstein"],
        minHits: 3,
      },
    },
    {
      order: 3,
      points: 2,
      prompt: "Wie gehen Sie basierend auf den Angaben des Patienten allgemein weiter vor?",
      hint: "Vitalparameter",
      rule: {
        mode: "anyOf",
        expected: [
          "Vitalparameter",
          "Anamnese",
          "Körperliche Untersuchung",
          "Labor"
        ],
        minHits: 2,
      },
    },
    {
      order: 4,
      points: 2,
      prompt: "Sie stellen fest, dass ihr Patient einen Blutdruck von 110/75 mmHg hat, HF von 85/min, So2 von 98% und Körpertemperatur von 36,8 °C hat. Sie haben ein Labor abgenommen und verschickt. Welche Laborparameter sind relevant (Nenne mindestens zwei)?",
      hint: "Entzündungswerte, Schwangerschtssausschluss",
      rule: {
        mode: "anyOf",
        expected: ["CRP", "kleines Blutbild", "Leukozyten", "beta-HCG", "Leukos"],
        minHits: 2,
      },
    },
    {
      order: 5,
      points: 3,
      prompt: "Anamnestisch sind keine weiteren relevanten Informationen zu erlangen, außer dass der Schmerz vor etwa 12 Stunden angefangen habe und progredient ist. Sie wollen jetzt mit der körperlichen Untersuchung beginnen, wie gehen Sie allgemein vor? ",
      hint: "",
      rule: {
        mode: "anyOf",
        expected: ["Inspektion", "Auskultation", "Palpation", "Perkussion"],
        minHits: 3,
      },
    },
    {
      order: 6,
      points: 3,
      prompt: "Die Patientin liegt schmerzgequält in Schonhaltung vor Ihnen, etwas geminderte Darmgeräusche, palpatorischer Schmerz insbesondere im rechten Unterbauch. Sie vermuten eine Appendizitis. Welche spezifischen schmerzhaften Druckpunkte und Manöver kennen Sie?",
      hint: "Appendizitiszeichen",
      rule: {
        mode: "anyOf",
        expected: ["Lanz Punkt", "McBurney Punkt", "Rosving","Blumberg", "Psoas Zeichen", "Douglas Schmerz", "Baldwin Zeichen"],
        minHits: 3,
      },
    },
    {
      order: 7,
      points: 3,
      prompt: "Sie führen zwei der genannten Manöver aus. Erklären Sie bitte ihr Vorgehen bei diesen Untersuchungen.",
      hint: "Appendizitiszeichen",
      rule: {
        mode: "anyOf",
        expected: ["Ungefähre Antwort (sei großzügig):Vorgehen bei Lanz Punkt: Druck Punkt auf der Linie zwischen beiden Spinae iliacae zwischen rechtem und mittlerem Drittel", "Ungefähre Antwort (sei großzügig): McBurney Punkt:  Punkt auf der Linie zwischen rechter Spina iliaca anterior superior und Bauchnabel zwischen dem lateralen und mittleren Drittel", "Rosving:  Schmerzen im rechten Unterbauch durch Ausstreichen des Kolons längs des Kolonrahmens in Richtung Appendix ","Blumberg: Kontralateraler Loslassschmerz (im rechten Unterbauch) nach Palpation des linken Unterbauchs ", "Psoas Zeichen:  Schmerzen im rechten Unterbauch durch Anheben des rechten Beins gegen Widerstand (bei Entzündung einer retrozäkal liegenden Appendix)", "Douglas Schmerz:  Schmerzen beim Palpieren des Douglas-Raums bei der digital-rektalen Untersuchung", "Baldwin Zeichen: Schmerzen in der Flanke nach Fallenlassen des gestreckten, im Liegen angehobenen rechten Beins (Hinweis auf retrozäkale Appendizitis) "],
        minHits: 2,
      },
    },
    {
      order: 8,
      points: 1,
      prompt: "Sie finden ein positives Lanz sowie McBurney Zeichen. Welche bilgebende Diagnostik führen Sie jetzt durch?",
      hint: "Niederschwellig und schnell verfügbar",
      rule: {
        mode: "anyOf",
        expected: ["Sonografie"],
        minHits: 1,
      },
    },
    {
      order: 9,
      points: 1,
      prompt: "Die durchgeführte Abdomensonografie ergibt folgendes Bild, beschreiben Sie? Welche Diagnose stellen Sie",
      hint: "Echogenität, Flüssigkeit",
      rule: {
        mode: "anyOf",
        expected: ["Frei Flüssigkeit", " perforierte Appendizitis"],
        minHits: 1,
      },
       // 👇 hier das Bild
      image: {
        path: "Roentgen/Appendizitis.jpeg", // Pfad im öffentlichen Bucket
        alt: "Sonografie einer Appendizitis",
        caption: "Sonografie einer Appendizitis",
      },
      
    },
    {
      order: 10,
      points: 3,
      prompt: "Aus den jetzt angekommenen Laborergebnissen ist folgendes ersichtlich: erhöhtes CRP, Leukozytose, beta-HCG negativ. Wie sieht das weitere therapeutische Vorgehen aus und welche supportiven Maßnahmen leiten Sie ein?",
      hint: "Echogenität, Flüssigkeit",
      rule: {
        mode: "anyOf",
        expected: ["zeitnahe Appendektomie", "Flüssigkeit", "Nahrungskarenz", "Analgesie"],
        minHits: 3,
      },
       // 👇 hier das Bild
      image: {
        path: "Roentgen/Appendizitis.jpeg", // Pfad im öffentlichen Bucket
        alt: "Sonografie einer Appendizitis",
        caption: "Sonografie einer Appendizitis",
      },
      
    },
  ],
  objectives: [
    { id: "diagnose", label: "Appendizitis erkennen" },
    { id: "zeichen", label: "Klinische Zeichen benennen" },
    { id: "therapie", label: "Therapieoptionen kennen" },
  ],
  completion: { minObjectives: 3, maxLLMTurns: 20, hardStopTurns: 20 },
};