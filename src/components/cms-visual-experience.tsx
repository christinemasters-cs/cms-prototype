"use client";

import { useEffect, useState } from "react";
import {
  ChevronDown,
  FileText,
  MessageSquare,
  Plus,
  Sparkles,
  LayoutGrid,
  LayoutTemplate,
  Layers,
  Link2,
  Settings,
  MessageCircle,
  Wand2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CmsShell } from "@/components/cms-shell";

type ActiveElement = "headline" | "subhead" | "cta" | "feature" | null;

export function CmsVisualExperience() {
  const [headline, setHeadline] = useState(
    "Experience the Ultimate Hiking Adventure in the Maldives"
  );
  const [activeElement, setActiveElement] = useState<ActiveElement>("headline");
  const [formOpen, setFormOpen] = useState(true);
  const [commentOpen, setCommentOpen] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [subhead, setSubhead] = useState(
    "Discover the excitement of hiking through lush tropical landscapes and hidden island trails in the Maldives."
  );
  const [ctaText, setCtaText] = useState("Plan your adventure");
  const [featureTitle, setFeatureTitle] = useState("Curated island trails");
  const [featureBody, setFeatureBody] = useState(
    "Guided routes built for sunrise hikers and deep‑blue lagoon views."
  );

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("polaris:page-context", {
        detail: {
          contextLabel: "Visual Experience: The Thrill of Hiking in the Maldives",
          contextPrompt:
            "Visual Experience page. Elements: headline, details text, hero image.",
        },
      })
    );
  }, []);

  useEffect(() => {
    const handleApply = (
      event: Event & { detail?: { contextKey?: string; value?: string } }
    ) => {
      const key = event.detail?.contextKey;
      const value = event.detail?.value ?? "";
      if (!key) {
        return;
      }
      if (key === "visual.headline") {
        setHeadline(value);
        return;
      }
      if (key === "visual.subhead") {
        setSubhead(value);
        return;
      }
      if (key === "visual.cta") {
        setCtaText(value);
        return;
      }
      if (key === "visual.feature") {
        setFeatureTitle(value);
        return;
      }
      if (key === "visual.feature.body") {
        setFeatureBody(value);
      }
    };
    window.addEventListener("polaris:apply", handleApply as EventListener);
    return () => {
      window.removeEventListener("polaris:apply", handleApply as EventListener);
    };
  }, []);

  const openPolarisForHeadline = () => {
    window.dispatchEvent(
      new CustomEvent("polaris:context", {
        detail: {
          contextLabel: "Visual Element: Hero Headline",
          contextPrompt: `Element: Hero headline\nCurrent value:\n${headline}`,
          contextKey: "visual.headline",
        },
      })
    );
    window.dispatchEvent(new Event("polaris:open"));
  };

  const openPolarisContext = (label: string, value: string, key: string) => {
    window.dispatchEvent(
      new CustomEvent("polaris:context", {
        detail: {
          contextLabel: label,
          contextPrompt: `${label}\nCurrent value:\n${value}`,
          contextKey: key,
        },
      })
    );
    window.dispatchEvent(new Event("polaris:open"));
  };

  return (
    <CmsShell active="visual">
      <div className="space-y-4">
        <div className="flex items-center justify-between rounded-xl border border-[color:var(--color-border)] bg-white px-4 py-3 text-[12px] text-[color:var(--color-muted)]">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-[color:var(--color-foreground)]">
              Builder
            </span>
            <div className="flex items-center gap-2 rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface-muted)]/50 px-2 py-1">
              <span className="text-[11px] text-[color:var(--color-muted)]">
                Page
              </span>
              <span className="font-semibold text-[color:var(--color-foreground)]">
                The Thrill of Hiking in the Maldives
              </span>
            </div>
            <div className="flex items-center gap-2 rounded-md border border-[color:var(--color-border)] px-2 py-1">
              <span className="text-[11px] text-[color:var(--color-muted)]">
                en
              </span>
              <ChevronDown className="h-3.5 w-3.5" />
            </div>
            <div className="flex items-center gap-2 rounded-md border border-[color:var(--color-border)] px-2 py-1">
              <span className="text-[11px] text-[color:var(--color-muted)]">
                Base Entry
              </span>
              <ChevronDown className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="h-8 text-[12px]">
              Version 2
              <ChevronDown className="ml-2 h-3.5 w-3.5" />
            </Button>
            <Button variant="outline" className="h-8 text-[12px]">
              Save
            </Button>
            <Button className="h-8 gap-2 rounded-md bg-[color:var(--color-brand)] px-3 text-[12px] text-white shadow-sm hover:brightness-105">
              Publish
            </Button>
          </div>
        </div>

        <div
          className={`grid min-h-[calc(100vh-220px)] gap-0 ${
            formOpen || commentOpen
              ? "lg:grid-cols-[minmax(0,1fr)_320px_56px]"
              : "lg:grid-cols-[minmax(0,1fr)_56px]"
          }`}
        >
          <div className="relative h-full bg-transparent">
            <div className="relative h-full bg-white">
              <div className="flex items-center justify-between border-b border-[color:var(--color-border)] px-6 py-4 text-[12px] text-[color:var(--color-muted)]">
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-[color:var(--color-foreground)]">
                    REDPANDA
                  </span>
                  <span>ROOMS</span>
                  <span>ARTICLES</span>
                  <span>ACTIVITIES</span>
                  <span>FAQ</span>
                </div>
                <div className="flex items-center gap-3">
                  <span>EN</span>
                </div>
              </div>
              <div className="h-[calc(100vh-300px)] overflow-y-auto">
                <div
                  className="relative h-[620px] bg-cover bg-center"
                  style={{
                    backgroundImage: "url('/hero.avif')",
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/25 to-black/20" />
                  <div className="relative flex h-full items-center justify-center px-12">
                    <div className="w-full max-w-[980px] text-center text-white">
                    <div
                      className={`group relative inline-flex items-center justify-center ${
                        activeElement === "headline"
                          ? "outline outline-2 outline-[color:var(--color-brand)] outline-offset-4"
                          : ""
                      }`}
                      onClick={() => setActiveElement("headline")}
                    >
                      <div className="absolute -top-10 left-0 flex items-center gap-2 rounded-md bg-white px-2 py-1 text-[10px] text-[color:var(--color-muted)] shadow-sm opacity-0 transition group-hover:opacity-100">
                        <span className="rounded-full bg-[color:var(--color-brand-soft)] px-2 py-0.5 text-[color:var(--color-brand)]">
                          Page
                        </span>
                        <span>Headline</span>
                        <div className="flex items-center gap-1">
                          <button
                              type="button"
                              className="flex h-6 w-6 items-center justify-center rounded-md border border-[color:var(--color-border)] bg-white text-[color:var(--color-muted)] hover:text-[color:var(--color-foreground)]"
                              onClick={() => {
                                setFormOpen(true);
                                setCommentOpen(false);
                              }}
                              aria-label="Open form"
                            >
                              <FileText className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              className="flex h-6 w-6 items-center justify-center rounded-md border border-[color:var(--color-border)] bg-white text-[color:var(--color-muted)] hover:text-[color:var(--color-foreground)]"
                              onClick={() => {
                                setCommentOpen(true);
                                setFormOpen(false);
                              }}
                              aria-label="Add comment"
                            >
                              <MessageSquare className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              className="flex h-6 w-6 items-center justify-center rounded-md border border-[color:var(--color-brand)] bg-[color:var(--color-brand-soft)]/30 text-[color:var(--color-brand)]"
                              onClick={openPolarisForHeadline}
                              aria-label="Polaris rewrite"
                            >
                              <Sparkles className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      {activeElement === "headline" ? (
                        <input
                          value={headline}
                          onChange={(event) => setHeadline(event.target.value)}
                          className="w-full bg-transparent text-center text-[44px] font-semibold leading-tight text-white focus:outline-none"
                        />
                      ) : (
                        <h1 className="text-[44px] font-semibold leading-tight">
                          {headline}
                        </h1>
                      )}
                    </div>
                    <div
                      className={`group relative mt-3 inline-flex items-center justify-center ${
                        activeElement === "subhead"
                          ? "outline outline-2 outline-[color:var(--color-brand)] outline-offset-4"
                          : ""
                      }`}
                      onClick={() => setActiveElement("subhead")}
                    >
                      <div className="absolute -top-10 left-0 flex items-center gap-2 rounded-md bg-white px-2 py-1 text-[10px] text-[color:var(--color-muted)] shadow-sm opacity-0 transition group-hover:opacity-100">
                        <span className="rounded-full bg-[color:var(--color-brand-soft)] px-2 py-0.5 text-[color:var(--color-brand)]">
                          Page
                        </span>
                        <span>Subhead</span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            className="flex h-6 w-6 items-center justify-center rounded-md border border-[color:var(--color-border)] bg-white text-[color:var(--color-muted)] hover:text-[color:var(--color-foreground)]"
                            onClick={() => {
                              setFormOpen(true);
                              setCommentOpen(false);
                            }}
                            aria-label="Open form"
                          >
                            <FileText className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            className="flex h-6 w-6 items-center justify-center rounded-md border border-[color:var(--color-border)] bg-white text-[color:var(--color-muted)] hover:text-[color:var(--color-foreground)]"
                            onClick={() => {
                              setCommentOpen(true);
                              setFormOpen(false);
                            }}
                            aria-label="Add comment"
                          >
                            <MessageSquare className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            className="flex h-6 w-6 items-center justify-center rounded-md border border-[color:var(--color-brand)] bg-[color:var(--color-brand-soft)]/30 text-[color:var(--color-brand)]"
                            onClick={() =>
                              openPolarisContext(
                                "Visual Element: Hero Subhead",
                                subhead,
                                "visual.subhead"
                              )
                            }
                            aria-label="Polaris rewrite"
                          >
                            <Sparkles className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                      {activeElement === "subhead" ? (
                        <input
                          value={subhead}
                          onChange={(event) => setSubhead(event.target.value)}
                          className="w-full bg-transparent text-center text-[17px] text-white/90 focus:outline-none"
                        />
                      ) : (
                        <p className="text-[17px] text-white/90">{subhead}</p>
                      )}
                    </div>
                    <div className="mt-6">
                      <div
                        className={`group relative inline-flex items-center justify-center ${
                          activeElement === "cta"
                            ? "outline outline-2 outline-[color:var(--color-brand)] outline-offset-4"
                            : ""
                        }`}
                        onClick={() => setActiveElement("cta")}
                      >
                        <div className="absolute -top-10 left-0 flex items-center gap-2 rounded-md bg-white px-2 py-1 text-[10px] text-[color:var(--color-muted)] shadow-sm opacity-0 transition group-hover:opacity-100">
                          <span className="rounded-full bg-[color:var(--color-brand-soft)] px-2 py-0.5 text-[color:var(--color-brand)]">
                            Component
                          </span>
                          <span>CTA Button</span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              className="flex h-6 w-6 items-center justify-center rounded-md border border-[color:var(--color-border)] bg-white text-[color:var(--color-muted)] hover:text-[color:var(--color-foreground)]"
                              onClick={() => {
                                setFormOpen(true);
                                setCommentOpen(false);
                              }}
                              aria-label="Open form"
                            >
                              <FileText className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              className="flex h-6 w-6 items-center justify-center rounded-md border border-[color:var(--color-border)] bg-white text-[color:var(--color-muted)] hover:text-[color:var(--color-foreground)]"
                              onClick={() => {
                                setCommentOpen(true);
                                setFormOpen(false);
                              }}
                              aria-label="Add comment"
                            >
                              <MessageSquare className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              className="flex h-6 w-6 items-center justify-center rounded-md border border-[color:var(--color-brand)] bg-[color:var(--color-brand-soft)]/30 text-[color:var(--color-brand)]"
                              onClick={() =>
                                openPolarisContext(
                                  "Visual Element: Hero CTA",
                                  ctaText,
                                  "visual.cta"
                                )
                              }
                              aria-label="Polaris rewrite"
                            >
                              <Sparkles className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                        <Button className="h-9 bg-white/95 text-[13px] text-black hover:bg-white">
                          {ctaText}
                        </Button>
                      </div>
                    </div>
                    </div>
                  </div>
                </div>
                <div className="bg-white px-6 py-8">
                <div className="grid gap-6 md:grid-cols-[1.2fr_1fr]">
                  <div className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-muted)]/40 p-4">
                    <div
                      className={`group relative ${
                        activeElement === "feature"
                          ? "outline outline-2 outline-[color:var(--color-brand)] outline-offset-2"
                          : ""
                      }`}
                      onClick={() => setActiveElement("feature")}
                    >
                      <div className="absolute -top-9 left-0 flex items-center gap-2 rounded-md bg-white px-2 py-1 text-[10px] text-[color:var(--color-muted)] shadow-sm opacity-0 transition group-hover:opacity-100">
                        <span className="rounded-full bg-[color:var(--color-brand-soft)] px-2 py-0.5 text-[color:var(--color-brand)]">
                          Card
                        </span>
                        <span>Feature</span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            className="flex h-6 w-6 items-center justify-center rounded-md border border-[color:var(--color-border)] bg-white text-[color:var(--color-muted)] hover:text-[color:var(--color-foreground)]"
                            onClick={() => {
                              setFormOpen(true);
                              setCommentOpen(false);
                            }}
                            aria-label="Open form"
                          >
                            <FileText className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            className="flex h-6 w-6 items-center justify-center rounded-md border border-[color:var(--color-border)] bg-white text-[color:var(--color-muted)] hover:text-[color:var(--color-foreground)]"
                            onClick={() => {
                              setCommentOpen(true);
                              setFormOpen(false);
                            }}
                            aria-label="Add comment"
                          >
                            <MessageSquare className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            className="flex h-6 w-6 items-center justify-center rounded-md border border-[color:var(--color-brand)] bg-[color:var(--color-brand-soft)]/30 text-[color:var(--color-brand)]"
                            onClick={() =>
                              openPolarisContext(
                                "Visual Element: Feature Title",
                                featureTitle,
                                "visual.feature"
                              )
                            }
                            aria-label="Polaris rewrite"
                          >
                            <Sparkles className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                      <div
                        className="h-[220px] rounded-lg bg-cover bg-center"
                        style={{ backgroundImage: "url('/boardwalk.avif')" }}
                      />
                      <div className="mt-4 text-[16px] font-semibold text-[color:var(--color-foreground)]">
                        {featureTitle}
                      </div>
                      <p className="mt-2 text-[12px] text-[color:var(--color-muted)]">
                        {featureBody}
                      </p>
                      <button
                        type="button"
                        className="mt-3 text-[11px] text-[color:var(--color-brand)]"
                        onClick={() =>
                          openPolarisContext(
                            "Visual Element: Feature Body",
                            featureBody,
                            "visual.feature.body"
                          )
                        }
                      >
                        Ask Polaris to refine copy
                      </button>
                    </div>
                  </div>
                  <div className="grid gap-4">
                    <div
                      className="h-[180px] rounded-xl bg-cover bg-center"
                      style={{ backgroundImage: "url('/lagoon.avif')" }}
                    />
                    <div className="rounded-xl border border-[color:var(--color-border)] bg-white p-4">
                      <div className="text-[12px] font-semibold text-[color:var(--color-muted)]">
                        Trip planner
                      </div>
                      <p className="mt-2 text-[13px] text-[color:var(--color-foreground)]">
                        Build a custom itinerary with guided trail maps and oceanfront lodging.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-8 grid gap-4 md:grid-cols-3">
                  {["Local guides", "Nature retreats", "Travel essentials"].map((label) => (
                    <div
                      key={label}
                      className="rounded-xl border border-[color:var(--color-border)] bg-white p-4"
                    >
                      <div className="text-[12px] font-semibold text-[color:var(--color-muted)]">
                        {label}
                      </div>
                      <p className="mt-2 text-[13px] text-[color:var(--color-foreground)]">
                        Hand‑picked recommendations tailored for coastal adventures.
                      </p>
                    </div>
                  ))}
                </div>
              </div>
              </div>
            </div>
          </div>
          {formOpen || commentOpen ? (
            <aside className="h-full border-l border-[color:var(--color-border)] bg-white">
              <div className="h-full overflow-y-auto px-4 py-4">
                {formOpen ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-[12px] text-[color:var(--color-muted)]">
                      <span className="font-semibold text-[color:var(--color-foreground)]">
                        Form
                      </span>
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-[color:var(--color-muted)]">
                        Headline
                      </label>
                      <Input
                        value={headline}
                        onChange={(event) => setHeadline(event.target.value)}
                        className="mt-2 h-9 text-[12px]"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-[color:var(--color-muted)]">
                        Subhead
                      </label>
                      <Input
                        value={subhead}
                        onChange={(event) => setSubhead(event.target.value)}
                        className="mt-2 h-9 text-[12px]"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-[color:var(--color-muted)]">
                        CTA Label
                      </label>
                      <Input
                        value={ctaText}
                        onChange={(event) => setCtaText(event.target.value)}
                        className="mt-2 h-9 text-[12px]"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-[color:var(--color-muted)]">
                        Details
                      </label>
                      <textarea
                        className="mt-2 min-h-[90px] w-full rounded-md border border-[color:var(--color-border)] bg-white px-3 py-2 text-[12px] text-[color:var(--color-foreground)] shadow-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--color-brand)]/30"
                        value={subhead}
                        onChange={(event) => setSubhead(event.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-[color:var(--color-muted)]">
                        Feature Title
                      </label>
                      <Input
                        value={featureTitle}
                        onChange={(event) => setFeatureTitle(event.target.value)}
                        className="mt-2 h-9 text-[12px]"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-[color:var(--color-muted)]">
                        Feature Body
                      </label>
                      <textarea
                        className="mt-2 min-h-[90px] w-full rounded-md border border-[color:var(--color-border)] bg-white px-3 py-2 text-[12px] text-[color:var(--color-foreground)] shadow-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--color-brand)]/30"
                        value={featureBody}
                        onChange={(event) => setFeatureBody(event.target.value)}
                      />
                    </div>
                  </div>
                ) : null}

                {commentOpen ? (
                  <div className="mt-6">
                    <div className="text-[12px] font-semibold text-[color:var(--color-foreground)]">
                      Comments
                    </div>
                    <textarea
                      value={commentText}
                      onChange={(event) => setCommentText(event.target.value)}
                      placeholder="Leave a comment on the headline..."
                      className="mt-3 min-h-[120px] w-full rounded-md border border-[color:var(--color-border)] bg-white px-3 py-2 text-[12px] text-[color:var(--color-foreground)] shadow-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--color-brand)]/30"
                    />
                    <Button className="mt-3 h-8 text-[12px]" variant="outline">
                      Add comment
                    </Button>
                  </div>
                ) : null}
              </div>
            </aside>
          ) : null}

          <aside className="h-full border-l border-[color:var(--color-border)] bg-white">
            <div className="flex h-full flex-col items-center gap-3 py-4 text-[color:var(--color-muted)]">
              {[
                { icon: Layers, label: "Layers" },
                { icon: LayoutGrid, label: "Grid" },
                { icon: LayoutTemplate, label: "Form" },
                { icon: MessageCircle, label: "Comments" },
                { icon: Link2, label: "Links" },
                { icon: Settings, label: "Settings" },
              ].map((item, index) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.label}
                    type="button"
                    className={`flex h-9 w-9 items-center justify-center rounded-md ${
                      index === 2
                        ? "bg-[color:var(--color-brand-soft)] text-[color:var(--color-brand)]"
                        : "hover:bg-[color:var(--color-surface-muted)]"
                    }`}
                    aria-label={item.label}
                    onClick={() => {
                      if (item.label === "Form") {
                        setFormOpen(true);
                        setCommentOpen(false);
                        return;
                      }
                      if (item.label === "Comments") {
                        setCommentOpen(true);
                        setFormOpen(false);
                      }
                    }}
                  >
                    <Icon className="h-4 w-4" />
                  </button>
                );
              })}
              <div className="mt-auto flex h-9 w-9 items-center justify-center rounded-md bg-[color:var(--color-brand-soft)] text-[color:var(--color-brand)]">
                <Wand2 className="h-4 w-4" />
              </div>
            </div>
          </aside>
        </div>
      </div>
    </CmsShell>
  );
}
