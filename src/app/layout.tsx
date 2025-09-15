// src/app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SideNav from "@/components/SideNav";
import LayoutVars from "@/components/LayoutVars";
import { Suspense } from "react";
import GlobalSkeleton from "@/components/GlobalSkeleton";

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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className={jakarta.variable}>
      <body className="bg-[var(--bg)] text-[var(--fg)]">
        <LayoutVars>
           <div id="app-shell" className="flex min-h-screen flex-col">
            <Header />

            <div className="mx-auto w-full max-w-screen-2xl px-6 py-6 flex-1">
              {/* Grid mit fixer Sidebar */}
              <div
                id="app-layout"
                className="grid grid-cols-1 gap-4 md:grid-cols-[var(--nav-w)_1fr] items-start"
              >
                {/* Sidebar links */}
                 <aside id="app-sidenav-container" className="hidden md:block">
                  <div className="sticky top-20">
                    <SideNav />
                  </div>
                </aside>

                {/* Seiteninhalt rechts mit Suspense */}
                <div>
                  <Suspense fallback={<GlobalSkeleton />}>
                    {children}
                  </Suspense>
                </div>
              </div>
            </div>

            <div className="mt-auto">
              <Footer />
            </div>
          </div>
        </LayoutVars>
      </body>
    </html>
  );
}