import { SettingsShell } from "@/components/settings-shell";
import { VariablesManager } from "@/components/variables-manager";

export default async function VariablesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <SettingsShell
      projectId={id}
      activeItem="variables"
      pageContext="Variables"
    >
      <VariablesManager projectId={id} />
    </SettingsShell>
  );
}
