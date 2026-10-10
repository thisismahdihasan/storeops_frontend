"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { useCurrentSession } from "@/features/auth/use-current-session";
import { StorageCleanupSettingsCard } from "@/features/storage-cleanup/storage-cleanup-settings-card";
import { Switch } from "@/components/ui/switch";

import { DeleteWorkspaceDialog } from "./delete-workspace-dialog";
import { useWorkspaces } from "./use-workspaces";
import { useScheduleWorkspaceDeletion } from "./use-workspace-deletion";
import { useUpdateWorkspaceSettings } from "./use-update-workspace-settings";

type WorkspaceSettingsViewProps = {
  workspaceId: string;
};

export function WorkspaceSettingsView({ workspaceId }: WorkspaceSettingsViewProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const currentSessionQuery = useCurrentSession();
  const workspacesQuery = useWorkspaces();
  const workspace = workspacesQuery.data?.data.workspaces.find(
    (ws) => ws.id === workspaceId
  );
  
  const updateSettingsMutation = useUpdateWorkspaceSettings(workspaceId);
  const scheduleDeletionMutation = useScheduleWorkspaceDeletion(workspaceId);
  const currentUserId = currentSessionQuery.data?.data.user.id;
  const isOwner = workspace?.ownerId === currentUserId;

  const handleDesignerToggle = (checked: boolean) => {
    updateSettingsMutation.mutate({ designerAutoAssignmentEnabled: checked });
  };

  const handleListerToggle = (checked: boolean) => {
    updateSettingsMutation.mutate({ listerAutoAssignmentEnabled: checked });
  };

  const handleScheduleDeletion = async (workspaceName: string) => {
    await scheduleDeletionMutation.mutateAsync({ workspaceName });
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

      {isOwner && (
        <section className="rounded-xl border border-destructive/30 bg-destructive/5 shadow-xs">
          <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Danger Zone</h2>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                Schedule this workspace for deletion. You will have a 3-day grace period to restore it before permanent cleanup.
              </p>
            </div>
            <Button onClick={() => setIsDeleteDialogOpen(true)} type="button" variant="destructive">
              Delete Workspace
            </Button>
          </div>
        </section>
      )}

      {isOwner && (
        <DeleteWorkspaceDialog
          onOpenChange={setIsDeleteDialogOpen}
          onSchedule={handleScheduleDeletion}
          open={isDeleteDialogOpen}
          submitting={scheduleDeletionMutation.isPending}
          workspaceName={workspace.name}
        />
      )}
    </main>
  );
}
