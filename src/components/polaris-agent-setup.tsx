"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, FlaskConical, MessageCircle, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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

type InstallTemplate = {
  id: string;
  name: string;
  summary: string;
  defaultDestination: string;
  trigger: string;
  tools: string[];
};

type InstallGroup = {
  label: string;
  templates: InstallTemplate[];
};

type PlanNode = {
  id: string;
  kind: "trigger" | "tool" | "automation" | "sub-agent" | "action";
  title: string;
  detail?: string;
};

type AgentPlan = {
  nodes: PlanNode[];
  assumptions: string[];
};

const installGroups: InstallGroup[] = [
  {
    label: "Marketing",
    templates: [
      {
        id: "tweet-to-slack",
        name: "Tweet → Slack Notifier",
        summary: "Send new tweets into a Slack channel with context.",
        defaultDestination: "#marketing-alerts",
        trigger: "HTTP request trigger",
        tools: ["Send Message"],
      },
      {
        id: "release-notes",
        name: "Release Notes Digest",
        summary: "Summarize release notes and post in Slack.",
        defaultDestination: "#product-updates",
        trigger: "Scheduled trigger",
        tools: ["Send Message"],
      },
      {
        id: "content-qa",
        name: "Content QA Checklist",
        summary: "Run a QA checklist and post results to Slack.",
        defaultDestination: "#content-qa",
        trigger: "Manual trigger",
        tools: ["Send Message"],
      },
    ],
  },
  {
    label: "Ops",
    templates: [
      {
        id: "incident-brief",
        name: "Incident Brief Builder",
        summary: "Turn incident payloads into a clean Slack summary.",
        defaultDestination: "#incident-room",
        trigger: "Webhook trigger",
        tools: ["Send Message"],
      },
    ],
  },
  {
    label: "Executive",
    templates: [
      {
        id: "exec-update",
        name: "Weekly Exec Update",
        summary: "Summarize key KPIs and send to leadership.",
        defaultDestination: "#exec-updates",
        trigger: "Scheduled trigger",
        tools: ["Send Message"],
      },
    ],
  },
];

const suggestionChips: Record<string, string[]> = {
  "agent-name": ["SlackAlert", "Slack Notifier", "Slack Communicator"],
  "delivery-channel": ["#marketing-alerts", "#product-updates", "#ops"],
  trigger: ["HTTP request trigger", "Scheduled trigger", "Webhook trigger"],
};

const toolCatalog = [
  { id: "contentstack", label: "Contentstack", keywords: ["contentstack"] },
  { id: "slack", label: "Slack", keywords: ["slack", "channel"] },
  { id: "webhook", label: "HTTP Webhook", keywords: ["webhook", "http"] },
  { id: "email", label: "Email", keywords: ["email"] },
  { id: "jira", label: "Jira", keywords: ["jira", "ticket"] },
  { id: "gmail", label: "Gmail", keywords: ["gmail"] },
  { id: "chatgpt", label: "ChatGPT", keywords: ["chatgpt", "gpt"] },
  { id: "gemini", label: "Gemini", keywords: ["gemini"] },
  { id: "brand-kit", label: "Brand Kit", keywords: ["brand", "brand kit"] },
  { id: "launch", label: "Launch", keywords: ["launch", "deploy"] },
];

