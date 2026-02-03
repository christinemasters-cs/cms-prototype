"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  BookOpen,
  ChevronRight,
  Globe,
  Lightbulb,
  Loader2,
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
import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PolarisAgentSetup } from "@/components/polaris-agent-setup";

const VOICE_PROFILES = ["Default", "Red Panda", "Northwind", "Atlas"] as const;

type PromptPreset = {
  headlines: string[];
  subheads: string[];
  welcomeTitles?: string[];
  welcomeSubheads?: string[];
  promoCards?: Array<{ title: string; description: string; icon: LucideIcon }>;
  activities?: Array<{ label: string; icon: LucideIcon }>;
  chips?: string[];
  prompts: string[];
};

type TimeBucket = "morning" | "afternoon" | "evening" | "late";

const hashString = (value: string) => {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

const pickFromList = (items: string[], seed: string, fallback = "") => {
  if (items.length === 0) {
    return fallback;
  }
  const index = hashString(`${seed}|${items.length}`) % items.length;
  return items[index] ?? items[0] ?? fallback;
};

const rotateBySeed = <T,>(items: T[], seed: string) => {
  if (items.length === 0) {
    return items;
  }
  const offset = hashString(`${seed}|rotate`) % items.length;
  return [...items.slice(offset), ...items.slice(0, offset)];
};

const getTimeBucket = (date: Date): TimeBucket => {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) {
    return "morning";
  }
  if (hour >= 12 && hour < 17) {
    return "afternoon";
  }
  if (hour >= 17 && hour < 22) {
    return "evening";
  }
  return "late";
};

const tagKeywords: Record<string, string[]> = {
  entries: ["entry", "entries", "content item", "draft"],
  assets: ["asset", "image", "media", "file", "video", "gallery"],
  models: ["model", "schema", "content type", "field", "global field"],
  publish: ["publish", "queue", "release", "launch", "go live", "schedule"],
  tasks: ["task", "review", "approval", "workflow", "assignment"],
  analytics: ["analytics", "insight", "performance", "metric", "report"],
  personalize: ["personalize", "variant", "experiment", "audience"],
  automate: ["automate", "automation", "agent", "trigger", "workflow"],
  brand: ["brand", "guideline", "logo", "tone"],
  dev: ["api", "sdk", "webhook", "developer"],
  marketplace: ["marketplace", "integration", "app", "extension"],
  academy: ["academy", "course", "training", "lesson"],
  admin: ["admin", "permission", "role", "user", "audit", "settings"],
  visual: ["visual", "experience", "builder", "composable", "studio"],
  data: ["data", "insight", "segment", "trend"],
  search: ["search", "find"],
};

const detectTagsFromText = (text: string) => {
  const lowered = text.toLowerCase();
  const matches = new Set<string>();
  for (const [tag, keywords] of Object.entries(tagKeywords)) {
    if (keywords.some((keyword) => lowered.includes(keyword))) {
      matches.add(tag);
    }
  }
  return matches;
};

const getContextTags = (context: string) => {
  return detectTagsFromText(context.replace(/[-_]/g, " "));
};

const buildTimePrompts = (context: string, bucket: TimeBucket) => {
  const tags = getContextTags(context);
  if (bucket === "morning") {
    return [
      tags.has("publish") ? "Morning check: review scheduled publishes" : "Morning check: review today’s priorities",
      tags.has("analytics") ? "Morning check: review overnight performance signals" : "Start the day with a quick status recap",
    ];
  }
  if (bucket === "afternoon") {
    return [
      tags.has("entries") ? "Midday check: review drafts needing updates" : "Midday check: see what’s in progress",
      tags.has("tasks") ? "Midday check: review approvals waiting on you" : "Midday check: clear the next task",
    ];
  }
  if (bucket === "evening") {
    return [
      tags.has("publish") ? "Wrap up: confirm what ships tonight" : "Wrap up: review what’s ready to ship",
      tags.has("analytics") ? "Wrap up: note any performance changes" : "Wrap up: summarize today’s progress",
    ];
  }
  return [
    "After hours: queue tasks for tomorrow",
    "After hours: capture notes for the next shift",
  ];
};

