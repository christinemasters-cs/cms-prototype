"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Filter,
  Plus,
  Search,
  Settings,
  Sparkles,
  Star,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { PolarisPanel } from "@/components/polaris-panel";

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

const seedProjects: Project[] = [
  {
    id: "execution-logs",
    name: "Execution Logs",
    automations: 1,
    connectedApps: 2,
    members: 1,
    updatedAt: "2025-12-30",
    starred: false,
  },
  {
    id: "christine-agents",
    name: "Christine Agents",
    automations: 0,
    connectedApps: 0,
    members: 1,
    updatedAt: "2025-12-26",
    starred: false,
  },
  {
    id: "agents-by-om",
    name: "Agents by Om",
    automations: 1,
    connectedApps: 4,
    members: 1,
    updatedAt: "2025-12-22",
    starred: false,
  },
  {
    id: "aditya-test",
    name: "Aditya Test",
    automations: 0,
    connectedApps: 1,
    members: 1,
    updatedAt: "2025-12-09",
    starred: false,
  },
  {
    id: "adwait",
    name: "Adwait",
    automations: 0,
    connectedApps: 0,
    members: 1,
    updatedAt: "2025-12-09",
    starred: false,
  },
  {
    id: "vishnu-project",
    name: "Vishnu project",
    automations: 0,
    connectedApps: 0,
    members: 1,
    updatedAt: "2025-12-04",
    starred: false,
  },
  {
    id: "test-empty-agents",
    name: "test-empty-agents",
    automations: 0,
    connectedApps: 2,
    members: 1,
    updatedAt: "2025-12-02",
    starred: false,
  },
  {
    id: "test-agents",
    name: "test-agents",
    automations: 3,
    connectedApps: 7,
    members: 1,
    updatedAt: "2025-12-02",
    starred: false,
  },
  {
    id: "system",
    name: "SYSTEM",
    automations: 0,
    connectedApps: 1,
    members: 1,
    updatedAt: "2025-08-29",
    starred: false,
  },
  {
    id: "test-prat",
    name: "Test - Prat",
    automations: 2,
    connectedApps: 7,
    members: 1,
    updatedAt: "2025-12-02",
    starred: false,
  },
  {
    id: "hello",
    name: "hello",
    automations: 20,
    connectedApps: 5,
    members: 1,
    updatedAt: "2025-02-06",
    starred: false,
  },
];

