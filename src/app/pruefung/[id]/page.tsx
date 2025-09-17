import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CASES } from "@/data/cases";
import PruefungClient from "./PruefungClient";

function getCase(id: string) {
  return CASES.find((c) => c.id === id) ?? null;
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const caseData = getCase(params.id);
  if (!caseData) {
    return {
      title: "Fall nicht gefunden – Prüfungsmodus",
    };
  }
  return {
    title: `${caseData.title} – Prüfungsmodus`,
    description: caseData.vignette,
  };
}

export default function PruefungCasePage({ params }: { params: { id: string } }) {
  const caseData = getCase(params.id);
  if (!caseData || !caseData.interactive) {
    notFound();
  }

  return <PruefungClient caseData={caseData} />;
}
