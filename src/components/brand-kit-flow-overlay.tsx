"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  MessageSquare,
  MoreVertical,
  Pin,
  PinOff,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";

import type {
  BrandKitCadence,
  BrandKitGoal,
  BrandKitGoalPriority,
  BrandKitInput,
  BrandKitItem,
  BrandKitKpi,
} from "@/lib/brand-kit-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type FlowStep = {
  id: "foundation" | "goals" | "kpis";
  title: string;
  prompt: string;
  helper: string;
};

type BrandKitFlowOverlayProps = {
  open: boolean;
  mode: "create" | "edit";
  initialData: BrandKitItem | null;
  saving: boolean;
  error?: string | null;
  onClose: () => void;
  onSave: (payload: BrandKitInput, id?: string) => Promise<void>;
};

type ChatMessage = {
  id: string;
  role: "user" | "polaris";
  content: string;
};

const steps: FlowStep[] = [
  {
    id: "foundation",
    title: "Brand foundation",
    prompt:
      "Let’s set the brand mission and the name Polaris should use throughout the kit.",
    helper: "Keep this concise and usable as a north star for content.",
  },
  {
    id: "goals",
    title: "Goals",
    prompt:
      "Capture 2–4 goals that guide the brand kit decisions and creative direction.",
    helper: "Polaris uses goals to validate future content updates.",
  },
  {
    id: "kpis",
    title: "Website KPIs",
    prompt:
      "Define the KPIs that prove the website is performing against the brand.",
    helper: "Add the target and cadence you review most often.",
  },
];

const priorityOptions: BrandKitGoalPriority[] = ["High", "Medium", "Low"];
const cadenceOptions: BrandKitCadence[] = [
  "Weekly",
  "Monthly",
  "Quarterly",
  "Annually",
];

const emptyGoal = (): BrandKitGoal => ({
  id: crypto.randomUUID(),
  text: "",
  priority: "Medium",
});

const emptyKpi = (): BrandKitKpi => ({
  id: crypto.randomUUID(),
  name: "",
  target: "",
  unit: "",
  cadence: "Monthly",
});

const buildDraft = (kit: BrandKitItem | null) => ({
  name: kit?.name ?? "",
  mission: kit?.mission ?? "",
  goals: kit?.goals.length ? kit.goals : [emptyGoal()],
  websiteKpis: kit?.websiteKpis.length ? kit.websiteKpis : [emptyKpi()],
});

const extractAfterColon = (value: string) => {
  const [, rest] = value.split(":");
  return rest ? rest.trim() : "";
};

const parsePriority = (value: string): BrandKitGoalPriority | null => {
  const lowered = value.toLowerCase();
  if (lowered.includes("high")) {
    return "High";
  }
  if (lowered.includes("medium")) {
    return "Medium";
  }
  if (lowered.includes("low")) {
    return "Low";
  }
  return null;
};

const parseCadence = (value: string): BrandKitCadence | null => {
  const lowered = value.toLowerCase();
  if (lowered.includes("weekly")) {
    return "Weekly";
  }
  if (lowered.includes("monthly")) {
    return "Monthly";
  }
  if (lowered.includes("quarter")) {
    return "Quarterly";
  }
  if (lowered.includes("annual") || lowered.includes("year")) {
    return "Annually";
  }
  return null;
};

