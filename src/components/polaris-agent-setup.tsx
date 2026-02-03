"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, FlaskConical, MessageCircle, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FloatingCallout } from "@/components/floating-callout";
import {
  buildPlan,
  installGroups,
  type InstallTemplate,
} from "@/lib/agent-planning";

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

type AgentPayload = Omit<Agent, "id">;

type FlowStep = {
  id: string;
  prompt: string;
  placeholder: string;
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

type PolarisAgentSetupProps = {
  projectId?: string;
  description?: string;
  expanded?: boolean;
  onDone?: () => void;
};

const getSuggestionChips = (stepId: string, description: string) => {
  const lower = description.toLowerCase();
  const wantsSlack = lower.includes("slack");
  const wantsBrand =
    lower.includes("brand") || lower.includes("voice") || lower.includes("tone");
  const wantsEmail = lower.includes("email") || lower.includes("inbox");
  const wantsSchedule =
    lower.includes("schedule") || lower.includes("daily") || lower.includes("weekly");
  const wantsWebhook =
    lower.includes("webhook") || lower.includes("http") || lower.includes("api");

  if (stepId === "agent-name") {
    if (wantsSlack) {
      return ["Slack Communicator", "Slack Alerts", "Slack Pulse"];
    }
    if (wantsBrand) {
      return ["Brand Guardian", "Voice Keeper", "Tone Guide"];
    }
    if (wantsEmail) {
      return ["Inbox Concierge", "Email Triage", "Mail Digest"];
    }
    return ["Ops Companion", "Workflow Helper", "Task Concierge"];
  }

  if (stepId === "delivery-channel") {
    if (wantsSlack) {
      return ["#alerts", "#ops", "#marketing-updates"];
    }
    if (wantsEmail) {
      return ["ops@company.com", "support@company.com", "marketing@company.com"];
    }
    return ["Dashboard", "Slack channel", "Email digest"];
  }

  if (stepId === "trigger") {
    if (wantsWebhook) {
      return ["Webhook trigger", "HTTP request trigger", "Event API trigger"];
    }
    if (wantsSchedule) {
      return ["Scheduled trigger", "Cron trigger", "Time-based trigger"];
    }
    if (wantsEmail) {
      return ["Inbound email trigger", "Webhook trigger", "Manual trigger"];
    }
    return ["HTTP request trigger", "Scheduled trigger", "Webhook trigger"];
  }

  return [];
};

const nameCallout = {
  title: "Name required",
  body: "Give the agent a name to start the build.",
};

const destinationCallout = {
  title: "Destination",
  body: "Which channel should we send updates to?",
};

const triggerCallout = {
  title: "Trigger",
  body: "How should the agent start?",
};


export function PolarisAgentSetup({
  projectId,
  description = "",
  expanded = false,
  onDone,
}: PolarisAgentSetupProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [inputValue, setInputValue] = useState("");
  const [completed, setCompleted] = useState(false);
  const [selectedChip, setSelectedChip] = useState<string | null>(null);
  const [testingToolId, setTestingToolId] = useState<string | null>(null);
  const [passedTools, setPassedTools] = useState<Set<string>>(() => new Set());
  const [triggerStatus, setTriggerStatus] = useState<"idle" | "testing" | "done">(
    "idle"
  );
  const [toolTestIndex, setToolTestIndex] = useState(0);
  const [toolsComplete, setToolsComplete] = useState(false);
  const testTimeoutRef = useRef<number | null>(null);
  const toolTestTimeoutRef = useRef<number | null>(null);
  const triggerStatusRef = useRef(triggerStatus);
  const pendingStepId = completed ? null : flowSteps[currentStep]?.id ?? null;
  const nameAnchorRef = useRef<HTMLDivElement | null>(null);
  const detailsAnchorRef = useRef<HTMLDivElement | null>(null);
  const triggerAnchorRef = useRef<HTMLDivElement | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  const messages = useMemo(() => {
    const items: Array<{
      role: "assistant" | "user";
      content: string;
      chips?: string[];
    }> = [
      {
        role: "assistant",
        content:
          "Thanks! I’ll set up your agent. I might ask a few questions to refine the behavior.",
      },
      {
        role: "assistant",
        content: `Agent goal: "${description}"`,
      },
    ];
    flowSteps.forEach((step, index) => {
      if (index < currentStep) {
        items.push({
          role: "assistant",
          content: step.prompt,
          chips: getSuggestionChips(step.id, description),
        });
        items.push({ role: "user", content: answers[step.id] });
      }
    });
    if (!completed) {
      items.push({
        role: "assistant",
        content: flowSteps[currentStep].prompt,
        chips: getSuggestionChips(flowSteps[currentStep].id, description),
      });
    }
    return items;
  }, [answers, completed, currentStep, description]);

  const handleNext = (value?: string) => {
    const trimmed = (value ?? inputValue).trim();
    if (!trimmed) {
      return;
    }
    const step = flowSteps[currentStep];
    setAnswers((prev) => ({ ...prev, [step.id]: trimmed }));
    setInputValue("");
    setSelectedChip(null);
    if (currentStep === flowSteps.length - 1) {
      setCompleted(true);
      return;
    }
    setCurrentStep((prev) => prev + 1);
  };

  const handleCalloutSubmit = () => {
    handleNext(inputValue);
  };

  const handleSuggestionPick = (value: string) => {
    setInputValue(value);
    handleNext(value);
  };

  const createAgent = async (payload: AgentPayload) => {
    const response = await fetch("/api/agents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await response.json()) as
      | { ok: true; item: Agent }
      | { ok: false; error: string };
    if (!data.ok) {
      throw new Error(data.error);
    }
    return data.item;
  };

  const handleBuildAgent = async () => {
    if (!projectId) {
      return;
    }
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem("handoff-loading", "true");
      window.dispatchEvent(new Event("handoff:show"));
    }
    setSubmissionError(null);
      const agentName = answers["agent-name"] ?? "New Agent";
      const destination = answers["delivery-channel"] ?? "Default destination";
      const trigger = answers["trigger"] ?? "Manual trigger";
      const buildPlanResult = buildPlan({ description, answers });
      const planTools = buildPlanResult.nodes
        .filter((node) => node.kind === "tool")
        .map((node) => node.title);
      const instructions = `Goal: ${description}\n\nSteps:\n1. Receive the request via ${trigger}.\n2. Extract the relevant content.\n3. Format the message for clarity.\n4. Send the formatted message to ${destination} using Send Message.\n\nImportant:\n- Include the original content and any available metadata.`;
    try {
      const created = await createAgent({
        projectId,
        name: agentName,
        description,
        instructions,
        triggers: [trigger],
        tools: planTools.length > 0 ? planTools : ["Agent Core"],
        active: true,
      });
      const handoffPlan = buildPlan({
        description,
        answers,
        tools: planTools.length > 0 ? planTools : ["Agent Core"],
      });
      const testedToolIds = handoffPlan.nodes
        .filter((node) => node.kind === "tool")
        .map((node) => node.id);
      const testedToolTitles = handoffPlan.nodes
        .filter((node) => node.kind === "tool")
        .map((node) => node.title);
      window.sessionStorage.setItem(
        "polaris-handoff",
        JSON.stringify({
          agentId: created.id,
          ts: Date.now(),
          triggerStatus: triggerStatus === "done" ? "done" : "idle",
          toolsPassed:
            toolsComplete || passedTools.size > 0
              ? Array.from(passedTools.size > 0 ? passedTools : new Set(testedToolIds))
              : [],
          toolsPassedTitles: testedToolTitles,
          plan: handoffPlan,
        })
      );
      onDone?.();
      router.push(`/automations/projects/${projectId}/agents/${created.id}`);
    } catch (error) {
      setSubmissionError(
        error instanceof Error ? error.message : "Failed to create agent."
      );
    }
  };

  const handleQuickInstall = async (template: InstallTemplate) => {
    if (!projectId) {
      return;
    }
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem("handoff-loading", "true");
      window.dispatchEvent(new Event("handoff:show"));
    }
    setSubmissionError(null);
    const instructions = `Goal: ${template.summary}\n\nSteps:\n1. Receive the request via ${template.trigger}.\n2. Extract the relevant content.\n3. Format the message for clarity.\n4. Send the formatted message to ${template.defaultDestination} using ${template.tools[0]}.\n\nImportant:\n- Include the original content and any available metadata.`;
    try {
      const created = await createAgent({
        projectId,
        name: template.name,
        description: template.summary,
        instructions,
        triggers: [template.trigger],
        tools: template.tools,
        active: true,
      });
      const handoffPlan = buildPlan({
        description: template.summary,
        answers: {
          trigger: template.trigger,
          "delivery-channel": template.defaultDestination,
        },
        tools: template.tools,
      });
      const testedToolIds = handoffPlan.nodes
        .filter((node) => node.kind === "tool")
        .map((node) => node.id);
      const testedToolTitles = handoffPlan.nodes
        .filter((node) => node.kind === "tool")
        .map((node) => node.title);
      window.sessionStorage.setItem(
        "polaris-handoff",
        JSON.stringify({
          agentId: created.id,
          ts: Date.now(),
          triggerStatus: "done",
          toolsPassed: testedToolIds,
          toolsPassedTitles: testedToolTitles,
          plan: handoffPlan,
        })
      );
      onDone?.();
      router.push(`/automations/projects/${projectId}/agents/${created.id}`);
    } catch (error) {
      setSubmissionError(
        error instanceof Error ? error.message : "Failed to create agent."
      );
    }
  };

  useEffect(() => {
    return () => {
      if (testTimeoutRef.current) {
        window.clearTimeout(testTimeoutRef.current);
      }
      if (toolTestTimeoutRef.current) {
        window.clearTimeout(toolTestTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    triggerStatusRef.current = triggerStatus;
  }, [triggerStatus]);

  useEffect(() => {
    setTriggerStatus("idle");
    setToolTestIndex(0);
    setToolsComplete(false);
    setTestingToolId(null);
    setPassedTools(new Set());
  }, [answers["trigger"]]);

  useEffect(() => {
    if (!expanded || !answers["trigger"] || triggerStatusRef.current !== "idle") {
      return;
    }
    setTriggerStatus("testing");
    const timeoutId = window.setTimeout(() => {
      setTriggerStatus("done");
    }, 1400);
    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [answers["trigger"], expanded]);

  const handleTestTool = (toolId: string) => {
    if (testTimeoutRef.current) {
      window.clearTimeout(testTimeoutRef.current);
    }
    setTestingToolId(toolId);
    setPassedTools((prev) => {
      const next = new Set(prev);
      next.delete(toolId);
      return next;
    });
    testTimeoutRef.current = window.setTimeout(() => {
      setPassedTools((prev) => new Set(prev).add(toolId));
      setTestingToolId(null);
    }, 1200);
  };

  const plan = useMemo(
    () => buildPlan({ description, answers }),
    [answers, description]
  );
  const triggerNode = plan.nodes.find((node) => node.kind === "trigger");
  const toolNodes = plan.nodes.filter((node) => node.kind === "tool");
  const visibleTools = useMemo(() => toolNodes.slice(0, 4), [toolNodes]);
  const extraToolsCount = Math.max(0, toolNodes.length - visibleTools.length);
  const actionNode = plan.nodes.find((node) => node.kind === "action");
  const showWorkflow = expanded;
  const hasAgentName = Boolean(answers["agent-name"]);
  const showTrigger = Boolean(answers["trigger"]) || pendingStepId === "trigger";
  const showTools = triggerStatus !== "idle";
  const toolsTesting = triggerStatus === "done" && !toolsComplete;
  const toolsDone = toolsComplete;
  const buildReady = triggerStatus === "done" && toolsComplete;

  useEffect(() => {
    if (!expanded || triggerStatus !== "done") {
      return;
    }
    if (visibleTools.length === 0) {
      setToolsComplete(true);
      return;
    }
    if (toolTestIndex >= visibleTools.length) {
      setToolsComplete(true);
      return;
    }
    const currentTool = visibleTools[toolTestIndex];
    if (!currentTool) {
      setToolsComplete(true);
      return;
    }
    setTestingToolId(currentTool.id);
    toolTestTimeoutRef.current = window.setTimeout(() => {
      setPassedTools((prev) => new Set(prev).add(currentTool.id));
      setTestingToolId(null);
      setToolTestIndex((prev) => prev + 1);
    }, 1200);
    return () => {
      if (toolTestTimeoutRef.current) {
        window.clearTimeout(toolTestTimeoutRef.current);
      }
    };
  }, [expanded, triggerStatus, toolTestIndex, visibleTools]);

  const chatPanel = (
    <div className="flex h-full min-h-0 flex-col gap-5 overflow-hidden lg:border-l lg:border-[color:var(--color-border)] lg:pl-6">
      <div className="flex items-center gap-3 rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface-muted)]/40 px-4 py-3 text-[13px] text-[color:var(--color-muted)]">
        <Sparkles className="h-4 w-4 text-[color:var(--color-brand)]" />
        Let’s refine the agent details before we open the builder.
      </div>
      {submissionError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[12px] text-red-600">
          {submissionError}
        </div>
      ) : null}

      {!completed &&
      currentStep === 0 &&
      inputValue.trim().length === 0 &&
      Object.keys(answers).length === 0 &&
      description.trim().length === 0 ? (
        <div className="rounded-xl border border-[color:var(--color-border)] bg-white p-4 shadow-sm">
          <div className="text-[13px] font-semibold text-[color:var(--color-foreground)]">
            1‑Click installs
          </div>
          <p className="mt-1 text-[12px] text-[color:var(--color-muted)]">
            We’ll assume defaults and install immediately. You can edit after.
          </p>
          <div className="mt-4 space-y-4">
            {installGroups.map((group) => (
              <div key={group.label} className="space-y-2">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--color-muted)]">
                  {group.label}
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {group.templates.map((template) => (
                    <button
                      key={template.id}
                      type="button"
                      className="rounded-xl border border-[color:var(--color-border)] px-4 py-3 text-left transition hover:border-[color:var(--color-brand)]"
                      onClick={() => handleQuickInstall(template)}
                    >
                      <div className="text-[13px] font-semibold text-[color:var(--color-foreground)]">
                        {template.name}
                      </div>
                      <p className="mt-1 text-[12px] text-[color:var(--color-muted)]">
                        {template.summary}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-[color:var(--color-muted)]">
                        <span className="rounded-full bg-[color:var(--color-surface-muted)]/70 px-2 py-1">
                          {template.defaultDestination}
                        </span>
                        <span className="rounded-full bg-[color:var(--color-surface-muted)]/70 px-2 py-1">
                          {template.trigger}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-2">
        {messages.map((message, index) => (
          <div
            key={`${message.role}-${index}`}
            className={`flex ${
              message.role === "assistant" ? "justify-start" : "justify-end"
            }`}
          >
            <div className="max-w-[80%]">
              <div
                className={`rounded-xl px-4 py-3 text-[13px] leading-[1.4] ${
                  message.role === "assistant"
                    ? "bg-[color:var(--color-surface-muted)]/60 text-[color:var(--color-foreground)]"
                    : "bg-[color:var(--color-brand)] text-white"
                }`}
              >
                {message.content}
              </div>
              {message.role === "assistant" &&
              message.chips &&
              message.chips.length > 0 &&
              index === messages.length - 1 ? (
                <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-[color:var(--color-muted)]">
                  {message.chips.map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      className={`rounded-full border px-3 py-1 text-[11px] transition ${
                        selectedChip === chip
                          ? "border-[color:var(--color-brand)] bg-[color:var(--color-brand)] text-white"
                          : "border-[color:var(--color-border)] bg-white text-[color:var(--color-foreground)] hover:border-[color:var(--color-brand)]"
                      }`}
                      onClick={() => {
                        setInputValue(chip);
                        setSelectedChip(chip);
                        handleNext(chip);
                      }}
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        ))}
      </div>
      {!completed ? (
        <div className="sticky bottom-0 flex items-center gap-3 border-t border-[color:var(--color-border)] bg-white/90 px-1 py-3 backdrop-blur">
          <Input
            value={inputValue}
            onChange={(event) => {
              const nextValue = event.target.value;
              setInputValue(nextValue);
              if (selectedChip && nextValue !== selectedChip) {
                setSelectedChip(null);
              }
            }}
            placeholder={flowSteps[currentStep].placeholder}
            className="h-10 flex-1 rounded-md border-[color:var(--color-border)] text-[13px]"
          />
          <Button
            onClick={() => handleNext()}
            className="h-10 gap-2 rounded-md bg-[color:var(--color-brand)] px-4 text-[13px] text-white shadow-sm hover:brightness-105"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="sticky bottom-0 flex flex-wrap items-center justify-between gap-3 border-t border-[color:var(--color-border)] bg-white/90 px-4 py-3 backdrop-blur">
          <div className="flex items-center gap-2 text-[13px] text-[color:var(--color-muted)]">
            <MessageCircle className="h-4 w-4" />
            {buildReady
              ? "Ready to open the agent builder."
              : "Testing connections before we open the builder."}
          </div>
          <Button
            onClick={handleBuildAgent}
            className="h-9 gap-2 rounded-md bg-[color:var(--color-brand)] px-4 text-[13px] text-white shadow-sm hover:brightness-105"
            disabled={!projectId || !buildReady}
          >
            {buildReady ? "Create Agent" : "Testing…"}
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );

  const workflowPanel = showWorkflow ? (
    <div className="flex min-h-0 flex-col gap-4 overflow-visible">
      <div className="text-[13px] font-semibold text-[color:var(--color-foreground)]">
        Workflow preview
      </div>
      <div className="relative flex-1">
        <div className="absolute inset-0 rounded-2xl border border-[color:var(--color-border)] bg-white/60">
          <div className="absolute inset-0 rounded-2xl bg-[radial-gradient(circle,_#e5e7eb_1px,_transparent_1px)] [background-size:16px_16px]" />
        </div>
        <div className="relative px-6 py-6">
          <div className="mx-auto flex w-full max-w-[860px] flex-col space-y-6">
            {!hasAgentName && pendingStepId === "agent-name" ? (
              <div className="relative flex flex-col items-center gap-4">
                <div
                  ref={nameAnchorRef}
                  className="w-full max-w-[520px] rounded-2xl border border-dashed border-emerald-200/80 bg-white/80 px-5 py-4 text-center shadow-[0_12px_28px_rgba(16,185,129,0.18)]"
                >
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--color-muted)]">
                    Agent details
                  </div>
                  <div className="mt-2 text-[13px] font-semibold text-[color:var(--color-foreground)]">
                    Waiting for name
                  </div>
                  <div className="mt-1 text-[11px] text-[color:var(--color-muted)]">
                    This card becomes your agent profile.
                  </div>
                </div>
              </div>
            ) : null}
            {hasAgentName ? (
              <div className="flex flex-col items-center">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--color-muted)]">
                  Agent details
                </div>
                <div
                  ref={detailsAnchorRef}
                  className="relative mt-2 w-full max-w-[520px] rounded-2xl border border-[color:var(--color-border)] bg-white/95 px-5 py-4 text-center shadow-[0_6px_18px_rgba(15,23,42,0.08)]"
                >
                  <div className="text-[14px] font-semibold text-[color:var(--color-foreground)]">
                    {answers["agent-name"]}
                  </div>
                  <div className="mt-2 text-[11px] text-[color:var(--color-muted)]">
                    Instructions and role setup
                  </div>
                </div>
              </div>
            ) : null}

            {showTrigger ? (
              <div className="flex flex-col items-center">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--color-muted)]">
                  Trigger
                </div>
                <div
                  ref={triggerAnchorRef}
                  className={`relative mt-2 w-full max-w-[420px] rounded-2xl border bg-white/90 px-4 py-3 text-center shadow-[0_6px_18px_rgba(15,23,42,0.08)] ${
                    triggerStatus === "testing"
                      ? "border-emerald-200 polaris-test-pulse"
                      : triggerStatus === "done"
                      ? "border-emerald-300 bg-emerald-50/80"
                      : "border-[color:var(--color-border)]"
                  }`}
                >
                  <div className="text-[13px] font-semibold text-[color:var(--color-foreground)]">
                    {triggerNode?.title ?? "Trigger"}
                  </div>
                  <div className="mt-1 text-[11px] text-[color:var(--color-muted)]">
                    {triggerStatus === "testing"
                      ? "Creating webhook"
                      : triggerStatus === "done"
                      ? "Webhook connected"
                      : "Entry point"}
                  </div>
                </div>
                <div className="mt-3 flex flex-col items-center">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      triggerStatus !== "idle"
                        ? "bg-emerald-400"
                        : "bg-[color:var(--color-brand)]"
                    }`}
                  />
                  <span
                    className={`mt-2 h-6 w-px ${
                      triggerStatus === "testing"
                        ? "polaris-test-flow-vertical"
                        : triggerStatus === "done"
                        ? "bg-emerald-400"
                        : "bg-[color:var(--color-border)]"
                    }`}
                  />
                </div>
              </div>
            ) : null}

            {showTools ? (
              <div className="flex flex-col items-center">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--color-muted)]">
                  Tools &amp; tests
                </div>
                <div className="mt-4 flex flex-col items-center">
                  <span
                    className={`h-6 w-px ${
                      toolsTesting
                        ? "polaris-test-flow-vertical"
                        : toolsDone
                        ? "bg-emerald-400"
                        : "bg-[color:var(--color-border)]"
                    }`}
                  />
                </div>
                <div className="w-full max-w-[820px] rounded-2xl border border-[color:var(--color-border)] bg-white/80 px-4 py-5 shadow-[0_6px_18px_rgba(15,23,42,0.06)]">
                  <div className="relative">
                    <div
                      className={`absolute left-0 right-0 top-2 h-px ${
                        toolsTesting
                          ? "polaris-test-flow"
                          : toolsDone
                          ? "bg-emerald-400"
                          : "bg-[color:var(--color-border)]"
                      }`}
                    />
                    <div
                      className={`absolute left-1/2 top-0 h-4 w-px -translate-x-1/2 ${
                        toolsTesting
                          ? "polaris-test-flow-vertical"
                          : toolsDone
                          ? "bg-emerald-400"
                          : "bg-[color:var(--color-border)]"
                      }`}
                    />
                    <div className="grid grid-cols-4 gap-4">
                      {visibleTools.map((tool) => (
                        <div
                          key={`${tool.id}-connector`}
                          className="flex flex-col items-center"
                        >
                          <div
                            className={`h-4 w-px ${
                              toolsTesting
                                ? "polaris-test-flow-vertical"
                                : toolsDone
                                ? "bg-emerald-400"
                                : "bg-[color:var(--color-border)]"
                            }`}
                          />
                          <span
                            className={`mt-1 h-2 w-2 rounded-full ${
                              toolsDone || passedTools.has(tool.id)
                                ? "bg-emerald-400"
                                : toolsTesting
                                ? "bg-emerald-300"
                                : "bg-[color:var(--color-brand)]"
                            }`}
                          />
                        </div>
                      ))}
                      {extraToolsCount > 0 ? (
                        <div className="flex flex-col items-center">
                          <div
                            className={`h-4 w-px ${
                              toolsTesting
                                ? "polaris-test-flow-vertical"
                                : toolsDone
                                ? "bg-emerald-400"
                                : "bg-[color:var(--color-border)]"
                            }`}
                          />
                          <span
                            className={`mt-1 h-2 w-2 rounded-full ${
                              toolsDone ? "bg-emerald-400" : "bg-[color:var(--color-brand)]"
                            }`}
                          />
                        </div>
                      ) : null}
                    </div>
                  </div>
                  <div className="mt-4 grid w-full grid-cols-4 gap-4">
                    {visibleTools.map((tool) => {
                      const isTesting = testingToolId === tool.id;
                      const isDone = passedTools.has(tool.id);
                      return (
                        <div
                          key={tool.id}
                          className={`rounded-2xl border px-4 py-3 shadow-[0_6px_18px_rgba(15,23,42,0.06)] ${
                            isDone
                              ? "border-emerald-300 bg-emerald-50/70"
                              : isTesting
                              ? "border-emerald-200 bg-emerald-50/30 polaris-test-pulse"
                              : "border-[color:var(--color-border)] bg-white"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 text-[11px] font-semibold text-[color:var(--color-muted)]">
                            <div className="flex items-center gap-2">
                              <span
                                className={`h-2.5 w-2.5 rounded-full ${
                                  isDone
                                    ? "bg-emerald-400"
                                    : isTesting
                                    ? "bg-emerald-300"
                                    : "bg-[color:var(--color-brand)]"
                                }`}
                              />
                              Tool
                            </div>
                            <button
                              type="button"
                              title="Test connection"
                              onClick={() => handleTestTool(tool.id)}
                              className="flex h-6 w-6 items-center justify-center rounded-full border border-[color:var(--color-border)] text-[color:var(--color-muted)] transition hover:border-[color:var(--color-brand)] hover:text-[color:var(--color-brand)]"
                            >
                              <FlaskConical className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <div className="mt-2 text-[13px] font-semibold text-[color:var(--color-foreground)]">
                            {tool.title}
                          </div>
                          <div className="mt-2 text-[11px] text-[color:var(--color-muted)]">
                            {isDone
                              ? "Connection verified"
                              : isTesting
                              ? "Testing tool"
                              : tool.detail ?? "Queued"}
                          </div>
                          <div className="mt-3">
                            <div
                              className={`h-1 rounded-full ${
                                isTesting
                                  ? "polaris-test-flow"
                                  : isDone
                                  ? "bg-emerald-400"
                                  : "bg-[color:var(--color-border)]"
                              }`}
                            />
                          </div>
                        </div>
                      );
                    })}
                    {extraToolsCount > 0 ? (
                      <div className="rounded-2xl border border-dashed border-[color:var(--color-border)] bg-white px-4 py-3 text-[12px] text-[color:var(--color-muted)]">
                        <div className="text-[13px] font-semibold text-[color:var(--color-foreground)]">
                          +{extraToolsCount} more tools
                        </div>
                        <p className="mt-2 text-[11px] text-[color:var(--color-muted)]">
                          Included in the full agent workflow.
                        </p>
                      </div>
                    ) : null}
                  </div>
                </div>
                <div className="mt-6 flex justify-center">
                  <div className="flex flex-col items-center">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        toolsDone ? "bg-emerald-400" : "bg-[color:var(--color-brand)]"
                      }`}
                    />
                    <span
                      className={`mt-2 h-6 w-px ${
                        toolsDone
                          ? "bg-emerald-400"
                          : "bg-[color:var(--color-border)]"
                      }`}
                    />
                  </div>
                </div>
              </div>
            ) : null}

            {showTools &&
            (plan.nodes.some((node) => node.kind === "automation") ||
              plan.nodes.some((node) => node.kind === "sub-agent")) ? (
              <div className="flex flex-col items-center">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--color-muted)]">
                  Orchestration
                </div>
                <div
                  className={`mt-3 grid w-full gap-3 md:justify-items-center ${
                    plan.nodes.some((node) => node.kind === "automation") &&
                    plan.nodes.some((node) => node.kind === "sub-agent")
                      ? "md:grid-cols-2"
                      : "md:grid-cols-1"
                  }`}
                >
                  {plan.nodes.some((node) => node.kind === "automation") ? (
                    <div className="rounded-2xl border border-dashed border-[color:var(--color-brand)]/40 bg-[color:var(--color-brand-soft)]/40 px-4 py-3 text-[12px] text-[color:var(--color-muted)]">
                      Automation
                      <div className="mt-2 text-[13px] font-semibold text-[color:var(--color-foreground)]">
                        Orchestrate steps
                      </div>
                    </div>
                  ) : null}
                  {plan.nodes.some((node) => node.kind === "sub-agent") ? (
                    <div className="rounded-2xl border border-[color:var(--color-border)] bg-white px-4 py-3 text-[12px] text-[color:var(--color-muted)]">
                      Sub‑agent
                      <div className="mt-2 text-[13px] font-semibold text-[color:var(--color-foreground)]">
                        Delegate task
                      </div>
                    </div>
                  ) : null}
                </div>
                <div className="mt-5 flex flex-col items-center">
                  <span className="h-2 w-2 rounded-full bg-[color:var(--color-brand)]" />
                  <span className="mt-2 h-6 w-px bg-[color:var(--color-border)]" />
                </div>
              </div>
            ) : null}

            {showTools ? (
              <div className="flex flex-col items-center">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--color-muted)]">
                  Action
                </div>
                <div className="mt-2 w-full max-w-[420px] rounded-2xl border border-[color:var(--color-brand)]/40 bg-[color:var(--color-brand-soft)]/40 px-4 py-3 text-center shadow-[0_10px_24px_rgba(108,92,231,0.18)]">
                  <div className="text-[13px] font-semibold text-[color:var(--color-foreground)]">
                    {actionNode?.title ?? "Send Message"}
                  </div>
                  <div className="mt-2 text-[11px] text-[color:var(--color-muted)]">
                    {actionNode?.detail ?? "Message template"}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
      {plan.assumptions.length > 0 ? (
        <div className="rounded-xl border border-[color:var(--color-border)] bg-white px-4 py-3 text-[11px] text-[color:var(--color-muted)]">
          <div className="font-semibold text-[color:var(--color-foreground)]">
            Assumptions
          </div>
          <ul className="mt-2 space-y-1">
            {plan.assumptions.map((assumption) => (
              <li key={assumption}>• {assumption}</li>
            ))}
          </ul>
        </div>
      ) : null}
      <p className="text-[12px] text-[color:var(--color-muted)]">
        Visualize triggers, logic, and actions as the agent comes to life.
      </p>
    </div>
  ) : null;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center gap-2 border-b border-[color:var(--color-border)] px-6 py-4 text-[15px] font-semibold text-[color:var(--color-foreground)]">
        Polaris Agent Setup
      </div>
      <div className="flex flex-1 min-h-0 flex-col gap-5 overflow-y-auto px-8 py-6">
        <div
          className={`grid min-h-0 flex-1 gap-6 ${
            showWorkflow ? "lg:grid-cols-[minmax(0,3fr)_minmax(0,1fr)]" : ""
          }`}
        >
          {showWorkflow ? workflowPanel : null}
          {chatPanel}
        </div>
      </div>
      {showWorkflow ? (
        <>
          <FloatingCallout
            anchorRef={nameAnchorRef}
            title={nameCallout.title}
            body={nameCallout.body}
            visible={Boolean(!hasAgentName && pendingStepId === "agent-name")}
            inputValue={inputValue}
            inputPlaceholder={flowSteps[0].placeholder}
            onInputChange={setInputValue}
            onSubmit={handleCalloutSubmit}
            suggestions={getSuggestionChips("agent-name", description)}
            onSuggestionClick={handleSuggestionPick}
          />
          <FloatingCallout
            anchorRef={detailsAnchorRef}
            title={destinationCallout.title}
            body={destinationCallout.body}
            visible={Boolean(hasAgentName && pendingStepId === "delivery-channel")}
            inputValue={inputValue}
            inputPlaceholder={flowSteps[1].placeholder}
            onInputChange={setInputValue}
            onSubmit={handleCalloutSubmit}
            suggestions={getSuggestionChips("delivery-channel", description)}
            onSuggestionClick={handleSuggestionPick}
          />
          <FloatingCallout
            anchorRef={triggerAnchorRef}
            title={triggerCallout.title}
            body={triggerCallout.body}
            visible={Boolean(showTrigger && pendingStepId === "trigger")}
            inputValue={inputValue}
            inputPlaceholder={flowSteps[2].placeholder}
            onInputChange={setInputValue}
            onSubmit={handleCalloutSubmit}
            suggestions={getSuggestionChips("trigger", description)}
            onSuggestionClick={handleSuggestionPick}
          />
        </>
      ) : null}
    </div>
  );
}
