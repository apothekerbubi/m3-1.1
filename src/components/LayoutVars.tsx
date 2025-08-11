"use client";

import { useEffect } from "react";

type Props = { children: React.ReactNode };

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
  for (const [k, v] of Object.entries(vars)) root.style.setProperty(k, v);
}

// Extend MediaQueryList with optional legacy methods
type MQWithDeprecated = MediaQueryList & {
  addListener?: (listener: (ev: MediaQueryListEvent) => void) => void;
  removeListener?: (listener: (ev: MediaQueryListEvent) => void) => void;
};

export default function LayoutVars({ children }: Props) {
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)") as MQWithDeprecated;

    const applyScheme = () => setCssVars(mq.matches ? DARK : LIGHT);

    // initial
    applyScheme();

    // subscribe (modern first, legacy fallback)
    const onChange = (_e: MediaQueryListEvent) => applyScheme();

    if (typeof mq.addEventListener === "function") {
      mq.addEventListener("change", onChange);
    } else if (typeof mq.addListener === "function") {
      mq.addListener(onChange);
    }

    return () => {
      if (typeof mq.removeEventListener === "function") {
        mq.removeEventListener("change", onChange);
      } else if (typeof mq.removeListener === "function") {
        mq.removeListener(onChange);
      }
    };
  }, []);

  return <>{children}</>;
}