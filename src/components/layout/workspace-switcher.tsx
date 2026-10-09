"use client";

import { Check, ChevronsUpDown, Plus, Store } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCurrentSession } from "@/features/auth/use-current-session";
import { CreateWorkspaceDialog } from "@/features/workspace/create-workspace-dialog";
import type { WorkspaceWithMembership } from "@/features/workspace/workspace.types";

import { resolveDefaultRouteForRoles } from "./navigation.config";
import { summarizeWorkspaceRoles } from "./workspace-role-summary";

export type WorkspaceSwitcherProps = {
  activeWorkspaceId: string;
  className?: string;
  workspaces: WorkspaceWithMembership[];
};

const getWorkspaceSubtitle = (
  workspace: WorkspaceWithMembership,
  currentUserId: string | undefined
) => {
  const roles = summarizeWorkspaceRoles(workspace.membership.roles);
  return workspace.ownerId === currentUserId ? `Owner · ${roles}` : roles;
};

const getPendingWorkspaceWarning = (workspace: WorkspaceWithMembership) => {
  const remainingMs = workspace.permanentDeletionAt
    ? new Date(workspace.permanentDeletionAt).getTime() - Date.now()
    : 0;

  if (remainingMs <= 0) {
    return `${workspace.name} — permanent deletion in progress`;
  }

  const remainingHours = Math.max(
    1,
    Math.ceil(remainingMs / (1000 * 60 * 60))
  );
  return `${workspace.name} is scheduled for deletion · ${remainingHours}h remaining`;
};

export function WorkspaceSwitcher({
  activeWorkspaceId,
  className,
  workspaces,
}: WorkspaceSwitcherProps) {
  const router = useRouter();
  const sessionQuery = useCurrentSession();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const currentUserId = sessionQuery.data?.data.user.id;
  const activeWorkspace = workspaces.find((ws) => ws.id === activeWorkspaceId);
  const currentName = activeWorkspace?.name ?? "Select Workspace";
  const canOpenSwitcher = workspaces.length > 0;

  const handleSelectWorkspace = (workspace: WorkspaceWithMembership) => {
    if (workspace.deletionScheduledAt !== null) {
      toast.warning(getPendingWorkspaceWarning(workspace));
      return;
    }

    if (workspace.id === activeWorkspaceId) {
      return;
    }

    const defaultRoute = resolveDefaultRouteForRoles(
      workspace.membership.roles,
      workspace.id,
    );
    router.push(defaultRoute);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          disabled={!canOpenSwitcher}
          className={`flex w-full items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2 text-left text-sm font-medium shadow-xs transition-colors hover:bg-muted/50 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default disabled:opacity-90 ${className ?? ""}`}
        >
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Store className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="block truncate text-xs font-semibold text-foreground">
                {currentName}
              </span>
              <span className="block truncate text-[10px] text-muted-foreground">
                {activeWorkspace
                  ? getWorkspaceSubtitle(activeWorkspace, currentUserId)
                  : "No workspace"}
              </span>
            </div>
          </div>
          {canOpenSwitcher && (
            <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
          )}
        </DropdownMenuTrigger>

        {canOpenSwitcher && (
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {workspaces.map((workspace) => {
              const isSelected = workspace.id === activeWorkspaceId;
              const isOwner = workspace.ownerId === currentUserId;
              const isPending = workspace.deletionScheduledAt !== null;

              return (
                <DropdownMenuItem
                  key={workspace.id}
                  onClick={() => handleSelectWorkspace(workspace)}
                  className={`flex cursor-pointer items-center justify-between gap-2 ${
                    isSelected ? "bg-muted/60" : ""
                  } ${
                    isPending
                      ? "text-amber-800 focus:bg-amber-500/10 focus:text-amber-900 dark:text-amber-300 dark:focus:text-amber-200"
                      : ""
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium">{workspace.name}</p>
                    <p className="truncate text-[10px] text-muted-foreground">
                      {isOwner
                        ? `Owner · ${summarizeWorkspaceRoles(workspace.membership.roles)}`
                        : summarizeWorkspaceRoles(workspace.membership.roles)}
                    </p>
                    {isPending && (
                      <p className="mt-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-300">
                        Deletion pending
                      </p>
                    )}
                  </div>
                  {isSelected && (
                    <Check className="size-3.5 shrink-0 text-primary" />
                  )}
                </DropdownMenuItem>
              );
            })}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setIsCreateOpen(true)}
              className="cursor-pointer gap-2 text-primary focus:text-primary"
            >
              <Plus className="size-4" />
              Create Workspace
            </DropdownMenuItem>
          </DropdownMenuContent>
        )}
      </DropdownMenu>
      <CreateWorkspaceDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
      />
    </>
  );
}
