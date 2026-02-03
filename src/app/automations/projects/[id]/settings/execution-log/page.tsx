import { SettingsShell } from "@/components/settings-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function SettingsExecutionLogPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <SettingsShell projectId={id} activeItem="execution" pageContext="Settings">
      <div>
        <p className="text-[12px] text-[color:var(--color-muted)]">
          Observability
        </p>
        <h1 className="text-[18px] font-semibold text-[color:var(--color-foreground)]">
          Execution log
        </h1>
        <p className="mt-1 text-[12px] text-[color:var(--color-muted)]">
          Review recent runs and tool activity.
        </p>
      </div>

      <Card className="border border-[color:var(--color-border)] bg-white shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-[13px] font-semibold text-[color:var(--color-muted)]">
            Recent executions
          </CardTitle>
        </CardHeader>
        <CardContent className="text-[12px] text-[color:var(--color-muted)]">
          No executions recorded yet.
        </CardContent>
      </Card>
    </SettingsShell>
  );
}
