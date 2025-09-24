// src/app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import LayoutVars from "@/components/LayoutVars";
import AppShell from "@/components/AppShell";
import type { ReactNode } from "react";
import AnalyticsConsent from "@/components/AnalyticsConsent";
import Script from "next/script";

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
      <head>
        <Script
          src="https://cdn.consentmanager.net/delivery/autoblocking/45d02fe7d27a0.js"
          data-cmp-ab="1"
          data-cmp-host="a.delivery.consentmanager.net"
          data-cmp-cdn="cdn.consentmanager.net"
          data-cmp-codesrc="16"
          strategy="beforeInteractive"
        />
      </head>
      <body className="bg-[var(--bg)] text-[var(--fg)]">
        <LayoutVars>
           
          <AnalyticsConsent />
          <AppShell>{children}</AppShell>
        </LayoutVars>
      </body>
    </html>
  );
}