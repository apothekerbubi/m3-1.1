"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import CaseImagePublic from "@/components/CaseImagePublic";
import { getExamModeCase } from "@/data/exam-mode";
import type { ExamModeCase } from "@/lib/types";
import {
  createInitialExamModeState,
  evaluateExamModeInput,
  type ExamModeEvaluation,
  type ExamModeState,
} from "@/lib/exam-mode";

type Message = {
  role: "tutor" | "student";
  text: string;
  image?: ExamModeCase["actions"][string]["image"];
};

function MessageBubble({ message }: { message: Message }) {
  const isStudent = message.role === "student";
  const alignment = isStudent ? "items-end" : "items-start";
  const bubbleClass = isStudent
    ? "self-end rounded-2xl rounded-br-sm bg-blue-600 text-white"
    : "self-start rounded-2xl rounded-bl-sm bg-gray-100 text-gray-900";

  return (
    <div className={`flex flex-col ${alignment} gap-2`}>
      <div className={`${bubbleClass} max-w-[85%] px-4 py-3 text-sm shadow-sm`}>{message.text}</div>
      {message.image && (
        <figure className="max-w-[85%] overflow-hidden rounded-xl border border-black/10 bg-white">
          <CaseImagePublic
            path={message.image.path}
            alt={message.image.alt}
            caption={message.image.caption}
            zoomable
          />
          {message.image.caption && (
            <figcaption className="border-t border-black/10 bg-gray-50 px-3 py-2 text-xs text-gray-600">
              {message.image.caption}
            </figcaption>
          )}
        </figure>
      )}
    </div>
  );
}

function defaultText(kind: ExamModeEvaluation["kind"], caseData: ExamModeCase, actionKey?: string): string {
  switch (kind) {
    case "locked":
      return caseData.lockedMessage || "Diese Maßnahme ist im Moment nicht verfügbar.";
    case "unknown":
      return caseData.unknownMessage || "Ich habe Sie nicht verstanden. Bitte formulieren Sie Ihre Maßnahme genauer.";
    case "repeat":
      if (actionKey) {
        const action = caseData.actions[actionKey];
        if (action?.repeatResponse) return action.repeatResponse;
      }
      return caseData.repeatMessage || "Dieser Schritt wurde bereits durchgeführt.";
    default:
      return "";
  }
}

export default function ExamModePage() {
  const params = useParams<{ id: string | string[] }>();
  const router = useRouter();
  const rawId = params?.id;
  const caseId = Array.isArray(rawId) ? rawId[0] : rawId || "";
  const caseData = useMemo<ExamModeCase | null>(() => getExamModeCase(caseId), [caseId]);

  const [state, setState] = useState<ExamModeState | null>(() =>
    caseData ? createInitialExamModeState(caseData) : null
  );
  const [messages, setMessages] = useState<Message[]>(() =>
    caseData
      ? [
          {
            role: "tutor",
            text: `${caseData.vignette} Wie gehen Sie vor?`,
          },
        ]
      : []
  );
  const [input, setInput] = useState("");

  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!caseData) {
      setState(null);
      setMessages([]);
      return;
    }
    setState(createInitialExamModeState(caseData));
    setMessages([
      {
        role: "tutor",
        text: `${caseData.vignette} Wie gehen Sie vor?`,
      },
    ]);
    setInput("");
  }, [caseData]);

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const disabled = !caseData || !state || state.finished;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!caseData || !state) return;
    const trimmed = input.trim();
    if (!trimmed) return;

    const { evaluation, nextState } = evaluateExamModeInput(caseData, state, trimmed);
    setState(nextState);
    setInput("");

    setMessages((prev) => {
      const base: Message[] = [...prev, { role: "student", text: trimmed }];

      if (evaluation.kind === "success") {
        const followUps: Message[] = [
          {
            role: "tutor",
            text: evaluation.action.response,
            image: evaluation.action.image,
          },
        ];
        if (evaluation.finished && caseData.completionMessage) {
          followUps.push({ role: "tutor", text: caseData.completionMessage });
        }
        return [...base, ...followUps];
      }

      const text = defaultText(evaluation.kind, caseData, "actionKey" in evaluation ? evaluation.actionKey : undefined);
      return [...base, { role: "tutor", text }];
    });
  }

  function handleReset() {
    if (!caseData) return;
    setState(createInitialExamModeState(caseData));
    setMessages([
      {
        role: "tutor",
        text: `${caseData.vignette} Wie gehen Sie vor?`,
      },
    ]);
    setInput("");
  }

  if (!caseData) {
    return (
      <main className="mx-auto max-w-3xl p-6">
        <h1 className="mb-3 text-2xl font-semibold tracking-tight">Prüfungsmodus</h1>
        <p className="mb-4 text-sm text-gray-600">
          Für diesen Fall steht der neue Prüfungsmodus noch nicht zur Verfügung.
        </p>
        <div className="flex gap-2">
          <Link
            href="/subjects"
            className="rounded-md border border-black/10 bg-white px-3 py-1.5 text-sm hover:bg-black/[.04]"
          >
            Zur Fallübersicht
          </Link>
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-md border border-black/10 bg-white px-3 py-1.5 text-sm hover:bg-black/[.04]"
          >
            Zurück
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col p-6">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{caseData.title}</h1>
          <p className="text-sm text-gray-600">Interaktiver Prüfungsmodus</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/cases/${caseData.id}`}
            className="inline-flex items-center rounded-md border border-black/10 bg-white px-3 py-1.5 text-sm hover:bg-black/[.04]"
          >
            Fallbeschreibung
          </Link>
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center rounded-md border border-black/10 bg-white px-3 py-1.5 text-sm hover:bg-black/[.04]"
          >
            Neu starten
          </button>
        </div>
      </header>

      <section
        ref={listRef}
        className="mb-4 flex max-h-[65vh] flex-1 flex-col gap-4 overflow-y-auto rounded-2xl border border-black/10 bg-white/80 p-4"
      >
        {messages.map((m, idx) => (
          <MessageBubble key={idx} message={m} />
        ))}
        {state?.finished && (
          <div className="self-start text-xs text-emerald-600">
            Fall abgeschlossen – Sie können den Verlauf jederzeit neu starten.
          </div>
        )}
      </section>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Beschreiben Sie Ihre nächste Maßnahme"
          className="h-11 flex-1 rounded-md border border-black/10 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={disabled}
        />
        <button
          type="submit"
          className="h-11 rounded-md bg-blue-600 px-5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
          disabled={disabled}
        >
          Senden
        </button>
      </form>
    </main>
  );
}
