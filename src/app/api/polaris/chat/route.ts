import "server-only";

import {
  createEntry,
  getAllContentTypes,
  getAllEntries,
  getContentType,
  getEntry,
  updateEntry,
} from "@/lib/server/contentstack";
import type { ContentTypeSummary } from "@/lib/server/contentstack";

type Role = "system" | "user" | "assistant" | "tool";

type ChatMessage = {
  role: Role;
  content: string;
  tool_call_id?: string;
  tool_calls?: ToolCall[];
};

type ToolName =
  | "get_all_content_types"
  | "get_a_single_content_type"
  | "get_all_entries"
  | "get_single_entry"
  | "create_an_entry"
  | "update_an_entry";

type ToolCall = {
  id: string;
  type: "function";
  function: {
    name: ToolName;
    arguments: string;
  };
};

type OpenAiMessage = {
  role: Role;
  content: string | null;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
};

type OpenAiResponse = {
  choices: Array<{
    message: OpenAiMessage;
  }>;
};

type ChatRequest = {
  sessionId?: string;
  message?: string;
  pageContext?: string;
};

const sessions = new Map<string, ChatMessage[]>();

const SYSTEM_PROMPT = [
  "You are Polaris, a Contentstack assistant.",
  "You can only use Contentstack CMA tools for read, create, and update.",
  "Never delete, publish, or unpublish.",
  "If a request requires disallowed actions, ask for an alternative and explain the limitation briefly.",
  "If information is missing, ask a concise follow-up question instead of refusing.",
  "Do not mention system limitations or internal policies.",
  "Entry list limits: 1-3 entries are ok. For 4-10, ask for confirmation. For 11-20, ask 'Are you sure?' before proceeding.",
  "Never request more than 20 entries at once; offer to paginate in batches of 20.",
].join(" ");

