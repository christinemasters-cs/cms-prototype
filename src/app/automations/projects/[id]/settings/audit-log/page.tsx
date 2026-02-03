import { SettingsShell } from "@/components/settings-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function SettingsAuditLogPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <SettingsShell projectId={id} activeItem="audit" pageContext="Settings">
      <div>
        <p className="text-[12px] text-[color:var(--color-muted)]">
          Governance
        </p>
        <h1 className="text-[18px] font-semibold text-[color:var(--color-foreground)]">
          Audit log
        </h1>
        <p className="mt-1 text-[12px] text-[color:var(--color-muted)]">
          Track configuration changes across the project.
        </p>
      </div>

      <Card className="border border-[color:var(--color-border)] bg-white shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-[13px] font-semibold text-[color:var(--color-muted)]">
            Recent changes
          </CardTitle>
        </CardHeader>
        <CardContent className="text-[12px] text-[color:var(--color-muted)]">
          No audit events yet.
        </CardContent>
      </Card>
    </SettingsShell>
  );
}
