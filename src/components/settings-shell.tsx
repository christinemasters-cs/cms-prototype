import type { ReactNode } from "react";
import Link from "next/link";
import {
  Activity,
  FileText,
  Plug,
  ScrollText,
  ShieldCheck,
  Users,
} from "lucide-react";

import { ProjectTopNav } from "@/components/project-top-nav";

type SettingsNavItem =
  | "users"
  | "execution"
  | "audit"
  | "variables"
  | "secrets"
  | "apps";

type PageContext =
  | "Dashboard"
  | "Automations"
  | "Agents"
  | "Variables"
  | "Secrets"
  | "Settings";

type SettingsShellProps = {
  projectId: string;
  activeItem?: SettingsNavItem | null;
  pageContext: PageContext;
  children: ReactNode;
};

const navBaseClassName =
  "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] transition";

const navItemClassName = (active: boolean) =>
  `${navBaseClassName} ${
    active
      ? "border border-[color:var(--color-border)] bg-white text-[color:var(--color-foreground)] shadow-sm"
      : "text-[color:var(--color-muted)] hover:bg-white"
  }`;

export function SettingsShell({
  projectId,
  activeItem = null,
  pageContext,
  children,
}: SettingsShellProps) {
  const basePath = `/automations/projects/${projectId}/settings`;

  return (
    <div className="min-h-screen bg-[color:var(--color-background)]">
      <ProjectTopNav
        projectId={projectId}
        active="settings"
        pageContext={pageContext}
      />
      <div className="dashboard-shell">
        <main className="mx-auto w-full px-6 py-6">
          <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
            <aside className="space-y-2">
              <Link
                href={`${basePath}/users`}
                className={navItemClassName(activeItem === "users")}
              >
                <Users className="h-4 w-4" />
                Users
              </Link>
              <Link
                href={`${basePath}/execution-log`}
                className={navItemClassName(activeItem === "execution")}
              >
                <Activity className="h-4 w-4" />
                Execution log
              </Link>
              <Link
                href={`${basePath}/audit-log`}
                className={navItemClassName(activeItem === "audit")}
              >
                <FileText className="h-4 w-4" />
                Audit log
              </Link>
              <Link
                href={`${basePath}/variables`}
                className={navItemClassName(activeItem === "variables")}
              >
                <ScrollText className="h-4 w-4" />
                Variables
              </Link>
              <Link
                href={`${basePath}/secrets`}
                className={navItemClassName(activeItem === "secrets")}
              >
                <ShieldCheck className="h-4 w-4" />
                Secrets
              </Link>
              <Link
                href={`${basePath}/connected-apps`}
                className={navItemClassName(activeItem === "apps")}
              >
                <Plug className="h-4 w-4" />
                Connected Apps
              </Link>
            </aside>
            <div className="space-y-6">{children}</div>
          </div>
        </main>
        <div className="polaris-rail" id="polaris-dock" />
      </div>
    </div>
  );
}
