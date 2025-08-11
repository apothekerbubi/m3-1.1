// src/components/LayoutVars.tsx
"use client";

import React from "react";

export default function LayoutVars({ children }: { children: React.ReactNode }) {
  // Hier ggf. später Dark-Mode einbauen. Jetzt nur sichere Light-Werte:
  return (
    <div
      style={{
        // Layout
        // nav & steps optional: werden von WidthTuner überschrieben
        // @ts-ignore CSS vars
        ["--nav-w" as any]: "220px",
        ["--steps-w" as any]: "320px",

        // Farben
        ["--bg" as any]: "#f7f9fc",
        ["--fg" as any]: "#0f172a",
        ["--panel" as any]: "#ffffff",
        ["--muted" as any]: "#475569",
        ["--ring" as any]: "#60a5fa",
      }}
    >
      {children}
    </div>
  );
}