const TOOLS = [
  {
    type: "function",
    function: {
      name: "get_all_content_types",
      description: "List all content types for the stack.",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  {
    type: "function",
    function: {
      name: "get_a_single_content_type",
      description: "Get a single content type schema by UID.",
      parameters: {
        type: "object",
        properties: { content_type_uid: { type: "string" } },
        required: ["content_type_uid"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_all_entries",
      description: "Get entries for a content type.",
      parameters: {
        type: "object",
        properties: {
          content_type_uid: { type: "string" },
          locale: { type: "string" },
          limit: { type: "number" },
          confirm: { type: "string", enum: ["ok", "sure"] },
        },
        required: ["content_type_uid"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_single_entry",
      description: "Get a single entry by UID.",
      parameters: {
        type: "object",
        properties: {
          content_type_uid: { type: "string" },
          entry_uid: { type: "string" },
          locale: { type: "string" },
        },
        required: ["content_type_uid", "entry_uid"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_an_entry",
      description: "Create a new entry for a content type.",
      parameters: {
        type: "object",
        properties: {
          content_type_uid: { type: "string" },
          entry: { type: "object" },
        },
        required: ["content_type_uid", "entry"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_an_entry",
      description: "Update an existing entry for a content type.",
      parameters: {
        type: "object",
        properties: {
          content_type_uid: { type: "string" },
          entry_uid: { type: "string" },
          entry: { type: "object" },
        },
        required: ["content_type_uid", "entry_uid", "entry"],
        additionalProperties: false,
      },
    },
  },
];

const TOOL_LABELS: Record<ToolName, string> = {
  get_all_content_types: "Fetching content types",
  get_a_single_content_type: "Loading content type schema",
  get_all_entries: "Fetching entries",
  get_single_entry: "Loading entry",
  create_an_entry: "Creating entry",
  update_an_entry: "Updating entry",
};

const CONTENT_TYPES_CACHE_TTL_MS = 5 * 60 * 1000;
const contentTypesCache: {
  fetchedAt: number;
  contentTypes: ContentTypeSummary[];
} = { fetchedAt: 0, contentTypes: [] };

function getOpenAiKey(): string {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) {
    throw new Error("Missing OPENAI_API_KEY.");
  }
  for (let i = 0; i < key.length; i += 1) {
    if (key.charCodeAt(i) > 127) {
      throw new Error("OPENAI_API_KEY contains non-ASCII characters.");
    }
  }
  return key;
}

function findNonAscii(value: string): { index: number; code: number } | null {
  for (let i = 0; i < value.length; i += 1) {
    const code = value.charCodeAt(i);
    if (code > 127) {
      return { index: i, code };
    }
  }
  return null;
}

function validateEnv(): void {
  const keys = [
    "OPENAI_API_KEY",
    "CONTENTSTACK_API_KEY",
    "CONTENTSTACK_MANAGEMENT_TOKEN",
  ] as const;

  for (const key of keys) {
    const value = process.env[key]?.trim();
    if (!value) {
      continue;
    }
    const offender = findNonAscii(value);
    if (offender) {
      throw new Error(
        `${key} contains non-ASCII characters at index ${offender.index} (code ${offender.code}).`
      );
    }
  }
}

async function callOpenAi(messages: ChatMessage[]) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getOpenAiKey()}`,
    },
    body: JSON.stringify({
      model: "gpt-5.2",
      temperature: 0.2,
      messages,
      tools: TOOLS,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenAI error ${response.status}: ${text}`);
  }

  return (await response.json()) as OpenAiResponse;
}

type OpenAiStreamResponse = {
  choices: Array<{
    delta?: {
      content?: string;
    };
  }>;
};

async function streamOpenAi(
  messages: ChatMessage[],
  onDelta: (chunk: string) => void
) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getOpenAiKey()}`,
    },
    body: JSON.stringify({
      model: "gpt-5.2",
      temperature: 0.2,
      messages,
      stream: true,
    }),
  });

  if (!response.ok || !response.body) {
    const text = await response.text();
    throw new Error(`OpenAI stream error ${response.status}: ${text}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) {
      break;
    }
    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\n\n");
    buffer = parts.pop() ?? "";

    for (const part of parts) {
      const line = part.trim();
      if (!line.startsWith("data:")) {
        continue;
      }
      const data = line.replace(/^data:\s*/, "");
      if (data === "[DONE]") {
        return;
      }
      const parsed = JSON.parse(data) as OpenAiStreamResponse;
      const delta = parsed.choices[0]?.delta?.content ?? "";
      if (delta) {
        onDelta(delta);
      }
    }
  }
}

async function callOpenAiPlan(input: {
  userMessage: string;
  contextMessage?: string;
}) {
  const messages: ChatMessage[] = [
    {
      role: "system",
      content:
        "Write a single-sentence plan for Contentstack CMA only. " +
        "Be concrete and tool-oriented (e.g., 'Fetch content types'). " +
        "Do not describe generic platforms or list unrelated content types. " +
        "Do not reveal chain-of-thought.",
    },
  ];
  if (input.contextMessage) {
    messages.push({ role: "system", content: input.contextMessage });
  }
  messages.push({
    role: "user",
    content: input.userMessage,
  });

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getOpenAiKey()}`,
    },
    body: JSON.stringify({
      model: "gpt-5.2",
      temperature: 0.2,
      messages,
    }),
  });

  if (!response.ok) {
    return "";
  }

  const data = (await response.json()) as OpenAiResponse;
  return data.choices[0]?.message?.content?.trim() ?? "";
}

type ContentTypeHint = { uid: string; title?: string };

function extractContentTypes(history: ChatMessage[]): ContentTypeHint[] {
  const results: ContentTypeHint[] = [];
  for (const message of history) {
    if (message.role !== "tool") {
      continue;
    }
    try {
      const parsed = JSON.parse(message.content) as
        | { content_types?: Array<{ uid: string; title?: string }> }
        | { content_type?: { uid?: string; title?: string } };
      if (parsed.content_types) {
        for (const item of parsed.content_types) {
          if (item?.uid) {
            results.push({ uid: item.uid, title: item.title });
          }
        }
      }
      if (parsed.content_type?.uid) {
        results.push({
          uid: parsed.content_type.uid,
          title: parsed.content_type.title,
        });
      }
    } catch {
      continue;
    }
  }
  const seen = new Set<string>();
  return results.filter((item) => {
    if (seen.has(item.uid)) {
      return false;
    }
    seen.add(item.uid);
    return true;
  });
}

type RecentEntry = {
  uid: string;
  title?: string;
  contentTypeUid?: string;
  updatedAt?: string;
};

function getToolCallContentTypeMap(history: ChatMessage[]) {
  const map = new Map<string, string>();
  for (const message of history) {
    if (message.role !== "assistant" || !message.tool_calls) {
      continue;
    }
    for (const call of message.tool_calls) {
      try {
        const args = parseArgs(call.function.arguments);
        const contentTypeUid = requireString(
          args.content_type_uid,
          "content_type_uid"
        );
        map.set(call.id, contentTypeUid);
      } catch {
        continue;
      }
    }
  }
  return map;
}

function extractRecentEntries(history: ChatMessage[]): RecentEntry[] {
  const results: RecentEntry[] = [];
  const callMap = getToolCallContentTypeMap(history);

  for (const message of history) {
    if (message.role !== "tool" || !message.tool_call_id) {
      continue;
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(message.content) as unknown;
    } catch {
      continue;
    }
    if (!parsed || typeof parsed !== "object") {
      continue;
    }
    const record = parsed as {
      entries?: Record<string, unknown>[];
      entry?: Record<string, unknown>;
    };
    const contentTypeUid = callMap.get(message.tool_call_id);
    if (Array.isArray(record.entries)) {
      for (const entry of record.entries) {
        results.push({
          uid: String(entry.uid ?? ""),
          title:
            (entry.title as string | undefined) ??
            (entry.headline as string | undefined) ??
            (entry.name as string | undefined),
          updatedAt:
            (entry.updated_at as string | undefined) ??
            (entry.created_at as string | undefined),
          contentTypeUid,
        });
      }
    }
    if (record.entry && typeof record.entry === "object") {
      const entry = record.entry as Record<string, unknown>;
      results.push({
        uid: String(entry.uid ?? ""),
        title:
          (entry.title as string | undefined) ??
          (entry.headline as string | undefined) ??
          (entry.name as string | undefined),
        updatedAt:
          (entry.updated_at as string | undefined) ??
          (entry.created_at as string | undefined),
        contentTypeUid,
      });
    }
  }

  const seen = new Set<string>();
  return results.filter((item) => {
    if (!item.uid || seen.has(item.uid)) {
      return false;
    }
    seen.add(item.uid);
    return true;
  }).slice(-6);
}

function extractRecentToolCalls(history: ChatMessage[]) {
  const tools: string[] = [];
  for (const message of history) {
    if (message.role !== "assistant" || !message.tool_calls) {
      continue;
    }
    for (const call of message.tool_calls) {
      tools.push(call.function.name);
    }
  }
  return tools.slice(-5);
}

async function getStackContentTypes(): Promise<ContentTypeSummary[]> {
  const now = Date.now();
  if (
    contentTypesCache.contentTypes.length > 0 &&
    now - contentTypesCache.fetchedAt < CONTENT_TYPES_CACHE_TTL_MS
  ) {
    return contentTypesCache.contentTypes;
  }
  try {
    const contentTypes = await getAllContentTypes();
    contentTypesCache.contentTypes = contentTypes;
    contentTypesCache.fetchedAt = now;
    return contentTypes;
  } catch {
    return contentTypesCache.contentTypes;
  }
}

function matchContentTypeFromText(
  text: string,
  contentTypes: ContentTypeSummary[]
) {
  const normalized = text.toLowerCase();
  for (const contentType of contentTypes) {
    if (normalized.includes(contentType.uid.toLowerCase())) {
      return contentType;
    }
    if (contentType.title && normalized.includes(contentType.title.toLowerCase())) {
      return contentType;
    }
  }
  return null;
}

function extractRecentContentType(
  history: ChatMessage[],
  contentTypes: ContentTypeSummary[]
) {
  for (let i = history.length - 1; i >= 0; i -= 1) {
    const message = history[i];
    if (message.role !== "user" && message.role !== "assistant") {
      continue;
    }
    const match = matchContentTypeFromText(message.content, contentTypes);
    if (match) {
      return match;
    }
  }
  return null;
}

function buildContextMessage(input: {
  contentTypes: ContentTypeSummary[];
  recentContentType: ContentTypeSummary | null;
  stackUid?: string;
  locale?: string;
  branch?: string;
  pageContext?: string;
  recentEntries?: RecentEntry[];
  recentTools?: string[];
}) {
  const lines: string[] = [
    "Context for Contentstack CMA:",
    "Use only listed content type UIDs. If none fit, ask which content type to use or list content types.",
  ];
  if (input.stackUid) {
    lines.push(`Stack UID: ${input.stackUid}.`);
  }
  if (input.branch) {
    lines.push(`Branch: ${input.branch}.`);
  }
  if (input.locale) {
    lines.push(`Locale: ${input.locale}.`);
  }
  if (input.pageContext) {
    lines.push(`Current area: ${input.pageContext}.`);
  }
  if (input.contentTypes.length > 0) {
    const list = input.contentTypes
      .slice(0, 12)
      .map((type) => `${type.uid}${type.title ? ` (${type.title})` : ""}`)
      .join(", ");
    const remaining = input.contentTypes.length - 12;
    lines.push(
      `Known content types: ${list}${remaining > 0 ? ` (+${remaining} more)` : ""}.`
    );
  } else {
    lines.push("Known content types: none cached.");
  }
  if (input.recentContentType) {
    lines.push(
      `Recent content type: ${input.recentContentType.uid}${
        input.recentContentType.title
          ? ` (${input.recentContentType.title})`
          : ""
      }.`
    );
  }
  if (input.recentEntries && input.recentEntries.length > 0) {
    const entries = input.recentEntries
      .map((entry) => {
        const label = entry.title ? `${entry.title} (${entry.uid})` : entry.uid;
        return entry.contentTypeUid
          ? `${label} in ${entry.contentTypeUid}`
          : label;
      })
      .join("; ");
    lines.push(`Recent entries: ${entries}.`);
  }
  if (input.recentTools && input.recentTools.length > 0) {
    lines.push(`Recent tools: ${input.recentTools.join(", ")}.`);
  }
  return {
    role: "system",
    content: lines.join(" "),
  } satisfies ChatMessage;
}

function withContext(
  history: ChatMessage[],
  contextMessage?: ChatMessage
): ChatMessage[] {
  if (!contextMessage) {
    return history;
  }
  const [first, ...rest] = history;
  if (first?.role === "system") {
    return [first, contextMessage, ...rest];
  }
  return [contextMessage, ...history];
}

function recentConversation(history: ChatMessage[]) {
  return history
    .filter((msg) => msg.role === "user" || msg.role === "assistant")
    .slice(-6)
    .map((msg) => `${msg.role}: ${msg.content}`)
    .join("\n");
}

function normalizeSuggestions(
  suggestions: string[],
  contentTypes: ContentTypeHint[]
) {
  if (contentTypes.length === 0) {
    return suggestions.length > 0 ? suggestions : ["List all content types"];
  }

  const uids = new Set(contentTypes.map((type) => type.uid));
  const isValid = (text: string) => {
    for (const uid of uids) {
      if (text.includes(uid)) {
        return true;
      }
    }
    return !/blog_post|article|story/i.test(text);
  };

  const filtered = suggestions.filter(isValid);
  if (filtered.length > 0) {
    return filtered;
  }

  const firstUid = contentTypes[0]?.uid;
  return [
    `Show schema for ${firstUid}`,
    `List 5 entries in ${firstUid}`,
    `Create entry in ${firstUid}`,
  ].filter(Boolean);
}

async function callOpenAiSuggestions(input: {
  userMessage: string;
  reply: string;
  contentTypes: ContentTypeHint[];
  conversation: string;
  contextMessage?: string;
}) {
  const messages: ChatMessage[] = [
    {
      role: "system",
      content:
        "Return 3 very short suggested follow-up prompts as a JSON array of strings. " +
        "Each suggestion should be a concrete next step in Contentstack CMA and be under 40 characters. " +
        "If content types are provided, use their UID exactly. " +
        "If none are provided, suggest listing content types or asking which type to use. " +
        "No extra text, no markdown.",
    },
  ];
  if (input.contextMessage) {
    messages.push({ role: "system", content: input.contextMessage });
  }
  messages.push({
    role: "user",
    content: [
      `Recent conversation:\n${input.conversation}`,
      `User request: ${input.userMessage}`,
      `Assistant reply: ${input.reply}`,
      `Content types: ${
        input.contentTypes.length > 0
          ? input.contentTypes
              .map((item) => `${item.uid}${item.title ? ` (${item.title})` : ""}`)
              .join(", ")
          : "none"
      }`,
    ].join("\n\n"),
  });

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getOpenAiKey()}`,
    },
    body: JSON.stringify({
      model: "gpt-5.2",
      temperature: 0.4,
      messages,
    }),
  });

  if (!response.ok) {
    return [];
  }

  const data = (await response.json()) as OpenAiResponse;
  const content = data.choices[0]?.message?.content ?? "[]";
  try {
    const parsed = JSON.parse(content) as unknown;
    if (Array.isArray(parsed)) {
      return parsed.filter((item): item is string => typeof item === "string");
    }
  } catch {
    return [];
  }
  return [];
}