const applyChatUpdate = (
  input: string,
  draft: {
    name: string;
    mission: string;
    goals: BrandKitGoal[];
    websiteKpis: BrandKitKpi[];
  }
) => {
  const next = {
    ...draft,
    goals: [...draft.goals],
    websiteKpis: [...draft.websiteKpis],
  };
  const updates: string[] = [];
  const trimmed = input.trim();
  if (!trimmed) {
    return { draft: next, updates };
  }

  const lines = trimmed.split("\n").map((line) => line.trim());

  lines.forEach((line) => {
    if (line.toLowerCase().startsWith("name:")) {
      const name = extractAfterColon(line);
      if (name) {
        next.name = name;
        updates.push(`Updated name to “${name}”.`);
      }
      return;
    }
    if (line.toLowerCase().startsWith("mission:")) {
      const mission = extractAfterColon(line);
      if (mission) {
        next.mission = mission;
        updates.push("Updated mission statement.");
      }
      return;
    }
    if (line.toLowerCase().startsWith("goal:")) {
      const goalText = extractAfterColon(line);
      if (goalText) {
        const priority = parsePriority(goalText) ?? "Medium";
        next.goals.push({
          id: crypto.randomUUID(),
          text: goalText,
          priority,
        });
        updates.push("Added a new goal.");
      }
      return;
    }
    if (line.toLowerCase().startsWith("remove goal")) {
      const match = line.match(/remove goal\s+(\d+)/i);
      if (match) {
        const index = Number(match[1]) - 1;
        if (next.goals[index]) {
          next.goals.splice(index, 1);
          updates.push(`Removed goal ${match[1]}.`);
        }
      }
      return;
    }
    if (line.toLowerCase().startsWith("kpi:")) {
      const kpiData = extractAfterColon(line);
      if (kpiData) {
        const parts = kpiData.split(/[|,]/).map((part) => part.trim());
        const [name, target, unit, cadenceRaw] = parts;
        if (name) {
          next.websiteKpis.push({
            id: crypto.randomUUID(),
            name,
            target: target ?? "",
            unit: unit ?? "",
            cadence: parseCadence(cadenceRaw ?? "") ?? "Monthly",
          });
          updates.push("Added a new KPI.");
        }
      }
      return;
    }
  });

  return { draft: next, updates };
};

