"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { updateProjectSettings } from "@/app/automations/projects/[id]/settings/actions";
import type { ProjectSettings } from "@/lib/server/project-settings-store";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type ProjectSettingsFormProps = {
  projectId: string;
  initialSettings: ProjectSettings;
};

type ActionState = { ok: boolean; error?: string; savedAt?: string };

const initialState: ActionState = { ok: true };

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      className="h-9 gap-2 rounded-md bg-[color:var(--color-brand)] px-4 text-[13px] text-white shadow-sm hover:brightness-105"
      disabled={pending}
    >
      {pending ? "Saving..." : "Save changes"}
    </Button>
  );
}

export function ProjectSettingsForm({
  projectId,
  initialSettings,
}: ProjectSettingsFormProps) {
  const [state, formAction] = useActionState(updateProjectSettings, initialState);

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="projectId" value={projectId} />
      <Card className="border border-[color:var(--color-border)] bg-white shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-[13px] font-semibold text-[color:var(--color-muted)]">
            General Info
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div>
            <label
              htmlFor="project-name"
              className="text-[11px] font-medium text-[color:var(--color-muted)]"
            >
              Project name
            </label>
            <Input
              id="project-name"
              name="name"
              defaultValue={initialSettings.name}
              required
              className="mt-1 h-9 rounded-md border-[color:var(--color-border)] text-[13px]"
            />
          </div>
          <div>
            <label
              htmlFor="project-description"
              className="text-[11px] font-medium text-[color:var(--color-muted)]"
            >
              Description
            </label>
            <textarea
              id="project-description"
              name="description"
              rows={4}
              defaultValue={initialSettings.description}
              className="mt-1 w-full rounded-md border border-[color:var(--color-border)] bg-white px-3 py-2 text-[13px] text-[color:var(--color-foreground)] shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-brand)]"
            />
          </div>
          <div>
            <label
              htmlFor="project-tags"
              className="text-[11px] font-medium text-[color:var(--color-muted)]"
            >
              Tags
            </label>
            <Input
              id="project-tags"
              name="tags"
              defaultValue={initialSettings.tags.join(", ")}
              placeholder="automation, go-to-market, ops"
              className="mt-1 h-9 rounded-md border-[color:var(--color-border)] text-[13px]"
            />
          </div>
          {state.ok ? null : (
            <p className="text-[12px] text-red-600">{state.error}</p>
          )}
          <div className="flex items-center gap-3">
            <SubmitButton />
            {state.ok && state.savedAt ? (
              <span className="text-[11px] text-[color:var(--color-muted)]">
                Saved.
              </span>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
