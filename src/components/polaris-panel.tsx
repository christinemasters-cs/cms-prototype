"use client";

import { useEffect, useId, useState } from "react";
import { Lightbulb, MoreVertical, Send, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

export function PolarisPanel() {
  const [open, setOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<
    Array<{
      id: string;
      role: "user" | "assistant";
      content: string;
      summary?: string;
      toolsUsed?: string[];
    }>
  >([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const panelId = useId();

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  const handleSubmit = async () => {
    if (!input.trim() || loading) {
      return;
    }

    const content = input.trim();
    const userMessage = { id: crypto.randomUUID(), role: "user" as const, content };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/polaris/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          message: content,
        }),
      });

      const data = (await response.json()) as {
        sessionId?: string;
        reply?: string;
        summary?: string;
        toolsUsed?: string[];
        error?: string;
      };

      if (!response.ok || data.error) {
        throw new Error(data.error ?? "Something went wrong.");
      }

      if (data.sessionId) {
        setSessionId(data.sessionId);
      }

      const reply = data.reply ?? "No response.";
      const summary = data.summary ?? "";
      const toolsUsed = data.toolsUsed ?? [];
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: reply,
          summary,
          toolsUsed,
        },
      ]);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to send message.";
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", content: message },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        aria-label="Open Polaris"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((prev) => !prev)}
      >
        <PolarisIcon className="h-8 w-8" />
      </Button>

      {open ? (
        <aside
          id={panelId}
          className="fixed right-4 top-10 z-30 flex h-[calc(100vh-56px)] w-[540px] flex-col rounded-md border border-transparent bg-[color:var(--color-surface)] shadow-[0_0_1.5rem_rgba(0,0,0,0.17)]"
          role="dialog"
          aria-label="Polaris assistant"
          aria-modal="false"
        >
          <div className="flex items-center justify-between border-b border-[color:var(--color-border)] px-5 py-3.5">
            <div className="flex items-center gap-2 text-[15px] font-semibold">
              <PolarisIcon className="h-5 w-5 text-[color:var(--color-brand)]" />
              Polaris
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" aria-label="Polaris options">
                <MoreVertical className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Close Polaris"
                onClick={() => setOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
          <div className="flex flex-1 flex-col overflow-hidden px-8 py-8">
            {messages.length === 0 ? (
              <div className="flex flex-1 flex-col items-center gap-3 text-center">
                <PolarisIcon className="h-[60px] w-[60px] text-[color:var(--color-brand)]" />
                <h3 className="text-[20px] font-semibold text-[color:var(--color-foreground)]">
                  Introducing Polaris
                </h3>
                <div className="max-w-[360px] text-center text-[0.875rem] leading-[1.5] text-[#6b7280]">
                  <span className="font-semibold">
                    A virtual co-worker helping you get more done across Contentstack.
                    <br />
                  </span>{" "}
                  <span className="font-normal">
                    Try asking, &quot;What can you do?&quot;
                  </span>
                </div>
                <Separator className="mt-4 w-full" />
              </div>
            ) : (
              <div className="flex flex-1 flex-col gap-4 overflow-y-auto pr-2">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`rounded-lg border px-4 py-3 text-sm ${
                      message.role === "user"
                        ? "ml-auto max-w-[85%] border-[color:var(--color-brand)] bg-[color:var(--color-brand-soft)] text-[color:var(--color-foreground)]"
                        : "mr-auto max-w-[90%] border-[color:var(--color-border)] bg-white text-[color:var(--color-foreground)]"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    {message.role === "assistant" &&
                    message.toolsUsed &&
                    message.toolsUsed.length > 0 ? (
                      <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-[color:var(--color-muted)]">
                        {message.toolsUsed.map((tool) => (
                          <span
                            key={`${message.id}-${tool}`}
                            className="rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-muted)] px-2 py-0.5"
                          >
                            {tool}
                          </span>
                        ))}
                      </div>
                    ) : null}
                    {message.role === "assistant" && message.summary ? (
                      <div className="mt-3 rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface-muted)] px-3 py-2 text-[12px] text-[color:var(--color-muted)]">
                        {message.summary}
                      </div>
                    ) : null}
                  </div>
                ))}
                {loading ? (
                  <div className="mr-auto max-w-[60%] rounded-lg border border-[color:var(--color-border)] bg-white px-4 py-3 text-sm text-[color:var(--color-muted)]">
                    Thinking...
                  </div>
                ) : null}
              </div>
            )}
          </div>
          <div className="space-y-2 px-5 py-4">
            <form
              className="rounded-md bg-gradient-to-r from-[#6c5ce7] via-[#8b7cf6] to-[#6c5ce7] p-[1px]"
              onSubmit={(event) => {
                event.preventDefault();
                void handleSubmit();
              }}
            >
              <div className="relative rounded-[5px] bg-white">
                <Input
                  placeholder="Describe what you would like to do..."
                  className="h-10 border-0 pr-10 text-[13px] focus-visible:ring-0 focus-visible:ring-offset-0"
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  disabled={loading}
                />
                <Button
                  type="submit"
                  size="icon"
                  variant="ghost"
                  className="absolute right-1 top-1/2 -translate-y-1/2"
                  aria-label="Send message"
                  disabled={loading || !input.trim()}
                >
                  <Send className="h-4 w-4 text-[color:var(--color-muted)]" />
                </Button>
              </div>
            </form>
            <div className="flex items-center justify-between text-[11px] text-[color:var(--color-muted)]">
              <p className="flex items-center gap-1 italic">
                <Lightbulb className="h-3.5 w-3.5 text-[color:var(--color-muted)]" />
                Not sure what to ask?{" "}
                <span className="text-[color:var(--color-brand)]">
                  See what I can do
                </span>
              </p>
              <span>0/2000</span>
            </div>
          </div>
        </aside>
      ) : null}
    </>
  );
}

function PolarisIcon({ className }: { className?: string }) {
  const gradientId = useId();
  const paint0 = `${gradientId}-paint0`;
  const paint1 = `${gradientId}-paint1`;
  const paint2 = `${gradientId}-paint2`;

  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M12.7 6.705c.285-.716 1.315-.716 1.599 0l.026.074 1.026 3.37 3.37 1.026c.815.248.815 1.402 0 1.65l-3.37 1.026-1.026 3.37c-.248.815-1.402.815-1.65 0l-1.027-3.37-3.369-1.026c-.815-.248-.815-1.402 0-1.65l3.37-1.027 1.026-3.369.026-.074zm-.015 3.905a.863.863 0 01-.575.575L9.433 12l2.678.815c.241.073.436.247.537.474l.038.1.815 2.679.815-2.679.037-.1a.863.863 0 01.537-.474L17.568 12l-2.679-.815a.863.863 0 01-.574-.575L13.5 7.933l-.815 2.678z"
        fill={`url(#${paint0})`}
      />
      <path
        d="M7.357 3.433a.15.15 0 01.285 0l.577 1.753a.15.15 0 00.095.095l1.753.576a.15.15 0 010 .285l-1.753.577a.15.15 0 00-.095.095l-.577 1.753a.15.15 0 01-.285 0l-.576-1.753a.15.15 0 00-.095-.095l-1.753-.577a.15.15 0 010-.285l1.753-.576a.15.15 0 00.095-.095l.576-1.753z"
        fill={`url(#${paint1})`}
      />
      <path
        d="M7.357 15.433a.15.15 0 01.285 0l.577 1.753a.15.15 0 00.095.095l1.753.577a.15.15 0 010 .284l-1.753.577a.15.15 0 00-.095.095l-.577 1.753a.15.15 0 01-.285 0l-.576-1.753a.15.15 0 00-.095-.095l-1.753-.577a.15.15 0 010-.284l1.753-.577a.15.15 0 00.095-.095l.576-1.753z"
        fill={`url(#${paint2})`}
      />
      <defs>
        <linearGradient
          id={paint0}
          x1="3.541"
          y1="2.635"
          x2="25.745"
          y2="15.114"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#49A466" />
          <stop offset="0.5" stopColor="#6F83F2" />
          <stop offset="1" stopColor="#8A3DFF" />
        </linearGradient>
        <linearGradient
          id={paint1}
          x1="3.541"
          y1="2.635"
          x2="25.745"
          y2="15.114"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#49A466" />
          <stop offset="0.5" stopColor="#6F83F2" />
          <stop offset="1" stopColor="#8A3DFF" />
        </linearGradient>
        <linearGradient
          id={paint2}
          x1="3.541"
          y1="2.635"
          x2="25.745"
          y2="15.114"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#49A466" />
          <stop offset="0.5" stopColor="#6F83F2" />
          <stop offset="1" stopColor="#8A3DFF" />
        </linearGradient>
      </defs>
    </svg>
  );
}
