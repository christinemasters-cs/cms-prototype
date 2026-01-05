"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  ChevronRight,
  Globe,
  Lightbulb,
  MoreVertical,
  PenSquare,
  Pin,
  PinOff,
  Rocket,
  Send,
  Sparkles,
  Zap,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function PolarisPanel({ pageContext }: { pageContext?: string }) {
  const pathname = usePathname();
  const inferredContext = useMemo(() => {
    if (pageContext) {
      return pageContext;
    }
    if (!pathname) {
      return "Dashboard";
    }
    const normalized = pathname.toLowerCase();
    if (
      normalized.startsWith("/automations/projects/") &&
      normalized.includes("/agents")
    ) {
      return "Agents";
    }
    if (normalized.includes("/entry/") || normalized.includes("/edit")) {
      return "Editing";
    }
    const mappings: Array<{ match: string; label: string }> = [
      { match: "/stacks", label: "CMS" },
      { match: "/personalize", label: "Personalize" },
      { match: "/automation", label: "Automate" },
      { match: "/brand-kit", label: "Brand Kit" },
      { match: "/launch", label: "Launch" },
      { match: "/developerhub", label: "Developer Hub" },
      { match: "/marketplace", label: "Marketplace" },
      { match: "/academy", label: "Academy" },
      { match: "/product-analytics", label: "Analytics" },
      { match: "/orgadmin", label: "Administration" },
    ];
    const matched = mappings.find((item) => normalized.startsWith(item.match));
    return matched?.label ?? "Dashboard";
  }, [pageContext, pathname]);
  const [open, setOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<
    Array<{
      id: string;
      role: "user" | "assistant";
      content: string;
      kind?: "thinking" | "message";
      hidden?: boolean;
      table?: {
        type?: "entries" | "content_types";
        title?: string;
        columns?: string[];
        rows?: Array<{
          id: string;
          title: string;
          updatedAt?: string;
          author?: string;
          entryUid?: string;
          contentTypeUid?: string;
          urlPath?: string;
          name?: string;
          uid?: string;
        }>;
      };
    }>
  >([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [liveStatus, setLiveStatus] = useState<string | null>(null);
  const [liveTools, setLiveTools] = useState<string[]>([]);
  const [livePlan, setLivePlan] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const panelId = useId();
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);
  const liveStatusRef = useRef<string | null>(null);
  const livePlanRef = useRef<string | null>(null);
  const liveToolsRef = useRef<string[]>([]);
  const [pendingSuggestions, setPendingSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [randomSeed] = useState(() => Math.random());
  const [isPinned, setIsPinned] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dockElement, setDockElement] = useState<HTMLElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLElement | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const shouldDock = open && isPinned && !isExpanded;

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  useEffect(() => {
    const stored = window.localStorage.getItem("polarisPinned");
    if (stored === "true") {
      setIsPinned(true);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("polarisPinned", String(isPinned));
  }, [isPinned]);

  useEffect(() => {
    if (!open) {
      return;
    }
    setDockElement(document.getElementById("polaris-dock"));
  }, [open, isPinned]);

  useEffect(() => {
    const root = document.documentElement;
    if (shouldDock) {
      root.dataset.polarisDocked = "true";
      return () => {
        delete root.dataset.polarisDocked;
      };
    }
    delete root.dataset.polarisDocked;
  }, [shouldDock]);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }
    const handleClick = (event: MouseEvent) => {
      if (!menuRef.current) {
        return;
      }
      if (!menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    window.addEventListener("mousedown", handleClick);
    return () => window.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  useEffect(() => {
    if (!autoScrollEnabled) {
      return;
    }
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, liveStatus, livePlan, liveTools, loading, autoScrollEnabled]);

  const updateMessage = (
    id: string,
    updater: (message: {
      id: string;
      role: "user" | "assistant";
      content: string;
    }) => {
      id: string;
      role: "user" | "assistant";
      content: string;
    }
  ) => {
    setMessages((prev) =>
      prev.map((message) => (message.id === id ? updater(message) : message))
    );
  };

  const [suggestedPrompts, setSuggestedPrompts] = useState<string[]>([]);

  const baseWelcomeTitles = useMemo(
    () => [
      "Let’s goooo 🚀",
      "Welcome back 👋",
      "Ready to build? ✨",
      "Time to ship content",
      "Let’s make progress",
      "You’re in the zone ⚡️",
      "Let’s move fast",
      "Kick off your next update",
      "Here to help",
      "Good to see you",
      "Let’s unlock momentum",
      "Ready when you are",
      "Content, incoming",
      "Let’s get this done",
      "Your workspace is ready",
    ],
    []
  );
  const baseWelcomeSubheads = useMemo(
    () => [
      "Pick a quick action or ask me anything.",
      "Want a schema, entries, or a quick update?",
      "Start with a content type or recent entries.",
      "Tell me what you want to change.",
      "I can fetch entries, schemas, and updates fast.",
      "Need help finding the right content?",
    ],
    []
  );

  const promptPresets = useMemo(() => {
    return {
      Dashboard: {
        headlines: [
          "Introducing Polaris",
          "Your Contentstack co-pilot",
          "Welcome to Polaris",
          "Ready to move faster?",
          "Let’s get content done",
        ],
        subheads: [
          "A virtual co-worker helping you get more done across Contentstack.",
          "Find, update, and create content faster.",
          "Ask for schemas, entries, or quick updates.",
        ],
        welcomeTitles: [
          "Let’s goooo 🚀",
          "Ready to build? ✨",
          "Welcome back 👋",
          "Good to see you ⚡️",
          "Let’s ship some content",
        ],
        welcomeSubheads: [
          "Pick up where you left off or start something new.",
          "You were last in the dashboard — want to continue?",
          "Choose a quick action or ask me anything.",
        ],
        promoCards: [
          {
            title: "Create Entry",
            description: "Learn the basics",
            icon: PenSquare,
          },
          {
            title: "Global Fields",
            description: "Manage content",
            icon: Globe,
          },
        ],
        activities: [
          { label: "Review Pending: Q4 Roadmap", icon: Zap },
          { label: "New Course: Mastering Workflows", icon: BookOpen },
          { label: "Guide: Content Modeling", icon: Sparkles },
          { label: "API Reference: Delivery API", icon: Rocket },
        ],
        chips: ["Draft a summary", "Check SEO status", "Find related assets"],
        prompts: [
          [
            "List content types",
            "Show latest entries",
            "Create a draft entry",
          ],
          ["Find my last edits", "Show entry schema", "Update an entry"],
        ],
      },
      CMS: {
        headlines: [
          "Work faster in CMS",
          "CMS mode: on",
          "Content updates, simplified",
          "Find content in seconds",
        ],
        subheads: [
          "Find entries, inspect schemas, and update content quickly.",
          "Search entries and edit content with fewer clicks.",
          "Browse schemas and update drafts fast.",
        ],
        welcomeTitles: [
          "CMS at your fingertips ✍️",
          "Edit faster in CMS",
          "Content ops, simplified",
        ],
        welcomeSubheads: [
          "Need a schema or recent entries? I can pull them up.",
          "Start with a content type, then drill into entries.",
        ],
        promoCards: [
          {
            title: "Create Entry",
            description: "Learn the basics",
            icon: PenSquare,
          },
          {
            title: "Global Fields",
            description: "Manage content",
            icon: Globe,
          },
        ],
        activities: [
          { label: "Review Pending: Content updates", icon: Zap },
          { label: "Guide: Content Modeling", icon: Sparkles },
          { label: "API Reference: Delivery API", icon: Rocket },
          { label: "Course: Entry workflows", icon: BookOpen },
        ],
        chips: ["Draft a summary", "Find related assets", "Check SEO status"],
        prompts: [
          ["List content types", "Show entry schema", "Find latest entries"],
          ["Find entries by type", "Update a draft entry", "Create new entry"],
        ],
      },
      Personalize: {
        headlines: [
          "Personalize with confidence",
          "Tailor content, faster",
          "Personalization workspace",
        ],
        subheads: [
          "Explore variants and update content for experiments.",
          "Find entries and prep variants quickly.",
        ],
        welcomeTitles: [
          "Personalize with confidence ✨",
          "Variants, ready to go",
          "Make it feel personal",
        ],
        welcomeSubheads: [
          "Need entries to personalize? I can find them fast.",
          "Set up content for experiments in a few clicks.",
        ],
        promoCards: [
          {
            title: "Create Entry",
            description: "Learn the basics",
            icon: PenSquare,
          },
          {
            title: "Global Fields",
            description: "Manage content",
            icon: Globe,
          },
        ],
        activities: [
          { label: "Review Pending: Variant refresh", icon: Zap },
          { label: "Guide: Content Modeling", icon: Sparkles },
          { label: "API Reference: Delivery API", icon: Rocket },
          { label: "Course: Experiment setup", icon: BookOpen },
        ],
        chips: ["Draft a summary", "Check SEO status", "Find related assets"],
        prompts: [
          ["List content types", "Show entry schema", "Find latest entries"],
          ["Find entries to test", "Update variant content", "Create entry"],
        ],
      },
      Automate: {
        headlines: [
          "Automate the busywork",
          "Automation, but human-friendly",
          "Put content on autopilot",
        ],
        subheads: [
          "Draft, update, and review content faster.",
          "Let Polaris handle repetitive content tasks.",
        ],
        welcomeTitles: [
          "Automate the busywork ⚡️",
          "Let’s speed this up",
          "Automation, unlocked",
        ],
        welcomeSubheads: [
          "Pick a workflow and I’ll help with the content.",
          "Start with recent entries or a schema.",
        ],
        promoCards: [
          {
            title: "Create Entry",
            description: "Learn the basics",
            icon: PenSquare,
          },
          {
            title: "Global Fields",
            description: "Manage content",
            icon: Globe,
          },
        ],
        activities: [
          { label: "Review Pending: Workflow drafts", icon: Zap },
          { label: "Guide: Automation patterns", icon: Sparkles },
          { label: "API Reference: Delivery API", icon: Rocket },
          { label: "Course: Workflow mastery", icon: BookOpen },
        ],
        chips: ["Draft a summary", "Find related assets", "Check SEO status"],
        prompts: [
          ["List content types", "Find latest entries", "Create entry"],
          ["Update an entry", "Find entries by type", "Show entry schema"],
        ],
      },
      "Brand Kit": {
        headlines: [
          "Keep brand tidy",
          "Brand consistency, locked",
          "Keep everything on-brand",
        ],
        subheads: [
          "Inspect content types and update brand-related entries.",
          "Review brand content and adjust quickly.",
        ],
        welcomeTitles: [
          "Keep brand tidy 🎯",
          "Stay on brand",
          "Brand kit, aligned",
        ],
        welcomeSubheads: [
          "Need to update brand content? I can help.",
          "Start with recent brand entries.",
        ],
        promoCards: [
          {
            title: "Create Entry",
            description: "Learn the basics",
            icon: PenSquare,
          },
          {
            title: "Global Fields",
            description: "Manage content",
            icon: Globe,
          },
        ],
        activities: [
          { label: "Review Pending: Brand refresh", icon: Zap },
          { label: "Guide: Content Modeling", icon: Sparkles },
          { label: "API Reference: Delivery API", icon: Rocket },
          { label: "Course: Brand workflows", icon: BookOpen },
        ],
        chips: ["Draft a summary", "Find related assets", "Check SEO status"],
        prompts: [
          ["List content types", "Find latest entries", "Update brand entry"],
          ["Show entry schema", "Find asset references", "Create entry"],
        ],
      },
      Launch: {
        headlines: [
          "Launch with clarity",
          "Ready for launch",
          "Ship content with confidence",
        ],
        subheads: [
          "Prepare content updates for upcoming releases.",
          "Find launch content and update quickly.",
        ],
        welcomeTitles: [
          "Launch with clarity 🚀",
          "Ready to launch",
          "Ship content with confidence",
        ],
        welcomeSubheads: [
          "Let’s prep your launch content.",
          "Find launch entries and update fast.",
        ],
        promoCards: [
          {
            title: "Create Entry",
            description: "Learn the basics",
            icon: PenSquare,
          },
          {
            title: "Global Fields",
            description: "Manage content",
            icon: Globe,
          },
        ],
        activities: [
          { label: "Review Pending: Launch checklist", icon: Zap },
          { label: "Guide: Content Modeling", icon: Sparkles },
          { label: "API Reference: Delivery API", icon: Rocket },
          { label: "Course: Launch planning", icon: BookOpen },
        ],
        chips: ["Draft a summary", "Find related assets", "Check SEO status"],
        prompts: [
          ["Find latest entries", "Update an entry", "Create entry"],
          ["Show entry schema", "List content types", "Find entries by type"],
        ],
      },
      "Developer Hub": {
        headlines: [
          "Build with content",
          "Developer Hub ready",
          "Ship faster with content APIs",
        ],
        subheads: [
          "Inspect schemas and entries for your integrations.",
          "Check schemas and entry payloads quickly.",
        ],
        welcomeTitles: [
          "Build with content 💻",
          "Developer Hub ready",
          "Schema-first workflow",
        ],
        welcomeSubheads: [
          "Inspect schemas and entries in a flash.",
          "Start with a content type or entry.",
        ],
        promoCards: [
          {
            title: "Create Entry",
            description: "Learn the basics",
            icon: PenSquare,
          },
          {
            title: "Global Fields",
            description: "Manage content",
            icon: Globe,
          },
        ],
        activities: [
          { label: "Review Pending: API updates", icon: Zap },
          { label: "Guide: Content Modeling", icon: Sparkles },
          { label: "API Reference: Delivery API", icon: Rocket },
          { label: "Course: API fundamentals", icon: BookOpen },
        ],
        chips: ["Draft a summary", "Find related assets", "Check SEO status"],
        prompts: [
          ["List content types", "Show entry schema", "Find latest entries"],
          ["Get single entry", "Update entry", "Create entry"],
        ],
      },
      Marketplace: {
        headlines: [
          "Marketplace content",
          "Manage Marketplace entries",
          "Marketplace, organized",
        ],
        subheads: [
          "Find and update marketplace-related entries quickly.",
          "Review Marketplace content in a few clicks.",
        ],
        welcomeTitles: [
          "Marketplace content",
          "Keep Marketplace fresh",
          "Marketplace, organized",
        ],
        welcomeSubheads: [
          "Find Marketplace entries and update quickly.",
          "Start with latest Marketplace content.",
        ],
        promoCards: [
          {
            title: "Create Entry",
            description: "Learn the basics",
            icon: PenSquare,
          },
          {
            title: "Global Fields",
            description: "Manage content",
            icon: Globe,
          },
        ],
        activities: [
          { label: "Review Pending: Listing updates", icon: Zap },
          { label: "Guide: Content Modeling", icon: Sparkles },
          { label: "API Reference: Delivery API", icon: Rocket },
          { label: "Course: Marketplace basics", icon: BookOpen },
        ],
        chips: ["Draft a summary", "Find related assets", "Check SEO status"],
        prompts: [
          ["Find latest entries", "List content types", "Show entry schema"],
          ["Update an entry", "Create entry", "Find entries by type"],
        ],
      },
      Academy: {
        headlines: [
          "Power up learning",
          "Academy content",
          "Keep training fresh",
        ],
        subheads: [
          "Review and update training content with ease.",
          "Find lessons and update them quickly.",
        ],
        welcomeTitles: [
          "Power up learning 📚",
          "Academy content",
          "Keep training fresh",
        ],
        welcomeSubheads: [
          "Update courses and resources in a few clicks.",
          "Start with recent Academy content.",
        ],
        promoCards: [
          {
            title: "Create Entry",
            description: "Learn the basics",
            icon: PenSquare,
          },
          {
            title: "Global Fields",
            description: "Manage content",
            icon: Globe,
          },
        ],
        activities: [
          { label: "Review Pending: Course updates", icon: Zap },
          { label: "Guide: Content Modeling", icon: Sparkles },
          { label: "API Reference: Delivery API", icon: Rocket },
          { label: "Course: Training workflows", icon: BookOpen },
        ],
        chips: ["Draft a summary", "Find related assets", "Check SEO status"],
        prompts: [
          ["Find latest entries", "Show entry schema", "Update an entry"],
          ["List content types", "Create entry", "Find entries by type"],
        ],
      },
      Analytics: {
        headlines: [
          "Insights at a glance",
          "Analytics, quickly",
          "Track content impact",
        ],
        subheads: [
          "Connect content changes to performance signals.",
          "Explore recent content updates alongside metrics.",
        ],
        welcomeTitles: [
          "Insights at a glance 📈",
          "Analytics, quickly",
          "Track content impact",
        ],
        welcomeSubheads: [
          "Review recent content updates alongside metrics.",
          "Find the content behind the numbers.",
        ],
        promoCards: [
          {
            title: "Create Entry",
            description: "Learn the basics",
            icon: PenSquare,
          },
          {
            title: "Global Fields",
            description: "Manage content",
            icon: Globe,
          },
        ],
        activities: [
          { label: "Review Pending: Performance dips", icon: Zap },
          { label: "Guide: Content Modeling", icon: Sparkles },
          { label: "API Reference: Delivery API", icon: Rocket },
          { label: "Course: Content analytics", icon: BookOpen },
        ],
        chips: ["Draft a summary", "Find related assets", "Check SEO status"],
        prompts: [
          ["Find latest entries", "Show entry schema", "Update an entry"],
          ["List content types", "Find entries by type", "Create entry"],
        ],
      },
      Administration: {
        headlines: [
          "Keep the stack organized",
          "Administration mode",
          "Structure, simplified",
        ],
        subheads: [
          "Review content structure and manage updates safely.",
          "Check schemas and tidy content structures.",
        ],
        welcomeTitles: [
          "Keep the stack organized 🧭",
          "Administration mode",
          "Structure, simplified",
        ],
        welcomeSubheads: [
          "Review schemas and content types quickly.",
          "Start with a content type overview.",
        ],
        promoCards: [
          {
            title: "Create Entry",
            description: "Learn the basics",
            icon: PenSquare,
          },
          {
            title: "Global Fields",
            description: "Manage content",
            icon: Globe,
          },
        ],
        activities: [
          { label: "Review Pending: Schema updates", icon: Zap },
          { label: "Guide: Content Modeling", icon: Sparkles },
          { label: "API Reference: Delivery API", icon: Rocket },
          { label: "Course: Governance basics", icon: BookOpen },
        ],
        chips: ["Draft a summary", "Find related assets", "Check SEO status"],
        prompts: [
          ["List content types", "Show entry schema", "Find latest entries"],
          ["Find entries by type", "Update an entry", "Create entry"],
        ],
      },
      Agents: {
        headlines: [
          "Guide your agents",
          "Agent workspace",
          "Coordinate with agents",
        ],
        subheads: [
          "Fetch content context and propose next actions.",
          "Review agent context and plan next steps.",
        ],
        welcomeTitles: [
          "Guide your agents 🤖",
          "Agent workspace",
          "Coordinate with agents",
        ],
        welcomeSubheads: [
          "Need content context? I can pull it in.",
          "Start with a content type or recent entries.",
        ],
        promoCards: [
          {
            title: "Create Entry",
            description: "Learn the basics",
            icon: PenSquare,
          },
          {
            title: "Global Fields",
            description: "Manage content",
            icon: Globe,
          },
        ],
        activities: [
          { label: "Review Pending: Agent tasks", icon: Zap },
          { label: "Guide: Content Modeling", icon: Sparkles },
          { label: "API Reference: Delivery API", icon: Rocket },
          { label: "Course: Agent workflows", icon: BookOpen },
        ],
        chips: ["Draft a summary", "Find related assets", "Check SEO status"],
        prompts: [
          ["List content types", "Find latest entries", "Show entry schema"],
          ["Create entry", "Update an entry", "Find entries by type"],
        ],
      },
      Editing: {
        headlines: [
          "Editing content",
          "You’re in edit mode",
          "Draft updates, ready",
        ],
        subheads: [
          "Need schema details or related entries?",
          "Review fields or find similar entries fast.",
        ],
        welcomeTitles: [
          "Editing content ✍️",
          "Draft updates, ready",
          "You’re in edit mode",
        ],
        welcomeSubheads: [
          "Want field guidance or related entries?",
          "I can pull schemas and similar content.",
        ],
        promoCards: [
          {
            title: "Review Fields",
            description: "Check schema",
            icon: Sparkles,
          },
          {
            title: "Find Related",
            description: "Similar entries",
            icon: Zap,
          },
        ],
        activities: [
          { label: "Review Pending: Draft updates", icon: Zap },
          { label: "Guide: Content Modeling", icon: Sparkles },
          { label: "API Reference: Delivery API", icon: Rocket },
          { label: "Course: Writing for CMS", icon: BookOpen },
        ],
        chips: ["Draft a summary", "Find related assets", "Check SEO status"],
        prompts: [
          ["Show entry schema", "Find related entries", "Update this entry"],
          ["List content types", "Find latest entries", "Create entry"],
        ],
      },
      Default: {
        headlines: [
          "Introducing Polaris",
          "Your Contentstack co-pilot",
          "Welcome to Polaris",
        ],
        subheads: [
          "A virtual co-worker helping you get more done across Contentstack.",
          "Ask for schemas, entries, or quick updates.",
          "Need a schema or entries? I can pull them up.",
        ],
        welcomeTitles: [
          "Let’s do this ✨",
          "Welcome back",
          "Ready when you are",
        ],
        welcomeSubheads: [
          "Pick a quick action or ask me anything.",
          "Start with a content type or recent entries.",
        ],
        promoCards: [
          {
            title: "Create Entry",
            description: "Learn the basics",
            icon: PenSquare,
          },
          {
            title: "Global Fields",
            description: "Manage content",
            icon: Globe,
          },
        ],
        activities: [
          { label: "Review Pending: Drafts", icon: Zap },
          { label: "Guide: Content Modeling", icon: Sparkles },
          { label: "API Reference: Delivery API", icon: Rocket },
          { label: "Course: Content workflows", icon: BookOpen },
        ],
        chips: ["Draft a summary", "Find related assets", "Check SEO status"],
        prompts: [
          ["List content types", "Show entry schema", "Find latest entries"],
        ],
      },
    };
  }, []);

  const initialPreset = useMemo(() => {
    const preset = promptPresets[inferredContext as keyof typeof promptPresets];
    return preset ?? promptPresets.Default;
  }, [inferredContext, promptPresets]);

  const initialWelcomeTitle = useMemo(() => {
    const titles = [
      ...baseWelcomeTitles,
      ...(initialPreset.welcomeTitles ?? []),
    ];
    const index = Math.floor(randomSeed * titles.length);
    return titles[index] ?? baseWelcomeTitles[0];
  }, [baseWelcomeTitles, initialPreset.welcomeTitles, randomSeed]);

  const initialWelcomeSubhead = useMemo(() => {
    const contextNote =
      inferredContext && inferredContext !== "Dashboard"
        ? inferredContext === "Editing"
          ? "Looks like you’re editing an entry."
          : `You’re in ${inferredContext}.`
        : "";
    const subheads = [
      ...baseWelcomeSubheads,
      ...(initialPreset.welcomeSubheads ?? []),
      ...(contextNote ? [contextNote] : []),
    ];
    const index = Math.floor(randomSeed * subheads.length);
    return subheads[index] ?? baseWelcomeSubheads[0];
  }, [baseWelcomeSubheads, inferredContext, initialPreset.welcomeSubheads, randomSeed]);

  const initialPromoCards = useMemo(() => {
    return initialPreset.promoCards ?? [];
  }, [initialPreset.promoCards]);

  const initialActivities = useMemo(() => {
    return initialPreset.activities ?? [];
  }, [initialPreset.activities]);

  const initialChips = useMemo(() => {
    return initialPreset.chips ?? [];
  }, [initialPreset.chips]);

  const initialPrompts = useMemo(() => {
    const options = initialPreset.prompts;
    if (options.length === 0) {
      return [];
    }
    const index = Math.floor(randomSeed * options.length);
    return options[index] ?? options[0] ?? [];
  }, [initialPreset.prompts, randomSeed]);

  useEffect(() => {
    if (messages.length > 0) {
      return;
    }
    setSuggestedPrompts(initialPrompts);
  }, [initialPrompts, messages.length]);

  const toolLabel = (tool: string) => {
    const labels: Record<string, string> = {
      get_all_content_types: "Fetching content types",
      get_a_single_content_type: "Loading content type schema",
      get_all_entries: "Fetching entries",
      get_single_entry: "Loading entry",
      create_an_entry: "Creating entry",
      update_an_entry: "Updating entry",
    };
    return labels[tool] ?? tool;
  };

  const handleClear = () => {
    setMessages([]);
    setShowSuggestions(true);
    setPendingSuggestions([]);
    setLiveStatus(null);
    setLivePlan(null);
    setLiveTools([]);
    liveStatusRef.current = null;
    livePlanRef.current = null;
    liveToolsRef.current = [];
    setPendingId(null);
    setLoading(false);
  };

  const handleRestart = () => {
    handleClear();
    setSessionId(null);
  };

  const handleExport = () => {
    const parts: string[] = [];
    for (const message of messages) {
      if (message.kind === "thinking") {
        continue;
      }
      if (message.table && Array.isArray(message.table.rows)) {
        parts.push(`## ${message.table.title ?? "Table"}`);
        parts.push((message.table.columns ?? []).join(" | "));
        parts.push(
          (message.table.columns ?? [])
            .map(() => "---")
            .join(" | ")
        );
        for (const row of message.table.rows) {
          if (message.table.type === "content_types") {
            parts.push([row.name ?? "", "Edit"].join(" | "));
          } else {
            parts.push(
              [
                row.title ?? "",
                formatDate(row.updatedAt),
                row.author ?? "",
                row.entryUid ?? "",
              ].join(" | ")
            );
          }
        }
        parts.push("");
        continue;
      }
      if (message.content.trim().length === 0) {
        continue;
      }
      parts.push(`${message.role === "user" ? "User" : "Polaris"}:`);
      parts.push(message.content);
      parts.push("");
    }
    const content = parts.join("\n");
    const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `polaris-export-${new Date()
      .toISOString()
      .slice(0, 10)}.md`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleExpandToggle = () => {
    setIsExpanded((prev) => !prev);
  };

  const handleSubmit = async (override?: string) => {
    const prompt = override ?? input.trim();
    if (!prompt || loading) {
      return;
    }

    const userMessage = { id: crypto.randomUUID(), role: "user" as const, content: prompt };
    const assistantId = crypto.randomUUID();
    const thinkingId = crypto.randomUUID();
    setMessages((prev) => [
      ...prev,
      userMessage,
      {
        id: thinkingId,
        role: "assistant",
        content: "Thinking: Planning next steps",
        kind: "thinking",
      },
      { id: assistantId, role: "assistant", content: "", kind: "message" },
    ]);
    setInput("");
    setLoading(true);
    setLiveStatus("Thinking...");
    setLiveTools([]);
    setLivePlan(null);
    liveStatusRef.current = "Thinking...";
    livePlanRef.current = null;
    liveToolsRef.current = [];
    setShowSuggestions(true);
    setPendingSuggestions([]);
    setPendingId(assistantId);

    try {
      const response = await fetch("/api/polaris/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          message: prompt,
          pageContext: inferredContext,
        }),
      });

      if (!response.ok || !response.body) {
        const text = await response.text();
        throw new Error(text || "Something went wrong.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      const handleEvent = (event: string, data: Record<string, unknown>) => {
        if (event === "session" && typeof data.sessionId === "string") {
          setSessionId(data.sessionId);
        }
        if (event === "status" && typeof data.state === "string") {
          setLiveStatus(data.state);
          liveStatusRef.current = data.state;
        }
        if (event === "plan" && typeof data.text === "string") {
          setLivePlan(data.text);
          livePlanRef.current = data.text;
        }
        if (event === "tool" && typeof data.name === "string") {
          const label =
            typeof data.label === "string" ? data.label : toolLabel(data.name);
          setLiveTools((prev) => (prev.includes(label) ? prev : [...prev, label]));
          if (!liveToolsRef.current.includes(label)) {
            liveToolsRef.current = [...liveToolsRef.current, label];
          }
        }
        const statusText = liveStatusRef.current ?? "Working";
        const toolsText = liveToolsRef.current
          .filter((tool) => tool !== statusText)
          .join(" · ");
        const thinkingParts = [
          livePlanRef.current ?? "Planning next steps",
          statusText,
          toolsText.length > 0 ? toolsText : null,
        ].filter(Boolean);
        updateMessage(thinkingId, (message) => ({
          ...message,
          content: `Thinking: ${thinkingParts.join(" • ")}`,
        }));
        if (event === "delta" && typeof data.text === "string") {
          updateMessage(assistantId, (message) => ({
            ...message,
            content: `${message.content}${data.text}`,
          }));
        }
        if (event === "done") {
          setLoading(false);
          setLiveStatus("Completed");
          liveStatusRef.current = "Completed";
          setPendingId(null);
          updateMessage(thinkingId, (message) => ({
            ...message,
            content: "Thinking: Completed",
          }));
          setShowSuggestions(true);
        }
        if (event === "error" && typeof data.message === "string") {
          updateMessage(assistantId, (message) => ({
            ...message,
            content: data.message,
          }));
          setLoading(false);
          setLiveStatus("Error");
          liveStatusRef.current = "Error";
          setPendingId(null);
          updateMessage(thinkingId, (message) => ({
            ...message,
            content: "Thinking: Error",
          }));
          setShowSuggestions(true);
        }
        if (event === "suggestions" && Array.isArray(data.items)) {
          const items = data.items.filter(
            (item): item is string => typeof item === "string"
          );
          if (items.length > 0) {
            setSuggestedPrompts(items);
            setShowSuggestions(true);
          }
        }
        if (
          event === "table" &&
          data &&
          typeof data === "object" &&
          Array.isArray((data as { rows?: unknown[] }).rows)
        ) {
          updateMessage(assistantId, (message) => ({ ...message, hidden: true }));
          const tableMessage = {
            id: crypto.randomUUID(),
            role: "assistant" as const,
            content: "",
            kind: "message" as const,
            table: data,
          };
          setMessages((prev) => [...prev, tableMessage]);
        }
      };

      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          break;
        }
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";
        for (const part of parts) {
          const lines = part.split("\n");
          let event = "message";
          let data = "";
          for (const line of lines) {
            if (line.startsWith("event:")) {
              event = line.replace("event:", "").trim();
            }
            if (line.startsWith("data:")) {
              data += line.replace("data:", "").trim();
            }
          }
          if (data) {
            handleEvent(event, JSON.parse(data) as Record<string, unknown>);
          }
        }
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to send message.";
      updateMessage(assistantId, (msg) => ({ ...msg, content: message }));
      setLoading(false);
      setLiveStatus("Error");
      setPendingId(null);
      updateMessage(thinkingId, (msg) => ({ ...msg, content: "Thinking: Error" }));
      setShowSuggestions(true);
    }
  };

  const formatDate = (value?: string) => {
    if (!value) {
      return "—";
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const stackUid = process.env.NEXT_PUBLIC_CONTENTSTACK_STACK_UID ?? "";
  const appBaseUrl =
    process.env.NEXT_PUBLIC_CONTENTSTACK_APP_BASE ?? "https://app.contentstack.com";
  const branch = process.env.NEXT_PUBLIC_CONTENTSTACK_BRANCH ?? "main";
  const locale = process.env.NEXT_PUBLIC_CONTENTSTACK_LOCALE ?? "en";
  const environmentUid = process.env.NEXT_PUBLIC_CONTENTSTACK_ENVIRONMENT_UID ?? "";
  const visualBuilderTargetBase =
    process.env.NEXT_PUBLIC_CONTENTSTACK_VB_TARGET_BASE ?? "";
  const liveBaseUrl = process.env.NEXT_PUBLIC_CONTENTSTACK_LIVE_BASE_URL ?? "";

  const buildEditUrl = (entryUid?: string, contentTypeUid?: string) => {
    if (!stackUid || !entryUid || !contentTypeUid) {
      return "";
    }
    return `${appBaseUrl}/#!/stack/${stackUid}/content-type/${contentTypeUid}/${locale}/entry/${entryUid}/edit?branch=${encodeURIComponent(
      branch
    )}`;
  };

  const buildVisualBuilderUrl = (entryUid?: string, contentTypeUid?: string) => {
    if (!stackUid || !entryUid || !contentTypeUid || !environmentUid) {
      return "";
    }
    const baseParams = new URLSearchParams({
      persist: "true",
      branch,
      locale,
      entry_uid: entryUid,
      content_type_uid: contentTypeUid,
      environment: environmentUid,
    });
    if (visualBuilderTargetBase) {
      baseParams.set("target-url", visualBuilderTargetBase);
    }
    return `${appBaseUrl}/#!/stack/${stackUid}/visual-builder?${baseParams.toString()}`;
  };

  const buildLiveUrl = (path?: string) => {
    if (!liveBaseUrl) {
      return "";
    }
    if (!path) {
      return liveBaseUrl;
    }
    const trimmedBase = liveBaseUrl.replace(/\/$/, "");
    const trimmedPath = path.startsWith("/") ? path : `/${path}`;
    return `${trimmedBase}${trimmedPath}`;
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        aria-label="Open Polaris"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((prev) => !prev)}
      >
        <PolarisIcon className="h-8 w-8" />
      </Button>

      {open
        ? (() => {
            const panel = (
              <aside
                id={panelId}
                ref={panelRef}
                className={`${
                  isExpanded
                    ? "fixed left-1/2 top-16 z-40 h-[calc(100vh-96px)] w-[min(920px,92vw)] -translate-x-1/2"
                    : isPinned
                    ? "relative h-full w-full"
                    : "fixed right-4 top-10 z-30 h-[calc(100vh-56px)] w-[540px]"
                } flex flex-col rounded-md border border-transparent bg-[color:var(--color-surface)] shadow-[0_0_1.5rem_rgba(0,0,0,0.17)]`}
                role="dialog"
                aria-label="Polaris assistant"
                aria-modal="false"
              >
          <div className="flex items-center justify-between border-b border-[color:var(--color-border)] px-5 py-3.5">
            <div className="flex items-center gap-2 text-[15px] font-semibold">
              <PolarisIcon className="h-5 w-5 text-[color:var(--color-brand)]" />
              Polaris
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                aria-label={isPinned ? "Unpin Polaris" : "Pin Polaris"}
                onClick={() => setIsPinned((prev) => !prev)}
              >
                {isPinned ? (
                  <PinOff className="h-4 w-4" />
                ) : (
                  <Pin className="h-4 w-4" />
                )}
              </Button>
              <div className="relative" ref={menuRef}>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Polaris options"
                  aria-expanded={menuOpen}
                  onClick={() => setMenuOpen((prev) => !prev)}
                >
                  <MoreVertical className="h-5 w-5" />
                </Button>
                {menuOpen ? (
                  <div className="absolute right-0 top-10 z-40 min-w-[160px] rounded-md border border-[color:var(--color-border)] bg-white p-1 text-left shadow-lg">
                    <button
                      type="button"
                      className="w-full rounded px-3 py-2 text-sm text-[color:var(--color-foreground)] hover:bg-[color:var(--color-surface-muted)]"
                      onClick={() => {
                        handleClear();
                        setMenuOpen(false);
                      }}
                    >
                      Clear conversation
                    </button>
                    <button
                      type="button"
                      className="w-full rounded px-3 py-2 text-sm text-[color:var(--color-foreground)] hover:bg-[color:var(--color-surface-muted)]"
                      onClick={() => {
                        handleRestart();
                        setMenuOpen(false);
                      }}
                    >
                      Restart session
                    </button>
                    <button
                      type="button"
                      className="w-full rounded px-3 py-2 text-sm text-[color:var(--color-foreground)] hover:bg-[color:var(--color-surface-muted)]"
                      onClick={() => {
                        handleExport();
                        setMenuOpen(false);
                      }}
                    >
                      Export transcript
                    </button>
                    <button
                      type="button"
                      className="w-full rounded px-3 py-2 text-sm text-[color:var(--color-foreground)] hover:bg-[color:var(--color-surface-muted)]"
                      onClick={() => {
                        handleExpandToggle();
                        setMenuOpen(false);
                      }}
                    >
                      {isExpanded ? "Exit wide view" : "Open wide view"}
                    </button>
                  </div>
                ) : null}
              </div>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Close Polaris"
                onClick={() => setOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
          <div className="flex flex-1 flex-col overflow-hidden px-8 py-8">
            {messages.length === 0 ? (
              <div className="flex flex-1 flex-col items-center gap-3 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[color:var(--color-brand-soft)] text-[color:var(--color-brand)] shadow-[0_8px_22px_rgba(109,80,255,0.25)]">
                  <PolarisIcon className="h-7 w-7" />
                </div>
                <h3 className="text-[20px] font-semibold text-[color:var(--color-foreground)]">
                  {initialWelcomeTitle}
                </h3>
                <p className="max-w-[320px] text-center text-[0.875rem] leading-[1.5] text-[#6b7280]">
                  {initialWelcomeSubhead}
                </p>

                <div className="mt-2 grid w-full max-w-[420px] grid-cols-2 gap-3">
                  {initialPromoCards.slice(0, 2).map((card) => {
                    const Icon = card.icon;
                    return (
                      <button
                        key={card.title}
                        type="button"
                        onClick={() => void handleSubmit(card.title)}
                        className="flex h-[88px] flex-col items-center justify-center gap-1 rounded-2xl bg-[color:var(--color-brand)] text-white shadow-[0_10px_18px_rgba(79,70,229,0.25)] transition hover:brightness-110"
                      >
                        <Icon className="h-6 w-6" />
                        <div className="text-sm font-semibold">{card.title}</div>
                        <div className="text-[11px] text-white/80">
                          {card.description}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-4 w-full max-w-[420px] space-y-2 text-left">
                  {initialActivities.map((activity) => {
                    const Icon = activity.icon;
                    return (
                      <button
                        key={activity.label}
                        type="button"
                        onClick={() => void handleSubmit(activity.label)}
                        className="flex w-full items-center justify-between rounded-xl border border-[color:var(--color-border)] bg-white px-3 py-2 text-sm text-[color:var(--color-foreground)] shadow-sm transition hover:border-[color:var(--color-brand)]"
                      >
                        <span className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-[color:var(--color-brand)]" />
                          {activity.label}
                        </span>
                        <ChevronRight className="h-4 w-4 text-[color:var(--color-muted)]" />
                      </button>
                    );
                  })}
                </div>

                <div className="mt-4 flex w-full max-w-[420px] flex-wrap justify-center gap-2">
                  {initialChips.map((chip) => (
                    <Button
                      key={chip}
                      variant="outline"
                      size="sm"
                      className="h-auto rounded-full px-3 py-1 text-[11px] font-medium"
                      onClick={() => void handleSubmit(chip)}
                    >
                      {chip}
                    </Button>
                  ))}
                </div>

              </div>
            ) : (
              <div className="flex flex-1 flex-col gap-3 overflow-hidden">
                <div
                  ref={scrollContainerRef}
                  className="flex flex-1 flex-col gap-4 overflow-y-auto pr-2"
                  onScroll={() => {
                    const container = scrollContainerRef.current;
                    if (!container) {
                      return;
                    }
                    const threshold = 40;
                    const atBottom =
                      container.scrollHeight -
                        (container.scrollTop + container.clientHeight) <=
                      threshold;
                    setAutoScrollEnabled(atBottom);
                  }}
                >
                  {messages.map((message) => {
                    const isHidden =
                      message.hidden && message.content.trim().length < 120;
                    if (isHidden) {
                      return null;
                    }
                    return (
                      <div
                        key={message.id}
                        className={`rounded-lg border px-4 py-3 text-sm ${
                          message.role === "user"
                            ? "ml-auto max-w-[85%] border-[color:var(--color-brand)] bg-[color:var(--color-brand-soft)] text-[color:var(--color-foreground)]"
                            : "mr-auto max-w-[90%] border-[color:var(--color-border)] bg-white text-[color:var(--color-foreground)]"
                        }`}
                      >
                      {message.table && Array.isArray(message.table.rows) ? (
                        <div className="space-y-3">
                          <div className="text-[13px] font-semibold text-[color:var(--color-foreground)]">
                            {message.table.title ?? "Entries"}
                          </div>
                          <div className="overflow-hidden rounded-lg border border-[color:var(--color-border)]">
                            <table className="w-full text-left text-[12px]">
                              <thead className="bg-[color:var(--color-surface-muted)] text-[color:var(--color-muted)]">
                                <tr>
                                  {(message.table.columns ?? []).map((column) => (
                                    <th
                                      key={column}
                                      className="px-3 py-2 font-semibold"
                                    >
                                      {column}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {message.table.type === "content_types"
                                  ? message.table.rows.map((row) => (
                                      <tr
                                        key={row.id}
                                        className="border-t border-[color:var(--color-border)]"
                                      >
                                        <td className="px-3 py-2 font-semibold text-[color:var(--color-foreground)]">
                                          {row.name ?? "Untitled"}
                                        </td>
                                        <td className="px-3 py-2 text-[color:var(--color-muted)]">
                                          {row.uid && stackUid ? (
                                            <a
                                              className="text-[color:var(--color-brand)] hover:underline"
                                              href={`${appBaseUrl}/#!/stack/${stackUid}/content-type/${row.uid}/content-type-builder?branch=${encodeURIComponent(
                                                branch
                                              )}`}
                                              target="_blank"
                                              rel="noreferrer"
                                            >
                                              Edit
                                            </a>
                                          ) : (
                                            <span className="text-[color:var(--color-muted)]">
                                              Edit
                                            </span>
                                          )}
                                        </td>
                                      </tr>
                                    ))
                                  : message.table.rows.map((row) => (
                                      <tr
                                        key={row.id}
                                        className="border-t border-[color:var(--color-border)]"
                                      >
                                        <td className="px-3 py-2">
                                          <span className="font-semibold text-[color:var(--color-foreground)]">
                                            {row.title}
                                          </span>
                                        </td>
                                        <td className="px-3 py-2 text-[color:var(--color-muted)]">
                                          {formatDate(row.updatedAt)}
                                        </td>
                                        <td className="px-3 py-2 text-[color:var(--color-muted)]">
                                          {row.author ?? "—"}
                                        </td>
                                        <td className="px-3 py-2 text-[color:var(--color-muted)]">
                                          <div className="flex flex-wrap gap-2">
                                            {(() => {
                                              const editUrl = buildEditUrl(
                                                row.entryUid,
                                                row.contentTypeUid
                                              );
                                              return editUrl ? (
                                                <a
                                                  className="text-[color:var(--color-brand)] hover:underline"
                                                  href={editUrl}
                                                  target="_blank"
                                                  rel="noreferrer"
                                                >
                                                  Edit
                                                </a>
                                              ) : (
                                                <span className="text-[color:var(--color-muted)]">
                                                  Edit
                                                </span>
                                              );
                                            })()}
                                            {(() => {
                                              const builderUrl = buildVisualBuilderUrl(
                                                row.entryUid,
                                                row.contentTypeUid
                                              );
                                              return builderUrl ? (
                                                <a
                                                  className="text-[color:var(--color-brand)] hover:underline"
                                                  href={builderUrl}
                                                  target="_blank"
                                                  rel="noreferrer"
                                                >
                                                  Visual Builder
                                                </a>
                                              ) : (
                                                <span className="text-[color:var(--color-muted)]">
                                                  Visual Builder
                                                </span>
                                              );
                                            })()}
                                            {(() => {
                                              const liveUrl = buildLiveUrl(row.urlPath);
                                              return liveUrl ? (
                                                <a
                                                  className="text-[color:var(--color-brand)] hover:underline"
                                                  href={liveUrl}
                                                  target="_blank"
                                                  rel="noreferrer"
                                                >
                                                  View live
                                                </a>
                                              ) : (
                                                <span className="text-[color:var(--color-muted)]">
                                                  View live
                                                </span>
                                              );
                                            })()}
                                          </div>
                                        </td>
                                      </tr>
                                    ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ) : (
                          <p
                            className={`whitespace-pre-wrap ${
                              message.kind === "thinking"
                                ? "text-[12px] text-[color:var(--color-muted)]"
                                : ""
                            }`}
                          >
                            {message.content}
                          </p>
                        )}
                      </div>
                    );
                  })}
                  {!loading && showSuggestions ? (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {suggestedPrompts.map((prompt) => (
                        <Button
                          key={`followup-${prompt}`}
                          variant="outline"
                          size="sm"
                          className="h-auto max-w-[210px] rounded-xl px-3 py-1 text-[11px] leading-[1.2]"
                          onClick={() => void handleSubmit(prompt)}
                        >
                          <span className="text-left">{prompt}</span>
                        </Button>
                      ))}
                    </div>
                  ) : null}
                  <div ref={messagesEndRef} />
                </div>
                {loading && !pendingId ? (
                  <div className="mr-auto max-w-[60%] rounded-lg border border-[color:var(--color-border)] bg-white px-4 py-3 text-sm text-[color:var(--color-muted)]">
                    Thinking...
                  </div>
                ) : null}
              </div>
            )}
          </div>
          <div className="space-y-2 px-5 py-4">
            <form
              className="rounded-md bg-gradient-to-r from-[#6c5ce7] via-[#8b7cf6] to-[#6c5ce7] p-[1px]"
              onSubmit={(event) => {
                event.preventDefault();
                void handleSubmit();
              }}
            >
              <div className="relative rounded-[5px] bg-white">
                <Input
                  placeholder="Describe what you would like to do..."
                  className="h-10 border-0 pr-10 text-[13px] focus-visible:ring-0 focus-visible:ring-offset-0"
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  disabled={loading}
                />
                <Button
                  type="submit"
                  size="icon"
                  variant="ghost"
                  className="absolute right-1 top-1/2 -translate-y-1/2"
                  aria-label="Send message"
                  disabled={loading || !input.trim()}
                >
                  <Send className="h-4 w-4 text-[color:var(--color-muted)]" />
                </Button>
              </div>
            </form>
            <div className="flex items-center justify-between text-[11px] text-[color:var(--color-muted)]">
              <p className="flex items-center gap-1 italic">
                <Lightbulb className="h-3.5 w-3.5 text-[color:var(--color-muted)]" />
                Not sure what to ask?{" "}
                <span className="text-[color:var(--color-brand)]">
                  See what I can do
                </span>
              </p>
              <span>0/2000</span>
            </div>
          </div>
              </aside>
            );
            if (isPinned && dockElement) {
              return createPortal(panel, dockElement);
            }
            return panel;
          })()
        : null}
    </>
  );
}

function PolarisIcon({ className }: { className?: string }) {
  const gradientId = useId();
  const paint0 = `${gradientId}-paint0`;
  const paint1 = `${gradientId}-paint1`;
  const paint2 = `${gradientId}-paint2`;

  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M12.7 6.705c.285-.716 1.315-.716 1.599 0l.026.074 1.026 3.37 3.37 1.026c.815.248.815 1.402 0 1.65l-3.37 1.026-1.026 3.37c-.248.815-1.402.815-1.65 0l-1.027-3.37-3.369-1.026c-.815-.248-.815-1.402 0-1.65l3.37-1.027 1.026-3.369.026-.074zm-.015 3.905a.863.863 0 01-.575.575L9.433 12l2.678.815c.241.073.436.247.537.474l.038.1.815 2.679.815-2.679.037-.1a.863.863 0 01.537-.474L17.568 12l-2.679-.815a.863.863 0 01-.574-.575L13.5 7.933l-.815 2.678z"
        fill={`url(#${paint0})`}
      />
      <path
        d="M7.357 3.433a.15.15 0 01.285 0l.577 1.753a.15.15 0 00.095.095l1.753.576a.15.15 0 010 .285l-1.753.577a.15.15 0 00-.095.095l-.577 1.753a.15.15 0 01-.285 0l-.576-1.753a.15.15 0 00-.095-.095l-1.753-.577a.15.15 0 010-.285l1.753-.576a.15.15 0 00.095-.095l.576-1.753z"
        fill={`url(#${paint1})`}
      />
      <path
        d="M7.357 15.433a.15.15 0 01.285 0l.577 1.753a.15.15 0 00.095.095l1.753.577a.15.15 0 010 .284l-1.753.577a.15.15 0 00-.095.095l-.577 1.753a.15.15 0 01-.285 0l-.576-1.753a.15.15 0 00-.095-.095l-1.753-.577a.15.15 0 010-.284l1.753-.577a.15.15 0 00.095-.095l.576-1.753z"
        fill={`url(#${paint2})`}
      />
      <defs>
        <linearGradient
          id={paint0}
          x1="3.541"
          y1="2.635"
          x2="25.745"
          y2="15.114"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#49A466" />
          <stop offset="0.5" stopColor="#6F83F2" />
          <stop offset="1" stopColor="#8A3DFF" />
        </linearGradient>
        <linearGradient
          id={paint1}
          x1="3.541"
          y1="2.635"
          x2="25.745"
          y2="15.114"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#49A466" />
          <stop offset="0.5" stopColor="#6F83F2" />
          <stop offset="1" stopColor="#8A3DFF" />
        </linearGradient>
        <linearGradient
          id={paint2}
          x1="3.541"
          y1="2.635"
          x2="25.745"
          y2="15.114"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#49A466" />
          <stop offset="0.5" stopColor="#6F83F2" />
          <stop offset="1" stopColor="#8A3DFF" />
        </linearGradient>
      </defs>
    </svg>
  );
}
