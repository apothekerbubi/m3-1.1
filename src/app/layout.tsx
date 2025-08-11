// src/app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import { Suspense } from "react";
import { Plus_Jakarta_Sans } from "next/font/google";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SideNav from "@/components/SideNav";
import WidthTuner from "@/components/WidthTuner";
import LayoutVars from "@/components/LayoutVars";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
});

export const metadata: Metadata = {
  title: "M3 Mentor",
  description: "Prüfungsnahe M3-Simulation – Innere, Chirurgie & Wahlfach",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className={jakarta.variable}>
      <body className="bg-[var(--bg)] text-[var(--fg)]">
        {/* Seiten-Layout: Header oben, Footer unten */}
        <div className="flex min-h-screen flex-col">
          <Header />

          {/* Content */}
          <div className="mx-auto w-full max-w-screen-2xl px-6 py-6 flex-1">
            <LayoutVars>
              {/* linke SideNav + Content */}
              <div className="grid grid-cols-1 md:grid-cols-[var(--nav-w)_1fr] gap-4 items-start">
                <SideNav />
                <div>{children}</div>
              </div>
            </LayoutVars>
          </div>

          <div className="mt-auto">
            <Footer />
          </div>

          {/* Alles mit useSearchParams in Suspense wrappen */}
          <Suspense fallback={null}>
            <WidthTuner />
          </Suspense>
        </div>
      </body>
    </html>
  );
}