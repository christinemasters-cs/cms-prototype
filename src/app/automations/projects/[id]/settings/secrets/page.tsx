import { SecretsManager } from "@/components/secrets-manager";
import { SettingsShell } from "@/components/settings-shell";

export default async function SettingsSecretsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <SettingsShell projectId={id} activeItem="secrets" pageContext="Secrets">
      <SecretsManager projectId={id} />
    </SettingsShell>
  );
}
