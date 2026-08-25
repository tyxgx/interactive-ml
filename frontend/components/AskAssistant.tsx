"use client";

import { FormEvent, useState } from "react";
import { MessageCircleQuestion, Send, Loader2, ChevronUp } from "lucide-react";
import { API_BASE } from "@/lib/api";
import { card, input, button } from "@/lib/ui";

type QaEntry = {
  id: number;
  question: string;
  answer?: string;
  sources?: string[];
  error?: string;
};

type AskAssistantProps = {
  sessionId: string | null;
};

const NOT_CONFIGURED_MESSAGE = "Assistant not available right now.";

export default function AskAssistant({ sessionId }: AskAssistantProps) {
  const [expanded, setExpanded] = useState(false);
  const [question, setQuestion] = useState("");
  const [qaList, setQaList] = useState<QaEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = question.trim();
    if (!trimmed || loading) return;

    setLoading(true);
    setQuestion("");

    try {
      const response = await fetch(`${API_BASE}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: trimmed, session_id: sessionId }),
      });
      const data = await response.json();

      setQaList((prev) => [
        ...prev,
        {
          id: Date.now(),
          question: trimmed,
          answer: data.answer,
          sources: data.sources,
          error: data.error,
        },
      ]);
    } catch {
      setQaList((prev) => [
        ...prev,
        {
          id: Date.now(),
          question: trimmed,
          error: "Something went wrong reaching the assistant.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className={`self-start ${button.secondary}`}
      >
        {expanded ? (
          <ChevronUp className="w-4 h-4" strokeWidth={2.5} />
        ) : (
          <MessageCircleQuestion className="w-4 h-4" strokeWidth={2} />
        )}
        {expanded ? "Hide Assistant" : "Ask about this pipeline"}
      </button>

      {expanded && (
        <div className={`${card} p-4 flex flex-col gap-3 transition-all duration-200`}>
          <div className="flex flex-col gap-4 max-h-72 overflow-y-auto">
            {qaList.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Ask a question about ML concepts or this pipeline, e.g. &quot;what
                is overfitting?&quot;
              </p>
            )}
            {qaList.map((qa) => (
              <div key={qa.id} className="flex flex-col gap-1">
                <p className="text-sm font-medium text-foreground">
                  Q: {qa.question}
                </p>
                {qa.error ? (
                  <p className="text-sm text-muted-foreground">
                    {qa.error === "RAG assistant not configured"
                      ? NOT_CONFIGURED_MESSAGE
                      : qa.error}
                  </p>
                ) : (
                  <>
                    <p className="text-sm text-foreground/90">{qa.answer}</p>
                    {qa.sources && qa.sources.length > 0 && (
                      <p className="text-xs font-mono text-muted-foreground">
                        Sources: {qa.sources.join(", ")}
                      </p>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Ask a question..."
              className={`flex-1 ${input}`}
            />
            <button
              type="submit"
              disabled={loading || !question.trim()}
              className={button.sm}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.5} />
              ) : (
                <Send className="w-4 h-4" strokeWidth={2.5} />
              )}
              {loading ? "Asking..." : "Ask"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
