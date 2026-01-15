"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  ChevronRight,
  CirclePlay,
  FolderCog,
  LayoutGrid,
  Save,
  Settings,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ProjectTopNav } from "@/components/project-top-nav";

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

export function AgentEditor() {
  const params = useParams<{ id: string; agentId: string }>();
  const [agent, setAgent] = useState<Agent | null>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return;
    }
    const parsed = JSON.parse(stored) as Agent[];
    const match = parsed.find(
      (item) => item.id === params.agentId && item.projectId === params.id
    );
    if (match) {
      setAgent(match);
    }
  }, [params.agentId, params.id]);

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

      <div className="dashboard-shell">
        <main className="mx-auto w-full px-6 py-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-[18px] font-semibold text-[color:var(--color-foreground)]">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ChevronRight className="h-4 w-4 rotate-180" />
            </Button>
            {agent?.name ?? "Tweet to Slack Notifier"}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 text-[13px] text-[color:var(--color-muted)]">
              <span>Off</span>
              <span className="flex h-5 w-9 items-center rounded-full bg-[color:var(--color-border)] px-1">
                <span className="h-4 w-4 rounded-full bg-white shadow-sm" />
              </span>
              <span>On</span>
            </div>
            <Button
              variant="outline"
              className="h-9 gap-2 rounded-md border-[color:var(--color-brand)] px-4 text-[13px] text-[color:var(--color-brand)]"
            >
              <CirclePlay className="h-4 w-4" />
              Test Agent
            </Button>
            <Button className="h-9 gap-2 rounded-md bg-[color:var(--color-brand)] px-4 text-[13px] text-white shadow-sm hover:brightness-105">
              <Save className="h-4 w-4" />
              Save
            </Button>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[220px_1fr]">
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

          <div className="grid gap-6">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
              <Card className="border border-[color:var(--color-border)] shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-[13px] font-semibold text-[color:var(--color-muted)]">
                    Triggers <span className="text-[color:var(--color-muted)]">(required)</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Input
                    placeholder="Add a trigger to decide when to run your agent..."
                    className="h-10 rounded-md border-[color:var(--color-border)] text-[13px]"
                    defaultValue={agent?.triggers[0]}
                  />
                </CardContent>
              </Card>

              <Card className="border border-[color:var(--color-border)] shadow-sm">
                <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-[13px] font-semibold text-[color:var(--color-muted)]">
                    Tools
                  </CardTitle>
                  <Button variant="ghost" size="sm" className="text-[12px]">
                    + Add
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 rounded-md border border-[color:var(--color-border)] px-3 py-2 text-[12px] text-[color:var(--color-muted)]">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[color:var(--color-brand-soft)]">
                      <Sparkles className="h-4 w-4 text-[color:var(--color-brand)]" />
                    </span>
                    {agent?.tools[0] ?? "Send Message"}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="border border-[color:var(--color-border)] shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-[13px] font-semibold text-[color:var(--color-muted)]">
                  Instructions <span className="text-[color:var(--color-muted)]">(required)</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface-muted)]/40 px-3 py-2 text-[12px] text-[color:var(--color-muted)]">
                  Describe the agent&apos;s behavior. Use &quot;/&quot; to add tools it can access.
                </div>
                <textarea
                  defaultValue={agent?.instructions}
                  className="min-h-[240px] w-full rounded-md border border-[color:var(--color-border)] bg-white px-4 py-3 text-[13px] text-[color:var(--color-foreground)]"
                />
              </CardContent>
            </Card>
          </div>
        </div>

          {!agent ? (
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
    </div>
  );
}