export function BrandKitFlowOverlay({
  open,
  mode,
  initialData,
  saving,
  error,
  onClose,
  onSave,
}: BrandKitFlowOverlayProps) {
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [draft, setDraft] = useState(() => buildDraft(initialData));
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const resetMessages = () => {
    setMessages([
      {
        id: crypto.randomUUID(),
        role: "polaris",
        content:
          mode === "create"
            ? "Hi! I’m Polaris. Tell me what you want to capture and I’ll update the Brand Kit fields."
            : "Welcome back! Tell me what you want to change and I’ll update the Brand Kit fields.",
      },
      {
        id: crypto.randomUUID(),
        role: "polaris",
        content:
          "Try: “mission: …” or “goal: … (high/medium/low)” or “kpi: Conversion rate, 3.2, %, monthly”.",
      },
    ]);
  };

  useEffect(() => {
    if (!open) {
      return;
    }
    setStepIndex(0);
    setDraft(buildDraft(initialData));
    resetMessages();
    setChatInput("");
  }, [open, initialData, mode]);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }
    const handleClick = (event: MouseEvent) => {
      if (!menuRef.current) {
        return;
      }
      if (!menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    window.addEventListener("mousedown", handleClick);
    return () => window.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  const step = steps[stepIndex];

  const canAdvance = useMemo(() => {
    if (step.id === "foundation") {
      return draft.name.trim().length > 1 && draft.mission.trim().length > 10;
    }
    return true;
  }, [draft.name, draft.mission, step.id]);

  const handleSave = async () => {
    const payload: BrandKitInput = {
      name: draft.name.trim(),
      mission: draft.mission.trim(),
      goals: draft.goals,
      websiteKpis: draft.websiteKpis,
      members: initialData?.members ?? 1,
      starred: initialData?.starred ?? false,
    };
    await onSave(payload, initialData?.id);
  };

  const handleSendMessage = () => {
    const text = chatInput.trim();
    if (!text) {
      return;
    }
    const { draft: updatedDraft, updates } = applyChatUpdate(text, draft);
    setDraft(updatedDraft);
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
    };
    const polarisMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "polaris",
      content:
        updates.length > 0
          ? updates.join(" ")
          : "I didn’t detect a structured update. Try “mission: …” or “goal: …”.",
    };
    setMessages((prev) => [...prev, userMessage, polarisMessage]);
    setChatInput("");
  };

  const handleExport = () => {
    const content = messages
      .map((message) => `${message.role === "user" ? "User" : "Polaris"}: ${message.content}`)
      .join("\n\n");
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `polaris-brand-kit-${new Date().toISOString().slice(0, 10)}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  if (!open) {
    return null;
  }

  return (
    <div
      className={`fixed inset-y-0 right-0 z-50 border-l border-[color:var(--color-border)] bg-white shadow-[-24px_0_60px_rgba(15,23,42,0.16)] ${
        isExpanded ? "w-[90vw] max-w-[1480px]" : "w-[75vw] max-w-[1280px]"
      }`}
      role="dialog"
      aria-label="Polaris brand kit setup"
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-[color:var(--color-border)] px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[color:var(--color-brand-soft)]/50 text-[color:var(--color-brand)]">
              <Sparkles className="h-5 w-5" />
            </span>
            <div>
              <div className="text-[14px] font-semibold text-[color:var(--color-foreground)]">
                Polaris Brand Kit Setup
              </div>
              <div className="text-[12px] text-[color:var(--color-muted)]">
                {mode === "create" ? "Create new kit" : "Edit brand kit"}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              aria-label={isPinned ? "Unpin Polaris" : "Pin Polaris"}
              onClick={() => setIsPinned((prev) => !prev)}
            >
              {isPinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
            </Button>
            <div className="relative" ref={menuRef}>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Polaris options"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((prev) => !prev)}
              >
                <MoreVertical className="h-5 w-5" />
              </Button>
              {menuOpen ? (
                <div className="absolute right-0 top-10 z-40 min-w-[180px] rounded-md border border-[color:var(--color-border)] bg-white p-1 text-left shadow-lg">
                  <button
                    type="button"
                    className="w-full rounded px-3 py-2 text-sm text-[color:var(--color-foreground)] hover:bg-[color:var(--color-surface-muted)]"
                    onClick={() => {
                      resetMessages();
                      setMenuOpen(false);
                    }}
                  >
                    Clear conversation
                  </button>
                  <button
                    type="button"
                    className="w-full rounded px-3 py-2 text-sm text-[color:var(--color-foreground)] hover:bg-[color:var(--color-surface-muted)]"
                    onClick={() => {
                      setDraft(buildDraft(initialData));
                      setStepIndex(0);
                      resetMessages();
                      setMenuOpen(false);
                    }}
                  >
                    Restart session
                  </button>
                  <button
                    type="button"
                    className="w-full rounded px-3 py-2 text-sm text-[color:var(--color-foreground)] hover:bg-[color:var(--color-surface-muted)]"
                    onClick={() => {
                      handleExport();
                      setMenuOpen(false);
                    }}
                  >
                    Export transcript
                  </button>
                  <button
                    type="button"
                    className="w-full rounded px-3 py-2 text-sm text-[color:var(--color-foreground)] hover:bg-[color:var(--color-surface-muted)]"
                    onClick={() => {
                      setIsExpanded((prev) => !prev);
                      setMenuOpen(false);
                    }}
                  >
                    {isExpanded ? "Exit wide view" : "Open wide view"}
                  </button>
                </div>
              ) : null}
            </div>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Close Polaris"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="grid min-h-0 flex-1 gap-6 overflow-hidden px-6 py-6 lg:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="flex min-h-0 flex-col gap-6 overflow-y-auto pr-2">
            <div className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-4 py-4">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--color-muted)]">
                Flow steps
              </div>
              <div className="mt-3 space-y-3">
                {steps.map((item, index) => (
                  <div
                    key={item.id}
                    className={`rounded-lg border px-3 py-2 text-[12px] ${
                      index === stepIndex
                        ? "border-[color:var(--color-brand)] bg-[color:var(--color-brand-soft)]/20 text-[color:var(--color-foreground)]"
                        : "border-[color:var(--color-border)] text-[color:var(--color-muted)]"
                    }`}
                  >
                    <div className="font-semibold">{item.title}</div>
                    <div className="text-[11px]">{item.helper}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-[color:var(--color-border)] bg-white px-4 py-4 text-[12px] text-[color:var(--color-foreground)] shadow-sm">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--color-muted)]">
                Polaris guidance
              </div>
              <p className="mt-3 text-[13px] font-semibold">{step.prompt}</p>
              <p className="mt-2 text-[12px] text-[color:var(--color-muted)]">
                {step.helper}
              </p>
            </div>
            <div className="rounded-xl border border-[color:var(--color-border)] bg-white px-4 py-4 text-[12px] text-[color:var(--color-foreground)] shadow-sm">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--color-muted)]">
                Schema map
              </div>
              <div className="mt-3 space-y-2 text-[12px] text-[color:var(--color-muted)]">
                <div className="flex items-center justify-between">
                  <span>Brand name</span>
                  <span className="font-semibold text-[color:var(--color-foreground)]">
                    {draft.name ? "Set" : "Missing"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Mission statement</span>
                  <span className="font-semibold text-[color:var(--color-foreground)]">
                    {draft.mission ? "Set" : "Missing"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Goals</span>
                  <span className="font-semibold text-[color:var(--color-foreground)]">
                    {draft.goals.filter((goal) => goal.text.trim()).length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Website KPIs</span>
                  <span className="font-semibold text-[color:var(--color-foreground)]">
                    {draft.websiteKpis.filter((kpi) => kpi.name.trim()).length}
                  </span>
                </div>
              </div>
            </div>
          </aside>

          <section className="min-h-0 overflow-hidden">
            <div className="grid min-h-0 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)]">
              <div className="min-h-0 overflow-y-auto pr-2">
                {step.id === "foundation" ? (
                  <div className="space-y-5">
                    <div>
                      <label className="text-[12px] font-semibold text-[color:var(--color-foreground)]">
                        Brand kit name
                      </label>
                      <Input
                        value={draft.name}
                        onChange={(event) =>
                          setDraft((prev) => ({
                            ...prev,
                            name: event.target.value,
                          }))
                        }
                        placeholder="e.g. Aurora Brand System"
                        className="mt-2 h-10 text-[13px]"
                      />
                    </div>
                    <div>
                      <label className="text-[12px] font-semibold text-[color:var(--color-foreground)]">
                        Mission statement
                      </label>
                      <textarea
                        value={draft.mission}
                        onChange={(event) =>
                          setDraft((prev) => ({
                            ...prev,
                            mission: event.target.value,
                          }))
                        }
                        placeholder="Describe what the brand stands for and the promise it makes."
                        className="mt-2 min-h-[160px] w-full rounded-md border border-[color:var(--color-border)] bg-white px-3 py-2 text-[13px] text-[color:var(--color-foreground)] shadow-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--color-brand)]/30"
                      />
                      <p className="mt-2 text-[11px] text-[color:var(--color-muted)]">
                        This becomes the guiding reference for all Polaris outputs.
                      </p>
                    </div>
                  </div>
                ) : null}

                {step.id === "goals" ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-[14px] font-semibold text-[color:var(--color-foreground)]">
                          Brand goals
                        </div>
                        <p className="text-[12px] text-[color:var(--color-muted)]">
                          Add the outcomes this kit must reinforce.
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        className="h-9 text-[12px]"
                        onClick={() =>
                          setDraft((prev) => ({
                            ...prev,
                            goals: [...prev.goals, emptyGoal()],
                          }))
                        }
                      >
                        Add goal
                      </Button>
                    </div>
                    <div className="space-y-3">
                      {draft.goals.map((goal, index) => (
                        <div
                          key={goal.id}
                          className="rounded-lg border border-[color:var(--color-border)] bg-white px-4 py-3 shadow-sm"
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-1">
                              <label className="text-[11px] font-semibold text-[color:var(--color-muted)]">
                                Goal {index + 1}
                              </label>
                              <Input
                                value={goal.text}
                                onChange={(event) =>
                                  setDraft((prev) => ({
                                    ...prev,
                                    goals: prev.goals.map((item) =>
                                      item.id === goal.id
                                        ? { ...item, text: event.target.value }
                                        : item
                                    ),
                                  }))
                                }
                                placeholder="Clarify brand promise across the homepage."
                                className="mt-2 h-9 text-[13px]"
                              />
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-[color:var(--color-muted)]"
                              aria-label="Remove goal"
                              onClick={() =>
                                setDraft((prev) => ({
                                  ...prev,
                                  goals: prev.goals.filter(
                                    (item) => item.id !== goal.id
                                  ),
                                }))
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {priorityOptions.map((priority) => (
                              <button
                                key={priority}
                                type="button"
                                onClick={() =>
                                  setDraft((prev) => ({
                                    ...prev,
                                    goals: prev.goals.map((item) =>
                                      item.id === goal.id
                                        ? { ...item, priority }
                                        : item
                                    ),
                                  }))
                                }
                                className={`rounded-full border px-3 py-1 text-[11px] font-semibold transition ${
                                  goal.priority === priority
                                    ? "border-[color:var(--color-brand)] bg-[color:var(--color-brand-soft)]/30 text-[color:var(--color-brand)]"
                                    : "border-[color:var(--color-border)] text-[color:var(--color-muted)] hover:text-[color:var(--color-foreground)]"
                                }`}
                              >
                                {priority}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {step.id === "kpis" ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-[14px] font-semibold text-[color:var(--color-foreground)]">
                          Website KPIs
                        </div>
                        <p className="text-[12px] text-[color:var(--color-muted)]">
                          These metrics help Polaris measure impact.
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        className="h-9 text-[12px]"
                        onClick={() =>
                          setDraft((prev) => ({
                            ...prev,
                            websiteKpis: [...prev.websiteKpis, emptyKpi()],
                          }))
                        }
                      >
                        Add KPI
                      </Button>
                    </div>
                    <div className="space-y-3">
                      {draft.websiteKpis.map((kpi, index) => (
                        <div
                          key={kpi.id}
                          className="rounded-lg border border-[color:var(--color-border)] bg-white px-4 py-3 shadow-sm"
                        >
                          <div className="flex items-center justify-between">
                            <div className="text-[11px] font-semibold text-[color:var(--color-muted)]">
                              KPI {index + 1}
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-[color:var(--color-muted)]"
                              aria-label="Remove KPI"
                              onClick={() =>
                                setDraft((prev) => ({
                                  ...prev,
                                  websiteKpis: prev.websiteKpis.filter(
                                    (item) => item.id !== kpi.id
                                  ),
                                }))
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="mt-3 grid gap-3 lg:grid-cols-[1.2fr_0.7fr_0.5fr_0.6fr]">
                            <div>
                              <label className="text-[11px] font-semibold text-[color:var(--color-muted)]">
                                Metric
                              </label>
                              <Input
                                value={kpi.name}
                                onChange={(event) =>
                                  setDraft((prev) => ({
                                    ...prev,
                                    websiteKpis: prev.websiteKpis.map((item) =>
                                      item.id === kpi.id
                                        ? {
                                            ...item,
                                            name: event.target.value,
                                          }
                                        : item
                                    ),
                                  }))
                                }
                                placeholder="Conversion rate"
                                className="mt-2 h-9 text-[13px]"
                              />
                            </div>
                            <div>
                              <label className="text-[11px] font-semibold text-[color:var(--color-muted)]">
                                Target
                              </label>
                              <Input
                                value={kpi.target}
                                onChange={(event) =>
                                  setDraft((prev) => ({
                                    ...prev,
                                    websiteKpis: prev.websiteKpis.map((item) =>
                                      item.id === kpi.id
                                        ? {
                                            ...item,
                                            target: event.target.value,
                                          }
                                        : item
                                    ),
                                  }))
                                }
                                placeholder="3.2"
                                className="mt-2 h-9 text-[13px]"
                              />
                            </div>
                            <div>
                              <label className="text-[11px] font-semibold text-[color:var(--color-muted)]">
                                Unit
                              </label>
                              <Input
                                value={kpi.unit}
                                onChange={(event) =>
                                  setDraft((prev) => ({
                                    ...prev,
                                    websiteKpis: prev.websiteKpis.map((item) =>
                                      item.id === kpi.id
                                        ? { ...item, unit: event.target.value }
                                        : item
                                    ),
                                  }))
                                }
                                placeholder="%"
                                className="mt-2 h-9 text-[13px]"
                              />
                            </div>
                            <div>
                              <label className="text-[11px] font-semibold text-[color:var(--color-muted)]">
                                Cadence
                              </label>
                              <select
                                value={kpi.cadence}
                                onChange={(event) =>
                                  setDraft((prev) => ({
                                    ...prev,
                                    websiteKpis: prev.websiteKpis.map((item) =>
                                      item.id === kpi.id
                                        ? {
                                            ...item,
                                            cadence: event.target
                                              .value as BrandKitCadence,
                                          }
                                        : item
                                    ),
                                  }))
                                }
                                className="mt-2 h-9 w-full rounded-md border border-[color:var(--color-border)] bg-white px-2 text-[12px] text-[color:var(--color-foreground)]"
                              >
                                {cadenceOptions.map((option) => (
                                  <option key={option} value={option}>
                                    {option}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="flex min-h-0 flex-col">
                <div className="flex items-center gap-2 text-[13px] font-semibold text-[color:var(--color-foreground)]">
                  <MessageSquare className="h-4 w-4 text-[color:var(--color-brand)]" />
                  Polaris
                </div>
                <div className="mt-3 flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-1">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`rounded-lg border px-3 py-2 text-[12px] leading-relaxed ${
                        message.role === "user"
                          ? "ml-auto max-w-[85%] border-[color:var(--color-brand)] bg-[color:var(--color-brand-soft)] text-[color:var(--color-foreground)]"
                          : "mr-auto max-w-[90%] border-[color:var(--color-border)] bg-white text-[color:var(--color-foreground)]"
                      }`}
                    >
                      <div className="text-[11px] font-semibold text-[color:var(--color-muted)]">
                        {message.role === "user" ? "You" : "Polaris"}
                      </div>
                      <p>{message.content}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-3 space-y-2">
                  <form
                    className="rounded-md bg-gradient-to-r from-[#6c5ce7] via-[#8b7cf6] to-[#6c5ce7] p-[1px]"
                    onSubmit={(event) => {
                      event.preventDefault();
                      handleSendMessage();
                    }}
                  >
                    <div className="relative rounded-[5px] bg-white">
                      <Input
                        value={chatInput}
                        onChange={(event) => setChatInput(event.target.value)}
                        placeholder="Ask Polaris to update fields…"
                        className="h-10 border-0 pr-20 text-[12px] focus-visible:ring-0 focus-visible:ring-offset-0"
                      />
                      <Button
                        type="submit"
                        size="sm"
                        className="absolute right-1 top-1/2 h-8 -translate-y-1/2 px-3 text-[12px]"
                        disabled={!chatInput.trim()}
                      >
                        Send
                      </Button>
                    </div>
                  </form>
                  <span className="text-[11px] text-[color:var(--color-muted)]">
                    Use “name:”, “mission:”, “goal:”, or “kpi:”.
                  </span>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="flex items-center justify-between border-t border-[color:var(--color-border)] px-6 py-4">
          <Button
            variant="ghost"
            className="h-9 text-[13px]"
            onClick={() =>
              setStepIndex((prev) => Math.max(0, prev - 1))
            }
            disabled={stepIndex === 0}
          >
            Back
          </Button>
          <div className="flex items-center gap-3">
            {error ? (
              <span className="text-[12px] text-red-600">{error}</span>
            ) : null}
            {stepIndex < steps.length - 1 ? (
              <Button
                className="h-9 gap-2 rounded-md bg-[color:var(--color-brand)] px-4 text-[13px] text-white shadow-sm hover:brightness-105 disabled:opacity-60"
                onClick={() =>
                  setStepIndex((prev) =>
                    Math.min(steps.length - 1, prev + 1)
                  )
                }
                disabled={!canAdvance}
              >
                Next
                <span className="text-[16px]">→</span>
              </Button>
            ) : (
              <Button
                className="h-9 gap-2 rounded-md bg-[color:var(--color-brand)] px-4 text-[13px] text-white shadow-sm hover:brightness-105 disabled:opacity-60"
                onClick={handleSave}
                disabled={saving || !canAdvance}
              >
                {saving ? "Saving..." : "Save Brand Kit"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
