"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Clock,
  Filter,
  HelpCircle,
  Plus,
  Search,
  Settings,
  Star,
  Trash2,
  User,
} from "lucide-react";

import type {
  CmsStackEnvironment,
  CmsStackInput,
  CmsStackItem,
  CmsStackRegion,
} from "@/lib/cms-stack-types";
import { AppSwitcher } from "@/components/app-switcher";
import { CmsBadge } from "@/components/cms-badge";
import { PolarisPanel } from "@/components/polaris-panel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type ChatMessage = {
  id: string;
  role: "user" | "polaris";
  content: string;
};

const formatDate = (value: string) => {
  const date = new Date(value);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
};

const regionOptions: CmsStackRegion[] = ["US", "EU", "APAC"];
const environmentOptions: CmsStackEnvironment[] = [
  "Production",
  "Staging",
  "Development",
];

const buildDraft = () => ({
  name: "",
  description: "",
  region: "US" as CmsStackRegion,
  environment: "Production" as CmsStackEnvironment,
});

const buildAssumedDescription = (name: string) => {
  if (!name.trim()) {
    return "";
  }
  return `Primary stack for ${name.trim()} content and editorial workflows.`;
};

const applyStackChat = (
  input: string,
  draft: { name: string; description: string }
) => {
  const updates: string[] = [];
  let next = { ...draft };
  const trimmed = input.trim();
  if (!trimmed) {
    return { draft: next, updates };
  }
  const lines = trimmed.split("\n").map((line) => line.trim());
  lines.forEach((line) => {
    if (line.toLowerCase().startsWith("name:")) {
      const [, value] = line.split(":");
      const name = value?.trim() ?? "";
      if (name) {
        next = { ...next, name };
        updates.push(`Stack name set to “${name}”.`);
      }
      return;
    }
    if (line.toLowerCase().startsWith("description:")) {
      const [, value] = line.split(":");
      const description = value?.trim() ?? "";
      if (description) {
        next = { ...next, description };
        updates.push("Updated stack description.");
      }
      return;
    }
  });
  if (!next.description && next.name) {
    next = {
      ...next,
      description: buildAssumedDescription(next.name),
    };
    updates.push("Added a suggested description based on the name.");
  }
  return { draft: next, updates };
};

