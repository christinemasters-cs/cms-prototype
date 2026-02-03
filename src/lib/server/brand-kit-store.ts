import { promises as fs } from "fs";
import path from "path";

import type {
  BrandKitCadence,
  BrandKitGoal,
  BrandKitGoalPriority,
  BrandKitInput,
  BrandKitItem,
  BrandKitKpi,
} from "@/lib/brand-kit-types";

const DATA_DIR = path.join(process.cwd(), ".data");
const FILE_PATH = path.join(DATA_DIR, "brand-kits.json");

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isString = (value: unknown): value is string => typeof value === "string";

const isBrandKitGoalPriority = (
  value: unknown
): value is BrandKitGoalPriority =>
  value === "High" || value === "Medium" || value === "Low";

const isBrandKitCadence = (value: unknown): value is BrandKitCadence =>
  value === "Weekly" ||
  value === "Monthly" ||
  value === "Quarterly" ||
  value === "Annually";

const isBrandKitGoal = (value: unknown): value is BrandKitGoal => {
  if (!isRecord(value)) {
    return false;
  }
  return (
    isString(value.id) &&
    isString(value.text) &&
    isBrandKitGoalPriority(value.priority)
  );
};

const isBrandKitKpi = (value: unknown): value is BrandKitKpi => {
  if (!isRecord(value)) {
    return false;
  }
  return (
    isString(value.id) &&
    isString(value.name) &&
    isString(value.target) &&
    isString(value.unit) &&
    isBrandKitCadence(value.cadence)
  );
};

const isBrandKitItem = (value: unknown): value is BrandKitItem => {
  if (!isRecord(value)) {
    return false;
  }
  return (
    isString(value.id) &&
    isString(value.name) &&
    isString(value.mission) &&
    Array.isArray(value.goals) &&
    value.goals.every(isBrandKitGoal) &&
    Array.isArray(value.websiteKpis) &&
    value.websiteKpis.every(isBrandKitKpi) &&
    typeof value.members === "number" &&
    typeof value.starred === "boolean" &&
    isString(value.createdAt) &&
    isString(value.updatedAt)
  );
};

const normalizeStore = (value: unknown): BrandKitItem[] => {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter(isBrandKitItem);
};

const seedBrandKits = (): BrandKitItem[] => {
  const now = new Date().toISOString();
  return [
    {
      id: "aurora-brand-system",
      name: "Aurora Brand System",
      mission: "Deliver a welcoming hospitality experience with confident, modern messaging.",
      goals: [
        { id: "goal-1", text: "Establish a cohesive tone across all pages.", priority: "High" },
        { id: "goal-2", text: "Increase returning customer loyalty messaging.", priority: "Medium" },
      ],
      websiteKpis: [
        {
          id: "kpi-1",
          name: "Conversion rate",
          target: "3.2",
          unit: "%",
          cadence: "Monthly",
        },
        {
          id: "kpi-2",
          name: "Average session duration",
          target: "2:45",
          unit: "min",
          cadence: "Monthly",
        },
      ],
      members: 4,
      starred: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "harbor-hospitality",
      name: "Harbor Hospitality",
      mission: "Position the brand as the premier coastal retreat for modern travelers.",
      goals: [
        { id: "goal-3", text: "Clarify brand promise across the booking journey.", priority: "High" },
        { id: "goal-4", text: "Standardize headline hierarchy.", priority: "Medium" },
      ],
      websiteKpis: [
        {
          id: "kpi-3",
          name: "Booking inquiries",
          target: "1200",
          unit: "per month",
          cadence: "Monthly",
        },
        {
          id: "kpi-4",
          name: "Landing page CTR",
          target: "4.5",
          unit: "%",
          cadence: "Quarterly",
        },
      ],
      members: 3,
      starred: false,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "northbound-education",
      name: "Northbound Education",
      mission: "Make digital learning feel personal, guided, and goal-oriented.",
      goals: [
        { id: "goal-5", text: "Improve clarity around program outcomes.", priority: "High" },
        { id: "goal-6", text: "Maintain consistent tone for students and parents.", priority: "Low" },
      ],
      websiteKpis: [
        {
          id: "kpi-5",
          name: "Program signup rate",
          target: "2.1",
          unit: "%",
          cadence: "Monthly",
        },
        {
          id: "kpi-6",
          name: "Form completion",
          target: "68",
          unit: "%",
          cadence: "Monthly",
        },
      ],
      members: 5,
      starred: false,
      createdAt: now,
      updatedAt: now,
    },
  ];
};

