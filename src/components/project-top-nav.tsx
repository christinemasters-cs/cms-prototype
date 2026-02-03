"use client";

import Link from "next/link";
import { Bell, HelpCircle, Search } from "lucide-react";

import { AgentOsBadge } from "@/components/agent-os-badge";
import { AppSwitcher } from "@/components/app-switcher";
import { Button } from "@/components/ui/button";
import { PolarisPanel } from "@/components/polaris-panel";

type ProjectTopNavProps = {
  projectId: string;
  active: "dashboard" | "automations" | "agents" | "settings";
  pageContext:
    | "Dashboard"
    | "Automations"
    | "Agents"
    | "Variables"
    | "Secrets"
    | "Settings";
};

const iconClassName = (isActive: boolean) =>
  isActive
    ? "text-[color:var(--color-foreground)]"
    : "text-[color:var(--color-muted)] group-hover:text-[color:var(--color-foreground)]";

const DashboardIcon = ({ active }: { active: boolean }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    className={iconClassName(active)}
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M2 16c0-.984.798-1.782 1.782-1.782h9.163c.985 0 1.782.798 1.782 1.782v12.218c0 .984-.797 1.782-1.782 1.782H3.782A1.782 1.782 0 012 28.218V16zm1.782-.255a.254.254 0 00-.255.255v12.218c0 .14.114.255.255.255h9.163c.141 0 .255-.114.255-.255V16a.255.255 0 00-.255-.255H3.782zM17.273 3.782c0-.984.797-1.782 1.782-1.782h9.163C29.202 2 30 2.798 30 3.782V16c0 .984-.798 1.782-1.782 1.782h-9.163A1.782 1.782 0 0117.273 16V3.782zm1.782-.255a.255.255 0 00-.255.255V16c0 .14.114.255.255.255h9.163c.14 0 .255-.114.255-.255V3.782a.254.254 0 00-.255-.255h-9.163zM2 3.782C2 2.798 2.798 2 3.782 2h9.163c.985 0 1.782.798 1.782 1.782V9.89c0 .984-.797 1.782-1.782 1.782H3.782A1.782 1.782 0 012 9.89V3.78zm1.782-.255a.255.255 0 00-.255.255V9.89c0 .14.114.255.255.255h9.163c.141 0 .255-.115.255-.255V3.78a.255.255 0 00-.255-.254H3.782zM17.273 22.11c0-.985.797-1.783 1.782-1.783h9.163c.984 0 1.782.798 1.782 1.782v6.11c0 .983-.798 1.781-1.782 1.781h-9.163a1.782 1.782 0 01-1.782-1.782V22.11zm1.782-.255a.255.255 0 00-.255.254v6.11c0 .14.114.254.255.254h9.163c.14 0 .255-.114.255-.255V22.11a.255.255 0 00-.255-.255h-9.163z"
      fill="currentColor"
    />
  </svg>
);

const AutomationsIcon = ({ active }: { active: boolean }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    className={iconClassName(active)}
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M18.25 24a4.75 4.75 0 119.5 0 4.75 4.75 0 01-9.5 0zM23 20.75a3.25 3.25 0 100 6.5 3.25 3.25 0 000-6.5z"
      fill="currentColor"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M20 3.25A1.75 1.75 0 0018.25 5v2.25h-3.726C8.85 7.25 4.25 11.85 4.25 17.524v.235a7.994 7.994 0 006.566 7.864l-1.584.729a.75.75 0 00.627 1.363l3.42-1.573a.75.75 0 00.298-1.115l-2.342-3.31a.75.75 0 10-1.224.867l1.11 1.57a6.493 6.493 0 01-5.371-6.395v-.235a8.774 8.774 0 018.774-8.774h3.726V11c0 .966.784 1.75 1.75 1.75h6A1.75 1.75 0 0027.75 11V5A1.75 1.75 0 0026 3.25h-6zM19.75 11c0 .138.112.25.25.25h6a.25.25 0 00.25-.25V5a.25.25 0 00-.25-.25h-6a.25.25 0 00-.25.25v6z"
      fill="currentColor"
    />
  </svg>
);

