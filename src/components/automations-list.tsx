"use client";

import { Plus, Search } from "lucide-react";
import { useParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ProjectTopNav } from "@/components/project-top-nav";

const sampleAutomations = [
  {
    id: "automation-1",
    name: "Release Notes Digest",
    description: "Summarize release notes and post to Slack.",
    runs: "24 runs",
  },
  {
    id: "automation-2",
    name: "Incident Brief Builder",
    description: "Build an incident summary and alert the on-call channel.",
    runs: "8 runs",
  },
];

export function AutomationsList() {
  const params = useParams<{ id: string }>();

  return (
    <div className="min-h-screen bg-[color:var(--color-background)]">
      <ProjectTopNav
        projectId={params.id ?? ""}
        active="automations"
        pageContext="Automations"
      />
      <div className="dashboard-shell">
        <main className="mx-auto w-full px-6 py-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-[12px] text-[color:var(--color-muted)]">
                Automate Projects
              </p>
              <h1 className="text-[18px] font-semibold text-[color:var(--color-foreground)]">
                Automations
              </h1>
            </div>
            <Button
              className="h-9 gap-2 rounded-md bg-[color:var(--color-brand)] px-4 text-[13px] text-white shadow-sm hover:brightness-105"
            >
              <Plus className="h-4 w-4" />
              New Automation
            </Button>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <div className="relative w-full max-w-[320px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--color-muted)]" />
              <Input
                placeholder="Search automations..."
                className="h-9 w-full rounded-md border-[color:var(--color-border)] pl-9 text-[13px]"
              />
            </div>
            <span className="text-[12px] text-[color:var(--color-muted)]">
              {sampleAutomations.length} automations
            </span>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {sampleAutomations.map((automation) => (
              <Card
                key={automation.id}
                className="border-[color:var(--color-border)] shadow-sm"
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-[15px] font-semibold text-[color:var(--color-foreground)]">
                    {automation.name}
                  </CardTitle>
                  <p className="text-[12px] text-[color:var(--color-muted)]">
                    {automation.description}
                  </p>
                </CardHeader>
                <CardContent className="flex items-center justify-between text-[11px] text-[color:var(--color-muted)]">
                  <span className="rounded-full bg-[color:var(--color-surface-muted)]/70 px-2 py-1">
                    Active
                  </span>
                  <span>{automation.runs}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        </main>
        <div className="polaris-rail" id="polaris-dock" />
      </div>
    </div>
  );
}