function parseArgs(rawArgs: string): Record<string, unknown> {
  if (!rawArgs) {
    return {};
  }
  try {
    return JSON.parse(rawArgs) as Record<string, unknown>;
  } catch {
    throw new Error("Invalid tool arguments.");
  }
}

function requireString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`Missing ${label}.`);
  }
  return value.trim();
}

function requireObject(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`Invalid ${label}.`);
  }
  return value as Record<string, unknown>;
}

function normalizeLimit(value: unknown): number | undefined {
  if (typeof value !== "number") {
    return undefined;
  }
  if (!Number.isFinite(value)) {
    return undefined;
  }
  return Math.max(1, Math.floor(value));
}

function buildEntryTable(args: {
  contentTypeUid: string;
  entries: Record<string, unknown>[];
}) {
  const rows = args.entries.map((entry) => {
    const title =
      (entry.title as string | undefined) ??
      (entry.headline as string | undefined) ??
      (entry.name as string | undefined) ??
      (entry.uid as string | undefined) ??
      "Untitled";
    const updatedAt =
      (entry.updated_at as string | undefined) ??
      (entry.created_at as string | undefined) ??
      "";
    const updatedBy =
      (entry.updated_by as { email?: string; uid?: string } | undefined) ??
      (entry.created_by as { email?: string; uid?: string } | undefined);
    const author = updatedBy?.email ?? updatedBy?.uid ?? "Unknown";
    return {
      id: String(entry.uid ?? title),
      title,
      updatedAt,
      author,
      entryUid: String(entry.uid ?? ""),
      contentTypeUid: args.contentTypeUid,
      urlPath:
        (entry.url as string | undefined) ??
        (entry.slug as string | undefined) ??
        (entry.path as string | undefined) ??
        "",
    };
  });

  return {
    type: "entries",
    title: `Entries · ${args.contentTypeUid}`,
    columns: ["Headline", "Updated", "Author", "Links"],
    rows,
  };
}

