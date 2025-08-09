async function callExamAPI(current: Turn[]) {
  setLoading(true);
  try {
    const res = await fetch("/api/exam/turn", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ caseText: c.vignette, transcript: current })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error || `HTTP ${res.status}`);
    }

    const data: ApiReply = await res.json();
    const nextT = [...current];

    if (data.evaluation) {
      const parts = [
        `${label(data.evaluation.correctness)} — ${data.evaluation.feedback}`,
        data.evaluation.tips ? `Tipp: ${data.evaluation.tips}` : ""
      ].filter(Boolean);
      nextT.push({ role: "prof", text: parts.join(" ") });
    }
    if (data.say_to_student?.trim()) nextT.push({ role: "prof", text: data.say_to_student });
    if (data.next_question?.trim()) nextT.push({ role: "prof", text: data.next_question });

    setTranscript(nextT);
    setEnded(Boolean(data.end));
  } catch (e: any) {
    alert(e?.message || "Unbekannter Fehler");
  } finally {
    setLoading(false);
  }
}