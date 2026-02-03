"use client";

import {
  ChevronDown,
  Filter,
  Plus,
  Search,
  Settings,
  SlidersHorizontal,
} from "lucide-react";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CmsShell } from "@/components/cms-shell";
import type { CmsEntryItem } from "@/lib/cms-entry-types";

const leftViews = [
  "Base Entries",
  "Base & Entry Variants",
  "Last Modified by Me",
  "Published by Me",
  "Not Published",
];

const contentTypes = [
  "Data Collections",
  "Glossary",
  "Partners",
  "Prompt Repository",
  "Series Pages",
  "Site Components",
];

export function CmsEntries() {
  const router = useRouter();
  const [entries, setEntries] = useState<CmsEntryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEntries = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch("/api/cms-entries");
        const data = (await response.json()) as
          | { ok: true; items: CmsEntryItem[] }
          | { ok: false; error: string };
        if (!data.ok) {
          throw new Error(data.error);
        }
        setEntries(data.items);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load entries."
        );
      } finally {
        setLoading(false);
      }
    };
    void fetchEntries();
  }, []);

  return (
    <CmsShell active="entries">
      <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="rounded-xl border border-[color:var(--color-border)] bg-white px-3 py-4">
          <div className="flex items-center gap-2 text-[12px] font-semibold text-[color:var(--color-muted)]">
            <span className="rounded-full bg-[color:var(--color-brand-soft)]/40 px-2 py-0.5 text-[11px] text-[color:var(--color-brand)]">
              Views
            </span>
            <span className="text-[10px] uppercase tracking-wide">Popular Views</span>
          </div>
          <div className="mt-3 space-y-1">
            {leftViews.map((view, index) => (
              <button
                key={view}
                type="button"
                className={`w-full rounded-md px-3 py-2 text-left text-[12px] ${
                  index === 0
                    ? "bg-[color:var(--color-brand-soft)]/30 text-[color:var(--color-foreground)]"
                    : "text-[color:var(--color-muted)] hover:bg-[color:var(--color-surface-muted)]"
                }`}
              >
                {view}
              </button>
            ))}
          </div>
          <div className="mt-6 border-t border-[color:var(--color-border)] pt-4">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--color-muted)]">
              Saved Views
            </div>
            <div className="mt-2 text-[12px] text-[color:var(--color-muted)]">
              No saved views yet.
            </div>
          </div>
          <div className="mt-6 border-t border-[color:var(--color-border)] pt-4">
            <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-[color:var(--color-muted)]">
              Content Type Views
              <span className="rounded-full bg-[color:var(--color-surface-muted)] px-2 py-0.5 text-[10px]">
                Grouped
              </span>
            </div>
            <div className="mt-2 space-y-1 text-[12px] text-[color:var(--color-muted)]">
              {contentTypes.map((item) => (
                <div key={item} className="flex items-center justify-between rounded-md px-2 py-1 hover:bg-[color:var(--color-surface-muted)]">
                  <span>{item}</span>
                  <ChevronDown className="h-3.5 w-3.5" />
                </div>
              ))}
            </div>
          </div>
        </aside>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-[20px] font-semibold text-[color:var(--color-foreground)]">
                Entries
              </h1>
              <p className="text-[12px] text-[color:var(--color-muted)]">
                Displaying localized entries in the selected language(s).
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" className="h-9 text-[12px]">
                English - United States
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
              <Button
                className="h-9 gap-2 rounded-md bg-[color:var(--color-brand)] px-4 text-[13px] text-white shadow-sm hover:brightness-105"
                onClick={async () => {
                  const response = await fetch("/api/cms-entries", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      title: "Untitled",
                      language: "English - United States",
                      contentType: "Blog Post",
                      variants: "—",
                      version: 1,
                      status: ["draft"],
                      fields: {
                        singleLine: "",
                        multiLine: "",
                        richText: "",
                        jsonRichText: "{\n  \"type\": \"doc\",\n  \"content\": []\n}",
                      },
                    }),
                  });
                  const data = (await response.json()) as
                    | { ok: true; item: CmsEntryItem }
                    | { ok: false; error: string };
                  if (data.ok) {
                    router.push(`/cms/entries/${data.item.id}`);
                  }
                }}
              >
                <Plus className="h-4 w-4" />
                New Entry
              </Button>
            </div>
          </div>

          <div className="rounded-xl border border-[color:var(--color-border)] bg-white">
            <div className="flex flex-wrap items-center gap-3 border-b border-[color:var(--color-border)] px-4 py-3">
              <Button variant="outline" className="h-8 text-[12px]">
                All
                <ChevronDown className="ml-2 h-3.5 w-3.5" />
              </Button>
              <div className="relative flex-1 min-w-[220px]">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--color-muted)]" />
                <Input
                  placeholder="Search entries"
                  className="h-8 rounded-md border-[color:var(--color-border)] pl-9 text-[12px]"
                />
              </div>
              <Button variant="outline" className="h-8 text-[12px]">
                <Filter className="mr-2 h-4 w-4" />
                Filters
              </Button>
              <Button variant="outline" className="h-8 text-[12px]">
                Advanced Search
              </Button>
              <div className="ml-auto flex items-center gap-2">
                <Button variant="outline" className="h-8 text-[12px]">
                  Base Entries
                  <ChevronDown className="ml-2 h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <SlidersHorizontal className="h-4 w-4 text-[color:var(--color-muted)]" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Settings className="h-4 w-4 text-[color:var(--color-muted)]" />
                </Button>
              </div>
            </div>

            {error ? (
              <div className="px-4 py-3 text-[12px] text-red-600">{error}</div>
            ) : null}
            <div className="overflow-hidden">
              <table className="w-full text-left text-[12px]">
                <thead className="bg-[color:var(--color-surface-muted)] text-[color:var(--color-muted)]">
                  <tr>
                    <th className="px-4 py-2 font-semibold">Title</th>
                    <th className="px-4 py-2 font-semibold">Language</th>
                    <th className="px-4 py-2 font-semibold">Content Type</th>
                    <th className="px-4 py-2 font-semibold">Variant(s)</th>
                    <th className="px-4 py-2 font-semibold text-right">Version</th>
                    <th className="px-4 py-2 font-semibold">Publish Status</th>
                    <th className="px-4 py-2 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => (
                    <tr
                      key={entry.id}
                      className="border-t border-[color:var(--color-border)]"
                    >
                      <td className="px-4 py-3 font-semibold text-[color:var(--color-foreground)]">
                        <a
                          href={`/cms/entries/${entry.id}`}
                          className="hover:text-[color:var(--color-brand)]"
                        >
                          {entry.title}
                        </a>
                      </td>
                      <td className="px-4 py-3 text-[color:var(--color-muted)]">
                        {entry.language}
                      </td>
                      <td className="px-4 py-3 text-[color:var(--color-muted)]">
                        {entry.contentType}
                      </td>
                      <td className="px-4 py-3 text-[color:var(--color-muted)]">
                        {entry.variants}
                      </td>
                      <td className="px-4 py-3 text-right text-[color:var(--color-muted)]">
                        {entry.version}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          {entry.status.map((status) => (
                            <span
                              key={status}
                              className="rounded-full border border-[color:var(--color-border)] px-2 py-0.5 text-[10px] font-semibold text-[color:var(--color-muted)]"
                            >
                              {status}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-[color:var(--color-muted)]">
                        •••
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between border-t border-[color:var(--color-border)] px-4 py-3 text-[11px] text-[color:var(--color-muted)]">
              <div>
                {loading
                  ? "Loading entries..."
                  : `Showing 1 to ${entries.length} of ${entries.length} records`}
              </div>
              <div className="flex items-center gap-2">
                <span>Rows: 30</span>
                <span>1 / 141</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </CmsShell>
  );
}
