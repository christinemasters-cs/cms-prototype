"use server";

import { revalidatePath } from "next/cache";

import {
  getProjectSettings,
  saveProjectSettings,
} from "@/lib/server/project-settings-store";

type ActionState = { ok: boolean; error?: string; savedAt?: string };

const parseTags = (value: string) =>
  value
    .split(",")
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);

export async function updateProjectSettings(
  _: ActionState,
  formData: FormData
): Promise<ActionState> {
  const projectId = formData.get("projectId");
  const name = formData.get("name");
  const description = formData.get("description");
  const tags = formData.get("tags");

  if (typeof projectId !== "string" || !projectId.trim()) {
    return { ok: false, error: "Project ID is required." };
  }
  if (typeof name !== "string" || !name.trim()) {
    return { ok: false, error: "Project name is required." };
  }

  const descriptionValue = typeof description === "string" ? description : "";
  const tagsValue = typeof tags === "string" ? parseTags(tags) : [];

  const existing = await getProjectSettings(projectId);
  await saveProjectSettings(
    projectId,
    {
      name: name.trim(),
      description: descriptionValue.trim(),
      tags: tagsValue,
    },
    existing
  );

  revalidatePath(`/automations/projects/${projectId}/settings`);
  return { ok: true, savedAt: new Date().toISOString() };
}