const AgentsIcon = ({ active }: { active: boolean }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    className={iconClassName(active)}
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M19 3.25a.75.75 0 01.75.75v6.25H26a.75.75 0 010 1.5h-7a.75.75 0 01-.75-.75V4a.75.75 0 01.75-.75z"
      fill="currentColor"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M5.763 3.763A1.75 1.75 0 017 3.25h12a.75.75 0 01.53.22l7 7c.141.14.22.331.22.53v16A1.75 1.75 0 0125 28.75h-3a.75.75 0 010-1.5h3a.25.25 0 00.25-.25V11.31l-6.56-6.56H7a.25.25 0 00-.25.25v13a.75.75 0 01-1.5 0V5c0-.464.184-.91.513-1.237z"
      fill="currentColor"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M16.84 21.25a.75.75 0 01.75.75v6a.75.75 0 01-1.5 0v-6a.75.75 0 01.75-.75zM10.502 21.669a.75.75 0 00-1.325 0l-3.166 5.98a.75.75 0 101.325.702l.72-1.36h3.567l.72 1.36a.75.75 0 001.326-.702l-3.167-5.98zm.327 3.822l-.99-1.869-.989 1.869h1.979z"
      fill="currentColor"
    />
  </svg>
);

const SettingsIcon = ({ active }: { active: boolean }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    className={iconClassName(active)}
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M16.638 3.111a.251.251 0 00-.208-.024 4.639 4.639 0 00-1.703.998.257.257 0 00-.082.193l.02 1.186a3.394 3.394 0 00-.205.357l-1.028.575a.256.256 0 00-.125.17 4.652 4.652 0 00.004 1.987.256.256 0 00.124.168l1.025.575c.061.124.13.245.204.36l-.02 1.184a.257.257 0 00.083.193 4.578 4.578 0 001.709.994c.069.022.144.013.206-.025l1.006-.608c.136.007.271.007.407 0l1.01.612a.251.251 0 00.208.024 4.637 4.637 0 001.703-.997.257.257 0 00.082-.193l-.02-1.186a3.41 3.41 0 00.205-.358l1.029-.575a.256.256 0 00.124-.169 4.652 4.652 0 00-.004-1.987.256.256 0 00-.124-.168l-1.025-.575a3.414 3.414 0 00-.204-.358l.02-1.186a.257.257 0 00-.083-.193 4.579 4.579 0 00-1.709-.994.251.251 0 00-.206.025l-1.006.607a3.945 3.945 0 00-.407 0l-1.01-.612zm-1.465 2.426l-.02-1.15c.39-.34.84-.602 1.325-.776l.977.592c.045.027.097.04.149.036.165-.012.33-.012.496 0a.251.251 0 00.148-.036l.973-.588c.488.17.938.432 1.329.772l-.02 1.15c0 .053.015.106.046.15.093.136.175.278.245.428.022.048.06.089.106.115l.993.557c.098.51.1 1.034.004 1.544l-.997.557a.255.255 0 00-.106.115c-.07.15-.152.292-.245.427a.258.258 0 00-.046.151l.02 1.15c-.39.34-.84.602-1.325.775l-.977-.591a.252.252 0 00-.148-.036 3.424 3.424 0 01-.497 0 .252.252 0 00-.148.035l-.973.589a4.071 4.071 0 01-1.329-.773l.02-1.145a.258.258 0 00-.044-.148 3.171 3.171 0 01-.247-.434.256.256 0 00-.106-.115l-.993-.557a4.134 4.134 0 01-.003-1.544l.996-.557a.255.255 0 00.107-.115c.069-.15.15-.292.244-.428a.258.258 0 00.046-.15zm.904 2.022c0-.99.795-1.792 1.775-1.792.98 0 1.774.802 1.774 1.792s-.794 1.792-1.774 1.792-1.775-.802-1.775-1.792zm1.775-2.304A2.293 2.293 0 0015.57 7.56a2.293 2.293 0 002.282 2.304 2.293 2.293 0 002.281-2.304 2.293 2.293 0 00-2.281-2.304zM7.09 9.128a.365.365 0 00-.302-.035 6.731 6.731 0 00-2.472 1.448.373.373 0 00-.12.28l.029 1.722c-.11.167-.208.34-.297.519l-1.493.834a.371.371 0 00-.18.246 6.752 6.752 0 00.006 2.885.371.371 0 00.18.244l1.487.835c.09.18.188.354.297.523l-.029 1.717a.373.373 0 00.12.281 6.645 6.645 0 002.48 1.442c.1.032.21.02.3-.035l1.46-.882c.197.01.394.01.59 0l1.467.888a.365.365 0 00.302.035 6.732 6.732 0 002.472-1.448.373.373 0 00.12-.28l-.029-1.722c.11-.167.209-.34.297-.519l1.493-.835a.371.371 0 00.18-.245 6.753 6.753 0 00-.006-2.886.371.371 0 00-.18-.243l-1.487-.835a4.939 4.939 0 00-.297-.519l.029-1.721a.373.373 0 00-.12-.281 6.647 6.647 0 00-2.48-1.443.365.365 0 00-.3.036l-1.46.882a5.694 5.694 0 00-.59 0L7.09 9.128zm-2.127 3.52l-.028-1.668a5.998 5.998 0 011.923-1.126l1.418.859c.065.039.14.057.215.052.24-.018.48-.018.72 0a.364.364 0 00.216-.052l1.413-.854a5.911 5.911 0 011.928 1.12l-.028 1.67a.374.374 0 00.066.218c.136.196.255.404.355.62a.37.37 0 00.155.167l1.441.81c.143.74.145 1.5.006 2.24l-1.447.81a.37.37 0 00-.155.166c-.1.217-.219.424-.354.62a.374.374 0 00-.067.22l.028 1.668a5.997 5.997 0 01-1.923 1.126l-1.418-.859a.366.366 0 00-.215-.052c-.24.017-.48.017-.72 0a.366.366 0 00-.216.052l-1.413.854a5.911 5.911 0 01-1.928-1.121l.028-1.662a.374.374 0 00-.064-.216 4.6 4.6 0 01-.358-.63.37.37 0 00-.154-.167l-1.441-.809a6.002 6.002 0 01-.006-2.24l1.447-.81a.37.37 0 00.155-.167 4.2 4.2 0 01.355-.62.374.374 0 00.066-.219zm1.313 2.936c0-1.437 1.153-2.601 2.576-2.601 1.422 0 2.576 1.164 2.576 2.601 0 1.436-1.154 2.601-2.576 2.601-1.423 0-2.576-1.165-2.576-2.601zm2.576-3.344c-1.83 0-3.312 1.497-3.312 3.344 0 1.847 1.483 3.344 3.312 3.344 1.829 0 3.312-1.497 3.312-3.344 0-1.847-1.483-3.344-3.312-3.344z"
      fill="currentColor"
    />
  </svg>
);

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
          <AgentOsBadge />
          <nav className="flex items-center gap-3 text-[12px] font-medium text-[color:var(--color-muted)]">
            <Link
              href={basePath}
              className={`group flex items-center gap-2 rounded-md px-2 py-1 transition ${
                active === "dashboard"
                  ? "text-[color:var(--color-foreground)]"
                  : "hover:text-[color:var(--color-foreground)]"
              }`}
              aria-current={active === "dashboard" ? "page" : undefined}
            >
              <DashboardIcon active={active === "dashboard"} />
              Dashboard
            </Link>
            <Link
              href={`${basePath}/automations`}
              className={`group flex items-center gap-2 rounded-md px-2 py-1 transition ${
                active === "automations"
                  ? "text-[color:var(--color-foreground)]"
                  : "hover:text-[color:var(--color-foreground)]"
              }`}
              aria-current={active === "automations" ? "page" : undefined}
            >
              <AutomationsIcon active={active === "automations"} />
              Automations
            </Link>
            <Link
              href={`${basePath}/agents`}
              className={`group flex items-center gap-2 rounded-md px-2 py-1 transition ${
                active === "agents"
                  ? "text-[color:var(--color-foreground)]"
                  : "hover:text-[color:var(--color-foreground)]"
              }`}
              aria-current={active === "agents" ? "page" : undefined}
            >
              <AgentsIcon active={active === "agents"} />
              Agents
            </Link>
            <Link
              href={`${basePath}/settings`}
              className={`group flex items-center gap-2 rounded-md px-2 py-1 transition ${
                active === "settings"
                  ? "text-[color:var(--color-foreground)]"
                  : "hover:text-[color:var(--color-foreground)]"
              }`}
              aria-current={active === "settings" ? "page" : undefined}
            >
              <SettingsIcon active={active === "settings"} />
              Settings
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <PolarisPanel pageContext={pageContext} />
          <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Search">
            <Search className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Help">
            <HelpCircle className="h-5 w-5" />
          </Button>
          <AppSwitcher />
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[color:var(--color-surface-muted)] text-[11px] font-semibold">
            CM
          </div>
        </div>
      </div>
    </header>
  );
}