const formatDate = (value: string) => {
  const date = new Date(`${value}T00:00:00`);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");

export function AutomateProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Project[];
      setProjects(parsed);
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seedProjects));
    setProjects(seedProjects);
  }, []);

  useEffect(() => {
    if (projects.length === 0) {
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  }, [projects]);

  const filtered = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    if (!normalized) {
      return projects;
    }
    return projects.filter((project) =>
      project.name.toLowerCase().includes(normalized)
    );
  }, [projects, search]);

  const handleCreate = () => {
    const trimmed = newName.trim();
    if (!trimmed) {
      return;
    }
    const id = slugify(trimmed);
    const newProject: Project = {
      id: `${id}-${Date.now()}`,
      name: trimmed,
      automations: 0,
      connectedApps: 0,
      members: 1,
      updatedAt: new Date().toISOString().slice(0, 10),
      starred: false,
    };
    setProjects((prev) => [newProject, ...prev]);
    setNewName("");
    setCreating(false);
  };

  const handleDelete = (project: Project) => {
    const confirmed = window.confirm(
      `Delete "${project.name}"? This cannot be undone.`
    );
    if (!confirmed) {
      return;
    }
    setProjects((prev) => prev.filter((item) => item.id !== project.id));
  };

  const handleStar = (project: Project) => {
    setProjects((prev) =>
      prev.map((item) =>
        item.id === project.id ? { ...item, starred: !item.starred } : item
      )
    );
  };

  return (
    <div className="min-h-screen bg-[color:var(--color-background)]">
      <header className="sticky top-0 z-20 border-b border-[color:var(--color-border)] bg-white/95 backdrop-blur">
        <div className="mx-auto flex w-full items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 items-center gap-2 rounded-md border border-[color:var(--color-border)] bg-white px-3 text-[13px] font-semibold text-[color:var(--color-brand)] shadow-sm">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[color:var(--color-brand-soft)]">
                <Sparkles className="h-4 w-4 text-[color:var(--color-brand)]" />
              </div>
              Contentstack Agent OS
            </div>
            <Button variant="ghost" size="sm" className="gap-2 text-[13px]">
              <Settings className="h-4 w-4" />
              Settings
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <PolarisPanel pageContext="Automations" />
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Sparkles className="h-4 w-4 text-[color:var(--color-brand)]" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <span className="text-sm font-semibold text-[color:var(--color-muted)]">
                ?
              </span>
            </Button>
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[color:var(--color-border)] text-[11px] font-semibold text-[color:var(--color-muted)]">
              CM
            </div>
          </div>
        </div>
      </header>

      <div className="dashboard-shell">
        <main className="mx-auto w-full px-6 py-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              <h1 className="text-[20px] font-semibold text-[color:var(--text-primary-text-gray-900-body-black)]">
                Automate Projects
              </h1>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--color-muted)]" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search for projects..."
                  className="h-9 w-[320px] rounded-md border-[color:var(--color-border)] pl-9 text-[13px]"
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 border border-[color:var(--color-border)]"
                aria-label="Filter projects"
              >
                <Filter className="h-4 w-4 text-[color:var(--color-muted)]" />
              </Button>
            </div>
            <Button
              onClick={() => setCreating((prev) => !prev)}
              className="h-9 gap-2 rounded-md bg-[color:var(--color-brand)] px-4 text-[13px] text-white shadow-sm hover:brightness-105"
            >
              <Plus className="h-4 w-4" />
              New Project
            </Button>
          </div>

        {creating ? (
          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg border border-[color:var(--color-border)] bg-white p-4 shadow-sm">
            <Input
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              placeholder="Project name"
              className="h-9 w-[280px] rounded-md border-[color:var(--color-border)] text-[13px]"
            />
            <Button
              onClick={handleCreate}
              className="h-9 gap-2 rounded-md bg-[color:var(--color-brand)] px-4 text-[13px] text-white shadow-sm hover:brightness-105"
            >
              Create project
            </Button>
            <Button
              variant="ghost"
              className="h-9 text-[13px]"
              onClick={() => {
                setCreating(false);
                setNewName("");
              }}
            >
              Cancel
            </Button>
          </div>
        ) : null}

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {filtered.map((project) => (
            <Card
              key={project.id}
              className="relative rounded-xl border border-[color:var(--color-border)] bg-white shadow-sm transition hover:border-[color:var(--color-brand)]"
            >
              <Link
                href={`/automations/projects/${project.id}`}
                className="absolute inset-0 z-0 rounded-xl"
                aria-label={`Open ${project.name}`}
              />
              <CardHeader className="flex-row items-start justify-between space-y-0 pb-2">
                <CardTitle className="text-[14px] font-semibold text-[color:var(--color-foreground)]">
                  {project.name}
                </CardTitle>
                <div className="relative z-10 flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`h-7 w-7 ${
                      project.starred ? "text-[color:var(--color-brand)]" : ""
                    }`}
                    aria-label={
                      project.starred ? "Unstar project" : "Star project"
                    }
                    onClick={(event) => {
                      event.preventDefault();
                      handleStar(project);
                    }}
                  >
                    <Star className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-[color:var(--color-muted)]"
                    aria-label="Delete project"
                    onClick={(event) => {
                      event.preventDefault();
                      handleDelete(project);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-center text-[12px] text-[color:var(--color-muted)]">
                  <div className="rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface-muted)]/40 py-2">
                    <div className="text-[16px] font-semibold text-[color:var(--color-foreground)]">
                      {project.automations}
                    </div>
                    Automations
                  </div>
                  <div className="rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface-muted)]/40 py-2">
                    <div className="text-[16px] font-semibold text-[color:var(--color-foreground)]">
                      {project.connectedApps}
                    </div>
                    Connected Apps
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-md bg-[color:var(--color-brand-soft)]/50 px-3 py-2 text-[12px] text-[color:var(--color-muted)]">
                  <span>{project.members} User</span>
                  <span>{formatDate(project.updatedAt)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

          {filtered.length === 0 ? (
            <div className="mt-12 text-center text-sm text-[color:var(--color-muted)]">
              No projects match your search.
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
