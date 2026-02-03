import { SettingsShell } from "@/components/settings-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function SettingsUsersPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <SettingsShell projectId={id} activeItem="users" pageContext="Settings">
      <div>
        <p className="text-[12px] text-[color:var(--color-muted)]">
          Project Access
        </p>
        <h1 className="text-[18px] font-semibold text-[color:var(--color-foreground)]">
          Users
        </h1>
        <p className="mt-1 text-[12px] text-[color:var(--color-muted)]">
          Invite teammates and manage access levels.
        </p>
      </div>

      <Card className="border border-[color:var(--color-border)] bg-white shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-[13px] font-semibold text-[color:var(--color-muted)]">
            Team Members
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-[12px] text-[color:var(--color-muted)]">
          <p>No users added yet.</p>
          <Button type="button" variant="outline" disabled className="h-9">
            Invite user
          </Button>
        </CardContent>
      </Card>
    </SettingsShell>
  );
}