const readStore = async () => {
  try {
    const raw = await fs.readFile(FILE_PATH, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    return normalizeStore(parsed);
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: string }).code === "ENOENT"
    ) {
      const seed = seedBrandKits();
      await writeStore(seed);
      return seed;
    }
    throw error;
  }
};

const writeStore = async (items: BrandKitItem[]) => {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(FILE_PATH, JSON.stringify(items, null, 2), "utf8");
};

const normalizeGoals = (goals: BrandKitGoal[]) =>
  goals
    .map((goal) => ({
      id: isString(goal.id) && goal.id.length ? goal.id : crypto.randomUUID(),
      text: isString(goal.text) ? goal.text.trim() : "",
      priority: isBrandKitGoalPriority(goal.priority)
        ? goal.priority
        : "Medium",
    }))
    .filter((goal) => goal.text.length > 0);

const normalizeKpis = (kpis: BrandKitKpi[]) =>
  kpis
    .map((kpi) => ({
      id: isString(kpi.id) && kpi.id.length ? kpi.id : crypto.randomUUID(),
      name: isString(kpi.name) ? kpi.name.trim() : "",
      target: isString(kpi.target) ? kpi.target.trim() : "",
      unit: isString(kpi.unit) ? kpi.unit.trim() : "",
      cadence: isBrandKitCadence(kpi.cadence) ? kpi.cadence : "Monthly",
    }))
    .filter((kpi) => kpi.name.length > 0);

const validateBrandKit = (input: BrandKitInput) => {
  if (!input.name.trim()) {
    return "Name is required.";
  }
  if (!input.mission.trim()) {
    return "Mission statement is required.";
  }
  return null;
};

export const listBrandKits = async () => readStore();

export const getBrandKit = async (id: string) => {
  const items = await readStore();
  return items.find((item) => item.id === id) ?? null;
};

export const createBrandKit = async (input: BrandKitInput) => {
  const error = validateBrandKit(input);
  if (error) {
    return { error };
  }
  const items = await readStore();
  const now = new Date().toISOString();
  const item: BrandKitItem = {
    id: crypto.randomUUID(),
    name: input.name.trim(),
    mission: input.mission.trim(),
    goals: normalizeGoals(input.goals),
    websiteKpis: normalizeKpis(input.websiteKpis),
    members: Math.max(1, Number(input.members ?? 1)),
    starred: Boolean(input.starred),
    createdAt: now,
    updatedAt: now,
  };
  await writeStore([item, ...items]);
  return { item };
};

export const updateBrandKit = async (
  id: string,
  input: BrandKitInput
) => {
  const error = validateBrandKit(input);
  if (error) {
    return { error };
  }
  const items = await readStore();
  const existing = items.find((item) => item.id === id);
  if (!existing) {
    return { error: "Brand kit not found." };
  }
  const updated: BrandKitItem = {
    ...existing,
    name: input.name.trim(),
    mission: input.mission.trim(),
    goals: normalizeGoals(input.goals),
    websiteKpis: normalizeKpis(input.websiteKpis),
    members: Math.max(1, Number(input.members ?? existing.members)),
    starred:
      typeof input.starred === "boolean" ? input.starred : existing.starred,
    updatedAt: new Date().toISOString(),
  };
  await writeStore(
    items.map((item) => (item.id === id ? updated : item))
  );
  return { item: updated };
};

export const deleteBrandKit = async (id: string) => {
  const items = await readStore();
  const nextItems = items.filter((item) => item.id !== id);
  if (nextItems.length === items.length) {
    return { error: "Brand kit not found." };
  }
  await writeStore(nextItems);
  return { removed: true };
};
