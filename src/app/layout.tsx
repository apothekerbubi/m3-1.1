// src/app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import LayoutVars from "@/components/LayoutVars";
import AppShell from "@/components/AppShell";
import type { ReactNode } from "react";
import AnalyticsConsent from "@/components/AnalyticsConsent";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
});

export const metadata: Metadata = {
  title: {
    default: "",
    template: "ExaSim | %s",
  },
  description: "Prüfungsnahe M3-Simulation – Innere, Chirurgie & Wahlfach",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="de" className={jakarta.variable}>
      <body className="bg-[var(--bg)] text-[var(--fg)]">
        <LayoutVars>
           
              <AnalyticsConsent />
          <AppShell>{children}</AppShell>
        </LayoutVars>
      </body>
    </html>
  );
}