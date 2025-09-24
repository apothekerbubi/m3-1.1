export function scoreBandComment(rawScore: number): string {
  const score = Number.isFinite(rawScore)
    ? Math.round(Math.max(0, Math.min(100, rawScore)))
    : 0;

  if (score >= 95) {
    return "Top Leistung – Sie haben die Aufgabe nahezu perfekt getroffen. Besser geht es kaum.";
  }
  if (score >= 85) {
    return "Sehr gut gemacht – Sie haben fast alle wichtigen Aspekte erwähnt und präzise ausgeführt.";
  }
  if (score >= 75) {
    return "Starke Antwort – nur wenige Punkte fehlen noch, um das Bild vollständig zu machen.";
  }
  if (score >= 65) {
    return "Gute Basis – bauen Sie die fehlenden Details noch aus, dann wird es eine runde Leistung.";
  }
  if (score >= 50) {
    return "Guter Anfang – Sie haben schon einige wichtige Punkte erkannt, aber es fehlt noch Wesentliches.";
  }
  if (score >= 35) {
    return "Solider Ansatz – Sie sind auf dem richtigen Weg, doch zentrale Aspekte fehlen noch deutlich.";
  }
  if (score >= 20) {
    return "Einige Ansätze sind erkennbar – schärfen Sie Ihre Ausführungen weiter und arbeiten Sie an der Struktur.";
  }
  if (score >= 10) {
    return "Sehr holpriger Start – wiederholen Sie die Grundlagen, um eine stabilere Basis zu schaffen.";
  }
  return "Das liegt noch daneben – beginnen Sie mit den Basics, um ein solides Fundament zu entwickeln.";
}