function buildContentTypeTable(contentTypes: ContentTypeSummary[]) {
  return {
    type: "content_types",
    title: "Content types",
    columns: ["Name", "Edit"],
    rows: contentTypes.map((item) => ({
      id: item.uid,
      name: item.title,
      uid: item.uid,
    })),
  };
}

async function runToolCall(call: ToolCall) {
  const args = parseArgs(call.function.arguments);
  switch (call.function.name) {
    case "get_all_content_types":
      return { content_types: await getAllContentTypes() };
    case "get_a_single_content_type": {
      const contentTypeUid = requireString(args.content_type_uid, "content_type_uid");
      return await getContentType(contentTypeUid);
    }
    case "get_all_entries": {
      const contentTypeUid = requireString(args.content_type_uid, "content_type_uid");
      const locale = typeof args.locale === "string" ? args.locale : undefined;
      const limitInput = normalizeLimit(args.limit);
      const limit = limitInput ?? 3;
      if (limit > 20) {
        return {
          error:
            "I can only fetch up to 20 entries at a time. Please confirm 20 or fewer.",
        };
      }
      if (limit > 10 && args.confirm !== "sure") {
        return {
          error:
            "That will fetch more than 10 entries. Are you sure? If yes, confirm with 'sure'.",
        };
      }
      if (limit > 3 && args.confirm !== "ok" && args.confirm !== "sure") {
        return {
          error:
            "That will fetch more than 3 entries. Should I proceed? If yes, confirm with 'ok'.",
        };
      }
      return await getAllEntries(contentTypeUid, locale, limit);
    }
    case "get_single_entry": {
      const contentTypeUid = requireString(args.content_type_uid, "content_type_uid");
      const entryUid = requireString(args.entry_uid, "entry_uid");
      const locale = typeof args.locale === "string" ? args.locale : undefined;
      return await getEntry(contentTypeUid, entryUid, locale);
    }
    case "create_an_entry": {
      const contentTypeUid = requireString(args.content_type_uid, "content_type_uid");
      const entry = requireObject(args.entry, "entry");
      return await createEntry(contentTypeUid, entry);
    }
    case "update_an_entry": {
      const contentTypeUid = requireString(args.content_type_uid, "content_type_uid");
      const entryUid = requireString(args.entry_uid, "entry_uid");
      const entry = requireObject(args.entry, "entry");
      return await updateEntry(contentTypeUid, entryUid, entry);
    }
    default:
      throw new Error(`Unsupported tool: ${call.function.name}`);
  }
}

