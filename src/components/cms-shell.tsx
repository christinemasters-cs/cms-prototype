import type { ReactNode } from "react";
import {
  AppWindow,
  Bell,
  BookOpen,
  Boxes,
  ClipboardCheck,
  Gauge,
  HelpCircle,
  LayoutGrid,
  Package,
  PenTool,
  Rocket,
  Search,
  Settings,
} from "lucide-react";

import { AppSwitcher } from "@/components/app-switcher";
import { CmsBadge } from "@/components/cms-badge";
import { PolarisPanel } from "@/components/polaris-panel";
import { Button } from "@/components/ui/button";

type CmsShellProps = {
  active: "dashboard" | "entries" | "visual";
  children: ReactNode;
};

const navItems = [
  { label: "Dashboard", href: "/cms/dashboard", icon: Gauge, id: "dashboard" },
  { label: "Entries", href: "/cms/entries", icon: LayoutGrid, id: "entries" },
  { label: "Assets", href: "/cms/assets", icon: Boxes, disabled: true },
  { label: "Content Models", href: "/cms/models", icon: BookOpen, disabled: true },
  { label: "Visual Experience", href: "/cms/visual", icon: PenTool, id: "visual" },
  { label: "Publish Queue", href: "/cms/publish", icon: Rocket, disabled: true },
  { label: "Releases", href: "/cms/releases", icon: Package, disabled: true },
  { label: "Tasks", href: "/cms/tasks", icon: ClipboardCheck, disabled: true },
  { label: "Settings", href: "/cms/settings", icon: Settings, disabled: true },
  { label: "Apps", href: "/cms/apps", icon: AppWindow, disabled: true },
];

export function CmsShell({ active, children }: CmsShellProps) {
  return (
    <div className="min-h-screen bg-[color:var(--color-background)]">
      <header className="sticky top-0 z-20 border-b border-[color:var(--color-border)] bg-white/95 backdrop-blur">
        <div className="mx-auto flex w-full items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <CmsBadge />
            <nav className="flex items-center gap-2 text-[12px] font-semibold text-[color:var(--color-muted)]">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = item.id === active;
                const isDisabled = item.disabled ?? false;
                return (
                  <a
                    key={item.label}
                    href={item.href ?? "#"}
                    className={`flex items-center gap-1.5 rounded-md px-2 py-1 transition ${
                      isActive
                        ? "text-[color:var(--color-foreground)]"
                        : "hover:text-[color:var(--color-foreground)]"
                    } ${isDisabled ? "cursor-default opacity-50" : ""}`}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </a>
                );
              })}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <PolarisPanel pageContext="CMS" />
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
      <div className="dashboard-shell">
        <main className="mx-auto w-full bg-[#f7f9fc] px-10 py-8">
          {children}
        </main>
        <aside id="polaris-dock" className="polaris-rail" aria-label="Polaris dock" />
      </div>
    </div>
  );
}
