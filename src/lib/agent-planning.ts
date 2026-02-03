export type PlanNode = {
  id: string;
  kind: "trigger" | "tool" | "automation" | "sub-agent" | "action";
  title: string;
  detail?: string;
};

export type AgentPlan = {
  nodes: PlanNode[];
  assumptions: string[];
};

export type InstallTemplate = {
  id: string;
  name: string;
  summary: string;
  defaultDestination: string;
  trigger: string;
  tools: string[];
};

export type InstallGroup = {
  label: string;
  templates: InstallTemplate[];
};

const toolCatalog = [
  { id: "contentstack", label: "Contentstack", keywords: ["contentstack"] },
  { id: "slack", label: "Slack", keywords: ["slack"] },
  { id: "webhook", label: "HTTP Webhook", keywords: ["webhook", "http"] },
  { id: "email", label: "Email", keywords: ["email"] },
  { id: "jira", label: "Jira", keywords: ["jira", "ticket"] },
  { id: "gmail", label: "Gmail", keywords: ["gmail"] },
  { id: "chatgpt", label: "ChatGPT", keywords: ["chatgpt", "gpt"] },
  { id: "gemini", label: "Gemini", keywords: ["gemini"] },
  { id: "brand-kit", label: "Brand Kit", keywords: ["brand", "brand kit"] },
  { id: "launch", label: "Launch", keywords: ["launch", "deploy"] },
];

const fallbackTools = [
  { id: "core", label: "Agent Core" },
  { id: "formatter", label: "Formatter" },
  { id: "validator", label: "Validator" },
  { id: "router", label: "Router" },
];

const toToolId = (label: string) =>
  `tool-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`;

export const buildPlan = ({
  description,
  answers,
  tools: toolsOverride,
}: {
  description: string;
  answers: Record<string, string>;
  tools?: string[];
}): AgentPlan => {
  const normalized = `${description} ${Object.values(answers).join(" ")}`
    .trim()
    .toLowerCase();
  const inferredTrigger = normalized.includes("webhook") ||
      normalized.includes("http") ||
      normalized.includes("api")
    ? "Webhook trigger"
    : normalized.includes("schedule") ||
        normalized.includes("daily") ||
        normalized.includes("weekly")
      ? "Scheduled trigger"
      : "Manual trigger";
  const trigger = answers["trigger"] ?? inferredTrigger;
  const channel = answers["delivery-channel"]
    ? answers["delivery-channel"]
    : normalized.includes("slack")
      ? "#alerts"
      : normalized.includes("email")
        ? "email inbox"
        : "default destination";
  const inferredTools = toolCatalog.filter((tool) =>
    tool.keywords.some((keyword) => normalized.includes(keyword))
  );
  const desiredToolCount =
    normalized.length > 80 ||
    normalized.includes("complex") ||
    normalized.includes("multi")
      ? 6
      : 4;
  const tools =
    toolsOverride && toolsOverride.length > 0
      ? toolsOverride.map((tool) => ({
          id: toToolId(tool),
          label: tool,
        }))
      : [
          ...new Map(
            [...inferredTools, ...fallbackTools].map((tool) => [tool.id, tool])
          ).values(),
        ].slice(0, desiredToolCount);
  const complexityScore = [
    normalized.includes("automation") || normalized.includes("workflow"),
    normalized.includes("sub-agent") || normalized.includes("delegate"),
    normalized.includes("test") || normalized.includes("validate"),
    normalized.split(" ").length > 14,
  ].filter(Boolean).length;
  const assumptions: string[] = [];

  if (!answers["delivery-channel"]) {
    assumptions.push(`Default channel: ${channel}`);
  }
  if (!answers["trigger"]) {
    assumptions.push(`Assumed trigger: ${trigger}`);
  }
  if (!toolsOverride || toolsOverride.length === 0) {
    if (inferredTools.length === 0) {
      assumptions.push("Added core runtime tools until more details arrive.");
    }
  }

  const nodes: PlanNode[] = [
    {
      id: "trigger",
      kind: "trigger",
      title: trigger,
      detail: "Entry point",
    },
    ...tools.map((tool) => ({
      id: tool.id.startsWith("tool-") ? tool.id : `tool-${tool.id}`,
      kind: "tool",
      title: tool.label,
      detail: "Test connection",
    })),
  ];

  if (
    normalized.includes("automation") ||
    normalized.includes("workflow") ||
    complexityScore >= 2
  ) {
    nodes.push({
      id: "automation",
      kind: "automation",
      title: "Automation",
      detail: "Orchestrate steps",
    });
  }

  if (normalized.includes("sub-agent") || normalized.includes("delegate")) {
    nodes.push({
      id: "sub-agent",
      kind: "sub-agent",
      title: "Sub-agent",
      detail: "Delegate task",
    });
  }

  const actionTitle = normalized.includes("slack")
    ? "Post to Slack"
    : normalized.includes("email")
      ? "Send Email"
      : normalized.includes("jira")
        ? "Create Jira Ticket"
        : "Execute Action";

  nodes.push({
    id: "action",
    kind: "action",
    title: actionTitle,
    detail: `Deliver to ${channel}`,
  });

  return { nodes, assumptions };
};

export const selectPlanImage = (description: string) => {
  const normalized = description.toLowerCase();
  if (normalized.includes("workflow") || normalized.includes("journey")) {
    return "/JourneyFlows_Thumb.jpg";
  }
  if (normalized.includes("automate") || normalized.includes("automation")) {
    return "/UnderstandingAutomate_thumbnail.jpg";
  }
  if (normalized.includes("code") || normalized.includes("developer")) {
    return "/Coding_Thumbnail_Kickstart_NextJS.jpg";
  }
  return "/Omni-channel_Personalization_Thumbnail.jpg";
};

export const installGroups: InstallGroup[] = [
  {
    label: "Marketing",
    templates: [
      {
        id: "tweet-to-slack",
        name: "Tweet → Slack Notifier",
        summary: "Send new tweets into a Slack channel with context.",
        defaultDestination: "#marketing-alerts",
        trigger: "HTTP request trigger",
        tools: ["Send Message"],
      },
      {
        id: "release-notes",
        name: "Release Notes Digest",
        summary: "Summarize release notes and post in Slack.",
        defaultDestination: "#product-updates",
        trigger: "Scheduled trigger",
        tools: ["Send Message"],
      },
      {
        id: "content-qa",
        name: "Content QA Checklist",
        summary: "Run a QA checklist and post results to Slack.",
        defaultDestination: "#content-qa",
        trigger: "Manual trigger",
        tools: ["Send Message"],
      },
    ],
  },
  {
    label: "Ops",
    templates: [
      {
        id: "incident-brief",
        name: "Incident Brief Builder",
        summary: "Turn incident payloads into a clean Slack summary.",
        defaultDestination: "#incident-room",
        trigger: "Webhook trigger",
        tools: ["Send Message"],
      },
      {
        id: "reliability-watch",
        name: "Reliability Watch",
        summary: "Flag workflow anomalies and notify Slack.",
        defaultDestination: "#ops-alerts",
        trigger: "Scheduled trigger",
        tools: ["Send Message"],
      },
    ],
  },
  {
    label: "Executive",
    templates: [
      {
        id: "exec-update",
        name: "Weekly Exec Update",
        summary: "Summarize key KPIs and send to leadership.",
        defaultDestination: "#exec-updates",
        trigger: "Scheduled trigger",
        tools: ["Send Message"],
      },
    ],
  },
];
