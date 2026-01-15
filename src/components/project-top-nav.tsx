"use client";

import Link from "next/link";
import { Settings, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PolarisPanel } from "@/components/polaris-panel";

type ProjectTopNavProps = {
  projectId: string;
  active: "dashboard" | "automations" | "agents" | "settings";
  pageContext: "Dashboard" | "Automations" | "Agents";
};

const buildClassName = (isActive: boolean) =>
  `transition ${
    isActive
      ? "text-[color:var(--color-foreground)]"
      : "text-[color:var(--color-muted)] hover:text-[color:var(--color-foreground)]"
  }`;

export function ProjectTopNav({
  projectId,
  active,
  pageContext,
}: ProjectTopNavProps) {
  const basePath = projectId
    ? `/automations/projects/${projectId}`
    : "/automations/projects";

  return (
    <header className="sticky top-0 z-20 border-b border-[color:var(--color-border)] bg-white/95 backdrop-blur">
      <div className="mx-auto flex w-full items-center justify-between px-6 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 items-center gap-2 rounded-md border border-[color:var(--color-border)] bg-white px-3 text-[13px] font-semibold text-[color:var(--color-brand)] shadow-sm">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[color:var(--color-brand-soft)]">
              <Sparkles className="h-4 w-4 text-[color:var(--color-brand)]" />
            </div>
            Contentstack Agent OS
          </div>
          <nav className="flex items-center gap-3 text-[13px] font-medium">
            <Link
              href={basePath}
              className={buildClassName(active === "dashboard")}
              aria-current={active === "dashboard" ? "page" : undefined}
            >
              Dashboard
            </Link>
            <Link
              href={`${basePath}/automations`}
              className={buildClassName(active === "automations")}
              aria-current={active === "automations" ? "page" : undefined}
            >
              Automations
            </Link>
            <Link
              href={`${basePath}/agents`}
              className={buildClassName(active === "agents")}
              aria-current={active === "agents" ? "page" : undefined}
            >
              Agents
            </Link>
            <span
              className={buildClassName(active === "settings")}
              aria-current={active === "settings" ? "page" : undefined}
            >
              Settings
            </span>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <PolarisPanel pageContext={pageContext} />
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Settings className="h-4 w-4 text-[color:var(--color-muted)]" />
          </Button>
          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[color:var(--color-border)] text-[11px] font-semibold text-[color:var(--color-muted)]">
            CM
          </div>
        </div>
      </div>
    </header>
  );
}
