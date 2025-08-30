import SymptomsClient from "./CasesClient";

export const metadata = {
  title: "Leitsymptome – ExaSim",
  description:
    "Erkunde medizinische Leitsymptome und trainiere interaktive Fallbeispiele passend zu den jeweiligen Beschwerden.",
};

export default function SymptomsPage() {
  return <SymptomsClient />;
}