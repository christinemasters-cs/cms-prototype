import { SettingsShell } from "@/components/settings-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function SettingsConnectedAppsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <SettingsShell projectId={id} activeItem="apps" pageContext="Settings">
      <div>
        <p className="text-[12px] text-[color:var(--color-muted)]">
          Integrations
        </p>
        <h1 className="text-[18px] font-semibold text-[color:var(--color-foreground)]">
          Connected Apps
        </h1>
        <p className="mt-1 text-[12px] text-[color:var(--color-muted)]">
          Manage API connections and OAuth tokens.
        </p>
      </div>

      <Card className="border border-[color:var(--color-border)] bg-white shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-[13px] font-semibold text-[color:var(--color-muted)]">
            Installed apps
          </CardTitle>
        </CardHeader>
        <CardContent className="text-[12px] text-[color:var(--color-muted)]">
          No connected apps yet.
        </CardContent>
      </Card>
    </SettingsShell>
  );
}
