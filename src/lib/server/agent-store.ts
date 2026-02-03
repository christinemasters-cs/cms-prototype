import { promises as fs } from "fs";
import path from "path";

export type AgentItem = {
  id: string;
  projectId: string;
  name: string;
  description: string;
  instructions: string;
  triggers: string[];
  tools: string[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

const DATA_DIR = path.join(process.cwd(), ".data");
const FILE_PATH = path.join(DATA_DIR, "agents.json");

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

const isAgentItem = (value: unknown): value is AgentItem => {
  if (!isRecord(value)) {
    return false;
  }
  return (
    typeof value.id === "string" &&
    typeof value.projectId === "string" &&
    typeof value.name === "string" &&
    typeof value.description === "string" &&
    typeof value.instructions === "string" &&
    isStringArray(value.triggers) &&
    isStringArray(value.tools) &&
    typeof value.active === "boolean" &&
    typeof value.createdAt === "string" &&
    typeof value.updatedAt === "string"
  );
};

const normalizeStore = (value: unknown): Record<string, AgentItem[]> => {
  if (!isRecord(value)) {
    return {};
  }
  const output: Record<string, AgentItem[]> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (!Array.isArray(entry)) {
      continue;
    }
    output[key] = entry.filter(isAgentItem);
  }
  return output;
};

const readStore = async () => {
  try {
    const raw = await fs.readFile(FILE_PATH, "utf8");
    return normalizeStore(JSON.parse(raw) as unknown);
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: string }).code === "ENOENT"
    ) {
      return {};
    }
    throw error;
  }
};

const writeStore = async (data: Record<string, AgentItem[]>) => {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(FILE_PATH, JSON.stringify(data, null, 2), "utf8");
};

const normalizeList = (value: string[]) =>
  value.map((item) => item.trim()).filter(Boolean);

const validateAgent = (input: {
  name: string;
  instructions: string;
  triggers: string[];
  tools: string[];
}) => {
  if (!input.name.trim()) {
    return "Name is required.";
  }
  if (!input.instructions.trim()) {
    return "Instructions are required.";
  }
  const triggers = normalizeList(input.triggers);
  if (triggers.length === 0) {
    return "At least one trigger is required.";
  }
  const tools = normalizeList(input.tools);
  if (tools.length === 0) {
    return "At least one tool is required.";
  }
  return null;
};

export const listAgents = async (projectId: string) => {
  const store = await readStore();
  return store[projectId] ?? [];
};

export const getAgent = async (projectId: string, id: string) => {
  const items = await listAgents(projectId);
  return items.find((item) => item.id === id) ?? null;
};

export const createAgent = async (input: {
  projectId: string;
  name: string;
  description: string;
  instructions: string;
  triggers: string[];
  tools: string[];
  active: boolean;
}) => {
  const error = validateAgent(input);
  if (error) {
    return { error };
  }
  const store = await readStore();
  const items = store[input.projectId] ?? [];
  const now = new Date().toISOString();
  const item: AgentItem = {
    id: crypto.randomUUID(),
    projectId: input.projectId,
    name: input.name.trim(),
    description: input.description.trim(),
    instructions: input.instructions.trim(),
    triggers: normalizeList(input.triggers),
    tools: normalizeList(input.tools),
    active: Boolean(input.active),
    createdAt: now,
    updatedAt: now,
  };
  store[input.projectId] = [item, ...items];
  await writeStore(store);
  return { item };
};

export const updateAgent = async (input: {
  projectId: string;
  id: string;
  name: string;
  description: string;
  instructions: string;
  triggers: string[];
  tools: string[];
  active: boolean;
}) => {
  const error = validateAgent(input);
  if (error) {
    return { error };
  }
  const store = await readStore();
  const items = store[input.projectId] ?? [];
  const existing = items.find((item) => item.id === input.id);
  if (!existing) {
    return { error: "Agent not found." };
  }
  const updated: AgentItem = {
    ...existing,
    name: input.name.trim(),
    description: input.description.trim(),
    instructions: input.instructions.trim(),
    triggers: normalizeList(input.triggers),
    tools: normalizeList(input.tools),
    active: Boolean(input.active),
    updatedAt: new Date().toISOString(),
  };
  store[input.projectId] = items.map((item) =>
    item.id === input.id ? updated : item
  );
  await writeStore(store);
  return { item: updated };
};

export const deleteAgent = async (projectId: string, id: string) => {
  const store = await readStore();
  const items = store[projectId] ?? [];
  const nextItems = items.filter((item) => item.id !== id);
  if (nextItems.length === items.length) {
    return { error: "Agent not found." };
  }
  store[projectId] = nextItems;
  await writeStore(store);
  return { removed: true };
};
