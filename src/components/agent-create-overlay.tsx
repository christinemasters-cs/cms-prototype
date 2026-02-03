"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import {
  buildPlan,
  installGroups,
  selectPlanImage,
  type InstallTemplate,
} from "@/lib/agent-planning";

type Agent = {
  id: string;
};

type AgentCreateOverlayProps = {
  open: boolean;
  projectId?: string;
  onClose: () => void;
};

type PreviewNode = {
  id: string;
  label: string;
  detail: string;
  kind: "trigger" | "tool" | "instructions" | "automation" | "action";
};

const buildPreviewNodes = (plan: ReturnType<typeof buildPlan> | null) => {
  if (!plan) {
    return [] as PreviewNode[];
  }
  const nodes: PreviewNode[] = [];
  const trigger = plan.nodes.find((node) => node.kind === "trigger");
  if (trigger) {
    nodes.push({
      id: trigger.id,
      label: "Trigger",
      detail: trigger.title,
      kind: "trigger",
    });
  }
  const tools = plan.nodes.filter((node) => node.kind === "tool");
  tools.forEach((tool) => {
    nodes.push({
      id: tool.id,
      label: "Tool",
      detail: tool.title,
      kind: "tool",
    });
  });
  nodes.push({
    id: "instructions",
    label: "Instructions",
    detail: "Awaiting agent directions",
    kind: "instructions",
  });
  if (plan.nodes.some((node) => node.kind === "automation")) {
    nodes.push({
      id: "automation",
      label: "Automation",
      detail: "Orchestrate steps",
      kind: "automation",
    });
  }
  if (plan.nodes.some((node) => node.kind === "sub-agent")) {
    nodes.push({
      id: "sub-agent",
      label: "Sub-agent",
      detail: "Delegate task",
      kind: "automation",
    });
  }
  const action = plan.nodes.find((node) => node.kind === "action");
  if (action) {
    nodes.push({
      id: action.id,
      label: "Action",
      detail: action.title,
      kind: "action",
    });
  }
  return nodes;
};

