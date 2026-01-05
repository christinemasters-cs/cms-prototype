import {
  BarChart3,
  Bell,
  BookOpen,
  Code2,
  Clock,
  GraduationCap,
  HelpCircle,
  ImagePlus,
  LayoutTemplate,
  LayoutGrid,
  Palette,
  Rocket,
  Search,
  ShieldCheck,
  Sparkles,
  Store,
  UserRound,
  Workflow,
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
import Image from "next/image";
import { PolarisPanel } from "@/components/polaris-panel";
import { UpcomingEventsCarousel } from "@/components/upcoming-events-carousel";

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
    disabled: true,
  },
  {
    title: "Composable Studio",
    description: "Build visual web experiences with reusable blocks",
    icon: LayoutTemplate,
    disabled: true,
  },
];

const trainingCards = [
  {
    title: "Omni-channel Personalization",
    label: "Demo",
    duration: "13m 16s",
    icon: Sparkles,
    imageSrc: "/Omni-channel_Personalization_Thumbnail.jpg",
    description:
      "This video walks through how Red Panda Resort uses Contentstack with Data and Insights.",
  },
  {
    title: "Understanding Journey Orchestration",
    label: "Explainer",
    duration: "12m",
    icon: BookOpen,
    imageSrc: "/JourneyFlows_Thumb.jpg",
    description:
      "Flows makes it easy for marketers, product, and dev teams to orchestrate experiences.",
  },
  {
    title: "Understanding Automate",
    label: "Explainer",
    duration: "9m 39s",
    icon: Workflow,
    imageSrc: "/UnderstandingAutomate_thumbnail.jpg",
    description:
      "This video demonstrates how users can set up automated actions with ease.",
  },
  {
    title: "Kickstart Next.js: Code Overview",
    label: "Coding",
    duration: "8m 58s",
    icon: Code2,
    imageSrc: "/Coding_Thumbnail_Kickstart_NextJS.jpg",
    description:
      "A lightweight Next.js boilerplate to get you up and running with Contentstack.",
  },
];

const quickLinks = [
  { label: "Explore Academy", icon: GraduationCap },
  { label: "Read Documentation", icon: HelpCircle },
  { label: "Join Community on Discord", icon: UserRound },
];

const changelogItems = [
  {
    title: "Unlock Locked Accounts Instantly",
    date: "Dec 15, 2025",
    tag: "Administration",
  },
  {
    title: "Javascript Management SDK Version 1.27.0",
    date: "Dec 14, 2025",
    tag: "SDKs and tools",
  },
  {
    title: "CLI Version 1.53.1",
    date: "Dec 14, 2025",
    tag: "CLI",
  },
];

const pulseItems = [
  {
    title: "End-of-Year CMS Enhancements for Growing Content Teams",
    date: "Dec 10, 2025",
  },
  {
    title: "Build faster, scale smarter: Latest Data & Insights (Lytics) updates",
    date: "Dec 2, 2025",
  },
  {
    title: "Unlock new opportunities with Contentstack's latest features",
    date: "Nov 20, 2025",
  },
  {
    title: "Introducing Contentstack's open-source app initiative",
    date: "Nov 18, 2025",
  },
];

