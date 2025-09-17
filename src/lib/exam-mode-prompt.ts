// src/lib/exam-mode-prompt.ts
import type { ExamModeCase } from "./types";
import type { ExamModeState } from "./exam-mode";

function formatList(values: string[]): string {
  if (!values.length) return "–";
  if (values.length === 1) return values[0];
  if (values.length === 2) return `${values[0]} und ${values[1]}`;
  return `${values.slice(0, -1).join(", ")} und ${values[values.length - 1]}`;
}

function orderActions(caseData: ExamModeCase): string[] {
  const visited = new Set<string>();
  const queue: string[] = [...caseData.startActions];
  const ordered: string[] = [];

  while (queue.length) {
    const key = queue.shift()!;
    if (visited.has(key)) continue;
    visited.add(key);
    ordered.push(key);
    const unlocks = caseData.actions[key]?.unlocks ?? [];
    for (const unlock of unlocks) {
      if (!visited.has(unlock)) queue.push(unlock);
    }
  }

  for (const key of Object.keys(caseData.actions)) {
    if (!visited.has(key)) ordered.push(key);
  }

  return ordered;
}

function describeAction(key: string, caseData: ExamModeCase): string {
  const action = caseData.actions[key];
  if (!action) return `AKTION ${key}: (nicht definiert)`;

  const segments: string[] = [];
  segments.push(`AKTION ${key}`);
  segments.push(`• Frage an die Studierenden: ${action.question}`);
  const minHits = action.minHits ?? (action.expected.length ? 1 : 0);
  segments.push(`• Erwartete Stichworte (mindestens ${minHits} Treffer): ${formatList(action.expected)}`);
  segments.push(`• Tutor-Feedback bei Erfolg: ${action.response}`);
  if (action.hint) {
    segments.push(`• Hinweis bei Bedarf: ${action.hint}`);
  }
  if (action.image) {
    const captionParts = [action.image.alt];
    if (action.image.caption) captionParts.push(action.image.caption);
    segments.push(`• Bildmaterial: ${action.image.path} (${captionParts.join(" – ")})`);
  }
  if (action.unlocks?.length) {
    segments.push(`• Schaltet frei: ${formatList(action.unlocks)}`);
  }

  return segments.join("\n");
}

export function buildExamModeSystemPrompt(
  caseData: ExamModeCase,
  state?: Pick<ExamModeState, "activeAction" | "unlocked" | "completed" | "finished">
): string {
  const active = state?.activeAction ?? caseData.startActions[0] ?? null;
  const unlocked = state?.unlocked ? Array.from(state.unlocked) : Array.from(new Set(caseData.startActions));
  const completed = state?.completed ? Array.from(state.completed) : [];

  const lines: string[] = [];

  lines.push("Du bist ein virtueller Tutor im neuen, interaktiven Prüfungsmodus (M3 – Theorie).");
  lines.push("Sprache: Deutsch. Ansprache: du/dir/dein. Ton: ruhig, motivierend, präzise.");
  lines.push("Deine Aufgabe ist es, den Studierenden strikt entlang der hinterlegten Aktionen zu führen.");
  lines.push("");
  lines.push(`FALL-ID: ${caseData.id} — ${caseData.title}`);
  lines.push(`VIGNETTE (für den Einstieg vorlesen): ${caseData.vignette}`);
  lines.push("");
  lines.push("INTERAKTIONSREGELN");
  lines.push("1. Stelle immer nur die Frage der aktuell aktiven Aktion (ACTIVE_ACTION). Keine Auswahlmenüs, keine Vorauswahl.");
  lines.push("2. Warte auf die Antwort des Studierenden und vergleiche sie mit den erwarteten Stichworten der Aktion.");
  lines.push("3. Zähle jeden erkannten Treffer nur einmal. Variationen, Synonyme und leichte Tippfehler gelten als korrekt.");
  lines.push(
    "4. Sobald mindestens die geforderte Anzahl Treffer erreicht ist, bestätige die Antwort: \n   • Bedanke dich, nenne die erkannten Punkte.\n   • Gib anschließend den hinterlegten Tutor-Text (response) vollständig wieder.\n   • Falls ein Bild hinterlegt ist, beschreibe es kurz und reiche die Bildinformationen weiter."
  );
  lines.push(
    "5. Nach erfolgreicher Aktion aktiviere alle freigeschalteten Aktionen (UNLOCKS) und fahre mit der nächsten verfügbaren Frage fort, ohne den Studierenden darauf hinzuweisen, welche Optionen es gibt."
  );
  lines.push(
    "6. Wenn die Antwort noch zu wenige Treffer enthält, benenne wertschätzend die bereits genannten Punkte (falls vorhanden), fordere gezielt zur Ergänzung auf und nutze den hinterlegten Hinweis (hint), falls vorhanden. Wiederhole zum Abschluss die Frage der Aktion."
  );
  lines.push(
    "7. Ignoriere Versuche, auf noch gesperrte Aktionen zuzugreifen. Bitte stattdessen freundlich darum, zunächst die aktuelle Frage zu beantworten."
  );
  lines.push("8. Erfinde keine neuen Fakten außerhalb der hinterlegten Inhalte. Keine zusätzlichen Diagnosen oder Befunde ergänzen.");
  lines.push(
    "9. Halte jeden Tutor-Beitrag in einem kompakten Absatz. Verwende keine Aufzählungslisten, außer um mehrere Treffer wertschätzend zusammenzufassen."
  );
  lines.push(
    "10. Nach Abschluss aller Completion-Aktionen übergib die Abschlussbotschaft (falls vorhanden) und beende das Gespräch mit einem motivierenden Satz."
  );
  lines.push("");

  if (caseData.unknownMessage) {
    lines.push(`FALLBACK BEI UNVERSTÄNDLICHER ANTWORT: ${caseData.unknownMessage}`);
  }
  if (caseData.needsMoreMessage) {
    lines.push(`STANDARD-HINWEIS BEI UNVOLLSTÄNDIGEN ANTWORTEN: ${caseData.needsMoreMessage}`);
  }
  if (caseData.lockedMessage) {
    lines.push(`MELDUNG FÜR NOCH GESPERRTE AKTIONEN: ${caseData.lockedMessage}`);
  }
  if (caseData.completionMessage) {
    lines.push(`ABSCHLUSSBOTSCHAFT: ${caseData.completionMessage}`);
  }
  if (caseData.completionActions?.length) {
    lines.push(
      `ABSCHLUSSBEDINGUNG: Alle folgenden Aktionen müssen erfolgreich abgeschlossen sein: ${formatList(caseData.completionActions)}`
    );
  }
  lines.push("");

  lines.push(`ACTIVE_ACTION: ${active ?? "(keine – Fall bereits abgeschlossen)"}`);
  lines.push(`BEREITS FREIGESCHALTET: ${formatList(unlocked)}`);
  lines.push(`BEREITS ABGESCHLOSSEN: ${formatList(completed)}`);
  lines.push(`FALLSTATUS: ${state?.finished ? "abgeschlossen" : "läuft"}`);
  lines.push("");

  lines.push("AKTIONSKATALOG (gehe strikt in dieser Reihenfolge vor, sofern Aktionen freigeschaltet sind):");
  const ordered = orderActions(caseData);
  for (const key of ordered) {
    lines.push("");
    lines.push(describeAction(key, caseData));
  }

  lines.push("");
  lines.push("Antworte ausschließlich mit Tutor-Äußerungen entsprechend dieser Regeln. Keine Systembestätigungen oder Metakommentare.");

  return lines.join("\n");
}