export function CmsStacks() {
  const router = useRouter();
  const [stacks, setStacks] = useState<CmsStackItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [draft, setDraft] = useState(buildDraft());
  const [saving, setSaving] = useState(false);
  const [panelError, setPanelError] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    const fetchStacks = async () => {
      try {
        setLoading(true);
        setLoadError(null);
        const response = await fetch("/api/cms-stacks");
        const data = (await response.json()) as
          | { ok: true; items: CmsStackItem[] }
          | { ok: false; error: string };
        if (!data.ok) {
          throw new Error(data.error);
        }
        setStacks(data.items);
      } catch (error) {
        setLoadError(
          error instanceof Error ? error.message : "Failed to load stacks."
        );
      } finally {
        setLoading(false);
      }
    };
    void fetchStacks();
  }, []);

  const refreshStacks = async () => {
    try {
      const response = await fetch("/api/cms-stacks");
      const data = (await response.json()) as
        | { ok: true; items: CmsStackItem[] }
        | { ok: false; error: string };
      if (data.ok) {
        setStacks(data.items);
      }
    } catch {
      // Ignore refresh errors.
    }
  };

  const filtered = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    if (!normalized) {
      return stacks;
    }
    return stacks.filter((stack) =>
      stack.name.toLowerCase().includes(normalized)
    );
  }, [stacks, search]);

  const openCreate = () => {
    setCreateOpen(true);
    setDraft(buildDraft());
    setPanelError(null);
    setMessages([
      {
        id: crypto.randomUUID(),
        role: "polaris",
        content:
          "Let’s set up your stack. What should we call it? You can respond with “name: …”.",
      },
      {
        id: crypto.randomUUID(),
        role: "polaris",
        content:
          "Add a description with “description: …” and I can suggest one if you skip it.",
      },
    ]);
    setChatInput("");
  };

  const closePanel = () => {
    setCreateOpen(false);
  };

  const handleChatSend = () => {
    const text = chatInput.trim();
    if (!text) {
      return;
    }
    const { draft: updatedDraft, updates } = applyStackChat(text, draft);
    setDraft(updatedDraft);
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: "user", content: text },
      {
        id: crypto.randomUUID(),
        role: "polaris",
        content:
          updates.length > 0
            ? updates.join(" ")
            : "I didn’t detect a structured update. Try “name: …” or “description: …”.",
      },
    ]);
    setChatInput("");
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setPanelError(null);
      const payload: CmsStackInput = {
        name: draft.name.trim(),
        description: draft.description.trim() || buildAssumedDescription(draft.name),
        region: draft.region,
        environment: draft.environment,
        members: 1,
        starred: false,
      };
      const response = await fetch("/api/cms-stacks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as
        | { ok: true; item: CmsStackItem }
        | { ok: false; error: string };
      if (!data.ok) {
        throw new Error(data.error);
      }
      setStacks((prev) => [data.item, ...prev]);
      closePanel();
      await refreshStacks();
    } catch (error) {
      setPanelError(
        error instanceof Error ? error.message : "Failed to save stack."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (stack: CmsStackItem) => {
    const confirmed = window.confirm(
      `Delete "${stack.name}"? This cannot be undone.`
    );
    if (!confirmed) {
      return;
    }
    try {
      const response = await fetch("/api/cms-stacks", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: stack.id }),
      });
      const data = (await response.json()) as
        | { ok: true }
        | { ok: false; error: string };
      if (!data.ok) {
        throw new Error(data.error);
      }
      setStacks((prev) => prev.filter((item) => item.id !== stack.id));
    } catch (error) {
      window.alert(
        error instanceof Error ? error.message : "Failed to delete stack."
      );
    }
  };

  const handleStar = async (stack: CmsStackItem) => {
    const updated = { ...stack, starred: !stack.starred };
    setStacks((prev) =>
      prev.map((item) => (item.id === stack.id ? updated : item))
    );
    try {
      const response = await fetch("/api/cms-stacks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...updated, id: stack.id }),
      });
      const data = (await response.json()) as
        | { ok: true }
        | { ok: false; error: string };
      if (!data.ok) {
        throw new Error(data.error);
      }
    } catch (error) {
      setStacks((prev) =>
        prev.map((item) => (item.id === stack.id ? stack : item))
      );
      window.alert(
        error instanceof Error ? error.message : "Failed to update stack."
      );
    }
  };

  return (
    <div className="min-h-screen bg-[color:var(--color-background)]">
      <header className="sticky top-0 z-20 border-b border-[color:var(--color-border)] bg-white/95 backdrop-blur">
        <div className="mx-auto flex w-full items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <CmsBadge />
            <Button variant="ghost" size="sm" className="gap-2 text-[13px]">
              <Settings className="h-4 w-4" />
              Settings
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <PolarisPanel pageContext="CMS" />
            <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Search">
              <Search className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Help">
              <HelpCircle className="h-5 w-5" />
            </Button>
            <AppSwitcher />
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[color:var(--color-surface-muted)] text-[11px] font-semibold">
              CM
            </div>
          </div>
        </div>
      </header>

      <div className="dashboard-shell">
        <main className="mx-auto w-full bg-[#f7f9fc] px-10 py-10 text-[16px] leading-[16px]">
          <div className="flex flex-col gap-5">
            <div className="flex flex-wrap items-center justify-between gap-5">
              <div className="flex flex-wrap items-center gap-5">
                <h1 className="text-[20px] font-semibold tracking-[0.2px] [font-variation-settings:'slnt'_0] text-[color:var(--text-primary-text-gray-900-body-black)]">
                  CMS Stacks
                </h1>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--color-muted)]" />
                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search for stacks..."
                    className="h-9 w-[320px] rounded-md border-[color:var(--color-border)] pl-9 text-[13px]"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 border border-[color:var(--color-border)]"
                  aria-label="Filter stacks"
                >
                  <Filter className="h-4 w-4 text-[color:var(--color-muted)]" />
                </Button>
              </div>
              <Button
                onClick={openCreate}
                className="h-9 gap-2 rounded-md bg-[color:var(--color-brand)] px-4 text-[13px] text-white shadow-sm hover:brightness-105"
              >
                <Plus className="h-4 w-4" />
                Create New Stack
              </Button>
            </div>

            {loadError ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[12px] text-red-600">
                {loadError}
              </div>
            ) : null}

            <div className="mt-10 grid justify-start gap-5 pr-5 pb-5 [grid-template-columns:repeat(auto-fill,minmax(20rem,20rem))]">
              {filtered.map((stack) => (
                <Card
                  key={stack.id}
                  className="relative w-full max-w-[20rem] rounded-[4px] border border-[#dde3ee] bg-white transition-shadow duration-300 ease-in-out hover:shadow-md"
                >
                  <button
                    type="button"
                    className="absolute inset-0 z-0 rounded-[4px]"
                    aria-label={`Open ${stack.name}`}
                    onClick={() => {
                      router.push("/cms/dashboard");
                    }}
                  />
                  <CardHeader className="flex-row items-start justify-between space-y-0 pb-2">
                    <CardTitle className="text-[16px] font-semibold leading-[1.5] tracking-[0.16px] text-[#212121]">
                      {stack.name}
                    </CardTitle>
                    <div className="relative z-10 flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-7 w-7 ${
                          stack.starred ? "text-[color:var(--color-brand)]" : ""
                        }`}
                        aria-label={
                          stack.starred ? "Unstar stack" : "Star stack"
                        }
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          handleStar(stack);
                        }}
                      >
                        <Star className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-[color:var(--color-muted)]"
                        aria-label="Delete stack"
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          handleDelete(stack);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="space-y-3 px-6 pt-4 pb-4">
                      <div className="flex items-center justify-between text-[12px] text-[color:var(--color-muted)]">
                        <div className="flex flex-1 items-center justify-between gap-3">
                          <span className="text-[12px] font-normal leading-[18px] tracking-[-0.00228px]">
                            Region
                          </span>
                          <span className="mb-1 text-[14px] font-semibold leading-[21px] text-[color:var(--color-foreground)]">
                            {stack.region}
                          </span>
                        </div>
                        <div className="mx-3 h-8 w-px bg-[color:var(--color-border)]" />
                        <div className="flex flex-1 items-center justify-between gap-3">
                          <span className="text-[12px] font-normal leading-[18px] tracking-[-0.00228px]">
                            Environment
                          </span>
                          <span className="mb-1 text-[14px] font-semibold leading-[21px] text-[color:var(--color-foreground)]">
                            {stack.environment}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="px-6 pb-3 text-[12px] text-[color:var(--color-muted)]">
                      {stack.description}
                    </div>
                    <div className="flex h-14 items-center justify-between rounded-b-[4px] rounded-t-none bg-[#edebff] px-[15px] py-[24px] text-[16px] leading-[16px] text-[color:var(--color-muted)]">
                      <span className="flex items-center gap-[5px] text-[12px] font-normal leading-[12px] tracking-[0.24px]">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white">
                          <User className="h-3.5 w-3.5" />
                        </span>
                        {stack.members} User
                      </span>
                      <span className="flex items-center gap-[5px] text-[12px] font-normal leading-[12px] tracking-[0.24px]">
                        <Clock className="h-3.5 w-3.5" />
                        {formatDate(stack.updatedAt)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {loading ? (
              <div className="text-center text-sm text-[color:var(--color-muted)]">
                Loading stacks...
              </div>
            ) : null}

            {!loading && filtered.length === 0 ? (
              <div className="text-center text-sm text-[color:var(--color-muted)]">
                No stacks match your search.
              </div>
            ) : null}
          </div>
        </main>
        <aside id="polaris-dock" className="polaris-rail" aria-label="Polaris dock" />
      </div>

      {createOpen ? (
        <div
          className="fixed inset-y-0 right-0 z-40 w-[70vw] max-w-[960px] border-l border-[color:var(--color-border)] bg-white shadow-[-20px_0_50px_rgba(15,23,42,0.18)]"
          role="dialog"
          aria-label="Polaris stack setup"
        >
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b border-[color:var(--color-border)] px-6 py-4">
              <div className="text-[14px] font-semibold text-[color:var(--color-foreground)]">
                Polaris Stack Setup
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={closePanel}
                aria-label="Close stack panel"
              >
                <span className="text-[18px]">×</span>
              </Button>
            </div>
            <div className="grid min-h-0 flex-1 gap-6 overflow-hidden px-6 py-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)]">
              <div className="min-h-0 overflow-y-auto pr-2">
                <div className="space-y-4">
                  <div>
                    <label className="text-[12px] font-semibold text-[color:var(--color-foreground)]">
                      Stack name
                    </label>
                    <Input
                      value={draft.name}
                      onChange={(event) =>
                        setDraft((prev) => ({ ...prev, name: event.target.value }))
                      }
                      placeholder="e.g. Aurora Commerce"
                      className="mt-2 h-10 text-[13px]"
                    />
                  </div>
                  <div>
                    <label className="text-[12px] font-semibold text-[color:var(--color-foreground)]">
                      Description
                    </label>
                    <textarea
                      value={draft.description}
                      onChange={(event) =>
                        setDraft((prev) => ({
                          ...prev,
                          description: event.target.value,
                        }))
                      }
                      placeholder="Short summary of the stack’s purpose."
                      className="mt-2 min-h-[160px] w-full rounded-md border border-[color:var(--color-border)] bg-white px-3 py-2 text-[13px] text-[color:var(--color-foreground)] shadow-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--color-brand)]/30"
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="text-[12px] font-semibold text-[color:var(--color-foreground)]">
                        Region (assumed)
                      </label>
                      <select
                        value={draft.region}
                        onChange={(event) =>
                          setDraft((prev) => ({
                            ...prev,
                            region: event.target.value as CmsStackRegion,
                          }))
                        }
                        className="mt-2 h-10 w-full rounded-md border border-[color:var(--color-border)] bg-white px-3 text-[12px] text-[color:var(--color-foreground)]"
                      >
                        {regionOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[12px] font-semibold text-[color:var(--color-foreground)]">
                        Environment (assumed)
                      </label>
                      <select
                        value={draft.environment}
                        onChange={(event) =>
                          setDraft((prev) => ({
                            ...prev,
                            environment: event.target.value as CmsStackEnvironment,
                          }))
                        }
                        className="mt-2 h-10 w-full rounded-md border border-[color:var(--color-border)] bg-white px-3 text-[12px] text-[color:var(--color-foreground)]"
                      >
                        {environmentOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  {panelError ? (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[12px] text-red-600">
                      {panelError}
                    </div>
                  ) : null}
                </div>
              </div>
              <div className="flex min-h-0 flex-col">
                <div className="flex items-center gap-2 text-[13px] font-semibold text-[color:var(--color-foreground)]">
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
                      handleChatSend();
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
                    Use “name:” or “description:”
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-[color:var(--color-border)] px-6 py-4">
              <Button
                variant="ghost"
                className="h-9 text-[13px]"
                onClick={closePanel}
              >
                Cancel
              </Button>
              <Button
                className="h-9 gap-2 rounded-md bg-[color:var(--color-brand)] px-4 text-[13px] text-white shadow-sm hover:brightness-105 disabled:opacity-60"
                onClick={handleSave}
                disabled={saving || !draft.name.trim()}
              >
                {saving ? "Saving..." : "Save Stack"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
