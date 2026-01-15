"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  ChevronRight,
  MessageCircle,
  Sparkles,
  UserRound,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PolarisPanel } from "@/components/polaris-panel";

type Agent = {
  id: string;
  projectId: string;
  name: string;
  description: string;
  instructions: string;
  triggers: string[];
  tools: string[];
  active: boolean;
};

const STORAGE_KEY = "automate-agents";

type FlowStep = {
  id: string;
  prompt: string;
  placeholder: string;
  defaultValue?: string;
};

const flowSteps: FlowStep[] = [
  {
    id: "agent-name",
    prompt: "What should we call this agent?",
    placeholder: "e.g. Tweet to Slack Notifier",
  },
  {
    id: "delivery-channel",
    prompt: "Which channel or destination should it send updates to?",
    placeholder: "e.g. #marketing-alerts",
  },
  {
    id: "trigger",
    prompt: "How should the agent be triggered?",
    placeholder: "e.g. HTTP request trigger",
  },
];

export function AgentCreationFlow() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialDescription = searchParams.get("description") ?? "";

  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [inputValue, setInputValue] = useState("");
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    const firstStep = flowSteps[0];
    if (!answers[firstStep.id]) {
      setInputValue(firstStep.defaultValue ?? "");
    }
  }, []);

  const messages = useMemo(() => {
    const items: Array<{ role: "assistant" | "user"; content: string }> = [
      {
        role: "assistant",
        content:
          "Thanks! I’ll set up your agent. I might ask a few questions to refine the behavior.",
      },
      {
        role: "assistant",
        content: `Agent goal: "${initialDescription}"`,
      },
    ];
    flowSteps.forEach((step, index) => {
      if (index < currentStep) {
        items.push({ role: "assistant", content: step.prompt });
        items.push({ role: "user", content: answers[step.id] });
      }
    });
    if (!completed) {
      items.push({
        role: "assistant",
        content: flowSteps[currentStep].prompt,
      });
    }
    return items;
  }, [answers, completed, currentStep, initialDescription]);

  const handleNext = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) {
      return;
    }
    const step = flowSteps[currentStep];
    setAnswers((prev) => ({ ...prev, [step.id]: trimmed }));
    setInputValue("");
    if (currentStep === flowSteps.length - 1) {
      setCompleted(true);
      return;
    }
    setCurrentStep((prev) => prev + 1);
  };

  const handleBuildAgent = () => {
    const agentName = answers["agent-name"] ?? "New Agent";
    const destination = answers["delivery-channel"] ?? "Slack";
    const trigger = answers["trigger"] ?? "HTTP request trigger";
    const instructions = `Goal: ${initialDescription}\n\nSteps:\n1. Receive the request via ${trigger}.\n2. Extract the relevant content.\n3. Format the message for clarity.\n4. Send the formatted message to ${destination} using Send Message.\n\nImportant:\n- Include the original content and any available metadata.`;
    const newAgent: Agent = {
      id: `agent-${Date.now()}`,
      projectId: params.id,
      name: agentName,
      description: initialDescription,
      instructions,
      triggers: [trigger],
      tools: ["Send Message"],
      active: true,
    };
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const parsed = stored ? (JSON.parse(stored) as Agent[]) : [];
    parsed.push(newAgent);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    router.push(`/automations/projects/${params.id}/agents/${newAgent.id}`);
  };

  return (
    <div className="min-h-screen bg-[color:var(--color-background)]">
      <header className="sticky top-0 z-20 border-b border-[color:var(--color-border)] bg-white/95 backdrop-blur">
        <div className="mx-auto flex w-full items-center justify-between px-6 py-3">
          <div className="flex items-center gap-2 text-[14px] font-semibold text-[color:var(--color-foreground)]">
            Create Agent
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            aria-label="Close"
            onClick={() => router.back()}
          >
            <span className="text-[18px]">×</span>
          </Button>
        </div>
      </header>

      <div className="dashboard-shell">
        <main className="mx-auto flex w-full justify-center px-6 py-8">
          <div className="w-full max-w-[760px] space-y-6 rounded-2xl border border-[color:var(--color-border)] bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface-muted)]/40 px-4 py-3 text-[13px] text-[color:var(--color-muted)]">
            <Sparkles className="h-4 w-4 text-[color:var(--color-brand)]" />
            Let’s refine the agent details before we open the builder.
          </div>

          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`flex ${
                  message.role === "assistant" ? "justify-start" : "justify-end"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-xl px-4 py-3 text-[13px] leading-[1.4] ${
                    message.role === "assistant"
                      ? "bg-[color:var(--color-surface-muted)]/60 text-[color:var(--color-foreground)]"
                      : "bg-[color:var(--color-brand)] text-white"
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}
          </div>

          {!completed ? (
            <div className="flex items-center gap-3">
              <Input
                value={inputValue}
                onChange={(event) => setInputValue(event.target.value)}
                placeholder={flowSteps[currentStep].placeholder}
                className="h-10 flex-1 rounded-md border-[color:var(--color-border)] text-[13px]"
              />
              <Button
                onClick={handleNext}
                className="h-10 gap-2 rounded-md bg-[color:var(--color-brand)] px-4 text-[13px] text-white shadow-sm hover:brightness-105"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface-muted)]/30 px-4 py-3">
              <div className="flex items-center gap-2 text-[13px] text-[color:var(--color-muted)]">
                <MessageCircle className="h-4 w-4" />
                Ready to open the agent builder.
              </div>
              <Button
                onClick={handleBuildAgent}
                className="h-9 gap-2 rounded-md bg-[color:var(--color-brand)] px-4 text-[13px] text-white shadow-sm hover:brightness-105"
              >
                Open Builder
                <UserRound className="h-4 w-4" />
              </Button>
            </div>
          )}
          </div>
        </main>
        <aside
          id="polaris-dock"
          className="polaris-rail"
          aria-label="Polaris dock"
        />
      </div>
    </div>
  );
}
