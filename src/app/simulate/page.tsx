import SimulateClient from "./SimulateClient";

export const metadata = {
  title: "Examenssimulation – ExaSim",
  description: "Stelle dir eine individuelle Examenssimulation aus Innerer Medizin, Chirurgie und deinem Wahlfach zusammen.",
};

export default function SimulatePage() {
  return <SimulateClient />;
}