function getSession(sessionId: string): ChatMessage[] {
  const existing = sessions.get(sessionId);
  if (existing) {
    return existing;
  }
  const initial: ChatMessage[] = [{ role: "system", content: SYSTEM_PROMPT }];
  sessions.set(sessionId, initial);
  return initial;
}

export async function POST(req: Request) {
  validateEnv();
  const body = (await req.json()) as ChatRequest;
  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!message) {
    return new Response(
      JSON.stringify({ error: "Message is required." }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const sessionId = body.sessionId ?? crypto.randomUUID();
  const history = getSession(sessionId);
  history.push({ role: "user", content: message });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (event: string, data: Record<string, unknown>) => {
        const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(payload));
      };

      try {
        const pageContext =
          typeof body.pageContext === "string" ? body.pageContext.trim() : "";
        const stackContentTypes = await getStackContentTypes();
        const recentContentType = extractRecentContentType(
          history,
          stackContentTypes
        );
        const recentEntries = extractRecentEntries(history);
        const recentTools = extractRecentToolCalls(history);
        const contextMessage = buildContextMessage({
          contentTypes: stackContentTypes,
          recentContentType,
          recentEntries,
          recentTools,
          stackUid: process.env.CONTENTSTACK_API_KEY?.trim(),
          locale: process.env.NEXT_PUBLIC_CONTENTSTACK_LOCALE?.trim(),
          branch: process.env.NEXT_PUBLIC_CONTENTSTACK_BRANCH?.trim(),
          pageContext: pageContext || undefined,
        });

        sendEvent("session", { sessionId });
        sendEvent("status", { state: "Planning next steps" });
        const plan = await callOpenAiPlan({
          userMessage: message,
          contextMessage: contextMessage.content,
        });
        if (plan) {
          sendEvent("plan", { text: plan });
        }

        let assistantMessage: OpenAiMessage | undefined;
        for (let attempt = 0; attempt < 3; attempt += 1) {
          const result = await callOpenAi(withContext(history, contextMessage));
          assistantMessage = result.choices[0]?.message;
          if (!assistantMessage) {
            throw new Error("OpenAI response was empty.");
          }

          if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
            history.push({
              role: "assistant",
              content: assistantMessage.content ?? "",
              tool_calls: assistantMessage.tool_calls,
            });

            for (const call of assistantMessage.tool_calls) {
              sendEvent("tool", {
                name: call.function.name,
                label: TOOL_LABELS[call.function.name],
              });
              sendEvent("status", {
                state: TOOL_LABELS[call.function.name],
              });
              try {
                const toolResult = await runToolCall(call);
                if (call.function.name === "get_all_content_types") {
                  const contentTypes = (toolResult as {
                    content_types?: ContentTypeSummary[];
                  }).content_types;
                  if (Array.isArray(contentTypes) && contentTypes.length > 0) {
                    sendEvent("table", buildContentTypeTable(contentTypes));
                  }
                }
                if (call.function.name === "get_all_entries") {
                  const args = parseArgs(call.function.arguments);
                  const contentTypeUid = requireString(
                    args.content_type_uid,
                    "content_type_uid"
                  );
                  if (toolResult && typeof toolResult === "object") {
                    const resultRecord = toolResult as {
                      entries?: Record<string, unknown>[];
                      error?: string;
                    };
                    if (resultRecord.error) {
                      if (resultRecord.error.includes("confirm with 'ok'")) {
                        sendEvent("suggestions", { items: ["OK"] });
                      }
                      if (resultRecord.error.includes("confirm with 'sure'")) {
                        sendEvent("suggestions", { items: ["Sure"] });
                      }
                      sendEvent("error", { message: resultRecord.error });
                      controller.close();
                      return;
                    }
                    if (Array.isArray(resultRecord.entries)) {
                      const table = buildEntryTable({
                        contentTypeUid,
                        entries: resultRecord.entries,
                      });
                      sendEvent("table", table);
                    }
                  }
                }
                history.push({
                  role: "tool",
                  tool_call_id: call.id,
                  content: JSON.stringify(toolResult),
                });
              } catch (error) {
                const errorMessage =
                  error instanceof Error ? error.message : "Tool call failed.";
                history.push({
                  role: "tool",
                  tool_call_id: call.id,
                  content: JSON.stringify({ error: errorMessage }),
                });
                sendEvent("error", { message: errorMessage });
                controller.close();
                return;
              }
            }
            continue;
          }

          break;
        }

        const contentTypes = extractContentTypes(history);
        const contextContentTypes =
          contentTypes.length > 0
            ? contentTypes
            : stackContentTypes.map((item) => ({
                uid: item.uid,
                title: item.title,
              }));
        const suggestionsRaw = await callOpenAiSuggestions({
          userMessage: message,
          reply: "",
          contentTypes: contextContentTypes,
          conversation: recentConversation(history),
          contextMessage: contextMessage.content,
        });
        const suggestions = normalizeSuggestions(
          suggestionsRaw,
          contextContentTypes
        );
        if (suggestions.length > 0) {
          sendEvent("suggestions", { items: suggestions });
        }

        let reply = "";
        await streamOpenAi(withContext(history, contextMessage), (chunk) => {
          reply += chunk;
          sendEvent("delta", { text: chunk });
        });

        history.push({ role: "assistant", content: reply });
        sendEvent("done", {});
        controller.close();
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error.";
        sendEvent("error", { message: errorMessage });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
