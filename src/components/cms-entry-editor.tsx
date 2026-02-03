"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  AlignLeft,
  ArrowLeft,
  Code2,
  FileText,
  LayoutGrid,
  MoreHorizontal,
  PenTool,
  Plus,
  Save,
  Sparkles,
  Wand2,
} from "lucide-react";

import type { CmsEntryInput, CmsEntryItem } from "@/lib/cms-entry-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CmsShell } from "@/components/cms-shell";

const rightActions = [
  {
    title: "Audience Alignment Analysis",
    owner: "Christine Masters",
  },
  {
    title: "Translate Page Into Language",
    owner: "Christine Masters",
  },
];

export function CmsEntryEditor() {
  const params = useParams<{ entryId: string }>();
  const router = useRouter();
  const [entry, setEntry] = useState<CmsEntryItem | null>(null);
  const [draft, setDraft] = useState<CmsEntryInput | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEntry = async () => {
      try {
        setLoading(true);
        setError(null);
        const entryId = params.entryId ?? "";
        if (!entryId) {
          throw new Error("Entry ID is missing.");
        }
        const response = await fetch(`/api/cms-entries?id=${entryId}`);
        const data = (await response.json()) as
          | { ok: true; item: CmsEntryItem }
          | { ok: false; error: string };
        if (!data.ok) {
          throw new Error(data.error);
        }
        setEntry(data.item);
        setDraft({
          title: data.item.title,
          language: data.item.language,
          contentType: data.item.contentType,
          variants: data.item.variants,
          version: data.item.version,
          status: data.item.status,
          fields: { ...data.item.fields },
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load entry.");
      } finally {
        setLoading(false);
      }
    };
    void fetchEntry();
  }, [params.entryId]);

  const canSave = useMemo(() => {
    return Boolean(draft?.title.trim());
  }, [draft]);

  const handleSave = async (publish: boolean) => {
    if (!entry || !draft) {
      return;
    }
    try {
      setSaving(true);
      setError(null);
      const payload: CmsEntryInput = {
        ...draft,
        status: publish
          ? Array.from(new Set([...draft.status, "production"]))
          : draft.status,
        version: draft.version + 1,
      };
      const response = await fetch("/api/cms-entries", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: entry.id, ...payload }),
      });
      const data = (await response.json()) as
        | { ok: true; item: CmsEntryItem }
        | { ok: false; error: string };
      if (!data.ok) {
        throw new Error(data.error);
      }
      setEntry(data.item);
      setDraft({
        title: data.item.title,
        language: data.item.language,
        contentType: data.item.contentType,
        variants: data.item.variants,
        version: data.item.version,
        status: data.item.status,
        fields: { ...data.item.fields },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save entry.");
    } finally {
      setSaving(false);
    }
  };

  const handleAskPolaris = () => {
    window.dispatchEvent(new Event("polaris:open"));
    window.dispatchEvent(new Event("polaris:expand"));
    window.dispatchEvent(
      new CustomEvent("polaris:prompt", {
        detail: {
          prompt:
            "Review this entry and suggest improvements for clarity and brand tone.",
        },
      })
    );
  };

  const openPolarisContext = (key: string, label: string, value: string) => {
    window.dispatchEvent(
      new CustomEvent("polaris:context", {
        detail: {
          contextLabel: label,
          contextPrompt: `${label}\nCurrent value:\n${value}`,
          contextKey: key,
        },
      })
    );
    window.dispatchEvent(new Event("polaris:open"));
  };

  useEffect(() => {
    if (!entry) {
      return;
    }
    window.dispatchEvent(
      new CustomEvent("polaris:page-context", {
        detail: {
          contextLabel: `Page: ${entry.title}`,
          contextPrompt: `Page: ${entry.title}\nFields: Title, Single Line Textbox, Multi Line Textbox, Rich Text Editor, JSON Rich Text Editor.`,
        },
      })
    );
  }, [entry]);

  useEffect(() => {
    const handleApply = (
      event: Event & { detail?: { contextKey?: string; value?: string } }
    ) => {
      const key = event.detail?.contextKey;
      const value = event.detail?.value ?? "";
      if (!key || !draft) {
        return;
      }
      if (key === "entry.title") {
        setDraft({ ...draft, title: value });
        return;
      }
      if (key === "entry.fields.singleLine") {
        setDraft({ ...draft, fields: { ...draft.fields, singleLine: value } });
        return;
      }
      if (key === "entry.fields.multiLine") {
        setDraft({ ...draft, fields: { ...draft.fields, multiLine: value } });
        return;
      }
      if (key === "entry.fields.richText") {
        setDraft({ ...draft, fields: { ...draft.fields, richText: value } });
        return;
      }
      if (key === "entry.fields.jsonRichText") {
        setDraft({ ...draft, fields: { ...draft.fields, jsonRichText: value } });
      }
    };
    window.addEventListener("polaris:apply", handleApply as EventListener);
    return () => {
      window.removeEventListener("polaris:apply", handleApply as EventListener);
    };
  }, [draft]);

  return (
    <CmsShell active="entries">
      <div className="flex items-center gap-3 text-[12px] text-[color:var(--color-muted)]">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          aria-label="Back to entries"
          onClick={() => router.push("/cms/entries")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <span className="font-semibold text-[color:var(--color-foreground)]">
          {entry?.title ?? "Entry"}
        </span>
        <span className="rounded-full border border-[color:var(--color-border)] px-2 py-0.5 text-[11px]">
          Simple Content Type
        </span>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[56px_minmax(0,1fr)_280px]">
        <aside className="flex flex-col items-center gap-4 rounded-xl border border-[color:var(--color-border)] bg-white py-4">
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <LayoutGrid className="h-4 w-4 text-[color:var(--color-muted)]" />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <FileText className="h-4 w-4 text-[color:var(--color-brand)]" />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <AlignLeft className="h-4 w-4 text-[color:var(--color-muted)]" />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <PenTool className="h-4 w-4 text-[color:var(--color-muted)]" />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <Code2 className="h-4 w-4 text-[color:var(--color-muted)]" />
          </Button>
        </aside>

        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[color:var(--color-border)] bg-white px-4 py-3">
            <div className="flex items-center gap-3 text-[12px] text-[color:var(--color-muted)]">
              <span className="font-semibold text-[color:var(--color-foreground)]">
                {entry?.title ?? "Entry"}
              </span>
              <span className="rounded-full border border-[color:var(--color-border)] px-2 py-0.5">
                Version {entry?.version ?? 1}
              </span>
              <span className="rounded-full border border-[color:var(--color-border)] px-2 py-0.5 text-[color:var(--color-brand)]">
                Latest
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" className="h-8 text-[12px]">
                English (M)
              </Button>
              <Button
                className="h-8 gap-2 rounded-md bg-white px-3 text-[12px] text-[color:var(--color-foreground)] shadow-sm"
                variant="outline"
                disabled={!canSave || saving}
                onClick={() => handleSave(false)}
              >
                <Save className="h-4 w-4" />
                Save
              </Button>
              <Button
                className="h-8 gap-2 rounded-md bg-[color:var(--color-brand)] px-3 text-[12px] text-white shadow-sm hover:brightness-105 disabled:opacity-60"
                disabled={!canSave || saving}
                onClick={() => handleSave(true)}
              >
                <Plus className="h-4 w-4" />
                Publish
              </Button>
            </div>
          </div>

          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[12px] text-red-600">
              {error}
            </div>
          ) : null}

          <div className="space-y-4 rounded-xl border border-[color:var(--color-border)] bg-white px-5 py-5">
            <div className="group">
              <div className="flex items-center justify-between">
                <label className="text-[12px] font-semibold text-[color:var(--color-muted)]">
                  Title (required)
                </label>
                <button
                  type="button"
                  className="opacity-0 transition group-hover:opacity-100"
                  aria-label="Ask Polaris about Title"
                  onClick={() =>
                    openPolarisContext(
                      "entry.title",
                      "Field: Title",
                      draft?.title ?? ""
                    )
                  }
                >
                  <Sparkles className="h-4 w-4 text-[color:var(--color-brand)]" />
                </button>
              </div>
              <Input
                value={draft?.title ?? ""}
                onChange={(event) =>
                  setDraft((prev) =>
                    prev
                      ? { ...prev, title: event.target.value }
                      : null
                  )
                }
                placeholder="Entry title"
                className="mt-2 h-10 text-[13px]"
              />
            </div>
            <div className="group">
              <div className="flex items-center justify-between">
                <label className="text-[12px] font-semibold text-[color:var(--color-muted)]">
                  Single Line Textbox
                </label>
                <button
                  type="button"
                  className="opacity-0 transition group-hover:opacity-100"
                  aria-label="Ask Polaris about Single Line Textbox"
                  onClick={() =>
                    openPolarisContext(
                      "entry.fields.singleLine",
                      "Field: Single Line Textbox",
                      draft?.fields.singleLine ?? ""
                    )
                  }
                >
                  <Sparkles className="h-4 w-4 text-[color:var(--color-brand)]" />
                </button>
              </div>
              <Input
                value={draft?.fields.singleLine ?? ""}
                onChange={(event) =>
                  setDraft((prev) =>
                    prev
                      ? {
                          ...prev,
                          fields: {
                            ...prev.fields,
                            singleLine: event.target.value,
                          },
                        }
                      : null
                  )
                }
                placeholder="Single line value"
                className="mt-2 h-10 text-[13px]"
              />
            </div>
            <div className="group">
              <div className="flex items-center justify-between">
                <label className="text-[12px] font-semibold text-[color:var(--color-muted)]">
                  Multi Line Textbox
                </label>
                <button
                  type="button"
                  className="opacity-0 transition group-hover:opacity-100"
                  aria-label="Ask Polaris about Multi Line Textbox"
                  onClick={() =>
                    openPolarisContext(
                      "entry.fields.multiLine",
                      "Field: Multi Line Textbox",
                      draft?.fields.multiLine ?? ""
                    )
                  }
                >
                  <Sparkles className="h-4 w-4 text-[color:var(--color-brand)]" />
                </button>
              </div>
              <textarea
                value={draft?.fields.multiLine ?? ""}
                onChange={(event) =>
                  setDraft((prev) =>
                    prev
                      ? {
                          ...prev,
                          fields: {
                            ...prev.fields,
                            multiLine: event.target.value,
                          },
                        }
                      : null
                  )
                }
                placeholder="Type something..."
                className="mt-2 min-h-[90px] w-full rounded-md border border-[color:var(--color-border)] bg-white px-3 py-2 text-[13px] text-[color:var(--color-foreground)] shadow-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--color-brand)]/30"
              />
            </div>
            <div className="group">
              <div className="flex items-center justify-between">
                <label className="text-[12px] font-semibold text-[color:var(--color-muted)]">
                  Rich Text Editor
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="opacity-0 transition group-hover:opacity-100"
                    aria-label="Ask Polaris about Rich Text Editor"
                    onClick={() =>
                      openPolarisContext(
                        "entry.fields.richText",
                        "Field: Rich Text Editor",
                        draft?.fields.richText ?? ""
                      )
                    }
                  >
                    <Sparkles className="h-4 w-4 text-[color:var(--color-brand)]" />
                  </button>
                  <Button variant="ghost" size="sm" className="text-[11px]">
                    Expand Text Editor
                  </Button>
                </div>
              </div>
              <textarea
                value={draft?.fields.richText ?? ""}
                onChange={(event) =>
                  setDraft((prev) =>
                    prev
                      ? {
                          ...prev,
                          fields: {
                            ...prev.fields,
                            richText: event.target.value,
                          },
                        }
                      : null
                  )
                }
                className="mt-2 min-h-[180px] w-full rounded-md border border-[color:var(--color-border)] bg-white px-3 py-2 text-[13px] text-[color:var(--color-foreground)] shadow-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--color-brand)]/30"
              />
            </div>
            <div className="group">
              <div className="flex items-center justify-between">
                <label className="text-[12px] font-semibold text-[color:var(--color-muted)]">
                  JSON Rich Text Editor
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="opacity-0 transition group-hover:opacity-100"
                    aria-label="Ask Polaris about JSON Rich Text Editor"
                    onClick={() =>
                      openPolarisContext(
                        "entry.fields.jsonRichText",
                        "Field: JSON Rich Text Editor",
                        draft?.fields.jsonRichText ?? ""
                      )
                    }
                  >
                    <Sparkles className="h-4 w-4 text-[color:var(--color-brand)]" />
                  </button>
                  <Button variant="ghost" size="sm" className="text-[11px]">
                    Expand Text Editor
                  </Button>
                </div>
              </div>
              <textarea
                value={draft?.fields.jsonRichText ?? ""}
                onChange={(event) =>
                  setDraft((prev) =>
                    prev
                      ? {
                          ...prev,
                          fields: {
                            ...prev.fields,
                            jsonRichText: event.target.value,
                          },
                        }
                      : null
                  )
                }
                className="mt-2 min-h-[140px] w-full rounded-md border border-[color:var(--color-border)] bg-white px-3 py-2 text-[12px] font-mono text-[color:var(--color-foreground)] shadow-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--color-brand)]/30"
              />
            </div>
          </div>

          {loading ? (
            <div className="text-[12px] text-[color:var(--color-muted)]">
              Loading entry...
            </div>
          ) : null}
        </section>

        <aside className="space-y-4">
          <div className="rounded-xl border border-[color:var(--color-border)] bg-white px-4 py-4">
            <div className="text-[12px] font-semibold text-[color:var(--color-foreground)]">
              Automate
            </div>
            <div className="mt-4 space-y-3">
              <div className="text-[12px] font-semibold text-[color:var(--color-muted)]">
                Run an Automation
              </div>
              {rightActions.map((action) => (
                <div
                  key={action.title}
                  className="rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface-muted)]/40 px-3 py-2 text-[12px]"
                >
                  <div className="font-semibold text-[color:var(--color-foreground)]">
                    {action.title}
                  </div>
                  <div className="text-[11px] text-[color:var(--color-muted)]">
                    {action.owner}
                  </div>
                </div>
              ))}
              <Button
                variant="outline"
                className="h-8 w-full text-[12px]"
                onClick={handleAskPolaris}
              >
                <Wand2 className="mr-2 h-4 w-4" />
                Ask Polaris
              </Button>
            </div>
          </div>
          <div className="rounded-xl border border-[color:var(--color-border)] bg-white px-4 py-4">
            <div className="text-[12px] font-semibold text-[color:var(--color-foreground)]">
              Actions
            </div>
            <div className="mt-3 space-y-2 text-[12px] text-[color:var(--color-muted)]">
              <button type="button" className="flex w-full items-center gap-2">
                <Sparkles className="h-4 w-4" />
                View Recipes
              </button>
              <button type="button" className="flex w-full items-center gap-2">
                <MoreHorizontal className="h-4 w-4" />
                Manage Automations
              </button>
            </div>
          </div>
        </aside>
      </div>
    </CmsShell>
  );
}
