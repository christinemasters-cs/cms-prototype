"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { useParams } from "next/navigation";

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

export function AgentsList() {
  const params = useParams<{ id: string }>();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return;
    }
    const parsed = JSON.parse(stored) as Agent[];
    setAgents(parsed.filter((agent) => agent.projectId === params.id));
  }, [params.id]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return agents;
    }
    return agents.filter((agent) =>
      [agent.name, agent.description]
        .join(" ")
        .toLowerCase()
        .includes(normalized)
    );
  }, [agents, query]);

  const handleCreateAgent = () => {
    window.dispatchEvent(new Event("polaris:open"));
    window.dispatchEvent(new Event("polaris:expand"));
    window.dispatchEvent(
      new CustomEvent("polaris:mode", {
        detail: {
          mode: "agent-setup",
          payload: {
            projectId: params.id ?? "",
            description: "",
          },
        },
      })
    );
  };

  return (
    <div className="min-h-screen bg-[color:var(--color-background)]">
      <ProjectTopNav
        projectId={params.id ?? ""}
        active="agents"
        pageContext="Agents"
      />
      <div className="dashboard-shell">
        <main className="mx-auto w-full px-6 py-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-[12px] text-[color:var(--color-muted)]">
                Automate Projects
              </p>
              <h1 className="text-[18px] font-semibold text-[color:var(--color-foreground)]">
                Agents
              </h1>
            </div>
            <Button
              className="h-9 gap-2 rounded-md bg-[color:var(--color-brand)] px-4 text-[13px] text-white shadow-sm hover:brightness-105"
              onClick={handleCreateAgent}
            >
              <Plus className="h-4 w-4" />
              New Agent
            </Button>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <div className="relative w-full max-w-[320px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--color-muted)]" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search agents..."
                className="h-9 w-full rounded-md border-[color:var(--color-border)] pl-9 text-[13px]"
              />
            </div>
            <span className="text-[12px] text-[color:var(--color-muted)]">
              {filtered.length} agent{filtered.length === 1 ? "" : "s"}
            </span>
          </div>

          {filtered.length === 0 ? (
            <div className="mt-6 rounded-lg border border-dashed border-[color:var(--color-border)] bg-white px-6 py-10 text-center text-[13px] text-[color:var(--color-muted)]">
              No agents yet. Create your first agent to start automating.
            </div>
          ) : (
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map((agent) => (
                <Card
                  key={agent.id}
                  className="border-[color:var(--color-border)] shadow-sm transition hover:border-[color:var(--color-brand)]"
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-[15px] font-semibold text-[color:var(--color-foreground)]">
                      <Link
                        href={`/automations/projects/${params.id}/agents/${agent.id}`}
                        className="hover:text-[color:var(--color-brand)]"
                      >
                        {agent.name}
                      </Link>
                    </CardTitle>
                    <p className="text-[12px] text-[color:var(--color-muted)]">
                      {agent.description}
                    </p>
                  </CardHeader>
                  <CardContent className="flex flex-wrap items-center gap-3 text-[11px] text-[color:var(--color-muted)]">
                    <span className="rounded-full bg-[color:var(--color-surface-muted)]/70 px-2 py-1">
                      {agent.triggers[0] ?? "Trigger"}
                    </span>
                    <span className="rounded-full bg-[color:var(--color-surface-muted)]/70 px-2 py-1">
                      {agent.tools.length} tool{agent.tools.length === 1 ? "" : "s"}
                    </span>
                    <span className="ml-auto text-[11px] font-medium text-[color:var(--color-brand)]">
                      {agent.active ? "Active" : "Paused"}
                    </span>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>
        <div className="polaris-rail" id="polaris-dock" />
      </div>
    </div>
  );
}
