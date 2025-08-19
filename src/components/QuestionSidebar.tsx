"use client";

import { useEffect, useRef } from "react";
import type { Step } from "@/lib/types";

type Props = {
  steps: Step[];
  activeOrder: number; // welche Frage aktuell im Chat läuft
};

export default function QuestionSidebar({ steps, activeOrder }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const lastStepRef = useRef<HTMLDivElement | null>(null);

  // scrollt immer zum letzten Step, wenn sich steps ändern
  useEffect(() => {
    if (lastStepRef.current) {
      lastStepRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [steps.length]);

  return (
    <aside
      ref={containerRef}
      className="w-64 border-l border-black/10 bg-white p-3 
                 overflow-y-auto max-h-[calc(100vh-80px)]"
    >
      <h2 className="mb-2 text-sm font-semibold text-gray-700">Fragenübersicht</h2>
      <ol className="space-y-1 text-sm">
        {steps.map((s, idx) => (
          <li
            key={s.order}
            ref={idx === steps.length - 1 ? lastStepRef : null}
            className={`p-2 rounded-md cursor-pointer ${
              s.order === activeOrder
                ? "bg-blue-100 font-medium"
                : "hover:bg-gray-50"
            }`}
          >
            Frage {s.order}
          </li>
        ))}
      </ol>
    </aside>
  );
}