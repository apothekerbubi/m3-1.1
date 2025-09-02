// src/components/LayoutVars.tsx
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

function setCssVars(vars: Record<string, string>) {
  const root = document.documentElement;
  for (const [k, v] of Object.entries(vars)) {
    root.style.setProperty(k, v);
  }
}

export default function LayoutVars({ children }: Props) {
  useEffect(() => {
    const root = document.documentElement;

    const applyLight = () => {
      // force light mode
      root.classList.remove("dark");
      root.removeAttribute("data-theme");
      root.style.colorScheme = "light";
      setCssVars(LIGHT);
    };

    // initial
    applyLight();

    // if the OS theme changes, re-apply light so the app stays light
    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
    const onChange = () => applyLight();

    if (mq?.addEventListener) mq.addEventListener("change", onChange);
    else if (mq?.addListener) mq.addListener(onChange);

    return () => {
      if (mq?.removeEventListener) mq.removeEventListener("change", onChange);
      else if (mq?.removeListener) mq.removeListener(onChange);
    };
  }, []);

  return <>{children}</>;
}