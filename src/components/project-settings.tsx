import { SettingsShell } from "@/components/settings-shell";
import { ProjectSettingsForm } from "@/components/project-settings-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getProjectSettings,
  saveProjectSettings,
} from "@/lib/server/project-settings-store";

const createDefaultSettings = async (projectId: string) => {
  const existing = await getProjectSettings(projectId);
  if (existing) {
    return existing;
  }
  return saveProjectSettings(projectId, {
    name: "Agent OS Project",
    description: "",
    tags: [],
  });
};

export async function ProjectSettings({ projectId }: { projectId: string }) {
  const settings = await createDefaultSettings(projectId);

  return (
    <SettingsShell projectId={projectId} pageContext="Settings">
      <div>
        <p className="text-[12px] text-[color:var(--color-muted)]">
          Automate Projects
        </p>
        <h1 className="text-[18px] font-semibold text-[color:var(--color-foreground)]">
          Settings
        </h1>
        <p className="mt-1 text-[12px] text-[color:var(--color-muted)]">
          Manage project access, configuration, and data.
        </p>
      </div>

      <ProjectSettingsForm projectId={projectId} initialSettings={settings} />

      <Card className="border border-[color:var(--color-border)] bg-white shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-[13px] font-semibold text-[color:var(--color-muted)]">
            Advanced Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-[12px] text-[color:var(--color-muted)]">
          <p>
            Delete this project only when it has no agents, automations,
            variables, or secrets attached.
          </p>
          <button
            type="button"
            disabled
            className="h-9 rounded-md border border-red-200 px-4 text-[12px] font-semibold text-red-500 opacity-60"
          >
            Delete Project (empty only)
          </button>
        </CardContent>
      </Card>
    </SettingsShell>
  );
}
