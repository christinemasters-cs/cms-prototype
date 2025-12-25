import {
  BarChart3,
  Bell,
  BookOpen,
  Bot,
  Code2,
  GraduationCap,
  HelpCircle,
  ImagePlus,
  LayoutGrid,
  Palette,
  Rocket,
  Search,
  ShieldCheck,
  Sparkles,
  Store,
  UserRound,
  Workflow,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

const appCards = [
  {
    title: "Headless CMS",
    description: "Create content using best-in-class CMS",
    icon: LayoutGrid,
  },
  {
    title: "Personalize",
    description: "Target users with tailored content",
    icon: UserRound,
  },
  {
    title: "Data & Insights",
    description: "Personalize with real-time customer data",
    icon: BarChart3,
  },
  {
    title: "Automate",
    description: "Integrate and simplify with clicks, not code",
    icon: Workflow,
  },
  {
    title: "Brand Kit",
    description: "Define brand tone using AI rules",
    icon: Palette,
  },
  {
    title: "Launch",
    description: "Deploy, host, and scale your sites",
    icon: Rocket,
  },
  {
    title: "Developer Hub",
    description: "Build and manage custom apps",
    icon: Code2,
  },
  {
    title: "Marketplace",
    description: "Bring together world-class products",
    icon: Store,
  },
  {
    title: "Academy",
    description: "Learn Contentstack with guided courses",
    icon: GraduationCap,
  },
  {
    title: "Analytics",
    description: "View usage data across Contentstack",
    icon: BarChart3,
  },
  {
    title: "Administration",
    description: "Manage users, roles, and permissions",
    icon: ShieldCheck,
  },
  {
    title: "Asset Management",
    description: "Organize, manage, and distribute assets",
    icon: ImagePlus,
  },
];

const trainingCards = [
  {
    title: "Omni-channel Personalization",
    label: "Demo",
    duration: "13m 16s",
    icon: Sparkles,
  },
  {
    title: "Understanding Journey Orchestration",
    label: "Explainer",
    duration: "12m",
    icon: BookOpen,
  },
  {
    title: "Understanding Automate",
    label: "Explainer",
    duration: "9m 39s",
    icon: Workflow,
  },
];

const quickLinks = [
  { label: "Explore Apps", icon: LayoutGrid },
  { label: "Read Docs", icon: BookOpen },
  { label: "Join Community", icon: UserRound },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-[color:var(--color-background)]">
      <header className="sticky top-0 z-20 border-b border-[color:var(--color-border)] bg-[color:var(--color-surface)]/90 backdrop-blur">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[color:var(--color-brand-soft)] text-[color:var(--color-brand)]">
              <span className="text-sm font-semibold">CS</span>
            </div>
            <span className="text-base font-semibold tracking-tight">
              Contentstack
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" aria-label="Search">
              <Search className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" aria-label="Notifications">
              <Bell className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" aria-label="Help">
              <HelpCircle className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" aria-label="Apps">
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[color:var(--color-surface-muted)] text-xs font-semibold">
              CM
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-[1200px] gap-6 px-6 py-8 xl:pr-[340px]">
        <section className="flex-1 space-y-8">
          <div className="space-y-1">
            <h1 className="font-display text-2xl font-semibold tracking-tight">
              Welcome, Christine
            </h1>
            <p className="text-base font-semibold text-[color:var(--color-muted)]">
              Organization Name: BambooHR Trial
            </p>
          </div>

          <section className="space-y-3">
            <h2 className="font-display text-sm font-semibold text-[color:var(--color-muted)]">
              Explore Apps
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {appCards.map((app) => {
                const Icon = app.icon;
                return (
                  <Card key={app.title}>
                    <CardHeader>
                      <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[color:var(--color-brand-soft)] text-[color:var(--color-brand)]">
                        <Icon className="h-5 w-5" />
                      </div>
                      <CardTitle className="font-display text-[15px]">
                        {app.title}
                      </CardTitle>
                      <CardDescription className="text-[13px] leading-relaxed text-[color:var(--color-muted)]">
                        {app.description}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                );
              })}
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-sm font-semibold text-[color:var(--color-muted)]">
                Level Up with Role-Based Training & Certifications
              </h2>
              <Button variant="ghost" size="sm">
                See all
              </Button>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {trainingCards.map((item) => {
                const Icon = item.icon;
                return (
                  <Card
                    key={item.title}
                    className="flex h-[19.875rem] w-full flex-col overflow-hidden"
                  >
                    <div className="flex h-[10.313rem] items-center justify-center bg-[color:var(--color-brand)] text-white">
                      <Icon className="h-8 w-8" />
                    </div>
                    <CardHeader className="gap-2">
                      <Badge variant="outline">{item.label}</Badge>
                      <CardTitle className="line-clamp-2 text-sm font-semibold">
                        {item.title}
                      </CardTitle>
                      <CardDescription className="text-sm text-[color:var(--color-muted)]">
                        {item.duration}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                );
              })}
            </div>
          </section>
        </section>

        <aside className="hidden w-64 shrink-0 flex-col gap-4 lg:flex">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Quick Links</CardTitle>
            </CardHeader>
            <CardContent className="divide-y divide-[color:var(--color-border)]">
              {quickLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <button
                    key={link.label}
                    className="flex w-full items-center gap-3 px-2 py-3 text-sm text-[color:var(--color-foreground)] transition hover:bg-[color:var(--color-surface-muted)]"
                    type="button"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-md bg-[color:var(--color-surface-muted)]">
                      <Icon className="h-4 w-4 text-[color:var(--color-brand)]" />
                    </span>
                    {link.label}
                  </button>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Upcoming Events</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface-muted)] px-4 py-6 text-center">
                <span className="text-xs font-semibold text-[color:var(--color-muted)]">
                  GARTNER
                </span>
                <p className="mt-1 text-lg font-semibold">MKTG SYM</p>
              </div>
              <div className="space-y-2 text-sm">
                <Badge variant="outline">Event</Badge>
                <p className="font-semibold">Gartner Marketing Symposium</p>
                <p className="text-xs text-[color:var(--color-muted)]">
                  This year&apos;s marketing event for modern teams.
                </p>
                <Button variant="outline" size="sm">
                  Register
                </Button>
              </div>
            </CardContent>
          </Card>
        </aside>
      </main>

      <aside className="fixed right-6 top-24 hidden w-80 flex-col gap-4 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-4 shadow-lg xl:flex">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[color:var(--color-brand-soft)] text-[color:var(--color-brand)]">
              <Bot className="h-4 w-4" />
            </span>
            Polaris
          </div>
          <Button variant="ghost" size="icon" aria-label="Close Polaris">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <Separator />
        <div className="flex flex-1 flex-col items-center justify-center gap-4 py-10 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[color:var(--color-brand-soft)] text-[color:var(--color-brand)]">
            <Sparkles className="h-6 w-6" />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-semibold">Introducing Polaris</p>
            <p className="text-xs text-[color:var(--color-muted)]">
              A virtual co-worker helping you get more done across Contentstack.
            </p>
          </div>
        </div>
        <div className="space-y-2">
          <Input placeholder="Describe what you would like to do..." />
          <p className="text-[10px] text-[color:var(--color-muted)]">
            Not sure what to ask?{" "}
            <span className="text-[color:var(--color-brand)]">See what I can do</span>
          </p>
        </div>
      </aside>
    </div>
  );
}