const selectPrompts = ({
  prompts,
  seed,
  recentText,
  recentPrompts,
  context,
  timeBucket,
  count = 6,
}: {
  prompts: string[];
  seed: string;
  recentText: string;
  recentPrompts: string[];
  context: string;
  timeBucket: TimeBucket;
  count?: number;
}) => {
  if (prompts.length === 0) {
    return [];
  }

  const recentPromptSet = new Set(recentPrompts.map((prompt) => prompt.toLowerCase()));
  const recentTags = detectTagsFromText(recentText);
  const contextTags = getContextTags(context);
  const timeKeywords: Record<TimeBucket, string[]> = {
    morning: ["morning", "start the day", "today"],
    afternoon: ["midday", "afternoon", "check-in"],
    evening: ["wrap up", "end of day", "tonight"],
    late: ["after hours", "tomorrow"],
  };

  const scored = prompts.map((prompt, index) => {
    const lowered = prompt.toLowerCase();
    let score = (prompts.length - index) / prompts.length;
    if (recentPromptSet.has(lowered)) {
      score -= 2;
    }
    if (timeKeywords[timeBucket].some((keyword) => lowered.includes(keyword))) {
      score += 1.1;
    }
    if ([...recentTags].some((tag) => tagKeywords[tag]?.some((keyword) => lowered.includes(keyword)))) {
      score += 0.9;
    }
    if ([...contextTags].some((tag) => tagKeywords[tag]?.some((keyword) => lowered.includes(keyword)))) {
      score += 0.8;
    }
    score += (hashString(`${seed}|${prompt}`) % 100) / 500;
    return { prompt, score };
  });

  scored.sort((a, b) => {
    if (b.score === a.score) {
      return a.prompt.localeCompare(b.prompt);
    }
    return b.score - a.score;
  });

  const unique: string[] = [];
  const seen = new Set<string>();
  for (const item of scored) {
    const lowered = item.prompt.toLowerCase();
    if (seen.has(lowered)) {
      continue;
    }
    seen.add(lowered);
    unique.push(item.prompt);
    if (unique.length >= count) {
      break;
    }
  }
  return unique;
};

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
    if (normalized.includes("/entries")) {
      return "Entries";
    }
    if (normalized.includes("/assets")) {
      return "Assets";
    }
    if (normalized.includes("/content-model") || normalized.includes("/content-type")) {
      return "Content Models";
    }
    if (normalized.includes("/visual")) {
      return "Visual Experience";
    }
    if (normalized.includes("/composable")) {
      return "Composable Studio";
    }
    if (normalized.includes("/publish-queue") || normalized.includes("/publish")) {
      return "Publish Queue";
    }
    if (normalized.includes("/releases")) {
      return "Releases";
    }
    if (normalized.includes("/tasks")) {
      return "Tasks";
    }
    if (normalized.includes("/settings")) {
      return "Settings";
    }
    if (normalized.includes("/apps")) {
      return "Apps";
    }
    const mappings: Array<{ match: string; label: string }> = [
      { match: "/stacks", label: "CMS" },
      { match: "/headless", label: "Headless CMS" },
      { match: "/personalize", label: "Personalize" },
      { match: "/automation", label: "Automate" },
      { match: "/agent-os", label: "Automate" },
      { match: "/brand-kit", label: "Brand Kit" },
      { match: "/launch", label: "Launch" },
      { match: "/developerhub", label: "Developer Hub" },
      { match: "/marketplace", label: "Marketplace" },
      { match: "/academy", label: "Academy" },
      { match: "/data-insights", label: "Data & Insights" },
      { match: "/insights", label: "Data & Insights" },
      { match: "/product-analytics", label: "Analytics" },
      { match: "/orgadmin", label: "Administration" },
      { match: "/asset-management", label: "Asset Management" },
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
  const [streamPhase, setStreamPhase] = useState<'idle' | 'planning' | 'tool' | 'streaming' | 'done'>('idle');
  const [currentOperation, setCurrentOperation] = useState<string | null>(null);
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
  const [timeBucket] = useState<TimeBucket>(() => getTimeBucket(new Date()));
  const [dayStamp] = useState(() => new Date().toISOString().slice(0, 10));
  const [recentPrompts, setRecentPrompts] = useState<string[]>([]);
  const [isPinned, setIsPinned] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dockElement, setDockElement] = useState<HTMLElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLElement | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const shouldDock = open && isPinned;
  const [panelMode, setPanelMode] = useState<"chat" | "agent-setup">("chat");
  const [contextLabel, setContextLabel] = useState<string | null>(null);
  const [contextPrompt, setContextPrompt] = useState<string | null>(null);
  const [contextKey, setContextKey] = useState<string | null>(null);
  const [pageContextLabel, setPageContextLabel] = useState<string | null>(null);
  const [pageContextPrompt, setPageContextPrompt] = useState<string | null>(null);
  const [dismissedApplyId, setDismissedApplyId] = useState<string | null>(null);
  const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(
    null
  );
  const voiceProfiles = VOICE_PROFILES;
  const [voiceProfile, setVoiceProfile] = useState("Default");
  const [voiceMenuOpen, setVoiceMenuOpen] = useState(false);
  const voiceMenuRef = useRef<HTMLDivElement | null>(null);
  const [panelPayload, setPanelPayload] = useState<{
    projectId?: string;
    description?: string;
  }>({});

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
    const stored = window.localStorage.getItem("polarisVoiceProfile");
    if (stored && VOICE_PROFILES.includes(stored as (typeof VOICE_PROFILES)[number])) {
      setVoiceProfile(stored);
    }
  }, []);

  useEffect(() => {
    const stored = window.localStorage.getItem("polarisRecentPrompts");
    if (!stored) {
      return;
    }
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        setRecentPrompts(parsed.filter((item) => typeof item === "string"));
      }
    } catch {
      setRecentPrompts([]);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("polarisPinned", String(isPinned));
  }, [isPinned]);

  useEffect(() => {
    window.localStorage.setItem("polarisVoiceProfile", voiceProfile);
  }, [voiceProfile]);

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
    const root = document.documentElement;
    if (open && isExpanded) {
      root.dataset.polarisExpanded = "true";
      return () => {
        delete root.dataset.polarisExpanded;
      };
    }
    delete root.dataset.polarisExpanded;
  }, [open, isExpanded]);

  useEffect(() => {
    const root = document.documentElement;
    if (open) {
      root.dataset.polarisOpen = "true";
      return () => {
        delete root.dataset.polarisOpen;
      };
    }
    delete root.dataset.polarisOpen;
  }, [open]);

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
    if (!voiceMenuOpen) {
      return;
    }
    const handleClick = (event: MouseEvent) => {
      if (!voiceMenuRef.current) {
        return;
      }
      if (!voiceMenuRef.current.contains(event.target as Node)) {
        setVoiceMenuOpen(false);
      }
    };
    window.addEventListener("mousedown", handleClick);
    return () => window.removeEventListener("mousedown", handleClick);
  }, [voiceMenuOpen]);

  useEffect(() => {
    if (!autoScrollEnabled) {
      return;
    }
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, liveStatus, livePlan, liveTools, loading, autoScrollEnabled]);

  useEffect(() => {
    const handleOpen = () => {
      setOpen(true);
      if (panelMode !== "agent-setup") {
        setIsExpanded(false);
      }
    };
    const handleClose = () => setOpen(false);
      const handleExpand = () => setIsExpanded(true);
      const handleCollapse = () => setIsExpanded(false);
    const handleMode = (
      event: Event & {
        detail?: { mode?: "chat" | "agent-setup"; payload?: typeof panelPayload };
      }
    ) => {
      if (!event.detail?.mode) {
        return;
      }
      setPanelMode(event.detail.mode);
      setPanelPayload(event.detail.payload ?? {});
    };
    const handleContext = (
      event: Event & {
        detail?: { contextLabel?: string; contextPrompt?: string; contextKey?: string };
      }
    ) => {
      const label = event.detail?.contextLabel?.trim();
      const prompt = event.detail?.contextPrompt?.trim();
      const key = event.detail?.contextKey?.trim();
      setContextLabel(label && label.length > 0 ? label : null);
      setContextPrompt(prompt && prompt.length > 0 ? prompt : null);
      setContextKey(key && key.length > 0 ? key : null);
      setSelectedSuggestion(null);
      setDismissedApplyId(null);
    };
    const handlePageContext = (
      event: Event & {
        detail?: { contextLabel?: string; contextPrompt?: string };
      }
    ) => {
      const label = event.detail?.contextLabel?.trim();
      const prompt = event.detail?.contextPrompt?.trim();
      setPageContextLabel(label && label.length > 0 ? label : null);
      setPageContextPrompt(prompt && prompt.length > 0 ? prompt : null);
    };

    window.addEventListener("polaris:open", handleOpen);
    window.addEventListener("polaris:close", handleClose);
    window.addEventListener("polaris:expand", handleExpand);
    window.addEventListener("polaris:collapse", handleCollapse);
    window.addEventListener("polaris:mode", handleMode as EventListener);
    window.addEventListener("polaris:context", handleContext as EventListener);
    window.addEventListener("polaris:page-context", handlePageContext as EventListener);
    return () => {
      window.removeEventListener("polaris:open", handleOpen);
      window.removeEventListener("polaris:close", handleClose);
      window.removeEventListener("polaris:expand", handleExpand);
      window.removeEventListener("polaris:collapse", handleCollapse);
      window.removeEventListener("polaris:mode", handleMode as EventListener);
      window.removeEventListener("polaris:context", handleContext as EventListener);
      window.removeEventListener("polaris:page-context", handlePageContext as EventListener);
    };
  }, []);

  const recentContextText = useMemo(() => {
    const recentMessages = messages
      .slice(-4)
      .map((message) => message.content)
      .join(" ");
    const storedPrompts = recentPrompts.join(" ");
    return `${recentMessages} ${storedPrompts}`.trim();
  }, [messages, recentPrompts]);

  const extractSuggestions = (content: string) => {
    const rawLines = content
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    const candidates = rawLines
      .map((line) => line.replace(/^[-*]\s+/, "").replace(/^\d+\.\s+/, ""))
      .filter((line) => line.length > 0 && line.length <= 140);
    if (candidates.length >= 1) {
      return candidates.slice(0, 5);
    }
    const sentence = content.split(/[.!?]/)[0]?.trim() ?? "";
    if (sentence) {
      return [sentence.slice(0, 140)];
    }
    return [];
  };

  const lastAssistantMessage = useMemo(
    () =>
      [...messages]
        .reverse()
        .find(
          (message) =>
            message.role === "assistant" && message.content.trim().length > 0
        ) ?? null,
    [messages]
  );

  const suggestionOptions = useMemo(() => {
    if (!lastAssistantMessage || !contextKey) {
      return [];
    }
    return extractSuggestions(lastAssistantMessage.content);
  }, [lastAssistantMessage, contextKey]);

  const hasSuggestionOptions = suggestionOptions.length > 1;

  const showApplyActions =
    Boolean(contextKey) &&
    Boolean(lastAssistantMessage) &&
    Boolean(selectedSuggestion) &&
    !hasSuggestionOptions &&
    dismissedApplyId !== lastAssistantMessage?.id;

  useEffect(() => {
    if (suggestionOptions.length === 1) {
      setSelectedSuggestion((prev) => prev ?? suggestionOptions[0]);
    }
  }, [suggestionOptions]);

  const seedKey = useMemo(() => {
    return [
      inferredContext,
      pathname ?? "",
      dayStamp,
      timeBucket,
      recentContextText,
    ].join("|");
  }, [dayStamp, inferredContext, pathname, recentContextText, timeBucket]);

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
  const timeWelcomeTitles = useMemo(
    () => ({
      morning: ["Good morning ☀️", "Morning momentum", "Start strong today"],
      afternoon: ["Good afternoon 👋", "Midday momentum", "Keep the flow going"],
      evening: ["Good evening 🌙", "Wrap up strong", "Evening focus"],
      late: ["Working late? 🌌", "Night shift mode", "Late-night momentum"],
    }),
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
  const timeWelcomeSubheads = useMemo(
    () => ({
      morning: ["Kick off with a quick content sweep.", "Start the day with a fast content check."],
      afternoon: ["Check what’s in flight and keep things moving.", "Midday is perfect for quick updates."],
      evening: ["Wrap up with a final review or ship-ready tasks.", "Close the loop on today’s content."],
      late: ["Capture notes and queue tomorrow’s work.", "Lightweight tasks are perfect right now."],
    }),
    []
  );

  const promptPresets = useMemo<Record<string, PromptPreset>>(() => {
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
          {
            title: "Review Queue",
            description: "Publish status",
            icon: Rocket,
          },
        ],
        activities: [
          { label: "Review Pending: Q4 Roadmap", icon: Zap },
          { label: "New Course: Mastering Workflows", icon: BookOpen },
          { label: "Guide: Content Modeling", icon: Sparkles },
          { label: "API Reference: Delivery API", icon: Rocket },
          { label: "Reminder: Publish queue review", icon: Zap },
        ],
        chips: ["Draft a summary", "Check SEO status", "Find related assets", "Review publish queue"],
        prompts: [
          "Show recent entries",
          "List content types",
          "Find my last edits",
          "Create a draft entry",
          "Review publish queue",
          "Show recent assets",
          "Summarize recent updates",
          "Open Visual Builder",
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
          {
            title: "Review Queue",
            description: "Publish status",
            icon: Rocket,
          },
        ],
        activities: [
          { label: "Review Pending: Content updates", icon: Zap },
          { label: "Guide: Content Modeling", icon: Sparkles },
          { label: "API Reference: Delivery API", icon: Rocket },
          { label: "Course: Entry workflows", icon: BookOpen },
        ],
        chips: ["Draft a summary", "Find related assets", "Check SEO status", "Review publish queue"],
        prompts: [
          "List content types",
          "Show entry schema",
          "Find latest entries",
          "Find entries by type",
          "Update a draft entry",
          "Create new entry",
          "Find related assets",
          "Show global fields",
          "Review publish queue",
        ],
      },
      "Headless CMS": {
        headlines: [
          "Headless CMS workspace",
          "Schema-first content",
          "Power the content layer",
        ],
        subheads: [
          "Inspect schemas, entries, and API-ready content.",
          "Move fast with content models and entry payloads.",
        ],
        welcomeTitles: [
          "Headless CMS ready",
          "Schema-first workflows",
          "Content API mode",
        ],
        welcomeSubheads: [
          "Need a schema or an entry payload? I can pull it fast.",
          "Start with a content type and I’ll drill into entries.",
        ],
        promoCards: [
          {
            title: "Content Types",
            description: "Review schemas",
            icon: Sparkles,
          },
          {
            title: "Delivery API",
            description: "Payloads & queries",
            icon: Rocket,
          },
        ],
        activities: [
          { label: "Guide: Content Modeling", icon: Sparkles },
          { label: "API Reference: Delivery API", icon: Rocket },
          { label: "Course: Headless foundations", icon: BookOpen },
        ],
        chips: ["Generate sample payload", "Check locales", "Find updated entries"],
        prompts: [
          "List content types",
          "Show entry schema",
          "Generate sample entry payload",
          "Find entries updated this week",
          "Check locales and environments",
          "Review webhooks",
          "Create a draft entry",
        ],
      },
      Entries: {
        headlines: ["Entries hub", "Entry management", "Find and update entries"],
        subheads: ["Search, create, and update entries fast.", "Drill into entries by type, status, or author."],
        welcomeTitles: ["Entries, ready", "Entry editor mode", "Let’s update entries"],
        welcomeSubheads: ["Find entries by type or status.", "Need the latest drafts? I can pull them up."],
        promoCards: [
          { title: "Create Entry", description: "New content", icon: PenSquare },
          { title: "Find Drafts", description: "Review drafts", icon: Sparkles },
        ],
        activities: [
          { label: "Review Pending: Draft updates", icon: Zap },
          { label: "Guide: Entry workflows", icon: BookOpen },
        ],
        chips: ["Show latest entries", "Find entries by type", "Create new entry"],
        prompts: [
          "Show latest entries",
          "Find entries by type",
          "Find entries updated today",
          "Create a new entry",
          "Update a draft entry",
          "Show entry schema",
          "Find entries by author",
        ],
      },
      Assets: {
        headlines: ["Assets ready", "Asset workflow", "Manage assets fast"],
        subheads: ["Find, review, and replace assets quickly.", "Track usage and keep assets organized."],
        welcomeTitles: ["Assets in focus", "Asset management", "Keep media fresh"],
        welcomeSubheads: ["Show the latest assets or find usage quickly.", "Need asset references? I can help."],
        promoCards: [
          { title: "Latest Assets", description: "Recent uploads", icon: Sparkles },
          { title: "Find Usage", description: "Asset references", icon: Rocket },
        ],
        activities: [
          { label: "Review Pending: Asset refresh", icon: Zap },
          { label: "Guide: Asset workflows", icon: BookOpen },
        ],
        chips: ["Show latest assets", "Find asset usage", "Replace an asset"],
        prompts: [
          "Show latest assets",
          "Find assets by tag",
          "Find where an asset is used",
          "Replace an asset",
          "Organize assets by folder",
          "Find large assets to optimize",
        ],
      },
      "Asset Management": {
        headlines: ["Asset management", "Keep assets organized", "Asset hygiene mode"],
        subheads: ["Audit, organize, and refresh asset libraries.", "Track usage and optimize assets fast."],
        welcomeTitles: ["Asset hygiene", "Asset management", "Keep media tidy"],
        welcomeSubheads: ["Need asset usage details or latest uploads?", "Let’s clean up and optimize assets."],
        promoCards: [
          { title: "Asset Audit", description: "Usage & size", icon: Sparkles },
          { title: "Replace Asset", description: "Swap files", icon: Rocket },
        ],
        activities: [
          { label: "Review Pending: Asset audit", icon: Zap },
          { label: "Guide: Asset governance", icon: BookOpen },
        ],
        chips: ["Find unused assets", "Show latest assets", "Find asset references"],
        prompts: [
          "Find unused assets",
          "Show latest assets",
          "Find where an asset is used",
          "Replace an asset",
          "Organize assets by folder",
          "Find large assets to optimize",
        ],
      },
      "Content Models": {
        headlines: ["Model your content", "Schema studio", "Content modeling"],
        subheads: ["Review content types and global fields.", "Evolve schemas with confidence."],
        welcomeTitles: ["Model your content", "Schema studio", "Content models ready"],
        welcomeSubheads: ["Need a content type schema? I can pull it fast.", "Start with a content type overview."],
        promoCards: [
          { title: "Content Types", description: "Schema overview", icon: Sparkles },
          { title: "Global Fields", description: "Shared fields", icon: Globe },
        ],
        activities: [
          { label: "Review Pending: Schema updates", icon: Zap },
          { label: "Guide: Content Modeling", icon: BookOpen },
        ],
        chips: ["List content types", "Show entry schema", "Review global fields"],
        prompts: [
          "List content types",
          "Show entry schema",
          "Review global fields",
          "Compare two content types",
          "Find fields used across models",
          "Create a new content type",
        ],
      },
      "Composable Studio": {
        headlines: ["Composable Studio", "Visual experiences", "Build pages fast"],
        subheads: ["Design visual experiences with reusable blocks.", "Preview and iterate on live layouts."],
        welcomeTitles: ["Composable Studio", "Visual experience mode", "Layout building time"],
        welcomeSubheads: ["Need a visual experience or preview? I can open it.", "Start with a page or layout entry."],
        promoCards: [
          { title: "Open Visual Builder", description: "Preview pages", icon: Rocket },
          { title: "Experience Library", description: "Layouts & blocks", icon: Sparkles },
        ],
        activities: [
          { label: "Review Pending: Experience updates", icon: Zap },
          { label: "Guide: Visual Builder", icon: BookOpen },
        ],
        chips: ["Open Visual Builder", "Preview latest layout", "Find experience entries"],
        prompts: [
          "Open Visual Builder",
          "List visual experiences",
          "Preview an entry in Visual Builder",
          "Find layout entries by template",
          "Generate component copy ideas",
          "Check live preview URL",
        ],
      },
      "Visual Experience": {
        headlines: ["Visual Experience", "Composable experiences", "Build pages fast"],
        subheads: ["Design visual experiences with reusable blocks.", "Preview and iterate on live layouts."],
        welcomeTitles: ["Visual Experience", "Layout building time", "Experience mode"],
        welcomeSubheads: ["Need a visual experience or preview? I can open it.", "Start with a page or layout entry."],
        promoCards: [
          { title: "Open Visual Builder", description: "Preview pages", icon: Rocket },
          { title: "Experience Library", description: "Layouts & blocks", icon: Sparkles },
        ],
        activities: [
          { label: "Review Pending: Experience updates", icon: Zap },
          { label: "Guide: Visual Builder", icon: BookOpen },
        ],
        chips: ["Open Visual Builder", "Preview latest layout", "Find experience entries"],
        prompts: [
          "Open Visual Builder",
          "List visual experiences",
          "Preview an entry in Visual Builder",
          "Find layout entries by template",
          "Generate component copy ideas",
          "Check live preview URL",
        ],
      },
      "Publish Queue": {
        headlines: ["Publish queue", "Ready to ship", "Publishing control"],
        subheads: ["See what’s queued for publish and what’s scheduled.", "Keep releases on track."],
        welcomeTitles: ["Publish queue ready", "Time to ship", "Release control"],
        welcomeSubheads: ["Review what’s queued or scheduled.", "Need to move items between releases?"],
        promoCards: [
          { title: "Review Queue", description: "Pending publishes", icon: Rocket },
          { title: "Scheduled Items", description: "Upcoming publishes", icon: Sparkles },
        ],
        activities: [
          { label: "Review Pending: Scheduled publishes", icon: Zap },
          { label: "Guide: Release management", icon: BookOpen },
        ],
        chips: ["Show publish queue", "Review scheduled publishes", "Create a release"],
        prompts: [
          "Show items in publish queue",
          "Review scheduled publishes",
          "Move items to a release",
          "Pause a publish",
          "Show recently published entries",
        ],
      },
      Releases: {
        headlines: ["Releases", "Release planning", "Ship with confidence"],
        subheads: ["Group content for coordinated publishing.", "Track release items and readiness."],
        welcomeTitles: ["Release planning", "Releases ready", "Ship with confidence"],
        welcomeSubheads: ["Need release details? I can pull them up.", "Start with a release overview."],
        promoCards: [
          { title: "List Releases", description: "Active releases", icon: Sparkles },
          { title: "Release Items", description: "What’s inside", icon: Rocket },
        ],
        activities: [
          { label: "Review Pending: Release approval", icon: Zap },
          { label: "Guide: Release management", icon: BookOpen },
        ],
        chips: ["List releases", "Show release items", "Create a release"],
        prompts: [
          "List releases",
          "Show release items",
          "Create a release",
          "Add entries to a release",
          "Compare release vs main",
        ],
      },
      Tasks: {
        headlines: ["Tasks", "Workflow tasks", "Approval queue"],
        subheads: ["Track approvals and keep reviews moving.", "Check tasks that need attention."],
        welcomeTitles: ["Task tracker", "Approvals ready", "Review tasks"],
        welcomeSubheads: ["See what’s waiting on you.", "Need to assign or review tasks quickly?"],
        promoCards: [
          { title: "Pending Tasks", description: "Awaiting review", icon: Zap },
          { title: "Assign Task", description: "Delegate work", icon: Sparkles },
        ],
        activities: [
          { label: "Review Pending: Approval tasks", icon: Zap },
          { label: "Guide: Workflow approvals", icon: BookOpen },
        ],
        chips: ["Show pending tasks", "Review approvals", "Assign task"],
        prompts: [
          "Show pending tasks",
          "Review approvals waiting on me",
          "Assign a task to a teammate",
          "Create a task for an entry",
          "Show tasks due today",
        ],
      },
      Settings: {
        headlines: ["Settings", "Workspace settings", "Configure your stack"],
        subheads: ["Manage locales, environments, and permissions.", "Keep governance tidy."],
        welcomeTitles: ["Settings mode", "Configure the stack", "Governance ready"],
        welcomeSubheads: ["Need roles, locales, or environments? I can help.", "Start with a quick settings check."],
        promoCards: [
          { title: "Roles & Permissions", description: "Access control", icon: Sparkles },
          { title: "Locales", description: "Language support", icon: Globe },
        ],
        activities: [
          { label: "Review Pending: Permission updates", icon: Zap },
          { label: "Guide: Governance basics", icon: BookOpen },
        ],
        chips: ["Review locales", "Show roles & permissions", "Audit recent changes"],
        prompts: [
          "Review locales and environments",
          "Show roles and permissions",
          "Audit recent changes",
          "Check webhook configurations",
          "List stack settings",
        ],
      },
      Apps: {
        headlines: ["Apps", "Integrations", "Extend the stack"],
        subheads: ["Manage installed apps and integrations.", "Connect new tools quickly."],
        welcomeTitles: ["Apps & integrations", "Extension hub", "Plug in tools"],
        welcomeSubheads: ["Need to review connected apps?", "Start with installed integrations."],
        promoCards: [
          { title: "Installed Apps", description: "Current apps", icon: Sparkles },
          { title: "Connect App", description: "Add integration", icon: Rocket },
        ],
        activities: [
          { label: "Review Pending: App updates", icon: Zap },
          { label: "Guide: App integrations", icon: BookOpen },
        ],
        chips: ["List installed apps", "Connect new app", "Review app permissions"],
        prompts: [
          "List installed apps",
          "Connect a new app",
          "Review app permissions",
          "Explore Marketplace integrations",
          "Check app activity logs",
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
            title: "Create Variant",
            description: "Personalized content",
            icon: Sparkles,
          },
          {
            title: "Audience Segments",
            description: "Targeting",
            icon: Globe,
          },
        ],
        activities: [
          { label: "Review Pending: Variant refresh", icon: Zap },
          { label: "Guide: Content Modeling", icon: Sparkles },
          { label: "Course: Experiment setup", icon: BookOpen },
        ],
        chips: ["Find entries to personalize", "Update variant content", "Review experiments"],
        prompts: [
          "Find entries to personalize",
          "Update variant content",
          "Create a new variant",
          "Review audience segments",
          "List personalization experiments",
        ],
      },
      "Data & Insights": {
        headlines: ["Data & Insights", "Insights workspace", "Connect data to content"],
        subheads: ["Turn data into content actions.", "Track performance signals across content."],
        welcomeTitles: ["Data & Insights", "Insight ready", "Performance signals"],
        welcomeSubheads: ["See what content is trending or slipping.", "Start with a performance overview."],
        promoCards: [
          { title: "Top Content", description: "Performance leaders", icon: Sparkles },
          { title: "Insight Summary", description: "Quick recap", icon: Rocket },
        ],
        activities: [
          { label: "Review Pending: Performance dips", icon: Zap },
          { label: "Guide: Content analytics", icon: BookOpen },
        ],
        chips: ["Show top entries by engagement", "Compare week over week", "Summarize performance"],
        prompts: [
          "Show top entries by engagement",
          "Compare content performance week over week",
          "Find content with declining performance",
          "Map performance changes to releases",
          "Summarize performance signals",
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
          { title: "Create Agent", description: "Automation setup", icon: Sparkles },
          { title: "Workflow Runs", description: "Execution logs", icon: Rocket },
        ],
        activities: [
          { label: "Review Pending: Workflow drafts", icon: Zap },
          { label: "Guide: Automation patterns", icon: Sparkles },
          { label: "Course: Workflow mastery", icon: BookOpen },
        ],
        chips: ["Create an automation agent", "Review workflow runs", "Set up a trigger"],
        prompts: [
          "Create an automation agent",
          "List automation workflows",
          "Review workflow runs",
          "Set up a trigger for new entries",
          "Generate a draft workflow",
        ],
      },
      "Agent OS": {
        headlines: [
          "Agent OS",
          "Automation command center",
          "Put content on autopilot",
        ],
        subheads: [
          "Design agents and triggers that keep content moving.",
          "Track automation runs and adjust quickly.",
        ],
        welcomeTitles: [
          "Agent OS ready ⚡️",
          "Automation command center",
          "Agents standing by",
        ],
        welcomeSubheads: [
          "Need a new agent or trigger? I can set it up.",
          "Start with recent runs or agent plans.",
        ],
        promoCards: [
          { title: "Create Agent", description: "Automation setup", icon: Sparkles },
          { title: "Workflow Runs", description: "Execution logs", icon: Rocket },
        ],
        activities: [
          { label: "Review Pending: Workflow drafts", icon: Zap },
          { label: "Guide: Automation patterns", icon: Sparkles },
          { label: "Course: Workflow mastery", icon: BookOpen },
        ],
        chips: ["Create an agent", "Review workflow runs", "Check triggers"],
        prompts: [
          "Create an automation agent",
          "Review workflow runs",
          "Check active triggers",
          "Summarize automation performance",
          "Generate a draft workflow",
        ],
      },
      Automations: {
        headlines: ["Automations", "Workflow control", "Automation hub"],
        subheads: ["Manage automation projects and workflow runs.", "Keep agents and triggers aligned."],
        welcomeTitles: ["Automation hub", "Automations ready", "Workflow control"],
        welcomeSubheads: ["Need a workflow overview?", "Start with recent runs or triggers."],
        promoCards: [
          { title: "Workflow Runs", description: "Execution logs", icon: Sparkles },
          { title: "Create Agent", description: "Automation setup", icon: Rocket },
        ],
        activities: [
          { label: "Review Pending: Automation runs", icon: Zap },
          { label: "Guide: Automation patterns", icon: BookOpen },
        ],
        chips: ["Review workflow runs", "Create an automation agent", "Check triggers"],
        prompts: [
          "Review workflow runs",
          "Create an automation agent",
          "Check active triggers",
          "Summarize automation performance",
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
            title: "Brand Assets",
            description: "Logos & colors",
            icon: Sparkles,
          },
          {
            title: "Guidelines",
            description: "Tone & voice",
            icon: Globe,
          },
        ],
        activities: [
          { label: "Review Pending: Brand refresh", icon: Zap },
          { label: "Guide: Content Modeling", icon: Sparkles },
          { label: "Course: Brand workflows", icon: BookOpen },
        ],
        chips: ["Find brand assets", "Update brand guidelines", "Review tone of voice"],
        prompts: [
          "Find brand assets",
          "Update brand guidelines entry",
          "List brand-approved assets",
          "Review tone of voice entries",
          "Create a brand update summary",
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
            title: "Launch Checklist",
            description: "Ship readiness",
            icon: Sparkles,
          },
          {
            title: "Release Items",
            description: "Launch content",
            icon: Rocket,
          },
        ],
        activities: [
          { label: "Review Pending: Launch checklist", icon: Zap },
          { label: "Guide: Content Modeling", icon: Sparkles },
          { label: "Course: Launch planning", icon: BookOpen },
        ],
        chips: ["Review launch checklist", "Find launch assets", "Schedule publish"],
        prompts: [
          "Review launch checklist",
          "Show release items for launch",
          "Find launch assets",
          "Update launch copy",
          "Schedule publish for launch",
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
            title: "Schema Explorer",
            description: "Content types",
            icon: Sparkles,
          },
          {
            title: "API Payloads",
            description: "JSON previews",
            icon: Rocket,
          },
        ],
        activities: [
          { label: "Review Pending: API updates", icon: Zap },
          { label: "Guide: Content Modeling", icon: Sparkles },
          { label: "Course: API fundamentals", icon: BookOpen },
        ],
        chips: ["Show entry schema", "Get entry JSON", "Review webhooks"],
        prompts: [
          "List content types",
          "Show entry schema",
          "Get single entry JSON",
          "Generate sample API query",
          "Review webhook payloads",
          "Check delivery API endpoints",
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
            title: "Listing Entries",
            description: "Marketplace content",
            icon: Sparkles,
          },
          {
            title: "Integration Assets",
            description: "Logos & media",
            icon: Globe,
          },
        ],
        activities: [
          { label: "Review Pending: Listing updates", icon: Zap },
          { label: "Guide: Content Modeling", icon: Sparkles },
          { label: "Course: Marketplace basics", icon: BookOpen },
        ],
        chips: ["Update listing copy", "Review listing assets", "List Marketplace entries"],
        prompts: [
          "List Marketplace entries",
          "Update listing copy",
          "Review integration assets",
          "Create a new listing entry",
          "Check listing status",
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
            title: "Latest Lessons",
            description: "Recent updates",
            icon: Sparkles,
          },
          {
            title: "Course Modules",
            description: "Organize content",
            icon: BookOpen,
          },
        ],
        activities: [
          { label: "Review Pending: Course updates", icon: Zap },
          { label: "Guide: Content Modeling", icon: Sparkles },
          { label: "Course: Training workflows", icon: BookOpen },
        ],
        chips: ["Find latest lessons", "Update course entry", "Create new module"],
        prompts: [
          "Find latest lessons",
          "Update course entry",
          "Create a new module",
          "Review training content for accuracy",
          "List instructors and authors",
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
          { title: "Top Content", description: "Performance leaders", icon: Sparkles },
          { title: "Insight Summary", description: "Quick recap", icon: Rocket },
        ],
        activities: [
          { label: "Review Pending: Performance dips", icon: Zap },
          { label: "Guide: Content analytics", icon: BookOpen },
        ],
        chips: ["Show top entries", "Compare performance", "Summarize insights"],
        prompts: [
          "Show top entries by engagement",
          "Compare content performance week over week",
          "Find content with declining performance",
          "Map performance changes to releases",
          "Summarize performance signals",
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
          { title: "Roles & Permissions", description: "Access control", icon: Sparkles },
          { title: "Audit Log", description: "Recent changes", icon: Rocket },
        ],
        activities: [
          { label: "Review Pending: Schema updates", icon: Zap },
          { label: "Guide: Governance basics", icon: BookOpen },
        ],
        chips: ["Review roles", "Audit activity log", "Manage users"],
        prompts: [
          "Review roles and permissions",
          "Audit activity log",
          "Manage users and access",
          "Review locales and environments",
          "Check API keys",
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
            title: "Agent Plan",
            description: "Next steps",
            icon: Sparkles,
          },
          {
            title: "Entry Context",
            description: "Recent content",
            icon: Rocket,
          },
        ],
        activities: [
          { label: "Review Pending: Agent tasks", icon: Zap },
          { label: "Guide: Content Modeling", icon: Sparkles },
          { label: "Course: Agent workflows", icon: BookOpen },
        ],
        chips: ["List content types", "Find latest entries", "Show entry schema"],
        prompts: [
          "List content types",
          "Find latest entries",
          "Show entry schema",
          "Create an entry for an agent",
          "Update an entry from agent feedback",
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
          { label: "Course: Writing for CMS", icon: BookOpen },
        ],
        chips: ["Show entry schema", "Find related entries", "Update this entry"],
        prompts: [
          "Show entry schema",
          "Find related entries",
          "Update this entry",
          "Check SEO status",
          "Summarize the changes so far",
        ],
      },
      Secrets: {
        headlines: ["Secrets", "Secure credentials", "Manage secrets"],
        subheads: ["Rotate and audit secrets safely.", "Keep credentials organized."],
        welcomeTitles: ["Secrets mode", "Credential hygiene", "Secure updates"],
        welcomeSubheads: ["Need to review or rotate a secret?", "Start with secret inventory."],
        promoCards: [
          { title: "Review Secrets", description: "Inventory", icon: Sparkles },
          { title: "Rotate Secret", description: "Security", icon: Rocket },
        ],
        activities: [
          { label: "Review Pending: Secret rotation", icon: Zap },
          { label: "Guide: Security basics", icon: BookOpen },
        ],
        chips: ["Review secrets", "Rotate a secret", "Audit secret usage"],
        prompts: [
          "Review stored secrets",
          "Rotate a secret",
          "Audit secret usage",
          "Create a new secret",
        ],
      },
      Variables: {
        headlines: ["Variables", "Runtime variables", "Config values"],
        subheads: ["Review and update configuration variables.", "Track variable changes safely."],
        welcomeTitles: ["Variables ready", "Config mode", "Update variables"],
        welcomeSubheads: ["Need current values or change history?", "Start with variable inventory."],
        promoCards: [
          { title: "List Variables", description: "Current config", icon: Sparkles },
          { title: "Update Variable", description: "Adjust values", icon: Rocket },
        ],
        activities: [
          { label: "Review Pending: Variable updates", icon: Zap },
          { label: "Guide: Configuration hygiene", icon: BookOpen },
        ],
        chips: ["List variables", "Update variable value", "Audit variable changes"],
        prompts: [
          "List variables",
          "Update a variable value",
          "Audit variable changes",
          "Create a new variable",
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
          "List content types",
          "Show entry schema",
          "Find latest entries",
          "Create a draft entry",
          "Review publish queue",
        ],
      },
    };
  }, []);

  const initialPreset = useMemo(() => {
    const preset = promptPresets[inferredContext as keyof typeof promptPresets];
    return preset ?? promptPresets.Default;
  }, [inferredContext, promptPresets]);

  const initialWelcomeTitle = useMemo(() => {
    const timeTitles = timeWelcomeTitles[timeBucket] ?? [];
    const titles = [
      ...timeTitles,
      ...baseWelcomeTitles,
      ...(initialPreset.welcomeTitles ?? []),
    ];
    return pickFromList(titles, `${seedKey}|welcome-title`, baseWelcomeTitles[0] ?? "");
  }, [
    baseWelcomeTitles,
    initialPreset.welcomeTitles,
    seedKey,
    timeBucket,
    timeWelcomeTitles,
  ]);

  const initialWelcomeSubhead = useMemo(() => {
    const contextNote =
      inferredContext && inferredContext !== "Dashboard"
        ? inferredContext === "Editing"
          ? "Looks like you’re editing an entry."
          : `You’re in ${inferredContext}.`
        : "";
    const timeSubheads = timeWelcomeSubheads[timeBucket] ?? [];
    const subheads = [
      ...timeSubheads,
      ...baseWelcomeSubheads,
      ...(initialPreset.welcomeSubheads ?? []),
      ...(contextNote ? [contextNote] : []),
    ];
    return pickFromList(subheads, `${seedKey}|welcome-subhead`, baseWelcomeSubheads[0] ?? "");
  }, [
    baseWelcomeSubheads,
    inferredContext,
    initialPreset.welcomeSubheads,
    seedKey,
    timeBucket,
    timeWelcomeSubheads,
  ]);

  const initialPromoCards = useMemo(() => {
    const cards = initialPreset.promoCards ?? [];
    return rotateBySeed(cards, `${seedKey}|promo-cards`).slice(0, 2);
  }, [initialPreset.promoCards, seedKey]);

  const initialActivities = useMemo(() => {
    const activities = initialPreset.activities ?? [];
    return rotateBySeed(activities, `${seedKey}|activities`).slice(0, 4);
  }, [initialPreset.activities, seedKey]);

  const initialChips = useMemo(() => {
    const chips = initialPreset.chips ?? [];
    return rotateBySeed(chips, `${seedKey}|chips`).slice(0, 8);
  }, [initialPreset.chips, seedKey]);

  const initialPrompts = useMemo(() => {
    const timePrompts = buildTimePrompts(inferredContext, timeBucket);
    const options = [...initialPreset.prompts, ...timePrompts];
    return selectPrompts({
      prompts: options,
      seed: seedKey,
      recentText: recentContextText,
      recentPrompts,
      context: inferredContext,
      timeBucket,
      count: 6,
    });
  }, [
    inferredContext,
    initialPreset.prompts,
    recentContextText,
    recentPrompts,
    seedKey,
    timeBucket,
  ]);

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

  const recordRecentPrompt = (prompt: string) => {
    const cleaned = prompt.trim();
    if (!cleaned) {
      return;
    }
    setRecentPrompts((prev) => {
      const normalized = cleaned.toLowerCase();
      const next = [
        cleaned,
        ...prev.filter((item) => item.toLowerCase() !== normalized),
      ].slice(0, 10);
      window.localStorage.setItem("polarisRecentPrompts", JSON.stringify(next));
      return next;
    });
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
    setStreamPhase('idle');
    setCurrentOperation(null);
  };

  const handleRestart = () => {
    handleClear();
    setSessionId(null);
  };

  const handleExport = () => {
    const parts: string[] = [];
    for (const message of messages) {
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

  const activeContextPrompt = contextPrompt || pageContextPrompt;
  const activeContextLabel = contextLabel || pageContextLabel;
  const activeVoiceProfile = voiceProfile !== "Default" ? voiceProfile : null;

  const handleSubmit = async (override?: string) => {
    const prompt = override ?? input.trim();
    if (!prompt || loading) {
      return;
    }
    const contextualPrompt = [
      activeContextPrompt ? `Context:\n${activeContextPrompt.trim()}` : "",
      activeVoiceProfile ? `Voice profile:\n${activeVoiceProfile}` : "",
      prompt,
    ]
      .filter(Boolean)
      .join("\n\n");
    recordRecentPrompt(prompt);

    const userMessage = { id: crypto.randomUUID(), role: "user" as const, content: prompt };
    const assistantId = crypto.randomUUID();
    setDismissedApplyId(null);
    setSelectedSuggestion(null);
    setMessages((prev) => [
      ...prev,
      userMessage,
      { id: assistantId, role: "assistant", content: "" },
    ]);
    setInput("");
    setLoading(true);
    setStreamPhase('planning');
    setCurrentOperation("Planning next steps...");
    setLiveStatus("Thinking...");
    setLiveTools([]);
    setLivePlan(null);
    liveStatusRef.current = "Thinking...";
    livePlanRef.current = null;
    liveToolsRef.current = [];
    setShowSuggestions(false);
    setPendingSuggestions([]);
    setPendingId(assistantId);

    try {
      const response = await fetch("/api/polaris/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          message: contextualPrompt,
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
          setCurrentOperation(data.state);
        }
        if (event === "plan" && typeof data.text === "string") {
          setLivePlan(data.text);
          livePlanRef.current = data.text;
          setCurrentOperation(data.text);
        }
        if (event === "tool" && typeof data.name === "string") {
          const label =
            typeof data.label === "string" ? data.label : toolLabel(data.name);
          setLiveTools((prev) => (prev.includes(label) ? prev : [...prev, label]));
          if (!liveToolsRef.current.includes(label)) {
            liveToolsRef.current = [...liveToolsRef.current, label];
          }
          setStreamPhase('tool');
          setCurrentOperation(label + "...");
        }
        if (event === "delta" && typeof data.text === "string") {
          setStreamPhase('streaming');
          setCurrentOperation(null);
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
          setStreamPhase('done');
          setCurrentOperation(null);
          setShowSuggestions(true);
        }
        if (event === "error" && typeof data.message === "string") {
          const errorContent = data.message as string;
          updateMessage(assistantId, (message) => ({
            ...message,
            content: errorContent,
          }));
          setLoading(false);
          setLiveStatus("Error");
          liveStatusRef.current = "Error";
          setPendingId(null);
          setStreamPhase('idle');
          setCurrentOperation(null);
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
          const tableData = data as {
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
          const tableMessage = {
            id: crypto.randomUUID(),
            role: "assistant" as const,
            content: "",
            table: tableData,
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
      const errorMessage =
        error instanceof Error ? error.message : "Failed to send message.";
      updateMessage(assistantId, (msg) => ({ ...msg, content: errorMessage }));
      setLoading(false);
      setLiveStatus("Error");
      setPendingId(null);
      setStreamPhase('idle');
      setCurrentOperation(null);
      setShowSuggestions(true);
    }
  };

  useEffect(() => {
    const handlePrompt = (
      event: Event & {
        detail?: {
          prompt?: string;
          expand?: boolean;
          mode?: "chat" | "agent-setup";
          contextLabel?: string;
          contextPrompt?: string;
        };
      }
    ) => {
      const prompt = event.detail?.prompt?.trim();
      if (!prompt || loading) {
        return;
      }
      setOpen(true);
      setPanelMode(event.detail?.mode ?? "chat");
      setPanelPayload({});
      if (event.detail?.mode !== "agent-setup") {
        setIsExpanded(false);
      }
      if (typeof event.detail?.contextLabel === "string") {
        setContextLabel(event.detail.contextLabel || null);
      }
      if (typeof event.detail?.contextPrompt === "string") {
        setContextPrompt(event.detail.contextPrompt || null);
      }
      if (typeof event.detail?.contextKey === "string") {
        setContextKey(event.detail.contextKey || null);
      }
      void handleSubmit(prompt);
    };

    window.addEventListener("polaris:prompt", handlePrompt as EventListener);
    return () => {
      window.removeEventListener("polaris:prompt", handlePrompt as EventListener);
    };
  }, [handleSubmit, loading]);

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
                  isPinned && dockElement
                    ? "polaris-docked-panel h-full w-full"
                    : isExpanded
                    ? "polaris-overlay polaris-expanded z-40"
                    : "polaris-overlay z-30"
                } flex flex-col rounded-md border border-transparent bg-[color:var(--color-surface)] shadow-[0_0_1.5rem_rgba(0,0,0,0.17)]`}
                data-expanded={isExpanded ? "true" : "false"}
                data-open={open ? "true" : "false"}
                data-mode={panelMode}
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
          {panelMode === "agent-setup" ? (
            <PolarisAgentSetup
              projectId={panelPayload.projectId}
              description={panelPayload.description}
              expanded={isExpanded}
              onDone={() => {
                setPanelMode("chat");
                setPanelPayload({});
                setIsExpanded(false);
              }}
            />
          ) : (
            <>
              <div
                className={`flex flex-1 flex-col overflow-hidden ${
                  isExpanded ? "px-10 py-10" : "px-8 py-8"
                }`}
              >
                {messages.length === 0 ? (
                  <div
                    className={`flex flex-1 flex-col items-center text-center ${
                      isExpanded ? "gap-5" : "gap-3"
                    }`}
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[color:var(--color-brand-soft)] text-[color:var(--color-brand)] shadow-[0_8px_22px_rgba(109,80,255,0.25)]">
                      <PolarisIcon className="h-7 w-7" />
                    </div>
                    <h3
                      className={`font-semibold text-[color:var(--color-foreground)] ${
                        isExpanded ? "text-[24px]" : "text-[20px]"
                      }`}
                    >
                      {initialWelcomeTitle}
                    </h3>
                    <p
                      className={`text-center leading-[1.5] text-[#6b7280] ${
                        isExpanded ? "max-w-[520px] text-[15px]" : "max-w-[320px] text-[0.875rem]"
                      }`}
                    >
                      {initialWelcomeSubhead}
                    </p>

                    <div
                      className={`mt-2 grid w-full ${
                        isExpanded
                          ? "max-w-[640px] grid-cols-2 gap-4"
                          : "max-w-[420px] grid-cols-2 gap-3"
                      }`}
                    >
                      {initialPromoCards.slice(0, 2).map((card) => {
                        const Icon = card.icon;
                        return (
                          <button
                            key={card.title}
                            type="button"
                            onClick={() => void handleSubmit(card.title)}
                            className={`flex flex-col items-center justify-center rounded-2xl bg-[color:var(--color-brand)] text-white shadow-[0_10px_18px_rgba(79,70,229,0.25)] transition hover:brightness-110 ${
                              isExpanded ? "h-[108px] gap-2" : "h-[88px] gap-1"
                            }`}
                          >
                            <Icon className="h-6 w-6" />
                            <div
                              className={`font-semibold ${
                                isExpanded ? "text-[15px]" : "text-sm"
                              }`}
                            >
                              {card.title}
                            </div>
                            <div
                              className={`text-white/80 ${
                                isExpanded ? "text-[12px]" : "text-[11px]"
                              }`}
                            >
                              {card.description}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    <div
                      className={`mt-4 w-full text-left ${
                        isExpanded
                          ? "max-w-[560px] space-y-3"
                          : "max-w-[420px] space-y-2"
                      }`}
                    >
                      {initialActivities.map((activity) => {
                        const Icon = activity.icon;
                        return (
                          <button
                            key={activity.label}
                            type="button"
                            onClick={() => void handleSubmit(activity.label)}
                            className={`flex w-full items-center justify-between rounded-xl border border-[color:var(--color-border)] bg-white text-[color:var(--color-foreground)] shadow-sm transition hover:border-[color:var(--color-brand)] ${
                              isExpanded ? "px-4 py-3 text-[14px]" : "px-3 py-2 text-sm"
                            }`}
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

                    <div
                      className={`mt-4 flex w-full flex-wrap justify-center gap-2 ${
                        isExpanded ? "max-w-[560px]" : "max-w-[420px]"
                      }`}
                    >
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
                            ) : message.role === "user" ? (
                              <p className="whitespace-pre-wrap">
                                {message.content}
                              </p>
                            ) : message.id === lastAssistantMessage?.id && hasSuggestionOptions ? (
                              <p className="text-[13px] text-[color:var(--color-foreground)]">
                                Here are a few options:
                              </p>
                            ) : (
                              <div className="prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-[12px] prose-pre:bg-gray-100 prose-pre:p-2 prose-headings:mt-2 prose-headings:mb-1">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                  {message.content || "..."}
                                </ReactMarkdown>
                              </div>
                            )}
                            {activeVoiceProfile && message.id === lastAssistantMessage?.id ? (
                              <div className="mt-2 inline-flex items-center gap-2 rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface-muted)]/60 px-2 py-1 text-[10px] text-[color:var(--color-muted)]">
                                <span>Generated with</span>
                                <button
                                  type="button"
                                  className="font-semibold text-[color:var(--color-foreground)]"
                                  onClick={() => setVoiceMenuOpen((prev) => !prev)}
                                >
                                  {activeVoiceProfile} voice profile
                                </button>
                              </div>
                            ) : null}
                            {contextKey && message.id === lastAssistantMessage?.id ? (
                              <div className="mt-3 space-y-2">
                                {suggestionOptions.length > 1 ? (
                                  <div className="flex flex-wrap gap-2">
                                    {suggestionOptions.map((option) => (
                                      <Button
                                        key={option}
                                        variant={
                                          selectedSuggestion === option
                                            ? "default"
                                            : "outline"
                                        }
                                        size="sm"
                                        className="h-8 max-w-full text-[11px]"
                                        onClick={() => setSelectedSuggestion(option)}
                                      >
                                        <span className="break-words whitespace-normal">
                                          {option}
                                        </span>
                                      </Button>
                                    ))}
                                  </div>
                                ) : null}
                                {showApplyActions ? (
                                  <div className="flex items-center justify-end gap-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 text-[12px]"
                                      onClick={() => {
                                        setDismissedApplyId(message.id);
                                        setSelectedSuggestion(null);
                                        setMessages((prev) => [
                                          ...prev,
                                          {
                                            id: crypto.randomUUID(),
                                            role: "assistant",
                                            content: "Okay, canceled.",
                                          },
                                        ]);
                                      }}
                                    >
                                      Cancel
                                    </Button>
                                    <Button
                                      size="sm"
                                      className="h-8 text-[12px]"
                                      onClick={() => {
                                        if (!selectedSuggestion) {
                                          return;
                                        }
                                        window.dispatchEvent(
                                          new CustomEvent("polaris:apply", {
                                            detail: {
                                              contextKey,
                                              value: selectedSuggestion,
                                            },
                                          })
                                        );
                                        setDismissedApplyId(message.id);
                                      }}
                                    >
                                      Apply
                                    </Button>
                                  </div>
                                ) : null}
                              </div>
                            ) : null}
                          </div>
                        );
                      })}
                      {!loading &&
                      showSuggestions &&
                      !showApplyActions &&
                      !hasSuggestionOptions ? (
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
                  </div>
                )}
              </div>
              <div className="space-y-2 px-5 py-4">
                {/* Thinking Indicator - positioned above input */}
                {loading && currentOperation && (
                  <div className="flex items-center gap-2 rounded-lg bg-[color:var(--color-surface-muted)] px-3 py-2 text-[12px] text-[color:var(--color-muted)]">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-[color:var(--color-brand)]" />
                    <span>{currentOperation}</span>
                  </div>
                )}
                <form
                  className="rounded-md bg-gradient-to-r from-[#6c5ce7] via-[#8b7cf6] to-[#6c5ce7] p-[1px]"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void handleSubmit();
                  }}
                >
                  <div className="rounded-[5px] bg-white">
                    {activeContextLabel ? (
                      <div className="flex items-center gap-2 border-b border-[color:var(--color-border)] bg-[color:var(--color-brand-soft)]/10 px-3 py-2 text-[11px] text-[color:var(--color-muted)]">
                        <span className="font-semibold text-[color:var(--color-foreground)]">
                          Operating Context
                        </span>
                        <span className="flex-1">{activeContextLabel}</span>
                        <button
                          type="button"
                          className="text-[12px] text-[color:var(--color-muted)] hover:text-[color:var(--color-foreground)]"
                          aria-label="Clear context"
                          onClick={() => {
                            if (contextLabel || contextPrompt || contextKey) {
                              setContextLabel(null);
                              setContextPrompt(null);
                              setContextKey(null);
                              return;
                            }
                            setPageContextLabel(null);
                            setPageContextPrompt(null);
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ) : null}
                    <div className="flex items-center gap-2 border-b border-[color:var(--color-border)] bg-[color:var(--color-surface-muted)] px-3 py-2 text-[11px] text-[color:var(--color-muted)]">
                      <span className="font-semibold text-[color:var(--color-foreground)]">
                        Brand Kit Voice Profile
                      </span>
                      <div className="relative" ref={voiceMenuRef}>
                        <button
                          type="button"
                          className="rounded-full border border-[color:var(--color-border)] px-2 py-0.5 text-[10px] font-semibold text-[color:var(--color-foreground)]"
                          onClick={() => setVoiceMenuOpen((prev) => !prev)}
                        >
                          {voiceProfile}
                        </button>
                        {voiceMenuOpen ? (
                          <div className="absolute left-0 bottom-full mb-2 z-40 min-w-[160px] rounded-md border border-[color:var(--color-border)] bg-white p-1 shadow-lg">
                            {voiceProfiles.map((profile) => (
                              <button
                                key={profile}
                                type="button"
                                className={`w-full rounded px-3 py-2 text-left text-[12px] ${
                                  profile === voiceProfile
                                    ? "bg-[color:var(--color-brand-soft)]/30 text-[color:var(--color-foreground)]"
                                    : "text-[color:var(--color-foreground)] hover:bg-[color:var(--color-surface-muted)]"
                                }`}
                                onClick={() => {
                                  setVoiceProfile(profile);
                                  setVoiceMenuOpen(false);
                                }}
                              >
                                {profile}
                              </button>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </div>
                    <div className="relative">
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
            </>
          )}
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
