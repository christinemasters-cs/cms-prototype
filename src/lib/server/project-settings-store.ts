import { promises as fs } from "fs";
import path from "path";

export type ProjectSettings = {
  name: string;
  description: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

const DATA_DIR = path.join(process.cwd(), ".data");
const SETTINGS_FILE = path.join(DATA_DIR, "project-settings.json");

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const normalizeSettings = (value: unknown): ProjectSettings | null => {
  if (!isRecord(value)) {
    return null;
  }
  if (
    typeof value.name !== "string" ||
    typeof value.description !== "string" ||
    !Array.isArray(value.tags) ||
    typeof value.createdAt !== "string" ||
    typeof value.updatedAt !== "string"
  ) {
    return null;
  }
  const tags = value.tags.filter((tag) => typeof tag === "string");
  return {
    name: value.name,
    description: value.description,
    tags,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  };
};

const normalizeStore = (value: unknown): Record<string, ProjectSettings> => {
  if (!isRecord(value)) {
    return {};
  }
  const output: Record<string, ProjectSettings> = {};
  for (const [key, entry] of Object.entries(value)) {
    const normalized = normalizeSettings(entry);
    if (normalized) {
      output[key] = normalized;
    }
  }
  return output;
};

const readStore = async () => {
  try {
    const raw = await fs.readFile(SETTINGS_FILE, "utf8");
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

const writeStore = async (data: Record<string, ProjectSettings>) => {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(SETTINGS_FILE, JSON.stringify(data, null, 2), "utf8");
};

export const getProjectSettings = async (projectId: string) => {
  const store = await readStore();
  return store[projectId] ?? null;
};

export const saveProjectSettings = async (
  projectId: string,
  data: Omit<ProjectSettings, "createdAt" | "updatedAt">,
  existing?: ProjectSettings | null
) => {
  const store = await readStore();
  const now = new Date().toISOString();
  const previous = existing ?? store[projectId] ?? null;
  const next: ProjectSettings = {
    name: data.name,
    description: data.description,
    tags: data.tags,
    createdAt: previous?.createdAt ?? now,
    updatedAt: now,
  };
  store[projectId] = next;
  await writeStore(store);
  return next;
};
