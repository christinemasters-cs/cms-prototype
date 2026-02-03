"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { MoreVertical, Plus, Search } from "lucide-react";
import { useParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ProjectTopNav } from "@/components/project-top-nav";
import { AgentCreateOverlay } from "@/components/agent-create-overlay";

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

export function AgentsList() {
  const params = useParams<{ id: string }>();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    if (!params.id) {
      setLoading(false);
      return;
    }
    const loadAgents = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `/api/agents?projectId=${encodeURIComponent(params.id)}`
        );
        const data = (await response.json()) as
          | { ok: true; items: Agent[] }
          | { ok: false; error: string };
        if (!data.ok) {
          throw new Error(data.error);
        }
        setAgents(data.items);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load agents.");
      } finally {
        setLoading(false);
      }
    };
    void loadAgents();
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
    if (!params.id) {
      window.alert("Project ID is required to create an agent.");
      return;
    }
    setCreateOpen(true);
  };

  const handleDeleteAgent = async (agentId: string) => {
    if (!params.id) {
      return;
    }
    const confirmed = window.confirm("Delete this agent? This cannot be undone.");
    if (!confirmed) {
      return;
    }
    try {
      const response = await fetch("/api/agents", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: params.id, id: agentId }),
      });
      const data = (await response.json()) as { ok: boolean; error?: string };
      if (!data.ok) {
        throw new Error(data.error ?? "Failed to delete agent.");
      }
      setAgents((prev) => prev.filter((agent) => agent.id !== agentId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete agent.");
    } finally {
      setMenuOpenId(null);
    }
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

          {error ? (
            <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-6 py-4 text-[12px] text-red-600">
              {error}
            </div>
          ) : null}

          {loading ? (
            <div className="mt-6 text-[12px] text-[color:var(--color-muted)]">
              Loading agents...
            </div>
          ) : null}

          {!loading && filtered.length === 0 ? (
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
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-[15px] font-semibold text-[color:var(--color-foreground)]">
                        <Link
                          href={`/automations/projects/${params.id}/agents/${agent.id}`}
                          className="hover:text-[color:var(--color-brand)]"
                        >
                          {agent.name}
                        </Link>
                      </CardTitle>
                      <div className="relative">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          aria-label="Agent actions"
                          onClick={() =>
                            setMenuOpenId((prev) =>
                              prev === agent.id ? null : agent.id
                            )
                          }
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                        {menuOpenId === agent.id ? (
                          <div className="absolute right-0 top-9 z-10 w-32 rounded-md border border-[color:var(--color-border)] bg-white p-1 text-[12px] shadow-lg">
                            <Link
                              href={`/automations/projects/${params.id}/agents/${agent.id}`}
                              className="block rounded px-2 py-1.5 text-[color:var(--color-foreground)] hover:bg-[color:var(--color-surface-muted)]"
                              onClick={() => setMenuOpenId(null)}
                            >
                              Edit
                            </Link>
                            <button
                              type="button"
                              className="block w-full rounded px-2 py-1.5 text-left text-[color:var(--color-foreground)] hover:bg-[color:var(--color-surface-muted)]"
                              onClick={() => void handleDeleteAgent(agent.id)}
                            >
                              Delete
                            </button>
                          </div>
                        ) : null}
                      </div>
                    </div>
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
      <AgentCreateOverlay
        open={createOpen}
        projectId={params.id ?? ""}
        onClose={() => setCreateOpen(false)}
      />
    </div>
  );
}
