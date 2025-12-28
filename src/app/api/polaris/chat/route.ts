import "server-only";
import { NextResponse } from "next/server";

import {
  createEntry,
  getAllContentTypes,
  getAllEntries,
  getContentType,
  getEntry,
  updateEntry,
} from "@/lib/server/contentstack";

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
};

const sessions = new Map<string, ChatMessage[]>();

const SYSTEM_PROMPT = [
  "You are Polaris, a Contentstack assistant.",
  "You can only use Contentstack CMA tools for read, create, and update.",
  "Never delete, publish, or unpublish.",
  "If a request requires disallowed actions, explain that you cannot do it.",
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

async function callOpenAiSummary(input: {
  userMessage: string;
  reply: string;
  toolsUsed: ToolName[];
}) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getOpenAiKey()}`,
    },
    body: JSON.stringify({
      model: "gpt-5.2",
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content:
            "Write a concise reasoning summary in 1-2 sentences. " +
            "Do not reveal chain-of-thought. Focus on high-level steps and tools used.",
        },
        {
          role: "user",
          content: [
            `User request: ${input.userMessage}`,
            `Assistant reply: ${input.reply}`,
            `Tools used: ${input.toolsUsed.join(", ") || "none"}`,
          ].join("\n"),
        },
      ],
    }),
  });

  if (!response.ok) {
    return "";
  }

  const data = (await response.json()) as OpenAiResponse;
  return data.choices[0]?.message?.content?.trim() ?? "";
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
      const limit = typeof args.limit === "number" ? args.limit : undefined;
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
  try {
    validateEnv();
    const body = (await req.json()) as ChatRequest;
    const message = typeof body.message === "string" ? body.message.trim() : "";
    if (!message) {
      return NextResponse.json({ error: "Message is required." }, { status: 400 });
    }

    const sessionId = body.sessionId ?? crypto.randomUUID();
    const history = getSession(sessionId);
    history.push({ role: "user", content: message });
    const toolsUsed: ToolName[] = [];

    let assistantMessage: OpenAiMessage | undefined;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const result = await callOpenAi(history);
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
          toolsUsed.push(call.function.name);
          const toolResult = await runToolCall(call);
          history.push({
            role: "tool",
            tool_call_id: call.id,
            content: JSON.stringify(toolResult),
          });
        }
        continue;
      }

      history.push({
        role: "assistant",
        content: assistantMessage.content ?? "",
      });
      break;
    }

    const reply = assistantMessage?.content ?? "No response.";
    const summary = await callOpenAiSummary({
      userMessage: message,
      reply,
      toolsUsed,
    });
    return NextResponse.json({ sessionId, reply, summary, toolsUsed });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
