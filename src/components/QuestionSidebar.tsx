// src/components/QuestionSidebar.tsx
"use client";

import { useEffect, useRef } from "react";
import type { Step } from "@/lib/types";

type Props = {
  steps: Step[];
  activeOrder: number;
  onSelect?: (order: number) => void;
};

export default function QuestionSidebar({ steps, activeOrder, onSelect }: Props) {
  // Container-Ref (DIV) bleibt ein div
  const sidebarRef = useRef<HTMLDivElement | null>(null);

  // Letztes Item: **LI**-Ref
  const lastStepRef = useRef<HTMLLIElement | null>(null);

  // Auto-Scroll: immer zum letzten freigeschalteten Eintrag scrollen
  useEffect(() => {
    lastStepRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [steps.length, activeOrder]);

  return (
    <aside
      ref={sidebarRef}
      className="hidden max-h-[calc(100vh-120px)] overflow-y-auto rounded-xl border border-black/10 bg-white/70 p-3 md:sticky md:top-20 md:block"
    >
      <div className="mb-2 text-xs font-medium text-gray-700">Fragenfolge</div>
      <ul className="space-y-2">
        {steps.map((s, idx) => {
          const isActive = s.order === activeOrder;
          return (
            <li
              key={s.order}
              // 👉 hier der Fix: LI-Ref + undefined statt null
              ref={idx === steps.length - 1 ? lastStepRef : undefined}
              className={`rounded-md p-2 cursor-pointer ${
                isActive ? "bg-blue-100 font-medium" : "bg-white"
              }`}
              onClick={() => onSelect?.(s.order)}
            >
              <div className="flex items-start gap-2">
                <span
                  className={`mt-1 h-2.5 w-2.5 flex-none rounded-full ${
                    isActive ? "bg-blue-500" : "bg-gray-300"
                  }`}
                />
                <span className="text-[13px] leading-snug">{s.prompt}</span>
              </div>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}