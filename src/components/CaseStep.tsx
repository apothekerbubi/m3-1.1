// src/components/CaseStep.tsx
"use client";

import type { Step } from "@/lib/types";
import CaseImagePublic from "@/components/CaseImagePublic";

export default function CaseStep({ step }: { step: Step }) {
  return (
    <section className="mb-6">
      <h3 className="font-semibold">Frage {step.order}</h3>
      <p>{step.prompt}</p>

      {/* falls ein Bild definiert ist → CaseImagePublic nutzen */}
      {step.image && (
        <CaseImagePublic
          path={step.image.path}
          alt={step.image.alt}
          caption={step.image.caption}
        />
      )}

      {step.hint && (
        <p className="mt-2 text-sm text-gray-500">Hinweis: {step.hint}</p>
      )}
    </section>
  );
}