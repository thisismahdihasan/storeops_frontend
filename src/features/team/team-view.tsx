"use client";

import { Plus, UsersRound } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api";
import { useWorkspaces } from "@/features/workspace/use-workspaces";

import { InviteMemberDialog } from "./invite-member-dialog";
import { TeamMembersList } from "./team-members-list";
import { PendingInvitesList } from "./pending-invites-list";
import type { PendingWorkspaceInvite } from "./team.types";
import {
  usePendingWorkspaceInvites,
  useResendWorkspaceInvite,
  useRevokeWorkspaceInvite,
  useTeamMembers,
} from "./use-team";

type TeamViewProps = { workspaceId: string };

function getRequestErrorMessage(error: unknown, fallback = "Please try again.") {
  return error instanceof ApiError ? error.message : fallback;
}

function getRetryAfterSeconds(error: unknown) {
  if (!(error instanceof ApiError) || error.status !== 429) {
    return undefined;
  }

  if (
    typeof error.data === "object" &&
    error.data !== null &&
    "retryAfterSeconds" in error.data &&
    typeof error.data.retryAfterSeconds === "number" &&
    Number.isFinite(error.data.retryAfterSeconds)
  ) {
    return Math.max(0, Math.ceil(error.data.retryAfterSeconds));
  }

  return undefined;
}

function formatRemainingDuration(remainingSeconds: number) {
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;

  return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
}

export function TeamView({ workspaceId }: TeamViewProps) {
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [cooldownEndsAtByInviteId, setCooldownEndsAtByInviteId] = useState<Record<string, number>>({});
  const workspacesQuery = useWorkspaces();
  const activeWorkspace = workspacesQuery.data?.data.workspaces.find((workspace) => workspace.id === workspaceId);
  const hasAdminRole = activeWorkspace?.membership.roles.includes("ADMIN") ?? false;
  const membersQuery = useTeamMembers(workspaceId, hasAdminRole);
  const pendingInvitesQuery = usePendingWorkspaceInvites(workspaceId, hasAdminRole);
  const resendInviteMutation = useResendWorkspaceInvite(workspaceId);
  const revokeInviteMutation = useRevokeWorkspaceInvite(workspaceId);

  const handleResend = async (invite: PendingWorkspaceInvite) => {
    try {
      await resendInviteMutation.mutateAsync(invite.id);
      setCooldownEndsAtByInviteId((current) => {
        const remainingCooldowns = { ...current };
        delete remainingCooldowns[invite.id];

        return remainingCooldowns;
      });
      toast.success("Invitation resent successfully.");
    } catch (error) {
      const retryAfterSeconds = getRetryAfterSeconds(error);

      if (retryAfterSeconds !== undefined) {
        setCooldownEndsAtByInviteId((current) => ({
          ...current,
          [invite.id]: Date.now() + retryAfterSeconds * 1_000,
        }));
        toast.error(
          retryAfterSeconds > 0
            ? `Please wait before resending this invitation. Resend available in ${formatRemainingDuration(retryAfterSeconds)}.`
            : "Please wait before resending this invitation.",
        );
        return;
      }

      toast.error(getRequestErrorMessage(error, "Could not resend this invitation."));
    }
  };

  const handleRevoke = async (invite: PendingWorkspaceInvite) => {
    try {
      await revokeInviteMutation.mutateAsync(invite.id);
      toast.success("Invitation revoked successfully.");
    } catch (error) {
      toast.error(getRequestErrorMessage(error, "Could not revoke this invitation."));
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-5 p-4 sm:p-6 lg:p-8">
      <header className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">Workspace access</p>
          <h1 className="mt-1 flex items-center gap-2 text-2xl font-bold tracking-tight sm:text-3xl"><UsersRound className="size-6 text-primary" />Team Management</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">Manage current workspace members and invite collaborators.</p>
        </div>
        <Button disabled={!hasAdminRole} onClick={() => setIsInviteDialogOpen(true)} type="button"><Plus className="size-4" />Invite member</Button>
      </header>
      <section aria-labelledby="workspace-members-heading" className="space-y-3">
        <div className="flex items-baseline justify-between gap-3">
          <div><h2 className="text-lg font-semibold" id="workspace-members-heading">Members</h2><p className="text-sm text-muted-foreground">Current accepted workspace memberships.</p></div>
          {membersQuery.data && <p className="shrink-0 text-sm text-muted-foreground">{membersQuery.data.data.members.length} member{membersQuery.data.data.members.length === 1 ? "" : "s"}</p>}
        </div>
        <TeamMembersList errorMessage={getRequestErrorMessage(membersQuery.error)} isError={membersQuery.isError} isLoading={workspacesQuery.isLoading || membersQuery.isLoading} members={membersQuery.data?.data.members ?? []} onRetry={() => void membersQuery.refetch()} />
      </section>
      <section aria-labelledby="pending-invites-heading" className="space-y-3">
        <div><h2 className="text-lg font-semibold" id="pending-invites-heading">Pending Invites</h2><p className="text-sm text-muted-foreground">Resend or revoke unaccepted workspace invitations.</p></div>
        <PendingInvitesList cooldownEndsAtByInviteId={cooldownEndsAtByInviteId} errorMessage={getRequestErrorMessage(pendingInvitesQuery.error)} invites={pendingInvitesQuery.data?.data.invites ?? []} isError={pendingInvitesQuery.isError} isLoading={workspacesQuery.isLoading || pendingInvitesQuery.isLoading} isResendingInviteId={resendInviteMutation.isPending ? resendInviteMutation.variables : undefined} onResend={(invite) => void handleResend(invite)} onRetry={() => void pendingInvitesQuery.refetch()} onRevoke={handleRevoke} />
      </section>
      <InviteMemberDialog onOpenChange={setIsInviteDialogOpen} open={isInviteDialogOpen} workspaceId={workspaceId} />
    </div>
  );
}