const buildPlan = ({
  description,
  answers,
}: {
  description: string;
  answers: Record<string, string>;
}): AgentPlan => {
  const normalized = `${description} ${Object.values(answers).join(" ")}`
    .trim()
    .toLowerCase();
  const trigger = answers["trigger"] ?? "HTTP request trigger";
  const channel = answers["delivery-channel"] ?? "#marketing-alerts";
  const inferredTools = toolCatalog.filter((tool) =>
    tool.keywords.some((keyword) => normalized.includes(keyword))
  );
  const desiredToolCount =
    normalized.length > 80 ||
    normalized.includes("complex") ||
    normalized.includes("multi")
      ? 6
      : 4;
  const tools = [
    ...new Map(
      [
        ...inferredTools,
        toolCatalog[0],
        toolCatalog[1],
        toolCatalog[2],
        toolCatalog[3],
        toolCatalog[4],
      ].map((tool) => [tool.id, tool])
    ).values(),
  ].slice(0, desiredToolCount);
  const complexityScore = [
    normalized.includes("automation") || normalized.includes("workflow"),
    normalized.includes("sub-agent") || normalized.includes("delegate"),
    normalized.includes("test") || normalized.includes("validate"),
    normalized.split(" ").length > 14,
  ].filter(Boolean).length;
  const assumptions: string[] = [];

  if (!answers["delivery-channel"]) {
    assumptions.push(`Default channel: ${channel}`);
  }
  if (!answers["trigger"]) {
    assumptions.push(`Assumed trigger: ${trigger}`);
  }
  if (inferredTools.length === 0) {
    assumptions.push("Auto-mapped core tools from your description.");
  }

  const nodes: PlanNode[] = [
    {
      id: "trigger",
      kind: "trigger",
      title: trigger,
      detail: "Entry point",
    },
    ...tools.map((tool) => ({
      id: `tool-${tool.id}`,
      kind: "tool",
      title: tool.label,
      detail: "Test connection",
    })),
  ];

  if (
    normalized.includes("automation") ||
    normalized.includes("workflow") ||
    complexityScore >= 2
  ) {
    nodes.push({
      id: "automation",
      kind: "automation",
      title: "Automation",
      detail: "Orchestrate steps",
    });
  }

  if (normalized.includes("sub-agent") || normalized.includes("delegate")) {
    nodes.push({
      id: "sub-agent",
      kind: "sub-agent",
      title: "Sub-agent",
      detail: "Delegate task",
    });
  }

  nodes.push({
    id: "action",
    kind: "action",
    title: "Send Message",
    detail: `Deliver to ${channel}`,
  });

  return { nodes, assumptions };
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
  const testTimeoutRef = useRef<number | null>(null);

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
          chips: suggestionChips[step.id] ?? [],
        });
        items.push({ role: "user", content: answers[step.id] });
      }
    });
    if (!completed) {
      items.push({
        role: "assistant",
        content: flowSteps[currentStep].prompt,
        chips: suggestionChips[flowSteps[currentStep].id] ?? [],
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

  const handleBuildAgent = () => {
    if (!projectId) {
      return;
    }
    const agentName = answers["agent-name"] ?? "New Agent";
    const destination = answers["delivery-channel"] ?? "Slack";
    const trigger = answers["trigger"] ?? "HTTP request trigger";
    const instructions = `Goal: ${description}\n\nSteps:\n1. Receive the request via ${trigger}.\n2. Extract the relevant content.\n3. Format the message for clarity.\n4. Send the formatted message to ${destination} using Send Message.\n\nImportant:\n- Include the original content and any available metadata.`;
    const newAgent: Agent = {
      id: `agent-${Date.now()}`,
      projectId,
      name: agentName,
      description,
      instructions,
      triggers: [trigger],
      tools: ["Send Message"],
      active: true,
    };
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const parsed = stored ? (JSON.parse(stored) as Agent[]) : [];
    parsed.push(newAgent);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    onDone?.();
    router.push(`/automations/projects/${projectId}/agents/${newAgent.id}`);
  };

  const handleQuickInstall = (template: InstallTemplate) => {
    if (!projectId) {
      return;
    }
    const instructions = `Goal: ${template.summary}\n\nSteps:\n1. Receive the request via ${template.trigger}.\n2. Extract the relevant content.\n3. Format the message for clarity.\n4. Send the formatted message to ${template.defaultDestination} using ${template.tools[0]}.\n\nImportant:\n- Include the original content and any available metadata.`;
    const newAgent: Agent = {
      id: `agent-${Date.now()}`,
      projectId,
      name: template.name,
      description: template.summary,
      instructions,
      triggers: [template.trigger],
      tools: template.tools,
      active: true,
    };
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const parsed = stored ? (JSON.parse(stored) as Agent[]) : [];
    parsed.push(newAgent);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    onDone?.();
    router.push(`/automations/projects/${projectId}/agents/${newAgent.id}`);
  };

  useEffect(() => {
    return () => {
      if (testTimeoutRef.current) {
        window.clearTimeout(testTimeoutRef.current);
      }
    };
  }, []);

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
  const visibleTools = toolNodes.slice(0, 4);
  const extraToolsCount = Math.max(0, toolNodes.length - visibleTools.length);
  const actionNode = plan.nodes.find((node) => node.kind === "action");
  const showWorkflow = expanded;

  const chatPanel = (
    <div className="flex h-full min-h-0 flex-col gap-5 overflow-hidden lg:border-l lg:border-[color:var(--color-border)] lg:pl-6">
      <div className="flex items-center gap-3 rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface-muted)]/40 px-4 py-3 text-[13px] text-[color:var(--color-muted)]">
        <Sparkles className="h-4 w-4 text-[color:var(--color-brand)]" />
        Let’s refine the agent details before we open the builder.
      </div>

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
        <div className="flex items-center gap-3">
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
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface-muted)]/30 px-4 py-3">
          <div className="flex items-center gap-2 text-[13px] text-[color:var(--color-muted)]">
            <MessageCircle className="h-4 w-4" />
            Ready to open the agent builder.
          </div>
          <Button
            onClick={handleBuildAgent}
            className="h-9 gap-2 rounded-md bg-[color:var(--color-brand)] px-4 text-[13px] text-white shadow-sm hover:brightness-105"
            disabled={!projectId}
          >
            Open Builder
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );

  const workflowPanel = showWorkflow ? (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="text-[13px] font-semibold text-[color:var(--color-foreground)]">
        Workflow preview
      </div>
      <div className="relative flex-1 overflow-hidden rounded-2xl border border-[color:var(--color-border)] bg-white/60">
        <div className="absolute inset-0 bg-[radial-gradient(circle,_#e5e7eb_1px,_transparent_1px)] [background-size:16px_16px]" />
        <div className="relative h-full overflow-y-auto px-6 py-6">
          <div className="mx-auto flex w-full max-w-[860px] flex-col space-y-6">
            <div className="flex flex-col items-center">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--color-muted)]">
                Trigger
              </div>
              <div className="mt-2 w-full max-w-[420px] rounded-2xl border border-[color:var(--color-border)] bg-white/90 px-4 py-3 text-center shadow-[0_6px_18px_rgba(15,23,42,0.08)]">
                <div className="text-[13px] font-semibold text-[color:var(--color-foreground)]">
                  {triggerNode?.title ?? "Trigger"}
                </div>
                <div className="mt-1 text-[11px] text-[color:var(--color-muted)]">
                  Entry point
                </div>
              </div>
              <div className="mt-3 flex flex-col items-center">
                <span className="h-2 w-2 rounded-full bg-[color:var(--color-brand)]" />
                <span className="mt-2 h-6 w-px bg-[color:var(--color-border)]" />
              </div>
            </div>

            <div className="flex flex-col items-center">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--color-muted)]">
                Tools &amp; tests
              </div>
              <div className="mt-4 flex flex-col items-center">
                <span className="h-6 w-px bg-[color:var(--color-border)]" />
              </div>
              <div className="w-full max-w-[820px] rounded-2xl border border-[color:var(--color-border)] bg-white/80 px-4 py-5 shadow-[0_6px_18px_rgba(15,23,42,0.06)]">
                <div className="relative">
                  <div className="absolute left-0 right-0 top-2 h-px bg-[color:var(--color-border)]" />
                  <div className="absolute left-1/2 top-0 h-4 w-px -translate-x-1/2 bg-[color:var(--color-border)]" />
                  <div className="grid grid-cols-4 gap-4">
                    {visibleTools.map((tool) => (
                      <div
                        key={`${tool.id}-connector`}
                        className="flex flex-col items-center"
                      >
                        <div className="h-4 w-px bg-[color:var(--color-border)]" />
                        <span className="mt-1 h-2 w-2 rounded-full bg-[color:var(--color-brand)]" />
                      </div>
                    ))}
                    {extraToolsCount > 0 ? (
                      <div className="flex flex-col items-center">
                        <div className="h-4 w-px bg-[color:var(--color-border)]" />
                        <span className="mt-1 h-2 w-2 rounded-full bg-[color:var(--color-brand)]" />
                      </div>
                    ) : null}
                  </div>
                </div>
                <div className="mt-4 grid w-full grid-cols-4 gap-4">
                  {visibleTools.map((tool) => (
                    <div
                      key={tool.id}
                      className="rounded-2xl border border-[color:var(--color-border)] bg-white px-4 py-3 shadow-[0_6px_18px_rgba(15,23,42,0.06)]"
                    >
                      <div className="flex items-center justify-between gap-2 text-[11px] font-semibold text-[color:var(--color-muted)]">
                        <div className="flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-full bg-[color:var(--color-brand)]" />
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
                        {tool.detail ?? "Test connection"}
                      </div>
                      <div className="mt-3">
                        <div
                          className={`h-1 rounded-full ${
                            testingToolId === tool.id
                              ? "polaris-test-flow"
                              : passedTools.has(tool.id)
                                ? "bg-emerald-400"
                                : "bg-[color:var(--color-border)]"
                          }`}
                        />
                      </div>
                    </div>
                  ))}
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
                  <span className="h-2 w-2 rounded-full bg-[color:var(--color-brand)]" />
                  <span className="mt-2 h-6 w-px bg-[color:var(--color-border)]" />
                </div>
              </div>
            </div>

            {plan.nodes.some((node) => node.kind === "automation") ||
            plan.nodes.some((node) => node.kind === "sub-agent") ? (
              <div className="flex flex-col items-center">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--color-muted)]">
                  Orchestration
                </div>
                <div className="mt-3 grid w-full gap-3 md:grid-cols-2">
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
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-[color:var(--color-border)] px-6 py-4 text-[15px] font-semibold text-[color:var(--color-foreground)]">
        Polaris Agent Setup
      </div>
      <div className="flex flex-1 flex-col gap-5 overflow-hidden px-8 py-6">
        <div
          className={`grid min-h-0 flex-1 gap-6 ${
            showWorkflow ? "lg:grid-cols-[minmax(0,3fr)_minmax(0,1fr)]" : ""
          }`}
        >
          {showWorkflow ? workflowPanel : null}
          {chatPanel}
        </div>
      </div>
    </div>
  );
}
