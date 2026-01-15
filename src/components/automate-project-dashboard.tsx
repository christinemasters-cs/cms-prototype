"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  BarChart3,
  ChevronDown,
  LayoutGrid,
  Plus,
  Sparkles,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProjectTopNav } from "@/components/project-top-nav";

type Project = {
  id: string;
  name: string;
  automations: number;
  connectedApps: number;
  members: number;
  updatedAt: string;
  starred: boolean;
};

const STORAGE_KEY = "automate-projects";

const formatDate = (value: string) => {
  const date = new Date(`${value}T00:00:00`);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
};

export function AutomateProjectDashboard() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [agentModalOpen, setAgentModalOpen] = useState(false);
  const [agentDescription, setAgentDescription] = useState("");
  const [polarisLaunching, setPolarisLaunching] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return;
    }
    const parsed = JSON.parse(stored) as Project[];
    const match = parsed.find((item) => item.id === params.id);
    if (match) {
      setProject(match);
    }
  }, [params.id]);

  const metrics = useMemo(() => {
    if (!project) {
      return null;
    }
    const totalAgents = Math.max(0, project.members);
    const totalAutomations = project.automations;
    const successRate =
      totalAutomations === 0 ? 0 : Math.min(100, 75 + totalAutomations * 2);
    const avgExecution = totalAutomations === 0 ? "0 s" : "2.4 s";
    return {
      totalAgents,
      totalAutomations,
      successRate,
      avgExecution,
    };
  }, [project]);

  return (
    <div className="min-h-screen bg-[color:var(--color-background)]">
      <ProjectTopNav
        projectId={params.id ?? ""}
        active="dashboard"
        pageContext="Dashboard"
      />

      <div className="dashboard-shell">
        <main className="mx-auto w-full px-6 py-6">
          {polarisLaunching ? (
            <div className="mb-4 flex items-center gap-2 rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-brand-soft)]/60 px-3 py-2 text-[12px] text-[color:var(--color-foreground)]">
              <Sparkles className="h-4 w-4 text-[color:var(--color-brand)]" />
              Launching Polaris focus mode…
            </div>
          ) : null}
          <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[12px] text-[color:var(--color-muted)]">
              {project ? project.name : "Project"}
            </p>
            <h1 className="text-[18px] font-semibold text-[color:var(--color-foreground)]">
              Dashboard
            </h1>
          </div>
          <div className="relative">
            <Button
              className="h-9 gap-2 rounded-md bg-[color:var(--color-brand)] px-4 text-[13px] text-white shadow-sm hover:brightness-105"
              onClick={() => setCreateOpen((prev) => !prev)}
              aria-expanded={createOpen}
            >
              <Plus className="h-4 w-4" />
              Create
              <ChevronDown className="h-4 w-4" />
            </Button>
            {createOpen ? (
              <div className="absolute right-0 top-11 z-30 w-44 rounded-md border border-[color:var(--color-border)] bg-white p-1 shadow-lg">
                <button
                  type="button"
                  className="w-full rounded px-3 py-2 text-left text-[13px] text-[color:var(--color-foreground)] hover:bg-[color:var(--color-surface-muted)]"
                  onClick={() => {
                    setCreateOpen(false);
                    setAgentModalOpen(true);
                  }}
                >
                  New Agent
                </button>
              </div>
            ) : null}
          </div>
        </div>

        <section className="mt-6 space-y-3">
          <h2 className="text-[13px] font-semibold text-[color:var(--color-muted)]">
            Overview
          </h2>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <Card className="border border-[color:var(--color-border)] shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-[12px] font-semibold text-[color:var(--color-muted)]">
                  Total Agents
                </CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-between text-[13px] text-[color:var(--color-muted)]">
                <div>
                  <span className="text-[18px] font-semibold text-[color:var(--color-foreground)]">
                    {metrics ? metrics.totalAgents : 0}
                  </span>
                  <span className="ml-2 text-[11px]">Active</span>
                </div>
                <span className="text-[11px]">Inactive</span>
              </CardContent>
            </Card>
            <Card className="border border-[color:var(--color-border)] shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-[12px] font-semibold text-[color:var(--color-muted)]">
                  Total Automations
                </CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-between text-[13px] text-[color:var(--color-muted)]">
                <span className="text-[18px] font-semibold text-[color:var(--color-foreground)]">
                  {project ? project.automations : 0}
                </span>
                <span className="text-[11px]">
                  {project ? project.connectedApps : 0} Inactive
                </span>
              </CardContent>
            </Card>
            <Card className="border border-[color:var(--color-border)] shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-[12px] font-semibold text-[color:var(--color-muted)]">
                  Success Rate
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-[13px] text-[color:var(--color-muted)]">
                <div className="text-[18px] font-semibold text-[color:var(--color-foreground)]">
                  {metrics ? metrics.successRate : 0}%
                </div>
                <div className="h-1.5 w-full rounded-full bg-[color:var(--color-border)]">
                  <div
                    className="h-1.5 rounded-full bg-[color:var(--color-brand)]"
                    style={{
                      width: `${metrics ? metrics.successRate : 0}%`,
                    }}
                  />
                </div>
              </CardContent>
            </Card>
            <Card className="border border-[color:var(--color-border)] shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-[12px] font-semibold text-[color:var(--color-muted)]">
                  Execution Summary (Today)
                </CardTitle>
              </CardHeader>
              <CardContent className="text-[18px] font-semibold text-[color:var(--color-foreground)]">
                0
              </CardContent>
            </Card>
            <Card className="border border-[color:var(--color-border)] shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-[12px] font-semibold text-[color:var(--color-muted)]">
                  Average Execution Time
                </CardTitle>
              </CardHeader>
              <CardContent className="text-[18px] font-semibold text-[color:var(--color-foreground)]">
                {metrics ? metrics.avgExecution : "0 s"}
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="mt-6 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-[13px] font-semibold text-[color:var(--color-muted)]">
              Agents
            </h2>
            <Button variant="ghost" size="sm" className="text-[12px]">
              View All
            </Button>
          </div>
          <Card className="border border-[color:var(--color-border)] bg-white shadow-sm">
            <CardContent className="flex flex-col items-center gap-2 py-8 text-center text-[13px] text-[color:var(--color-muted)]">
              <Users className="h-5 w-5 text-[color:var(--color-muted)]" />
              <p className="font-semibold text-[color:var(--color-foreground)]">
                No agents created yet!
              </p>
              <p className="max-w-[420px] text-[12px]">
                Build your first Agent to automate tasks, generate workflows,
                and solve complex problems. Get started and unleash the full
                potential of AI in your projects.
              </p>
            </CardContent>
          </Card>
        </section>

        <section className="mt-6 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-[13px] font-semibold text-[color:var(--color-muted)]">
              Automations
            </h2>
            <Button variant="ghost" size="sm" className="text-[12px]">
              View All
            </Button>
          </div>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            <Card className="border border-[color:var(--color-border)] bg-white shadow-sm">
              <CardContent className="space-y-3 py-4 text-[12px] text-[color:var(--color-muted)]">
                <div className="flex items-center justify-between text-[13px] font-semibold text-[color:var(--color-foreground)]">
                  okk
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-600">
                    Active
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-[color:var(--color-muted)]">
                  <BarChart3 className="h-4 w-4" />
                  Steps
                </div>
                <div className="flex items-center justify-between text-[11px] text-[color:var(--color-muted)]">
                  <span className="flex items-center gap-1">
                    <LayoutGrid className="h-3.5 w-3.5" />
                    1
                  </span>
                  <span>2</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="mt-6 space-y-3">
          <h2 className="text-[13px] font-semibold text-[color:var(--color-muted)]">
            Executions
          </h2>
          <Card className="border border-[color:var(--color-border)] bg-white shadow-sm">
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-[12px] font-semibold text-[color:var(--color-muted)]">
                {project ? formatDate(project.updatedAt) : "Dec 23, 2025"} -{" "}
                {formatDate(new Date().toISOString().slice(0, 10))}
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-[12px]">
                Export
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-12 gap-2 border-b border-[color:var(--color-border)] pb-4">
                {Array.from({ length: 12 }).map((_, index) => (
                  <div
                    key={`bar-${index}`}
                    className="flex h-32 items-end justify-center"
                  >
                    <div
                      className={`w-4 rounded-md ${
                        index === 0
                          ? "bg-[color:var(--color-brand)]"
                          : "bg-[color:var(--color-border)]"
                      }`}
                      style={{ height: index === 0 ? "40%" : "6%" }}
                    />
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-4 pt-4 text-center text-[12px] text-[color:var(--color-muted)]">
                <div>
                  <div className="text-[16px] font-semibold text-[color:var(--color-foreground)]">
                    0
                  </div>
                  Active Agents
                </div>
                <div>
                  <div className="text-[16px] font-semibold text-[color:var(--color-foreground)]">
                    {project ? project.connectedApps : 1}
                  </div>
                  Abilities
                </div>
                <div>
                  <div className="text-[16px] font-semibold text-[color:var(--color-foreground)]">
                    {project ? project.automations : 1}
                  </div>
                  Active Automations
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

          {!project ? (
            <div className="mt-10 rounded-lg border border-[color:var(--color-border)] bg-white p-6 text-sm text-[color:var(--color-muted)]">
              Project not found. Return to Automate Projects to select one.
            </div>
          ) : null}
        </main>
        <aside
          id="polaris-dock"
          className="polaris-rail"
          aria-label="Polaris dock"
        />
      </div>

      {agentModalOpen ? (
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
                onClick={() => setAgentModalOpen(false)}
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
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  className="h-9 rounded-md px-4 text-[13px]"
                >
                  Browse Templates
                </Button>
                <Button
                  className="h-9 gap-2 rounded-md bg-[color:var(--color-brand)] px-4 text-[13px] text-white shadow-sm hover:brightness-105 disabled:opacity-60"
                  disabled={agentDescription.trim().length < 10}
                  onClick={() => {
                    const description = agentDescription.trim();
                    if (description.length < 10) {
                      return;
                    }
                    setAgentModalOpen(false);
                    setPolarisLaunching(true);
                    window.dispatchEvent(new Event("polaris:open"));
                    window.dispatchEvent(new Event("polaris:expand"));
                    window.dispatchEvent(
                      new CustomEvent("polaris:mode", {
                        detail: {
                          mode: "agent-setup",
                          payload: {
                            projectId: params.id,
                            description,
                          },
                        },
                      })
                    );
                    window.setTimeout(() => setPolarisLaunching(false), 1200);
                  }}
                >
                  Create Agent
                  <span className="text-[16px]">→</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
