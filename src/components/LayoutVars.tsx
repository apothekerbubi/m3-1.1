// src/components/LayoutVars.tsx
"use client";

import { useEffect } from "react";

type Props = {
  children: React.ReactNode;
};

const LIGHT: Record<string, string> = {
  "--bg": "#ffffff",
  "--fg": "#0f172a",
  "--panel": "#ffffff",
  "--muted": "#475569",
  "--ring": "#60a5fa",
};

const DARK: Record<string, string> = {
  "--bg": "#0c111c",
  "--fg": "#e5e7eb",
  "--panel": "#0f1524",
  "--muted": "#9ca3af",
  "--ring": "#3b82f6",
};

function setCssVars(vars: Record<string, string>) {
  const root = document.documentElement;
  for (const [k, v] of Object.entries(vars)) {
    root.style.setProperty(k, v);
  }
}

export default function LayoutVars({ children }: Props) {
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");

    const applyScheme = () => {
      setCssVars(mq.matches ? DARK : LIGHT);
    };

    // initial
    applyScheme();

    // subscribe (both modern and legacy)
    const onChange = () => applyScheme();
    if ("addEventListener" in mq) {
      mq.addEventListener("change", onChange);
    } else {
      // Fallback für ältere Browser-Typings
      mq.addListener(onChange);
    }

    return () => {
      if ("removeEventListener" in mq) {
        mq.removeEventListener("change", onChange);
      } else {
        mq.removeListener(onChange);
      }
    };
  }, []);

  return <>{children}</>;
}