function BuildPreview({
  nodes,
  paused,
  animated = true,
}: {
  nodes: PreviewNode[];
  paused: boolean;
  animated?: boolean;
}) {
  const [visibleCount, setVisibleCount] = useState(0);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testedIds, setTestedIds] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    if (!animated) {
      setVisibleCount(nodes.length);
      setTestingId(null);
      setTestedIds(new Set(nodes.map((node) => node.id)));
      return;
    }
    setVisibleCount(0);
    setTestingId(null);
    setTestedIds(new Set());
  }, [animated, nodes]);

  useEffect(() => {
    if (!animated || paused || nodes.length === 0) {
      setTestingId(null);
      return;
    }
    const timeouts: number[] = [];
    const stepInterval = window.setInterval(() => {
      setVisibleCount((prev) => {
        if (prev >= nodes.length) {
          return prev;
        }
        const next = prev + 1;
        const current = nodes[next - 1];
        setTestingId(current?.id ?? null);
        const timeoutId = window.setTimeout(() => {
          setTestedIds((prevSet) => {
            const nextSet = new Set(prevSet);
            if (current) {
              nextSet.add(current.id);
            }
            return nextSet;
          });
          setTestingId((currentId) =>
            currentId === current?.id ? null : currentId
          );
        }, 700);
        timeouts.push(timeoutId);
        return next;
      });
    }, 650);
    return () => {
      window.clearInterval(stepInterval);
      timeouts.forEach((timeoutId) => window.clearTimeout(timeoutId));
    };
  }, [animated, nodes, paused]);

  const visibleIds = useMemo(() => {
    return new Set(nodes.slice(0, visibleCount).map((node) => node.id));
  }, [nodes, visibleCount]);

  const triggerNode = nodes.find((node) => node.kind === "trigger");
  const toolNodes = nodes.filter((node) => node.kind === "tool");
  const instructionNode = nodes.find((node) => node.kind === "instructions");
  const automationNodes = nodes.filter((node) => node.kind === "automation");
  const actionNode = nodes.find((node) => node.kind === "action");
  const statusForNode = (node: PreviewNode) => {
    if (testedIds.has(node.id)) {
      return "done";
    }
    if (!paused && testingId === node.id) {
      return "testing";
    }
    return "pending";
  };

  return (
    <div className="space-y-3">
      {triggerNode && visibleIds.has(triggerNode.id) ? (
        <div className="flex flex-col items-center">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-[color:var(--color-muted)]">
            Trigger
          </div>
          <div className="mt-1 w-full">
            <div
              className={`build-node text-center ${
                statusForNode(triggerNode) === "done"
                  ? "build-node--done"
                  : statusForNode(triggerNode) === "testing"
                  ? "build-node--testing"
                  : "build-node--pending"
              }`}
            >
              <div className="text-[12px] font-semibold text-[color:var(--color-foreground)]">
                {triggerNode.detail}
              </div>
            </div>
          </div>
          <div className="mt-2 h-4 w-px bg-[color:var(--color-border)]" />
        </div>
      ) : null}

      {toolNodes.length > 0 ? (
        <div className="space-y-2">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-[color:var(--color-muted)]">
            Tools
          </div>
          <div className="grid grid-cols-2 gap-2">
            {toolNodes.map((tool) => {
              if (!visibleIds.has(tool.id)) {
                return null;
              }
              const status = statusForNode(tool);
              return (
                <div
                  key={tool.id}
                  className={`build-node ${
                    status === "done"
                      ? "build-node--done"
                      : status === "testing"
                      ? "build-node--testing"
                      : "build-node--pending"
                  }`}
                >
                  <div className="text-[11px] font-semibold text-[color:var(--color-foreground)]">
                    {tool.detail}
                  </div>
                  <div className="text-[10px] text-[color:var(--color-muted)]">
                    {status === "done"
                      ? "Tested"
                      : status === "testing"
                      ? "Testing…"
                      : "Queued"}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {instructionNode && visibleIds.has(instructionNode.id) ? (
        <div
          className={`build-node text-center ${
            statusForNode(instructionNode) === "done"
              ? "build-node--done"
              : statusForNode(instructionNode) === "testing"
              ? "build-node--testing"
              : "build-node--pending"
          }`}
        >
          <div className="text-[10px] font-semibold uppercase tracking-wide text-[color:var(--color-muted)]">
            Instructions
          </div>
          <div className="text-[11px] text-[color:var(--color-foreground)]">
            {instructionNode.detail}
          </div>
        </div>
      ) : null}

      {automationNodes.length > 0 &&
      automationNodes.some((node) => visibleIds.has(node.id)) ? (
        <div
          className={`build-node ${
            automationNodes.some((node) => statusForNode(node) === "testing")
              ? "build-node--testing"
              : automationNodes.every((node) => statusForNode(node) === "done")
              ? "build-node--done"
              : "build-node--pending"
          }`}
        >
          <div className="text-[10px] font-semibold uppercase tracking-wide text-[color:var(--color-muted)]">
            Orchestration
          </div>
          <div className="text-[11px] text-[color:var(--color-foreground)]">
            {automationNodes.map((node) => node.detail).join(" · ")}
          </div>
        </div>
      ) : null}

      {actionNode && visibleIds.has(actionNode.id) ? (
        <div
          className={`build-node text-center ${
            statusForNode(actionNode) === "done"
              ? "build-node--done"
              : statusForNode(actionNode) === "testing"
              ? "build-node--testing"
              : "build-node--pending"
          }`}
        >
          <div className="text-[10px] font-semibold uppercase tracking-wide text-[color:var(--color-muted)]">
            Action
          </div>
          <div className="text-[12px] font-semibold text-[color:var(--color-foreground)]">
            {actionNode.detail}
          </div>
        </div>
      ) : null}
      {paused ? (
        <div className="rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface-muted)]/60 px-3 py-2 text-[11px] text-[color:var(--color-muted)]">
          Waiting for more details to continue building.
        </div>
      ) : null}
    </div>
  );
}

export function AgentCreateOverlay({
  open,
  projectId,
  onClose,
}: AgentCreateOverlayProps) {
  const router = useRouter();
  const [agentDescription, setAgentDescription] = useState("");
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    null
  );

  useEffect(() => {
    if (!open) {
      return;
    }
    setTemplatesOpen(false);
    setSubmissionError(null);
    setAgentDescription("");
    const firstTemplate = installGroups.flatMap((group) => group.templates)[0];
    setSelectedTemplateId(firstTemplate?.id ?? null);
  }, [open]);

  const planPreview = useMemo(
    () => buildPlan({ description: agentDescription, answers: {} }),
    [agentDescription]
  );

  const planImage = useMemo(
    () => selectPlanImage(agentDescription),
    [agentDescription]
  );

  const handleQuickInstall = async (template: InstallTemplate) => {
    if (!projectId) {
      window.alert("Project ID is required to create an agent.");
      return;
    }
    setSubmissionError(null);
    const instructions = `Goal: ${template.summary}\n\nSteps:\n1. Receive the request via ${template.trigger}.\n2. Extract the relevant content.\n3. Format the message for clarity.\n4. Send the formatted message to ${template.defaultDestination} using ${template.tools[0]}.\n\nImportant:\n- Include the original content and any available metadata.`;
    try {
      const response = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          name: template.name,
          description: template.summary,
          instructions,
          triggers: [template.trigger],
          tools: template.tools,
          active: true,
        }),
      });
      const data = (await response.json()) as
        | { ok: true; item: Agent }
        | { ok: false; error: string };
      if (!data.ok) {
        throw new Error(data.error);
      }
      onClose();
      setTemplatesOpen(false);
      router.push(`/automations/projects/${projectId}/agents/${data.item.id}`);
    } catch (error) {
      setSubmissionError(
        error instanceof Error ? error.message : "Failed to install template."
      );
    }
  };

  const handleCreateAgent = () => {
    if (!projectId) {
      window.alert("Project ID is required to create an agent.");
      return;
    }
    const description = agentDescription.trim();
    if (description.length < 10) {
      return;
    }
    onClose();
    window.dispatchEvent(new Event("polaris:open"));
    window.dispatchEvent(new Event("polaris:expand"));
    window.dispatchEvent(
      new CustomEvent("polaris:mode", {
        detail: {
          mode: "agent-setup",
          payload: {
            projectId,
            description,
          },
        },
      })
    );
  };

  const selectedTemplate =
    installGroups
      .flatMap((group) => group.templates)
      .find((template) => template.id === selectedTemplateId) ?? null;

  const templatePlan = useMemo(() => {
    if (!selectedTemplate) {
      return null;
    }
    return buildPlan({
      description: selectedTemplate.summary,
      answers: {
        trigger: selectedTemplate.trigger,
        "delivery-channel": selectedTemplate.defaultDestination,
      },
      tools: selectedTemplate.tools,
    });
  }, [selectedTemplate]);

  const templatePreviewNodes = useMemo(
    () => buildPreviewNodes(templatePlan),
    [templatePlan]
  );

  if (!open) {
    return null;
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-6">
        <div className="w-full max-w-[760px] rounded-xl border border-[color:var(--color-border)] bg-white shadow-[0_24px_60px_rgba(15,23,42,0.2)]">
          <div className="flex items-center justify-between border-b border-[color:var(--color-border)] px-6 py-4">
            <div className="flex items-center gap-2 text-[16px] font-semibold text-[color:var(--color-foreground)]">
              Create Agent
              <span className="text-[color:var(--color-muted)]">?</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              aria-label="Close create agent"
              onClick={onClose}
            >
              <span className="text-[18px]">×</span>
            </Button>
          </div>
          <div className="space-y-4 px-6 py-5">
            <p className="text-[14px] font-semibold text-[color:var(--color-foreground)]">
              What do you want your agent to do?
            </p>
            <textarea
              value={agentDescription}
              onChange={(event) => setAgentDescription(event.target.value)}
              placeholder="Describe the agent's job (e.g., summarize text, translate text into French, etc.)"
              className="min-h-[200px] w-full rounded-md border border-[color:var(--color-brand)]/60 bg-white px-4 py-3 text-[14px] text-[color:var(--color-foreground)] shadow-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--color-brand)]/40"
            />
            <p className="text-[12px] text-[color:var(--color-muted)]">
              The agent description requires at least 10 characters.
            </p>
            {submissionError ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[12px] text-red-600">
                {submissionError}
              </div>
            ) : null}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Button
                variant="outline"
                className="h-9 rounded-md px-4 text-[13px]"
                onClick={() => setTemplatesOpen(true)}
              >
                Show 1-click templates
              </Button>
              <Button
                className="h-9 gap-2 rounded-md bg-[color:var(--color-brand)] px-4 text-[13px] text-white shadow-sm hover:brightness-105 disabled:opacity-60"
                disabled={agentDescription.trim().length < 10}
                onClick={handleCreateAgent}
              >
                Let&apos;s go
                <span className="text-[16px]">→</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {templatesOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-6">
          <div className="flex w-[95vw] max-w-[1320px] flex-col overflow-hidden rounded-xl border border-[color:var(--color-border)] bg-white shadow-[0_24px_60px_rgba(15,23,42,0.2)]">
            <div className="flex items-center justify-between border-b border-[color:var(--color-border)] px-6 py-4">
              <div className="text-[16px] font-semibold text-[color:var(--color-foreground)]">
                1-click templates
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                aria-label="Close templates"
                onClick={() => setTemplatesOpen(false)}
              >
                <span className="text-[18px]">×</span>
              </Button>
            </div>
            <div className="grid max-h-[70vh] min-h-0 gap-6 overflow-hidden px-6 py-5 lg:grid-cols-[340px_minmax(0,1fr)]">
              <div className="space-y-4">
                <div className="relative h-40 overflow-hidden rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface-muted)]/40">
                  <Image
                    src={planImage}
                    alt="Template preview"
                    fill
                    sizes="260px"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-tr from-black/10 via-transparent to-white/20" />
                </div>
                <div className="rounded-lg border border-[color:var(--color-border)] bg-white px-3 py-3 text-[12px] text-[color:var(--color-muted)]">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--color-muted)]">
                    How templates work
                  </div>
                  <p className="mt-2">
                    Pick a template and we&apos;ll generate an agent you can edit
                    immediately.
                  </p>
                  {planPreview.assumptions.length > 0 ? (
                    <ul className="mt-3 list-disc space-y-1 pl-4 text-[11px]">
                      {planPreview.assumptions.map((assumption) => (
                        <li key={assumption}>{assumption}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
                <div className="rounded-lg border border-[color:var(--color-border)] bg-white px-3 py-3 text-[12px] text-[color:var(--color-muted)]">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--color-muted)]">
                    Template workflow
                  </div>
                  {selectedTemplate && templatePlan ? (
                    <div className="mt-3 space-y-3">
                      <div className="text-[12px] font-semibold text-[color:var(--color-foreground)]">
                        {selectedTemplate.name}
                      </div>
                      <BuildPreview
                        nodes={templatePreviewNodes}
                        paused={false}
                        animated={false}
                      />
                      {templatePlan.assumptions.length > 0 ? (
                        <div className="rounded-lg border border-[color:var(--color-border)] bg-white px-3 py-2 text-[10px] text-[color:var(--color-muted)]">
                          <div className="font-semibold text-[color:var(--color-foreground)]">
                            Assumptions
                          </div>
                          <ul className="mt-2 space-y-1">
                            {templatePlan.assumptions.map((assumption) => (
                              <li key={assumption}>• {assumption}</li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <p className="mt-2">Select a template to preview its workflow.</p>
                  )}
                </div>
              </div>
              <div className="min-h-0 overflow-y-auto pr-2">
                {installGroups.map((group) => (
                  <div key={group.label} className="mb-5 space-y-2">
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--color-muted)]">
                      {group.label}
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      {group.templates.map((template) => (
                        <button
                          key={template.id}
                          type="button"
                          onClick={() => setSelectedTemplateId(template.id)}
                          className={`rounded-lg border bg-white p-3 text-left transition ${
                            selectedTemplateId === template.id
                              ? "border-[color:var(--color-brand)] shadow-[0_10px_18px_rgba(108,92,231,0.12)]"
                              : "border-[color:var(--color-border)] hover:border-[color:var(--color-brand)]"
                          }`}
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
                          <Button
                            size="sm"
                            className="mt-3 h-8 bg-[color:var(--color-brand)] text-[12px] text-white shadow-sm hover:brightness-105"
                            onClick={(event) => {
                              event.stopPropagation();
                              void handleQuickInstall(template);
                            }}
                          >
                            Install
                          </Button>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
