import { promises as fs } from "fs";
import path from "path";

import type {
  CmsStackEnvironment,
  CmsStackInput,
  CmsStackItem,
  CmsStackRegion,
} from "@/lib/cms-stack-types";

const DATA_DIR = path.join(process.cwd(), ".data");
const FILE_PATH = path.join(DATA_DIR, "cms-stacks.json");

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isString = (value: unknown): value is string => typeof value === "string";

const isRegion = (value: unknown): value is CmsStackRegion =>
  value === "US" || value === "EU" || value === "APAC";

const isEnvironment = (value: unknown): value is CmsStackEnvironment =>
  value === "Production" || value === "Staging" || value === "Development";

const normalizeStackItem = (value: unknown): CmsStackItem | null => {
  if (!isRecord(value)) {
    return null;
  }
  if (
    !isString(value.id) ||
    !isString(value.name) ||
    !isRegion(value.region) ||
    !isEnvironment(value.environment) ||
    typeof value.members !== "number" ||
    typeof value.starred !== "boolean" ||
    !isString(value.createdAt) ||
    !isString(value.updatedAt)
  ) {
    return null;
  }
  return {
    id: value.id,
    name: value.name,
    description: isString(value.description) ? value.description : "",
    region: value.region,
    environment: value.environment,
    members: value.members,
    starred: value.starred,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  };
};

const normalizeStore = (value: unknown): CmsStackItem[] => {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((item) => normalizeStackItem(item))
    .filter((item): item is CmsStackItem => item !== null);
};

const seedStacks = (): CmsStackItem[] => {
  const now = new Date().toISOString();
  return [
    {
      id: "aurora-commerce",
      name: "Aurora Commerce",
      description: "Primary commerce stack for product and marketing teams.",
      region: "US",
      environment: "Production",
      members: 6,
      starred: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "harbor-marketing",
      name: "Harbor Marketing",
      description: "Regional marketing site stack with localized entries.",
      region: "EU",
      environment: "Staging",
      members: 4,
      starred: false,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "northbound-docs",
      name: "Northbound Docs",
      description: "Documentation stack for developer resources.",
      region: "APAC",
      environment: "Development",
      members: 3,
      starred: false,
      createdAt: now,
      updatedAt: now,
    },
  ];
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
      const seed = seedStacks();
      await writeStore(seed);
      return seed;
    }
    throw error;
  }
};

const writeStore = async (items: CmsStackItem[]) => {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(FILE_PATH, JSON.stringify(items, null, 2), "utf8");
};

const normalizeName = (value: unknown) =>
  isString(value) ? value.trim() : "";

const validateStack = (input: CmsStackInput) => {
  if (!input.name.trim()) {
    return "Name is required.";
  }
  if (!input.description.trim()) {
    return "Description is required.";
  }
  if (!isRegion(input.region)) {
    return "Region is required.";
  }
  if (!isEnvironment(input.environment)) {
    return "Environment is required.";
  }
  return null;
};

export const listStacks = async () => readStore();

export const getStack = async (id: string) => {
  const items = await readStore();
  return items.find((item) => item.id === id) ?? null;
};

export const createStack = async (input: CmsStackInput) => {
  const error = validateStack(input);
  if (error) {
    return { error };
  }
  const items = await readStore();
  const now = new Date().toISOString();
  const item: CmsStackItem = {
    id: crypto.randomUUID(),
    name: normalizeName(input.name),
    description: normalizeName(input.description),
    region: input.region,
    environment: input.environment,
    members: Math.max(1, Number(input.members ?? 1)),
    starred: Boolean(input.starred),
    createdAt: now,
    updatedAt: now,
  };
  await writeStore([item, ...items]);
  return { item };
};

export const updateStack = async (id: string, input: CmsStackInput) => {
  const error = validateStack(input);
  if (error) {
    return { error };
  }
  const items = await readStore();
  const existing = items.find((item) => item.id === id);
  if (!existing) {
    return { error: "Stack not found." };
  }
  const updated: CmsStackItem = {
    ...existing,
    name: normalizeName(input.name),
    description: normalizeName(input.description),
    region: input.region,
    environment: input.environment,
    members: Math.max(1, Number(input.members ?? existing.members)),
    starred: typeof input.starred === "boolean" ? input.starred : existing.starred,
    updatedAt: new Date().toISOString(),
  };
  await writeStore(items.map((item) => (item.id === id ? updated : item)));
  return { item: updated };
};

export const deleteStack = async (id: string) => {
  const items = await readStore();
  const nextItems = items.filter((item) => item.id !== id);
  if (nextItems.length === items.length) {
    return { error: "Stack not found." };
  }
  await writeStore(nextItems);
  return { removed: true };
};
