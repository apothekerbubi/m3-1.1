"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import CaseImagePublic from "@/components/CaseImagePublic";
import { getExamModeCase } from "@/data/exam-mode";
import type { ExamModeCase } from "@/lib/types";
import { createInitialExamModeState, evaluateExamModeInput, type ExamModeState } from "@/lib/exam-mode";
import { buildExamModeSystemPrompt } from "@/lib/exam-mode-prompt";

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

function formatList(items: string[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} und ${items[1]}`;
  const [last, ...restReversed] = items.slice().reverse();
  const rest = restReversed.reverse();
  return `${rest.join(", ")} und ${last}`;
}

export default function ExamModePage() {
  const params = useParams<{ id: string | string[] }>();
  const router = useRouter();
  const rawId = params?.id;
  const caseId = Array.isArray(rawId) ? rawId[0] : rawId || "";
  const caseData = useMemo<ExamModeCase | null>(() => getExamModeCase(caseId), [caseId]);

  const initialPrompt = useMemo(() => {
    if (!caseData) return "";
    const initialState = createInitialExamModeState(caseData);
    return buildExamModeSystemPrompt(caseData, initialState);
  }, [caseData]);

  const [state, setState] = useState<ExamModeState | null>(() =>
    caseData ? createInitialExamModeState(caseData) : null
  );
  const [messages, setMessages] = useState<Message[]>(() => {
    if (!caseData) return [];
    const initialState = createInitialExamModeState(caseData);
    const initialMessages: Message[] = [
      {
        role: "tutor",
        text: caseData.vignette,
      },
    ];
    const firstKey = initialState.activeAction;
    if (firstKey) {
      const firstAction = caseData.actions[firstKey];
      if (firstAction) {
        initialMessages.push({ role: "tutor", text: firstAction.question });
      }
    }
    return initialMessages;
  });
  const [input, setInput] = useState("");
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");

  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!caseData) {
      setState(null);
      setMessages([]);
      return;
    }
    const initialState = createInitialExamModeState(caseData);
    setState(initialState);
    const nextMessages: Message[] = [
      {
        role: "tutor",
        text: caseData.vignette,
      },
    ];
    if (initialState.activeAction) {
      const firstAction = caseData.actions[initialState.activeAction];
      if (firstAction) {
        nextMessages.push({ role: "tutor", text: firstAction.question });
      }
    }
    setMessages(nextMessages);
    setInput("");
  }, [caseData]);

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const disabled = !caseData || !state || state.finished;

  async function handleCopyPrompt() {
    if (!initialPrompt) return;
    if (typeof navigator === "undefined" || !navigator.clipboard) {
      setCopyState("error");
      setTimeout(() => setCopyState("idle"), 2000);
      return;
    }
    try {
      await navigator.clipboard.writeText(initialPrompt);
      setCopyState("copied");
      setTimeout(() => setCopyState("idle"), 2000);
    } catch {
      setCopyState("error");
      setTimeout(() => setCopyState("idle"), 2000);
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!caseData || !state) return;
    const trimmed = input.trim();
    if (!trimmed) return;

    const previousState = state;
    const { evaluation, nextState } = evaluateExamModeInput(caseData, state, trimmed);
    setState(nextState);
    setInput("");

    setMessages((prev) => {
      const base: Message[] = [...prev, { role: "student", text: trimmed }];

      if (evaluation.kind === "success") {
        const hitsText = evaluation.hits.length
          ? `Gute Punkte: ${formatList(evaluation.hits)}.`
          : "Danke für Ihre Antwort.";
        const tutorText = `${hitsText} ${evaluation.action.response}`.trim();

        const followUps: Message[] = [
          {
            role: "tutor",
            text: tutorText,
            image: evaluation.action.image,
          },
        ];

        if (evaluation.finished && caseData.completionMessage) {
          followUps.push({ role: "tutor", text: caseData.completionMessage });
        } else if (!evaluation.finished && nextState.activeAction && nextState.activeAction !== previousState?.activeAction) {
          const nextAction = caseData.actions[nextState.activeAction];
          if (nextAction) {
            followUps.push({ role: "tutor", text: nextAction.question });
          }
        }

        return [...base, ...followUps];
      }

      if (evaluation.kind === "needs_more") {
        const hitsText = evaluation.hits.length
          ? `Sie nannten bereits: ${formatList(evaluation.hits)}. `
          : "";
        const baseText = caseData.needsMoreMessage || "Bitte ergänzen Sie Ihre Antwort.";
        const hintText = evaluation.action.hint ? ` Hinweis: ${evaluation.action.hint}.` : "";
        const reminder = ` ${evaluation.action.question}`;

        const tutorText = `${hitsText}${baseText}${hintText}${reminder}`.trim();

        return [...base, { role: "tutor", text: tutorText }];
      }

      const fallback = caseData.unknownMessage || "Ich habe Sie nicht verstanden. Bitte antworten Sie auf die aktuelle Frage.";
      return [...base, { role: "tutor", text: fallback }];
    });
  }

  function handleReset() {
    if (!caseData) return;
    const initialState = createInitialExamModeState(caseData);
    setState(initialState);
    const resetMessages: Message[] = [
      {
        role: "tutor",
        text: caseData.vignette,
      },
    ];
    if (initialState.activeAction) {
      const firstAction = caseData.actions[initialState.activeAction];
      if (firstAction) {
        resetMessages.push({ role: "tutor", text: firstAction.question });
      }
    }
    setMessages(resetMessages);
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

      {initialPrompt && (
        <details className="mb-4 space-y-3 rounded-xl border border-black/10 bg-gray-50/80 p-4 text-sm text-gray-700">
          <summary className="cursor-pointer select-none text-sm font-semibold text-gray-900">
            System-Prompt für diesen Fall anzeigen
          </summary>
          <p>
            Dieser Prompt fasst alle Regeln des neuen Prüfungsmodus zusammen und eignet sich, um den Fall direkt mit einem LLM
            zu simulieren.
          </p>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleCopyPrompt}
              className="inline-flex items-center gap-2 rounded-md border border-black/10 bg-white px-3 py-1 text-xs font-medium text-gray-700 shadow-sm transition hover:bg-black/[.04]"
            >
              {copyState === "copied"
                ? "Kopiert!"
                : copyState === "error"
                ? "Konnte nicht kopiert werden"
                : "In Zwischenablage kopieren"}
            </button>
          </div>
          <pre className="max-h-64 overflow-y-auto whitespace-pre-wrap rounded-lg border border-black/10 bg-white p-3 text-xs text-gray-800">
            {initialPrompt}
          </pre>
        </details>
      )}

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
