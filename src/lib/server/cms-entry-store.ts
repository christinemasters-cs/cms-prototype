import { promises as fs } from "fs";
import path from "path";

import type { CmsEntryInput, CmsEntryItem, CmsEntryStatus } from "@/lib/cms-entry-types";

const DATA_DIR = path.join(process.cwd(), ".data");
const FILE_PATH = path.join(DATA_DIR, "cms-entries.json");

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isString = (value: unknown): value is string => typeof value === "string";

const isNumber = (value: unknown): value is number =>
  typeof value === "number" && !Number.isNaN(value);

const isStatus = (value: unknown): value is CmsEntryStatus =>
  value === "draft" || value === "staging" || value === "production";

const normalizeEntry = (value: unknown): CmsEntryItem | null => {
  if (!isRecord(value)) {
    return null;
  }
  const fields = isRecord(value.fields) ? value.fields : {};
  const status = Array.isArray(value.status)
    ? value.status.filter(isStatus)
    : [];
  if (
    !isString(value.id) ||
    !isString(value.title) ||
    !isString(value.language) ||
    !isString(value.contentType) ||
    !isString(value.variants) ||
    !isNumber(value.version) ||
    !isString(value.updatedAt)
  ) {
    return null;
  }
  return {
    id: value.id,
    title: value.title,
    language: value.language,
    contentType: value.contentType,
    variants: value.variants,
    version: value.version,
    status: status.length ? status : ["draft"],
    updatedAt: value.updatedAt,
    fields: {
      singleLine: isString(fields.singleLine) ? fields.singleLine : "",
      multiLine: isString(fields.multiLine) ? fields.multiLine : "",
      richText: isString(fields.richText) ? fields.richText : "",
      jsonRichText: isString(fields.jsonRichText) ? fields.jsonRichText : "",
    },
  };
};

const normalizeStore = (value: unknown): CmsEntryItem[] => {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((item) => normalizeEntry(item))
    .filter((item): item is CmsEntryItem => item !== null);
};

const seedEntries = (): CmsEntryItem[] => {
  const now = new Date().toISOString();
  return [
    {
      id: "entry-1",
      title: "Composable DXP: What it is and ...",
      language: "English - United States",
      contentType: "Blog Post",
      variants: "—",
      version: 3,
      status: ["staging", "production"],
      updatedAt: now,
      fields: {
        singleLine: "Onze producten",
        multiLine: "Type something...",
        richText:
          "Our products\nAt Action, you'll find always surprising assortment at the lowest prices.",
        jsonRichText: "{\n  \"type\": \"doc\",\n  \"content\": []\n}",
      },
    },
    {
      id: "entry-2",
      title: "Homepage",
      language: "English - United States",
      contentType: "Homepage",
      variants: "Location +4",
      version: 126,
      status: ["development", "production"],
      updatedAt: now,
      fields: {
        singleLine: "Homepage hero",
        multiLine: "Messaging block",
        richText: "Homepage\nHero section copy...",
        jsonRichText: "{\n  \"type\": \"doc\",\n  \"content\": []\n}",
      },
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
      const seed = seedEntries();
      await writeStore(seed);
      return seed;
    }
    throw error;
  }
};

const writeStore = async (items: CmsEntryItem[]) => {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(FILE_PATH, JSON.stringify(items, null, 2), "utf8");
};

const normalizeInput = (input: CmsEntryInput): CmsEntryInput => ({
  title: input.title.trim(),
  language: input.language.trim(),
  contentType: input.contentType.trim(),
  variants: input.variants.trim(),
  version: Number.isFinite(input.version) ? input.version : 1,
  status: input.status.filter(isStatus),
  fields: {
    singleLine: input.fields.singleLine.trim(),
    multiLine: input.fields.multiLine.trim(),
    richText: input.fields.richText.trim(),
    jsonRichText: input.fields.jsonRichText.trim(),
  },
});

const validateEntry = (input: CmsEntryInput) => {
  if (!input.title.trim()) {
    return "Title is required.";
  }
  if (!input.language.trim()) {
    return "Language is required.";
  }
  if (!input.contentType.trim()) {
    return "Content type is required.";
  }
  return null;
};

export const listEntries = async () => readStore();

export const getEntry = async (id: string) => {
  const items = await readStore();
  return items.find((item) => item.id === id) ?? null;
};

export const createEntry = async (input: CmsEntryInput) => {
  const normalized = normalizeInput(input);
  const error = validateEntry(normalized);
  if (error) {
    return { error };
  }
  const items = await readStore();
  const now = new Date().toISOString();
  const item: CmsEntryItem = {
    id: crypto.randomUUID(),
    ...normalized,
    status: normalized.status.length ? normalized.status : ["draft"],
    updatedAt: now,
  };
  await writeStore([item, ...items]);
  return { item };
};

export const updateEntry = async (id: string, input: CmsEntryInput) => {
  const normalized = normalizeInput(input);
  const error = validateEntry(normalized);
  if (error) {
    return { error };
  }
  const items = await readStore();
  const existing = items.find((item) => item.id === id);
  if (!existing) {
    return { error: "Entry not found." };
  }
  const updated: CmsEntryItem = {
    ...existing,
    ...normalized,
    status: normalized.status.length ? normalized.status : existing.status,
    updatedAt: new Date().toISOString(),
  };
  await writeStore(items.map((item) => (item.id === id ? updated : item)));
  return { item: updated };
};