export default function Home() {
  return (
    <div className="dashboard-shell">
      <div className="dashboard-page min-h-screen bg-[color:var(--color-background)]">
        <header className="sticky top-0 z-20 border-b border-[color:var(--color-border)] bg-[color:var(--color-surface)]/90 backdrop-blur">
          <div className="mx-auto flex w-full items-center justify-between px-6 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[color:var(--color-brand-soft)] text-[color:var(--color-brand)]">
                <span className="text-sm font-semibold">CS</span>
              </div>
              <span className="text-sm font-semibold tracking-tight">
                Contentstack
              </span>
            </div>
            <div className="flex items-center gap-2">
              <PolarisPanel pageContext="Dashboard" />
              <Button
                variant="ghost"
                size="icon"
                aria-label="Search"
                className="h-8 w-8"
              >
                <Search className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Notifications"
                className="h-8 w-8"
              >
                <Bell className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" aria-label="Help" className="h-8 w-8">
                <HelpCircle className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" aria-label="Apps" className="h-8 w-8">
                <LayoutGrid className="h-5 w-5" />
              </Button>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[color:var(--color-surface-muted)] text-[11px] font-semibold">
                CM
              </div>
            </div>
          </div>
        </header>

        <main className="dashboard-main mx-auto grid w-full gap-10 px-6 py-8 lg:grid-cols-[minmax(0,1fr)_29.5%] lg:grid-rows-[auto_1fr]">
          <div className="space-y-1 lg:col-start-1 lg:row-start-1">
            <h1 className="text-[20px] font-semibold leading-[28px] tracking-tight text-[color:var(--text-primary-text-gray-900-body-black)]">
              Welcome, Christine
            </h1>
            <p className="text-[12px] font-medium text-[color:var(--text-secondary-text-purple-gray)]">
              Organization Name: BambooHR Trial
            </p>
          </div>

          <section className="space-y-8 lg:col-start-1 lg:row-start-2">
            <section className="space-y-3">
              <h2 className="text-[16px] font-semibold text-[color:var(--text-secondary-text-tarmac-grey-n-700)]">
                Explore Apps
              </h2>
              <div className="grid justify-start gap-3 [grid-template-columns:repeat(auto-fill,minmax(190px,190px))]">
                {appCards.map((app) => {
                  const Icon = app.icon;
                  const isDisabled = Boolean(app.disabled);
                  return (
                    <Card
                      key={app.title}
                      className={`widget-container w-[190px] shadow-sm transition ${
                        isDisabled
                          ? "disabled"
                          : "hover:border-[color:var(--color-brand)] hover:shadow-md"
                      }`}
                      role="button"
                      tabIndex={0}
                      aria-disabled={isDisabled}
                    >
                      <CardHeader className="product-details-container gap-2">
                        <div className="product-icon-container">
                          <div className="product-icon-wrapper text-[color:var(--color-brand)]">
                            <Icon className="h-5 w-5" />
                          </div>
                        </div>
                        <CardTitle className="academic-card-title text-[14px] font-semibold text-[color:var(--text-primary-text-gray-900-body-black)]">
                          {app.title}
                        </CardTitle>
                        <CardDescription className="product-description">
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
                <h2 className="text-[16px] font-semibold text-[color:var(--text-secondary-text-tarmac-grey-n-700)]">
                  Level Up with Role-Based Training & Certifications
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[12px] font-semibold text-[color:var(--color-brand)]"
                >
                  See all
                </Button>
              </div>
              <div className="grid justify-start gap-4 [grid-template-columns:repeat(auto-fill,minmax(18.313rem,18.313rem))]">
                {trainingCards.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Card
                      key={item.title}
                      className="academic-card-container clickable-card overflow-hidden shadow-sm transition hover:border-[color:var(--color-brand)] hover:shadow-md"
                    >
                      <div className="courseImage relative w-full overflow-hidden">
                        <Image
                          src={item.imageSrc}
                          alt={`${item.title} thumbnail`}
                          fill
                          sizes="(max-width: 1024px) 100vw, 320px"
                          className="object-contain"
                          priority={item.title === "Omni-channel Personalization"}
                        />
                        <div className="absolute inset-0 bg-gradient-to-tr from-black/10 via-transparent to-white/10" />
                        <div className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-[color:var(--color-brand)] shadow">
                          <Icon className="h-4 w-4" />
                        </div>
                      </div>
                      <div className="flex items-center gap-2 px-4 pt-3">
                        <Badge
                          variant="outline"
                          className="dashboard-tag text-[10px] font-semibold uppercase"
                        >
                          {item.label}
                        </Badge>
                        <span className="flex items-center gap-1 text-[11px] text-[color:var(--text-secondary-text-purple-gray)]">
                          <Clock className="h-3 w-3" />
                          {item.duration}
                        </span>
                      </div>
                      <CardHeader className="gap-2">
                        <CardTitle className="academic-card-title text-[14px] font-semibold">
                          {item.title}
                        </CardTitle>
                        <CardDescription className="academic-card-description">
                          {item.description}
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  );
                })}
              </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-2">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-[16px] font-semibold text-[color:var(--text-secondary-text-tarmac-grey-n-700)]">
                    Product Changelog
                  </h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-[12px] font-semibold text-[color:var(--color-brand)]"
                  >
                    See all
                  </Button>
                </div>
                <Card className="widget-container shadow-sm">
                  <CardContent className="divide-y divide-[color:var(--color-border)]">
                    {changelogItems.map((item) => (
                      <button
                        key={item.title}
                        type="button"
                        className="changeLogCont px-2 py-3 text-left transition hover:bg-[color:var(--color-surface-muted)] active:bg-[color:var(--color-border)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-brand)] focus-visible:ring-offset-2"
                      >
                        <span className="changeLogDesc">
                          <span className="changeLogTitle text-[15px] font-semibold">
                            {item.title}
                          </span>
                          <span className="changeLogDate">{item.date}</span>
                        </span>
                        <Badge
                          variant="outline"
                          className="changeLogTag dashboard-tag text-[10px] font-semibold"
                        >
                          {item.tag}
                        </Badge>
                      </button>
                    ))}
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-[16px] font-semibold text-[color:var(--text-secondary-text-tarmac-grey-n-700)]">
                    Contentstack Pulse
                  </h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-[12px] font-semibold text-[color:var(--color-brand)]"
                  >
                    See all
                  </Button>
                </div>
                <Card className="widget-container shadow-sm">
                  <CardContent className="divide-y divide-[color:var(--color-border)]">
                    {pulseItems.map((item) => (
                      <button
                        key={item.title}
                        type="button"
                        className="changeLogCont px-2 py-3 text-left transition hover:bg-[color:var(--color-surface-muted)] active:bg-[color:var(--color-border)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-brand)] focus-visible:ring-offset-2"
                      >
                        <span className="changeLogDesc">
                          <span className="changeLogTitle text-[15px] font-semibold">
                            {item.title}
                          </span>
                          <span className="changeLogDate">{item.date}</span>
                        </span>
                      </button>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </section>
          </section>

          <aside className="dashboard-rail hidden w-full flex-col gap-6 lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:flex">
            <div className="dashboard-rail-content space-y-6">
              <div className="space-y-2">
                <h3 className="text-[16px] font-semibold text-[color:var(--text-secondary-text-tarmac-grey-n-700)]">
                  Quick Links
                </h3>
                <Card className="widget-container shadow-sm">
                  <CardContent className="divide-y divide-[color:var(--color-border)] px-2 py-1">
                    {quickLinks.map((link) => {
                      const Icon = link.icon;
                      return (
                        <button
                          key={link.label}
                          className="flex w-full items-center gap-3 px-2 py-3 text-sm text-[color:var(--color-foreground)] transition hover:bg-[color:var(--color-surface-muted)] active:bg-[color:var(--color-border)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-brand)] focus-visible:ring-offset-2"
                          type="button"
                        >
                          <span className="flex h-6 w-6 items-center justify-center rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface)] text-[color:var(--color-muted)]">
                            <Icon className="h-3.5 w-3.5" />
                          </span>
                          <span className="quickLink text-[12px] font-semibold">
                            {link.label}
                          </span>
                        </button>
                      );
                    })}
                  </CardContent>
                </Card>
              </div>

              <UpcomingEventsCarousel />
            </div>
          </aside>
        </main>
      </div>
      <aside
        id="polaris-dock"
        className="polaris-rail"
        aria-label="Polaris dock"
      />
    </div>
  );
}
