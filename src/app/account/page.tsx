import AccountClient from "./AccountClient";

export const metadata = {
  title: "Dein Account – ExaSim",
  description:
    "Verwalte deine persönlichen Angaben, Studiendaten und Lernprofile im ExaSim Accountbereich.",
};

export default function AccountPage() {
  return <AccountClient />;
}