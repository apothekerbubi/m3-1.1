// src/app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
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
        <div className="flex min-h-screen flex-col">
          <Header />

          <div className="mx-auto w-full max-w-screen-2xl px-6 py-6 flex-1">
            <LayoutVars>
              {/* ⬇️ Grid mit fester Nav-Spalte */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-[var(--nav-w)_1fr] items-start">
                {/* Linke Spalte: Sidebar – sticky, bekommt eigene Spalte */}
                <aside className="hidden md:block">
                  <div className="sticky top-20">
                    <SideNav />
                  </div>
                </aside>

                {/* Rechte Spalte: Seiteninhalt */}
                <div>{children}</div>
              </div>
            </LayoutVars>
          </div>

          <div className="mt-auto">
            <Footer />
          </div>

          <WidthTuner />
        </div>
      </body>
    </html>
  );
}