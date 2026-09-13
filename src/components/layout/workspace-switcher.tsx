"use client";

import { Check, ChevronsUpDown, Store } from "lucide-react";
import { useRouter } from "next/navigation";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { WorkspaceWithMembership } from "@/features/workspace/workspace.types";

import { resolveDefaultRouteForRoles } from "./navigation.config";
import { summarizeWorkspaceRoles } from "./workspace-role-summary";

export type WorkspaceSwitcherProps = {
  activeWorkspaceId: string;
  className?: string;
  workspaces: WorkspaceWithMembership[];
};

export function WorkspaceSwitcher({
  activeWorkspaceId,
  className,
  workspaces,
}: WorkspaceSwitcherProps) {
  const router = useRouter();

  const activeWorkspace = workspaces.find((ws) => ws.id === activeWorkspaceId);
  const currentName = activeWorkspace?.name ?? "Select Workspace";

  const handleSelectWorkspace = (workspace: WorkspaceWithMembership) => {
    if (workspace.id === activeWorkspaceId) {
      return;
    }

    const defaultRoute = resolveDefaultRouteForRoles(
      workspace.membership.roles,
      workspace.id,
    );
    router.push(defaultRoute);
  };

  // If there's only 1 workspace or 0, we can still render the switcher cleanly
  const isSingle = workspaces.length <= 1;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={isSingle}
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
                ? summarizeWorkspaceRoles(activeWorkspace.membership.roles)
                : "No workspace"}
            </span>
          </div>
        </div>
        {!isSingle && (
          <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
        )}
      </DropdownMenuTrigger>

      {!isSingle && (
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {workspaces.map((ws) => {
            const isSelected = ws.id === activeWorkspaceId;
            return (
              <DropdownMenuItem
                key={ws.id}
                onClick={() => handleSelectWorkspace(ws)}
                className="flex items-center justify-between cursor-pointer gap-2"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-foreground">
                    {ws.name}
                  </p>
                  <p className="truncate text-[10px] text-muted-foreground">
                    {summarizeWorkspaceRoles(ws.membership.roles)}
                  </p>
                </div>
                {isSelected && (
                  <Check className="size-3.5 shrink-0 text-primary" />
                )}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      )}
    </DropdownMenu>
  );
}
