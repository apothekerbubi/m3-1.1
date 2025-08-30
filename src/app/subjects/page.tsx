import { Suspense } from "react";
import SubjectsPageInner from "./subjects-inner";
import GlobalSkeleton from "@/components/GlobalSkeleton";

export const metadata = {
  title: "Bibliothek – ExaSim",
  description: "Durchsuche Fälle nach Fachrichtung, Wahlfach oder Kategorie. Behalte deinen Lernfortschritt im Blick.",
};

export default function SubjectsPage() {
  return (
    <Suspense fallback={<GlobalSkeleton />}>
      <SubjectsPageInner />
    </Suspense>
  );
}