"use client";

import { useEffect, useState } from "react";

function readPxVar(name: string, fallback: number) {
  if (typeof window === "undefined") return fallback;
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name);
  const n = parseInt(String(raw).replace(/[^\d.-]/g, ""), 10);
  return Number.isFinite(n) ? n : fallback;
}
function setPxVar(name: string, val: number) {
  if (typeof window === "undefined") return;
  document.documentElement.style.setProperty(name, `${Math.round(val)}px`);
}

const DEFAULTS = { nav: 220, steps: 320 };

export default function WidthTuner() {
  // 👉 initial nicht von Hooks/URL abhängig machen
  const [open, setOpen] = useState<boolean>(false);
  const [nav, setNav] = useState<number>(DEFAULTS.nav);
  const [steps, setSteps] = useState<number>(DEFAULTS.steps);

  // Initiale Werte erst NACH Mount (client-only) bestimmen
  useEffect(() => {
    const urlHasTuner =
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("tuner") === "1";

    const storedOpen = typeof window !== "undefined" && localStorage.getItem("tunerOpen") === "1";
    const shouldOpen = storedOpen || urlHasTuner || process.env.NODE_ENV !== "production";
    setOpen(shouldOpen);

    const savedNav = Number(localStorage.getItem("tunerNavPx"));
    const savedSteps = Number(localStorage.getItem("tunerStepsPx"));
    const startNav = Number.isFinite(savedNav) ? savedNav : readPxVar("--nav-w", DEFAULTS.nav);
    const startSteps = Number.isFinite(savedSteps) ? savedSteps : readPxVar("--steps-w", DEFAULTS.steps);
    setNav(startNav);
    setSteps(startSteps);
    setPxVar("--nav-w", startNav);
    setPxVar("--steps-w", startSteps);
  }, []);

  useEffect(() => {
    setPxVar("--nav-w", nav);
    if (typeof window !== "undefined") localStorage.setItem("tunerNavPx", String(nav));
  }, [nav]);

  useEffect(() => {
    setPxVar("--steps-w", steps);
    if (typeof window !== "undefined") localStorage.setItem("tunerStepsPx", String(steps));
  }, [steps]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "w") {
        e.preventDefault();
        setOpen((v) => {
          const nv = !v;
          if (typeof window !== "undefined") localStorage.setItem("tunerOpen", nv ? "1" : "0");
          return nv;
        });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const reset = () => {
    setNav(DEFAULTS.nav);
    setSteps(DEFAULTS.steps);
  };

  return (
    <div className="hidden md:block">
      {!open && (
        <button
          onClick={() => {
            setOpen(true);
            if (typeof window !== "undefined") localStorage.setItem("tunerOpen", "1");
          }}
          className="fixed bottom-6 right-6 z-50 rounded-full border border-black/10 bg-white/90 px-3 py-2 text-xs shadow-md hover:shadow-lg"
          title="Layout-Tuner öffnen (⌘/Ctrl + ⇧ + W)"
        >
          Breite anpassen
        </button>
      )}

      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-[320px] rounded-xl border border-black/10 bg-white/95 p-3 shadow-xl backdrop-blur">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-sm font-medium">Layout-Tuner</div>
            <div className="flex items-center gap-2">
              <button
                onClick={reset}
                className="rounded-md border border-black/10 px-2 py-1 text-[11px] hover:bg-black/[.04]"
              >
                Reset
              </button>
              <button
                onClick={() => {
                  setOpen(false);
                  if (typeof window !== "undefined") localStorage.setItem("tunerOpen", "0");
                }}
                className="rounded-md border border-black/10 px-2 py-1 text-[11px] hover:bg-black/[.04]"
              >
                Schließen
              </button>
            </div>
          </div>

          <div className="mb-3">
            <label className="mb-1 block text-[12px] text-gray-700">
              Linke Sidebar — <b>{nav}px</b>
            </label>
            <input
              type="range"
              min={160}
              max={360}
              step={2}
              value={nav}
              onChange={(e) => setNav(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <div className="mb-1">
            <label className="mb-1 block text-[12px] text-gray-700">
              Fragen-Spalte — <b>{steps}px</b>
            </label>
            <input
              type="range"
              min={240}
              max={460}
              step={2}
              value={steps}
              onChange={(e) => setSteps(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <p className="mt-2 text-[11px] text-gray-500">
            Gilt ab <b>md</b> (≥768px). Toggle:{" "}
            <kbd className="rounded border px-1">⌘/Ctrl</kbd>+
            <kbd className="rounded border px-1">⇧</kbd>+
            <kbd className="rounded border px-1">W</kbd>
          </p>
        </div>
      )}
    </div>
  );
}