import { promises as fs } from "fs";
import path from "path";

export type ConfigKind = "variables" | "secrets";

export type ConfigItem = {
  id: string;
  name: string;
  value: string;
  createdAt: string;
  updatedAt: string;
};

const NAME_PATTERN = /^[a-zA-Z][a-zA-Z0-9_]*$/;
const DATA_DIR = path.join(process.cwd(), ".data");

const fileForKind = (kind: ConfigKind) =>
  path.join(DATA_DIR, `${kind}.json`);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isConfigItem = (value: unknown): value is ConfigItem => {
  if (!isRecord(value)) {
    return false;
  }
  return (
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.value === "string" &&
    typeof value.createdAt === "string" &&
    typeof value.updatedAt === "string"
  );
};

const normalizeStore = (value: unknown): Record<string, ConfigItem[]> => {
  if (!isRecord(value)) {
    return {};
  }
  const output: Record<string, ConfigItem[]> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (!Array.isArray(entry)) {
      continue;
    }
    output[key] = entry.filter(isConfigItem);
  }
  return output;
};

const readStore = async (kind: ConfigKind) => {
  const filePath = fileForKind(kind);
  try {
    const raw = await fs.readFile(filePath, "utf8");
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

const writeStore = async (kind: ConfigKind, data: Record<string, ConfigItem[]>) => {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(fileForKind(kind), JSON.stringify(data, null, 2), "utf8");
};

const validateName = (name: string) => {
  if (!name.trim()) {
    return "Name is required.";
  }
  if (!NAME_PATTERN.test(name)) {
    return "Name must start with a letter and contain only letters, numbers, or underscores.";
  }
  return null;
};

export const listConfig = async (kind: ConfigKind, projectId: string) => {
  const store = await readStore(kind);
  return store[projectId] ?? [];
};

export const createConfig = async (
  kind: ConfigKind,
  projectId: string,
  name: string,
  value: string
) => {
  const error = validateName(name);
  if (error) {
    return { error };
  }
  const store = await readStore(kind);
  const items = store[projectId] ?? [];
  const exists = items.some(
    (item) => item.name.toLowerCase() === name.toLowerCase()
  );
  if (exists) {
    return { error: "Name already exists." };
  }
  const now = new Date().toISOString();
  const item: ConfigItem = {
    id: crypto.randomUUID(),
    name,
    value,
    createdAt: now,
    updatedAt: now,
  };
  store[projectId] = [item, ...items];
  await writeStore(kind, store);
  return { item };
};

export const updateConfig = async (
  kind: ConfigKind,
  projectId: string,
  id: string,
  name: string,
  value: string
) => {
  const error = validateName(name);
  if (error) {
    return { error };
  }
  const store = await readStore(kind);
  const items = store[projectId] ?? [];
  const target = items.find((item) => item.id === id);
  if (!target) {
    return { error: "Item not found." };
  }
  const nameTaken = items.some(
    (item) => item.id !== id && item.name.toLowerCase() === name.toLowerCase()
  );
  if (nameTaken) {
    return { error: "Name already exists." };
  }
  const updated: ConfigItem = {
    ...target,
    name,
    value,
    updatedAt: new Date().toISOString(),
  };
  store[projectId] = items.map((item) => (item.id === id ? updated : item));
  await writeStore(kind, store);
  return { item: updated };
};

export const deleteConfig = async (
  kind: ConfigKind,
  projectId: string,
  id: string
) => {
  const store = await readStore(kind);
  const items = store[projectId] ?? [];
  const nextItems = items.filter((item) => item.id !== id);
  if (nextItems.length === items.length) {
    return { error: "Item not found." };
  }
  store[projectId] = nextItems;
  await writeStore(kind, store);
  return { removed: true };
};
