// src/app/exam/summary/page.tsx
import SummaryClient from "./SummaryClient";

export const metadata = {
  title: "Simulation – Ergebnis & Analyse | ExaSim",
  description:
    "Gesamtergebnis deiner Examenssimulation mit Stärken, Schwächen und konkreten Empfehlungen.",
};

export default function SummaryPage() {
  return <SummaryClient />;
}