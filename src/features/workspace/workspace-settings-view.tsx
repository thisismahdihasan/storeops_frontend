"use client";

import { useWorkspaces } from "./use-workspaces";
import { useUpdateWorkspaceSettings } from "./use-update-workspace-settings";
import { Switch } from "@/components/ui/switch";
import { StorageCleanupSettingsCard } from "@/features/storage-cleanup/storage-cleanup-settings-card";

type WorkspaceSettingsViewProps = {
  workspaceId: string;
};

export function WorkspaceSettingsView({ workspaceId }: WorkspaceSettingsViewProps) {
  const workspacesQuery = useWorkspaces();
  const workspace = workspacesQuery.data?.data.workspaces.find(
    (ws) => ws.id === workspaceId
  );
  
  const updateSettingsMutation = useUpdateWorkspaceSettings(workspaceId);

  const handleDesignerToggle = (checked: boolean) => {
    updateSettingsMutation.mutate({ designerAutoAssignmentEnabled: checked });
  };

  const handleListerToggle = (checked: boolean) => {
    updateSettingsMutation.mutate({ listerAutoAssignmentEnabled: checked });
  };

  if (!workspace) {
    return null;
  }

  return (
    <main className="mx-auto max-w-screen-2xl space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-2 border-b border-border pb-5">
        <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          Workspace Settings
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage operational settings for this workspace.
        </p>
      </div>

      {/* Automatic Assignment Section */}
      <section className="rounded-xl border border-border bg-card shadow-xs">
        <div className="border-b border-border/50 bg-muted/20 px-4 py-3 sm:px-6">
          <h2 className="text-sm font-semibold text-foreground">
            Automatic Assignment
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Control whether new work is automatically routed to available team members.
          </p>
        </div>

        <div className="flex flex-col divide-y divide-border/50">
          {/* Designer Auto-Assignment */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-6">
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-foreground">
                Designer auto-assignment
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Automatically assign new research items to available Designers.
              </p>
            </div>
            <div className="flex items-center gap-3 self-start sm:self-auto">
              <span className="text-sm font-medium w-6 text-right">
                {workspace.designerAutoAssignmentEnabled ? "On" : "Off"}
              </span>
              <Switch
                checked={workspace.designerAutoAssignmentEnabled}
                onCheckedChange={handleDesignerToggle}
                disabled={updateSettingsMutation.isPending}
                aria-label="Designer auto-assignment"
              />
            </div>
          </div>

          {/* Lister Auto-Assignment */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-6">
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-foreground">
                Lister auto-assignment
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Automatically assign listing-ready items to available Listers.
              </p>
            </div>
            <div className="flex items-center gap-3 self-start sm:self-auto">
              <span className="text-sm font-medium w-6 text-right">
                {workspace.listerAutoAssignmentEnabled ? "On" : "Off"}
              </span>
              <Switch
                checked={workspace.listerAutoAssignmentEnabled}
                onCheckedChange={handleListerToggle}
                disabled={updateSettingsMutation.isPending}
                aria-label="Lister auto-assignment"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Storage Cleanup & Retention Section */}
      <StorageCleanupSettingsCard
        workspace={workspace}
        onUpdateSettings={updateSettingsMutation.mutate}
        isUpdating={updateSettingsMutation.isPending}
      />
    </main>
  );
}
