"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ChevronRight,
  CirclePlay,
  FlaskConical,
  FolderCog,
  LayoutGrid,
  Save,
  Settings,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { FloatingCallout } from "@/components/floating-callout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ProjectTopNav } from "@/components/project-top-nav";
import { buildPlan } from "@/lib/agent-planning";

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

type ConfigItem = {
  id: string;
  name: string;
  value: string;
  createdAt: string;
  updatedAt: string;
};

type CommandItem = {
  id: string;
  name: string;
  kind: "variable" | "secret";
};

const instructionsCallout = {
  title: "Input needed",
  body: "Add instructions to define the agent role.",
};

export function AgentEditor() {
  const params = useParams<{ id: string; agentId: string }>();
  const router = useRouter();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");
  const [triggers, setTriggers] = useState<string[]>([""]);
  const [tools, setTools] = useState<string[]>([""]);
  const [active, setActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [handoffActive, setHandoffActive] = useState(false);
  const [handoffAnimate, setHandoffAnimate] = useState(false);
  const [handoffKey, setHandoffKey] = useState(0);
  const [handoffCurtain, setHandoffCurtain] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }
    try {
      const stored = window.sessionStorage.getItem("polaris-handoff");
      if (!stored) {
        return false;
      }
      const parsed = JSON.parse(stored) as { agentId?: string };
      return parsed.agentId === params.agentId;
    } catch {
      return false;
    }
  });
  const [passedToolTitles, setPassedToolTitles] = useState<string[]>([]);
  const [handoffPlan, setHandoffPlan] = useState<ReturnType<typeof buildPlan> | null>(
    null
  );
  const [activeTab, setActiveTab] = useState<"workflow" | "details">("workflow");
  const [testingToolId, setTestingToolId] = useState<string | null>(null);
  const [passedTools, setPassedTools] = useState<Set<string>>(() => new Set());
  const [triggerStatus, setTriggerStatus] = useState<"idle" | "testing" | "done">(
    "idle"
  );
  const testTimeoutRef = useRef<number | null>(null);
  const [variables, setVariables] = useState<ConfigItem[]>([]);
  const [secrets, setSecrets] = useState<ConfigItem[]>([]);
  const [commandOpen, setCommandOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState("");
  const [commandStart, setCommandStart] = useState<number | null>(null);
  const [commandIndex, setCommandIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const cursorRef = useRef<number>(0);
  const instructionsAnchorRef = useRef<HTMLDivElement | null>(null);
  const lastAgentIdRef = useRef<string | null>(null);

  useEffect(() => {
    const nextAgentId = params.agentId ?? null;
    if (lastAgentIdRef.current && lastAgentIdRef.current !== nextAgentId) {
      setPassedTools(new Set());
      setPassedToolTitles([]);
      setTriggerStatus("idle");
      setHandoffPlan(null);
      setHandoffActive(false);
      setHandoffAnimate(false);
      window.sessionStorage.removeItem("handoff-loading");
      window.dispatchEvent(new Event("handoff:hide"));
    }
    lastAgentIdRef.current = nextAgentId;
  }, [params.agentId]);


  const handleInstructionHelp = () => {
    window.dispatchEvent(new Event("polaris:open"));
    window.dispatchEvent(
      new CustomEvent("polaris:mode", { detail: { mode: "chat" } })
    );
    window.dispatchEvent(
      new CustomEvent("polaris:prompt", {
        detail: {
          prompt:
            "Help me write clear, effective agent instructions. Ask me a few questions and propose a concise template I can fill in.",
        },
      })
    );
  };

  useEffect(() => {
    const projectId =
      typeof params.id === "string" ? params.id.trim() : "";
    const agentId =
      typeof params.agentId === "string" ? params.agentId.trim() : "";
    if (!projectId || !agentId) {
      setLoading(false);
      return;
    }
    const loadAgent = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `/api/agents?projectId=${encodeURIComponent(projectId)}&id=${encodeURIComponent(agentId)}`
        );
        const data = (await response.json()) as
          | { ok: true; item: Agent }
          | { ok: false; error: string };
        if (!data.ok) {
          throw new Error(data.error);
        }
        setAgent(data.item);
        setName(data.item.name);
        setDescription(data.item.description);
        setInstructions(data.item.instructions ?? "");
        setTriggers(
          data.item.triggers && data.item.triggers.length > 0
            ? data.item.triggers
            : [""]
        );
        setTools(
          data.item.tools && data.item.tools.length > 0 ? data.item.tools : [""]
        );
        setActive(data.item.active);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load agent.");
      } finally {
        setLoading(false);
      }
    };
    void loadAgent();
  }, [params.agentId, params.id]);

  useEffect(() => {
    if (!agent?.id) {
      return;
    }
    const stored = window.sessionStorage.getItem("polaris-handoff");
    if (!stored) {
      return;
    }
    try {
      const parsed = JSON.parse(stored) as {
        agentId?: string;
        ts?: number;
        triggerStatus?: "idle" | "testing" | "done";
        toolsPassed?: string[];
        toolsPassedTitles?: string[];
        plan?: ReturnType<typeof buildPlan>;
      };
      if (
        parsed.agentId === agent.id &&
        typeof parsed.ts === "number" &&
        Date.now() - parsed.ts < 15000
      ) {
        setHandoffActive(true);
        setHandoffAnimate(false);
        setHandoffKey((prev) => prev + 1);
        setHandoffCurtain(true);
        window.requestAnimationFrame(() => {
          window.requestAnimationFrame(() => setHandoffAnimate(true));
        });
        setActiveTab("workflow");
        if (parsed.triggerStatus === "done") {
          setTriggerStatus("done");
        }
        if (Array.isArray(parsed.toolsPassed)) {
          setPassedTools(new Set(parsed.toolsPassed));
        }
        if (Array.isArray(parsed.toolsPassedTitles)) {
          setPassedToolTitles(parsed.toolsPassedTitles);
        }
        if (parsed.plan) {
          setHandoffPlan(parsed.plan);
        }
        window.sessionStorage.removeItem("polaris-handoff");
        window.sessionStorage.removeItem("handoff-loading");
        window.dispatchEvent(new Event("handoff:hide"));
        window.setTimeout(() => setHandoffCurtain(false), 2800);
        window.setTimeout(() => {
          setHandoffActive(false);
          setHandoffAnimate(false);
        }, 2400);
      }
    } catch {
      window.sessionStorage.removeItem("polaris-handoff");
    }
  }, [agent?.id]);

  useEffect(() => {
    return () => {
      if (testTimeoutRef.current) {
        window.clearTimeout(testTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const projectId =
      typeof params.id === "string" ? params.id.trim() : "";
    if (!projectId || projectId === "undefined" || projectId === "null") {
      return;
    }
    const loadConfigs = async () => {
      const [variablesResponse, secretsResponse] = await Promise.all([
        fetch(`/api/variables?projectId=${encodeURIComponent(projectId)}`),
        fetch(`/api/secrets?projectId=${encodeURIComponent(projectId)}`),
      ]);
      const variablesData = (await variablesResponse.json()) as {
        ok: boolean;
        items?: ConfigItem[];
      };
      const secretsData = (await secretsResponse.json()) as {
        ok: boolean;
        items?: ConfigItem[];
      };
      if (variablesData.ok && Array.isArray(variablesData.items)) {
        setVariables(variablesData.items);
      }
      if (secretsData.ok && Array.isArray(secretsData.items)) {
        setSecrets(secretsData.items);
      }
    };
    void loadConfigs();
  }, [params.id]);

  const commandItems = useMemo<CommandItem[]>(() => {
    const normalized = commandQuery.trim().toLowerCase();
    const matches = (item: ConfigItem) =>
      !normalized || item.name.toLowerCase().includes(normalized);
    const variableItems = variables
      .filter(matches)
      .map((item) => ({ id: item.id, name: item.name, kind: "variable" as const }));
    const secretItems = secrets
      .filter(matches)
      .map((item) => ({ id: item.id, name: item.name, kind: "secret" as const }));
    return [...variableItems, ...secretItems];
  }, [commandQuery, variables, secrets]);

  const updateCommandState = (value: string, cursor: number) => {
    cursorRef.current = cursor;
    const slice = value.slice(0, cursor);
    const slashIndex = slice.lastIndexOf("/");
    if (slashIndex === -1) {
      setCommandOpen(false);
      return;
    }
    const prev = slashIndex === 0 ? " " : slice[slashIndex - 1];
    if (prev && !/\s/.test(prev)) {
      setCommandOpen(false);
      return;
    }
    const query = slice.slice(slashIndex + 1);
    if (query.includes(" ") || query.includes("\n")) {
      setCommandOpen(false);
      return;
    }
    setCommandStart(slashIndex);
    setCommandQuery(query);
    setCommandIndex(0);
    setCommandOpen(true);
  };

  const handleCommandSelect = (item: CommandItem) => {
    if (commandStart === null) {
      return;
    }
    const start = commandStart;
    const cursor = cursorRef.current;
    const token =
      item.kind === "variable"
        ? `{{var.${item.name}}}`
        : `{{secret.${item.name}}}`;
    const nextValue = `${instructions.slice(0, start)}${token}${instructions.slice(cursor)}`;
    setInstructions(nextValue);
    setCommandOpen(false);
    setCommandQuery("");
    setCommandStart(null);
    requestAnimationFrame(() => {
      const nextCursor = start + token.length;
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(nextCursor, nextCursor);
    });
  };

  const updateListItem = (
    items: string[],
    index: number,
    value: string
  ) => items.map((item, itemIndex) => (itemIndex === index ? value : item));

  const handleSave = async () => {
    const projectId =
      typeof params.id === "string" ? params.id.trim() : "";
    const agentId =
      typeof params.agentId === "string" ? params.agentId.trim() : "";
    if (!projectId || !agentId) {
      setError("Project ID is required to save.");
      return;
    }
    const normalizedTriggers = triggers.map((item) => item.trim()).filter(Boolean);
    const normalizedTools = tools.map((item) => item.trim()).filter(Boolean);
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    if (!instructions.trim()) {
      setError("Instructions are required.");
      return;
    }
    if (normalizedTriggers.length === 0) {
      setError("At least one trigger is required.");
      return;
    }
    if (normalizedTools.length === 0) {
      setError("At least one tool is required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/agents", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          id: agentId,
          name,
          description,
          instructions,
          triggers: normalizedTriggers,
          tools: normalizedTools,
          active,
        }),
      });
      const data = (await response.json()) as
        | { ok: true; item: Agent }
        | { ok: false; error: string };
      if (!data.ok) {
        throw new Error(data.error);
      }
      setAgent(data.item);
      setTriggers(data.item.triggers ?? []);
      setTools(data.item.tools ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save agent.");
    } finally {
      setSaving(false);
    }
  };

  const planPreview = useMemo(() => {
    if (handoffPlan && (handoffActive || loading)) {
      return handoffPlan;
    }
    return buildPlan({
      description,
      answers: {
        trigger: triggers.find((item) => item.trim().length > 0) ?? "",
      },
      tools: tools.filter((tool) => tool.trim().length > 0),
    });
  }, [description, handoffActive, handoffPlan, tools, triggers]);

  const triggerLabel =
    triggers.find((item) => item.trim().length > 0) ?? "HTTP request trigger";
  const triggerNode = planPreview.nodes.find((node) => node.kind === "trigger");
  const toolNodes = planPreview.nodes.filter((node) => node.kind === "tool");
  const visibleTools = toolNodes.slice(0, 4);
  const extraToolsCount = Math.max(0, toolNodes.length - visibleTools.length);
  const actionNode = planPreview.nodes.find((node) => node.kind === "action");
  const hasAutomation = planPreview.nodes.some(
    (node) => node.kind === "automation"
  );
  const hasSubAgent = planPreview.nodes.some((node) => node.kind === "sub-agent");
  const normalizeKey = (value: string) =>
    value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const normalizedPassedTools = useMemo(() => {
    return new Set(Array.from(passedTools).map((item) => normalizeKey(item)));
  }, [passedTools]);
  const normalizedPassedToolTitles = useMemo(() => {
    return new Set(passedToolTitles.map((item) => normalizeKey(item)));
  }, [passedToolTitles]);
  const handoffTestedTitles = useMemo(() => {
    if (!handoffPlan || passedTools.size === 0) {
      return new Set<string>();
    }
    const titles = new Set<string>();
    handoffPlan.nodes
      .filter((node) => node.kind === "tool")
      .forEach((node) => {
        const normalizedId = normalizeKey(node.id);
        if (
          passedTools.has(node.id) ||
          normalizedPassedTools.has(node.id) ||
          normalizedPassedTools.has(normalizedId) ||
          normalizedPassedTools.has(`tool-${normalizedId}`)
        ) {
          titles.add(normalizeKey(node.title));
        }
      });
    return titles;
  }, [handoffPlan, normalizedPassedTools, passedTools]);
  const toolsDone = visibleTools.every((tool) => passedTools.has(tool.id));
  const hasHandoffTools = passedTools.size > 0;
  const fallbackAllDone =
    handoffActive && handoffPlan && passedTools.size === 0
      ? handoffPlan.nodes.some((node) => node.kind === "tool")
      : false;
  const handoffAllDone =
    handoffPlan?.nodes
      .filter((node) => node.kind === "tool")
      .every((node) => passedTools.has(node.id) || normalizedPassedTools.has(node.id)) ??
    false;
  const effectiveToolsDone =
    toolsDone ||
    handoffAllDone ||
    fallbackAllDone ||
    (handoffActive && (triggerStatus === "done" || hasHandoffTools));
  const toolsTesting = testingToolId !== null;
  const isToolDone = (toolId: string, toolTitle?: string) => {
    if (
      passedTools.has(toolId) ||
      fallbackAllDone ||
      (handoffActive && (triggerStatus === "done" || hasHandoffTools))
    ) {
      return true;
    }
    const normalizedId = normalizeKey(toolId);
    if (
      normalizedPassedTools.has(normalizedId) ||
      normalizedPassedTools.has(`tool-${normalizedId}`)
    ) {
      return true;
    }
    if (toolTitle) {
      const normalizedTitle = normalizeKey(toolTitle);
      if (normalizedPassedToolTitles.has(normalizedTitle)) {
        return true;
      }
      if (handoffTestedTitles.has(normalizedTitle)) {
        return true;
      }
      return (
        normalizedPassedTools.has(normalizedTitle) ||
        normalizedPassedTools.has(`tool-${normalizedTitle}`)
      );
    }
    return false;
  };

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

  return (
    <div className="min-h-screen bg-[color:var(--color-background)]">
      <ProjectTopNav
        projectId={params.id ?? ""}
        active="agents"
        pageContext="Agents"
      />

      <div className="border-b border-[color:var(--color-border)] bg-[color:var(--color-surface-muted)]/40 px-6 py-2 text-[12px] text-[color:var(--color-muted)]">
        hello <ChevronRight className="inline h-3 w-3" /> AI Agents
      </div>

      <div className={`dashboard-shell ${handoffCurtain ? "handoff-hide" : ""}`}>
        <main className="mx-auto w-full px-6 py-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-[18px] font-semibold text-[color:var(--color-foreground)]">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              aria-label="Back to agents"
              onClick={() => {
                const projectId =
                  typeof params.id === "string" ? params.id.trim() : "";
                router.push(
                  projectId
                    ? `/automations/projects/${projectId}/agents`
                    : "/automations/projects"
                );
              }}
            >
              <ChevronRight className="h-4 w-4 rotate-180" />
            </Button>
            {name || agent?.name || "Agent"}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActive((prev) => !prev)}
              className="flex items-center gap-2 text-[13px] text-[color:var(--color-muted)]"
              aria-pressed={active}
            >
              <span className={active ? "" : "text-[color:var(--color-foreground)]"}>
                Off
              </span>
              <span
                className={`flex h-5 w-9 items-center rounded-full px-1 transition ${
                  active
                    ? "bg-[color:var(--color-brand)]/70"
                    : "bg-[color:var(--color-border)]"
                }`}
              >
                <span
                  className={`h-4 w-4 rounded-full bg-white shadow-sm transition ${
                    active ? "translate-x-4" : ""
                  }`}
                />
              </span>
              <span className={active ? "text-[color:var(--color-foreground)]" : ""}>
                On
              </span>
            </button>
            <Button
              variant="outline"
              className="h-9 gap-2 rounded-md border-[color:var(--color-brand)] px-4 text-[13px] text-[color:var(--color-brand)]"
            >
              <CirclePlay className="h-4 w-4" />
              Test Agent
            </Button>
            <Button
              className="h-9 gap-2 rounded-md bg-[color:var(--color-brand)] px-4 text-[13px] text-white shadow-sm hover:brightness-105"
              onClick={handleSave}
              disabled={saving || loading}
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>

        {error ? (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[12px] text-red-600">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="mt-4 text-[12px] text-[color:var(--color-muted)]">
            Loading agent...
          </div>
        ) : null}

        <div className="mt-6 grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)_minmax(0,320px)]">
          <aside className="space-y-2">
            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-lg border border-[color:var(--color-border)] bg-white px-3 py-2 text-[13px] font-medium text-[color:var(--color-brand)] shadow-sm"
            >
              <LayoutGrid className="h-4 w-4" />
              Agent Builder
              <ChevronRight className="ml-auto h-4 w-4" />
            </button>
            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] text-[color:var(--color-muted)] hover:bg-white"
            >
              <FolderCog className="h-4 w-4" />
              Executions
            </button>
            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] text-[color:var(--color-muted)] hover:bg-white"
            >
              <Settings className="h-4 w-4" />
              Settings
            </button>
          </aside>

          <div className="grid gap-0">
            <div className="flex items-end border-b border-[color:var(--color-border)]">
              <button
                type="button"
                onClick={() => setActiveTab("workflow")}
                className={`-mb-px rounded-t-md px-4 py-2 text-[12px] font-semibold transition ${
                  activeTab === "workflow"
                    ? "border border-b-0 border-[color:var(--color-border)] bg-white text-[color:var(--color-foreground)]"
                    : "border border-transparent text-[color:var(--color-muted)] hover:text-[color:var(--color-foreground)]"
                }`}
              >
                Agent Workflow
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("details")}
                className={`-mb-px rounded-t-md px-4 py-2 text-[12px] font-semibold transition ${
                  activeTab === "details"
                    ? "border border-b-0 border-[color:var(--color-border)] bg-white text-[color:var(--color-foreground)]"
                    : "border border-transparent text-[color:var(--color-muted)] hover:text-[color:var(--color-foreground)]"
                }`}
              >
                Agent Details
              </button>
            </div>

            {activeTab === "workflow" ? (
              <Card
                className={`rounded-t-none border border-[color:var(--color-border)] shadow-sm ${
                  handoffActive ? "agent-diagram-handoff" : ""
                }`}
              >
                <CardContent className="space-y-4 pt-6">
                <div
                  key={`handoff-${handoffKey}`}
                  className={`relative overflow-visible ${
                    handoffActive && handoffAnimate ? "workflow-build" : ""
                  }`}
                >
                  <div className="absolute inset-0 rounded-2xl border border-[color:var(--color-border)] bg-white/80">
                    <div className="absolute inset-0 rounded-2xl bg-[radial-gradient(circle,_#e5e7eb_1px,_transparent_1px)] [background-size:16px_16px]" />
                  </div>
                  <div className="relative px-6 py-6">
                    <div className="mx-auto flex w-full max-w-[860px] flex-col space-y-6">
                      <div className="flex flex-col items-center">
                        <div className="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--color-muted)]">
                          Trigger
                        </div>
                        <div
                          className={`relative mt-2 w-full max-w-[420px] rounded-2xl border bg-white/90 px-4 py-3 text-center shadow-[0_6px_18px_rgba(15,23,42,0.08)] workflow-node ${
                            triggerStatus === "testing"
                              ? "border-emerald-200 polaris-test-pulse"
                              : triggerStatus === "done"
                              ? "border-emerald-300 bg-emerald-50/80"
                              : "border-[color:var(--color-border)]"
                          }`}
                          style={{ "--node-delay": "80ms" } as CSSProperties}
                        >
                          <div className="text-[13px] font-semibold text-[color:var(--color-foreground)]">
                            {triggerNode?.title ?? triggerLabel}
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
                              triggerStatus === "done"
                                ? "bg-emerald-400"
                                : "bg-[color:var(--color-brand)]"
                            }`}
                          />
                          <span
                            className={`mt-2 h-6 w-px ${
                              handoffAnimate
                                ? "workflow-line-animate-vertical"
                                : triggerStatus === "testing"
                                ? "polaris-test-flow-vertical"
                                : triggerStatus === "done"
                                ? "bg-emerald-400"
                                : "bg-[color:var(--color-border)]"
                            }`}
                          />
                        </div>
                      </div>

                      <div className="flex flex-col items-center">
                        <div className="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--color-muted)]">
                          Tools &amp; tests
                        </div>
                        <div className="mt-4 flex flex-col items-center">
                          <span
                            className={`h-6 w-px ${
                              handoffAnimate
                                ? "workflow-line-animate-vertical"
                                : toolsTesting
                                ? "polaris-test-flow-vertical"
                                : effectiveToolsDone
                                ? "bg-emerald-400"
                                : "bg-[color:var(--color-border)]"
                            }`}
                          />
                        </div>
                        <div className="w-full max-w-[820px] rounded-2xl border border-[color:var(--color-border)] bg-white/80 px-4 py-5 shadow-[0_6px_18px_rgba(15,23,42,0.06)]">
                          <div className="relative">
                            <div
                              className={`absolute left-0 right-0 top-2 h-px ${
                                handoffAnimate
                                  ? "workflow-line-animate"
                                  : toolsTesting
                                  ? "polaris-test-flow"
                                  : effectiveToolsDone
                                  ? "bg-emerald-400"
                                  : "bg-[color:var(--color-border)]"
                              }`}
                            />
                            <div
                              className={`absolute left-1/2 top-0 h-4 w-px -translate-x-1/2 ${
                                handoffAnimate
                                  ? "workflow-line-animate-vertical"
                                  : toolsTesting
                                  ? "polaris-test-flow-vertical"
                                  : effectiveToolsDone
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
                                      handoffAnimate
                                        ? "workflow-line-animate-vertical"
                                        : toolsTesting
                                        ? "polaris-test-flow-vertical"
                                        : effectiveToolsDone
                                        ? "bg-emerald-400"
                                        : "bg-[color:var(--color-border)]"
                                    }`}
                                  />
                                  <span
                                    className={`mt-1 h-2 w-2 rounded-full ${
                                      isToolDone(tool.id, tool.title)
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
                                      handoffAnimate
                                        ? "workflow-line-animate-vertical"
                                        : toolsTesting
                                        ? "polaris-test-flow-vertical"
                                        : effectiveToolsDone
                                        ? "bg-emerald-400"
                                        : "bg-[color:var(--color-border)]"
                                    }`}
                                  />
                                  <span
                                    className={`mt-1 h-2 w-2 rounded-full ${
                                      effectiveToolsDone ? "bg-emerald-400" : "bg-[color:var(--color-brand)]"
                                    }`}
                                  />
                                </div>
                              ) : null}
                            </div>
                          </div>
                          <div className="mt-4 grid w-full grid-cols-4 gap-4">
                            {visibleTools.map((tool, index) => {
                              const isTesting = testingToolId === tool.id;
                              const isDone = isToolDone(tool.id, tool.title);
                              return (
                              <div
                                key={tool.id}
                                className={`rounded-2xl border px-4 py-3 shadow-[0_6px_18px_rgba(15,23,42,0.06)] workflow-node ${
                                  isDone
                                    ? "border-emerald-300 bg-emerald-50/70"
                                    : isTesting
                                    ? "border-emerald-200 bg-emerald-50/30 polaris-test-pulse"
                                    : "border-[color:var(--color-border)] bg-white"
                                }`}
                                style={{
                                  "--node-delay": `${160 + index * 70}ms`,
                                } as CSSProperties}
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
                                    : tool.detail ?? "Test connection"}
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
                                effectiveToolsDone ? "bg-emerald-400" : "bg-[color:var(--color-brand)]"
                              }`}
                            />
                            <span
                              className={`mt-2 h-6 w-px ${
                                handoffAnimate
                                  ? "workflow-line-animate-vertical"
                                  : effectiveToolsDone
                                  ? "bg-emerald-400"
                                  : "bg-[color:var(--color-border)]"
                              }`}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-center">
                        <div className="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--color-muted)]">
                          Instructions
                        </div>
                        <div
                          ref={instructionsAnchorRef}
                          className="relative w-full max-w-[420px]"
                        >
                          <button
                            type="button"
                            onClick={() => setActiveTab("details")}
                            className="mt-2 w-full rounded-2xl border border-[color:var(--color-brand)]/40 bg-[color:var(--color-brand-soft)]/20 px-4 py-3 text-center text-[12px] text-[color:var(--color-foreground)] shadow-[0_10px_24px_rgba(108,92,231,0.12)] transition hover:border-[color:var(--color-brand)] workflow-node"
                            style={{ "--node-delay": "420ms" } as CSSProperties}
                          >
                            Edit agent instructions
                          </button>
                        </div>
                        <div className="mt-3 flex flex-col items-center">
                          <span className="h-2 w-2 rounded-full bg-[color:var(--color-brand)]" />
                          <span className="mt-2 h-6 w-px bg-[color:var(--color-border)]" />
                        </div>
                      </div>

                      {hasAutomation || hasSubAgent ? (
                        <div className="flex flex-col items-center">
                          <div className="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--color-muted)]">
                            Orchestration
                          </div>
                          <div className="mt-3 grid w-full gap-3 md:grid-cols-2">
                            {hasAutomation ? (
                              <div
                                className="rounded-2xl border border-dashed border-[color:var(--color-brand)]/40 bg-[color:var(--color-brand-soft)]/40 px-4 py-3 text-[12px] text-[color:var(--color-muted)] workflow-node"
                                style={{ "--node-delay": "520ms" } as CSSProperties}
                              >
                                Automation
                                <div className="mt-2 text-[13px] font-semibold text-[color:var(--color-foreground)]">
                                  Orchestrate steps
                                </div>
                              </div>
                            ) : null}
                            {hasSubAgent ? (
                              <div
                                className="rounded-2xl border border-[color:var(--color-border)] bg-white px-4 py-3 text-[12px] text-[color:var(--color-muted)] workflow-node"
                                style={{ "--node-delay": "560ms" } as CSSProperties}
                              >
                                Sub-agent
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
                        <div
                          className="mt-2 w-full max-w-[420px] rounded-2xl border border-[color:var(--color-brand)]/40 bg-[color:var(--color-brand-soft)]/40 px-4 py-3 text-center shadow-[0_10px_24px_rgba(108,92,231,0.18)] workflow-node"
                          style={{ "--node-delay": "640ms" } as CSSProperties}
                        >
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

                {planPreview.assumptions.length > 0 ? (
                  <div className="rounded-xl border border-[color:var(--color-border)] bg-white px-4 py-3 text-[11px] text-[color:var(--color-muted)]">
                    <div className="font-semibold text-[color:var(--color-foreground)]">
                      Assumptions
                    </div>
                    <ul className="mt-2 space-y-1">
                      {planPreview.assumptions.map((assumption) => (
                        <li key={assumption}>• {assumption}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </CardContent>
            </Card>
            ) : (
              <>
                <Card className="border border-[color:var(--color-border)] shadow-sm">
                  <CardHeader className="pb-2">
                <CardTitle className="text-[13px] font-semibold text-[color:var(--color-muted)]">
                  Agent Details
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[color:var(--color-muted)]">
                    Name
                  </label>
                  <Input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Agent name"
                    className="h-9 rounded-md border-[color:var(--color-border)] text-[13px]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[color:var(--color-muted)]">
                    Description
                  </label>
                  <Input
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="Short description"
                    className="h-9 rounded-md border-[color:var(--color-border)] text-[13px]"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border border-[color:var(--color-border)] shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-[13px] font-semibold text-[color:var(--color-muted)]">
                  Triggers{" "}
                  <span className="text-[color:var(--color-muted)]">
                    (required)
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {triggers.map((trigger, index) => (
                  <div key={`trigger-${index}`} className="flex items-center gap-2">
                    <Input
                      placeholder="Add a trigger to decide when to run your agent..."
                      className="h-10 rounded-md border-[color:var(--color-border)] text-[13px]"
                      value={trigger}
                      onChange={(event) =>
                        setTriggers(updateListItem(triggers, index, event.target.value))
                      }
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9"
                      onClick={() =>
                        setTriggers((prev) =>
                          prev.length > 1
                            ? prev.filter((_, itemIndex) => itemIndex !== index)
                            : prev
                        )
                      }
                      aria-label="Remove trigger"
                    >
                      ×
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-[12px]"
                  onClick={() => setTriggers((prev) => [...prev, ""])}
                >
                  + Add Trigger
                </Button>
              </CardContent>
            </Card>

            <Card className="border border-[color:var(--color-border)] shadow-sm">
              <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-[13px] font-semibold text-[color:var(--color-muted)]">
                  Instructions{" "}
                  <span className="text-[color:var(--color-muted)]">
                    (required)
                  </span>
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1 text-[12px] text-[color:var(--color-brand)]"
                  onClick={handleInstructionHelp}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Ask Polaris
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface-muted)]/40 px-3 py-2 text-[12px] text-[color:var(--color-muted)]">
                  Describe the agent&apos;s behavior. Use &quot;/&quot; to insert variables or secrets.
                </div>
                <div className="relative">
                  <textarea
                    ref={textareaRef}
                    value={instructions}
                    onChange={(event) => {
                      const nextValue = event.target.value;
                      setInstructions(nextValue);
                      updateCommandState(nextValue, event.target.selectionStart ?? nextValue.length);
                    }}
                    onKeyDown={(event) => {
                      if (!commandOpen || commandItems.length === 0) {
                        return;
                      }
                      if (event.key === "ArrowDown") {
                        event.preventDefault();
                        setCommandIndex((prev) =>
                          prev + 1 >= commandItems.length ? 0 : prev + 1
                        );
                      }
                      if (event.key === "ArrowUp") {
                        event.preventDefault();
                        setCommandIndex((prev) =>
                          prev - 1 < 0 ? commandItems.length - 1 : prev - 1
                        );
                      }
                      if (event.key === "Enter") {
                        event.preventDefault();
                        const selected = commandItems[commandIndex];
                        if (selected) {
                          handleCommandSelect(selected);
                        }
                      }
                      if (event.key === "Escape") {
                        setCommandOpen(false);
                      }
                    }}
                    onClick={(event) => {
                      updateCommandState(
                        event.currentTarget.value,
                        event.currentTarget.selectionStart ??
                          event.currentTarget.value.length
                      );
                    }}
                    className="min-h-[240px] w-full rounded-md border border-[color:var(--color-border)] bg-white px-4 py-3 text-[13px] text-[color:var(--color-foreground)]"
                  />
                  {commandOpen ? (
                    <div className="absolute left-4 top-4 z-20 w-[320px] rounded-lg border border-[color:var(--color-border)] bg-white p-2 shadow-lg">
                      <div className="px-2 pb-2 text-[11px] font-semibold text-[color:var(--color-muted)]">
                        Insert variable or secret
                      </div>
                      {commandItems.length === 0 ? (
                        <div className="px-2 py-1 text-[12px] text-[color:var(--color-muted)]">
                          No matches for &quot;{commandQuery}&quot;.
                        </div>
                      ) : (
                        <div className="max-h-[180px] overflow-auto">
                          {commandItems.map((item, index) => (
                            <button
                              key={`${item.kind}-${item.id}`}
                              type="button"
                              onMouseDown={(event) => event.preventDefault()}
                              onClick={() => handleCommandSelect(item)}
                              className={`flex w-full items-center justify-between rounded-md px-2 py-2 text-left text-[12px] ${
                                index === commandIndex
                                  ? "bg-[color:var(--color-brand-soft)] text-[color:var(--color-brand)]"
                                  : "text-[color:var(--color-foreground)] hover:bg-[color:var(--color-surface-muted)]"
                              }`}
                            >
                              <span className="font-medium">{item.name}</span>
                              <span className="text-[11px] uppercase">
                                {item.kind === "variable" ? "Var" : "Secret"}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
                <p className="text-[11px] text-[color:var(--color-muted)]">
                  Type <span className="font-semibold">/</span> to insert variables or secrets.
                </p>
              </CardContent>
            </Card>

              </>
            )}
          </div>

          <aside className="space-y-6">
            <Card className="border border-[color:var(--color-border)] shadow-sm">
              <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-[13px] font-semibold text-[color:var(--color-muted)]">
                  Tools
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {tools.map((tool, index) => (
                  <div key={`tool-${index}`} className="flex items-center gap-2">
                    <Input
                      value={tool}
                      onChange={(event) =>
                        setTools(updateListItem(tools, index, event.target.value))
                      }
                      placeholder="e.g. Send Message"
                      className="h-9 rounded-md border-[color:var(--color-border)] text-[13px]"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9"
                      onClick={() =>
                        setTools((prev) =>
                          prev.length > 1
                            ? prev.filter((_, itemIndex) => itemIndex !== index)
                            : prev
                        )
                      }
                      aria-label="Remove tool"
                    >
                      ×
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-[12px]"
                  onClick={() => setTools((prev) => [...prev, ""])}
                >
                  + Add Tool
                </Button>
                <div className="text-[11px] text-[color:var(--color-muted)]">
                  Use <span className="font-semibold">/</span> in instructions to
                  insert variables or secrets.
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>

          {!loading && !agent ? (
            <div className="mt-10 rounded-lg border border-[color:var(--color-border)] bg-white p-6 text-sm text-[color:var(--color-muted)]">
              Agent not found. Create a new agent to continue.
            </div>
          ) : null}
        </main>
        <aside
          id="polaris-dock"
          className="polaris-rail"
          aria-label="Polaris dock"
        />
      </div>
      {handoffCurtain ? (
        <div className="handoff-curtain">
          <div className="handoff-curtain-card">
            <div className="handoff-curtain-title">Finalizing agent</div>
            <div className="handoff-curtain-subtitle">
              Locking in workflow and tests…
            </div>
          </div>
        </div>
      ) : null}
      <FloatingCallout
        anchorRef={instructionsAnchorRef}
        title={instructionsCallout.title}
        body={instructionsCallout.body}
        visible={activeTab === "workflow" && instructions.trim().length === 0}
      />
    </div>
  );
}
