import { ArrowUpRight, BarChart3, Clock, FileText, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CmsShell } from "@/components/cms-shell";

const statCards = [
  {
    title: "Entries published",
    value: "1,284",
    change: "+12% vs last week",
    icon: FileText,
  },
  {
    title: "Assets processed",
    value: "326",
    change: "+5% vs last week",
    icon: Sparkles,
  },
  {
    title: "Content approvals",
    value: "92",
    change: "+3% vs last week",
    icon: Clock,
  },
  {
    title: "Audience reach",
    value: "2.4M",
    change: "+8% vs last week",
    icon: BarChart3,
  },
];

const recentActivity = [
  {
    title: "Homepage hero updated",
    detail: "Published to Production",
    time: "2 hours ago",
  },
  {
    title: "Release: Q1 feature launch",
    detail: "Scheduled for Feb 3",
    time: "4 hours ago",
  },
  {
    title: "Docs rebuild",
    detail: "Validation succeeded",
    time: "Yesterday",
  },
];

export function CmsDashboard() {
  return (
    <CmsShell active="dashboard">
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[22px] font-semibold text-[color:var(--color-foreground)]">
              CMS Dashboard
            </h1>
            <p className="mt-1 text-[13px] text-[color:var(--color-muted)]">
              Track content health, approvals, and publishing momentum.
            </p>
          </div>
          <Button className="h-9 gap-2 rounded-md bg-[color:var(--color-brand)] px-4 text-[13px] text-white shadow-sm hover:brightness-105">
            View content calendar
            <ArrowUpRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid gap-4 lg:grid-cols-4">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <Card key={card.title} className="border-[color:var(--color-border)]">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-[13px] font-medium text-[color:var(--color-muted)]">
                    {card.title}
                  </CardTitle>
                  <Icon className="h-4 w-4 text-[color:var(--color-brand)]" />
                </CardHeader>
                <CardContent>
                  <div className="text-[26px] font-semibold text-[color:var(--color-foreground)]">
                    {card.value}
                  </div>
                  <p className="mt-1 text-[12px] text-[color:var(--color-muted)]">
                    {card.change}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <Card className="border-[color:var(--color-border)]">
            <CardHeader className="pb-2">
              <CardTitle className="text-[16px] font-semibold">
                Publishing health
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface-muted)]/60 px-4 py-6 text-[13px] text-[color:var(--color-muted)]">
                <div className="text-[12px] uppercase tracking-wide text-[color:var(--color-muted)]">
                  Active pipelines
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-md bg-white px-3 py-3 shadow-sm">
                    <div className="text-[12px] text-[color:var(--color-muted)]">
                      Draft review
                    </div>
                    <div className="text-[18px] font-semibold text-[color:var(--color-foreground)]">
                      18 items
                    </div>
                  </div>
                  <div className="rounded-md bg-white px-3 py-3 shadow-sm">
                    <div className="text-[12px] text-[color:var(--color-muted)]">
                      Pending publish
                    </div>
                    <div className="text-[18px] font-semibold text-[color:var(--color-foreground)]">
                      6 items
                    </div>
                  </div>
                  <div className="rounded-md bg-white px-3 py-3 shadow-sm">
                    <div className="text-[12px] text-[color:var(--color-muted)]">
                      Localized
                    </div>
                    <div className="text-[18px] font-semibold text-[color:var(--color-foreground)]">
                      24 entries
                    </div>
                  </div>
                  <div className="rounded-md bg-white px-3 py-3 shadow-sm">
                    <div className="text-[12px] text-[color:var(--color-muted)]">
                      Assets in review
                    </div>
                    <div className="text-[18px] font-semibold text-[color:var(--color-foreground)]">
                      9 assets
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-[color:var(--color-border)]">
            <CardHeader className="pb-2">
              <CardTitle className="text-[16px] font-semibold">
                Recent activity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentActivity.map((item) => (
                <div
                  key={item.title}
                  className="rounded-lg border border-[color:var(--color-border)] bg-white px-4 py-3 shadow-sm"
                >
                  <div className="text-[13px] font-semibold text-[color:var(--color-foreground)]">
                    {item.title}
                  </div>
                  <div className="text-[12px] text-[color:var(--color-muted)]">
                    {item.detail}
                  </div>
                  <div className="mt-2 text-[11px] text-[color:var(--color-muted)]">
                    {item.time}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </CmsShell>
  );
}
