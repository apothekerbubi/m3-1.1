import OverviewClient from "./OverviewClient";

export const metadata = {
  title: "Übersicht – ExaSim",
  description: "Sieh dir deinen Lernfortschritt und deine zuletzt bearbeiteten Fälle in der Übersicht an.",
};

export default function OverviewPage() {
  return <OverviewClient />;
}