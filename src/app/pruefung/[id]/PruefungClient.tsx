"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import CaseImagePublic from "@/components/CaseImagePublic";
import { InteractiveCaseEngine } from "@/lib/interactive-engine";
import type { Case, StepImage } from "@/lib/types";

type Message = {
  role: "tutor" | "student";
  text: string;
  image?: StepImage;
};

type Props = {
  caseData: Case;
};

export default function PruefungClient({ caseData }: Props) {
  const interactive = caseData.interactive;
  const [engine] = useState(() => (interactive ? new InteractiveCaseEngine(caseData) : null));

  const [messages, setMessages] = useState<Message[]>(() => {
    const introMessages: Message[] = [];
    introMessages.push({ role: "tutor", text: caseData.vignette });
    const intro = interactive?.intro;
    if (intro) {
      introMessages.push({ role: "tutor", text: intro });
    }
    return introMessages;
  });

  const [input, setInput] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const listRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const available = Boolean(interactive && engine);

  const tutorFallbacks = useMemo(
    () => ({
      locked: interactive?.fallbacks?.locked || "Diese Maßnahme steht noch nicht zur Verfügung.",
      unknown: interactive?.fallbacks?.unknown || "Ich habe das nicht verstanden. Welche Maßnahme planen Sie?",
      finished: interactive?.fallbacks?.finished || "Der Fall ist bereits abgeschlossen.",
    }),
    [interactive]
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || !available || !engine) return;

    setStatusMessage(null);
    setMessages((prev) => [...prev, { role: "student", text: trimmed }]);
    setInput("");

    const result = engine.handleInput(trimmed);

    if (result.type === "success") {
      setMessages((prev) => {
        const next: Message[] = [...prev, { role: "tutor", text: result.response, image: result.image }];
        if (result.finished && result.completionMessage) {
          next.push({ role: "tutor", text: result.completionMessage });
        }
        return next;
      });
      return;
    }

    if (result.type === "finished") {
      setMessages((prev) => [...prev, { role: "tutor", text: result.message || tutorFallbacks.finished }]);
      return;
    }

    if (result.type === "locked") {
      setMessages((prev) => [...prev, { role: "tutor", text: result.message || tutorFallbacks.locked }]);
      return;
    }

    setMessages((prev) => [...prev, { role: "tutor", text: result.message || tutorFallbacks.unknown }]);
  }

  return (
    <div className="flex h-full flex-col gap-6">
      <header className="space-y-1">
        <div className="text-sm text-gray-500">
          <Link href="/pruefung" className="text-brand-700 hover:text-brand-800">
            Zur Fallauswahl
          </Link>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">{caseData.title}</h1>
        <p className="text-sm text-gray-600">
          {caseData.specialty} {caseData.subspecialty ? `- ${caseData.subspecialty}` : ""}
        </p>
      </header>

      {!available ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Für diesen Fall ist noch kein Prüfungsmodus hinterlegt.
        </div>
      ) : (
        <>
          <section
            ref={listRef}
            className="flex-1 space-y-4 overflow-y-auto rounded-2xl border border-black/10 bg-white/80 p-4 shadow-sm"
          >
            {messages.map((msg, idx) => (
              <article key={idx} className="space-y-3">
                <p
                  className={
                    msg.role === "student"
                      ? "ml-auto max-w-[85%] rounded-2xl bg-brand-700 px-4 py-2 text-sm text-white shadow"
                      : "max-w-[85%] rounded-2xl bg-gray-100 px-4 py-2 text-sm text-gray-900 shadow"
                  }
                >
                  {msg.text}
                </p>
                {msg.image && msg.role === "tutor" && (
                  <div className="max-w-xl">
                    <CaseImagePublic path={msg.image.path} alt={msg.image.alt} caption={msg.image.caption} />
                  </div>
                )}
              </article>
            ))}
          </section>

          <form onSubmit={onSubmit} className="space-y-3">
            {statusMessage && <p className="text-sm text-red-600">{statusMessage}</p>}
            <label className="block text-sm font-medium text-gray-700" htmlFor="student-input">
              Ihre nächste Maßnahme
            </label>
            <textarea
              id="student-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={3}
              className="w-full resize-none rounded-xl border border-black/10 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-200"
              placeholder={'z. B. "Anamnese erheben" oder "grosslumige Zugange legen"'}
            />
            <div className="flex justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  if (!engine) return;
                  engine.reset();
                  setMessages(() => {
                    const introMessages: Message[] = [];
                    introMessages.push({ role: "tutor", text: caseData.vignette });
                    const intro = interactive?.intro;
                    if (intro) {
                      introMessages.push({ role: "tutor", text: intro });
                    }
                    return introMessages;
                  });
                  setStatusMessage(null);
                }}
                className="rounded-lg border border-black/10 px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
              >
                Fall zurücksetzen
              </button>
              <button
                type="submit"
                className="inline-flex items-center rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
              >
                Antwort senden
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}
