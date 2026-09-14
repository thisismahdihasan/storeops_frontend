"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { Loader2, LogOut, X } from "lucide-react";

import { StoreOpsLogo } from "@/components/brand/storeops-logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { CurrentUser } from "@/features/auth/auth.types";
import { useLogout } from "@/features/auth/use-logout";
import type { WorkspaceWithMembership } from "@/features/workspace/workspace.types";
import { cn } from "cn";
import { NavigationModeSwitch } from "./navigation-mode-switch";
import {
  resolveNavigationForRoles,
  shouldShowNavigationModeSwitch,
  type NavigationMode,
} from "./navigation.config";
import { getInitials } from "./user-menu";
import { WorkspaceRoleSummary } from "./workspace-role-summary";
import { WorkspaceSwitcher } from "./workspace-switcher";

export type MobileNavProps = {
  activeWorkspaceId: string;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  unreadNotificationsCount?: number;
  user: CurrentUser;
  navigationMode: NavigationMode;
  onNavigationModeChange: (mode: NavigationMode) => void;
  workspaces: WorkspaceWithMembership[];
};

export function MobileNav({
  activeWorkspaceId,
  onOpenChange,
  open,
  unreadNotificationsCount = 0,
  user,
  navigationMode,
  onNavigationModeChange,
  workspaces,
}: MobileNavProps) {
  const pathname = usePathname();
  const logoutMutation = useLogout();

  const handleLogout = () => {
    onOpenChange(false);
    logoutMutation.mutate();
  };

  const activeWorkspace = workspaces.find((ws) => ws.id === activeWorkspaceId);
  const roles = activeWorkspace?.membership.roles ?? [];
  const navigationGroups = resolveNavigationForRoles(
    roles,
    activeWorkspaceId,
    navigationMode,
  );

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 isolate z-50 bg-black/40 backdrop-blur-xs duration-150 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
        <DialogPrimitive.Popup className="fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] min-h-0 flex-col border-r border-border bg-card shadow-xl outline-none duration-200 data-open:animate-in data-open:slide-in-from-left data-closed:animate-out data-closed:slide-out-to-left">
          {/* Header */}
          <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-4">
            <Link
              href={`/w/${activeWorkspaceId}/dashboard`}
              onClick={() => onOpenChange(false)}
              className="flex items-center rounded-md focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="StoreOps Dashboard"
            >
              <StoreOpsLogo variant="full" height={28} priority />
            </Link>
            <DialogPrimitive.Close
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Close navigation menu"
                />
              }
            >
              <X className="size-4" />
            </DialogPrimitive.Close>
          </div>

          {/* Workspace Switcher */}
          <div className="shrink-0 border-b border-border/60 p-3">
            <WorkspaceSwitcher
              activeWorkspaceId={activeWorkspaceId}
              workspaces={workspaces}
            />
          </div>

          {shouldShowNavigationModeSwitch(roles) ? (
            <div className="shrink-0 px-3 pt-3">
              <NavigationModeSwitch
                mode={navigationMode}
                onModeChange={onNavigationModeChange}
              />
            </div>
          ) : null}

          {/* Navigation Groups */}
          <nav className="min-h-0 flex-1 space-y-6 overflow-y-auto px-3 py-4">
            {navigationGroups.map((group) => (
              <div key={group.title} className="space-y-1">
                <h3 className="px-3 pt-2 pb-1.5 font-ui text-xs font-bold uppercase tracking-wider text-foreground/70 select-none">
                  {group.title}
                </h3>
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const isActive =
                      pathname === item.href ||
                      pathname.startsWith(`${item.href}/`);
                    const showUnread =
                      item.badgeKey === "unreadNotifications" &&
                      unreadNotificationsCount > 0;

                    return (
                      <Link
                        key={item.id}
                        href={item.href}
                        onClick={() => onOpenChange(false)}
                        aria-current={isActive ? "page" : undefined}
                        className={cn(
                          "group flex items-center gap-3 rounded-lg px-3 py-2.5 font-ui text-sm font-medium transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring",
                          isActive
                            ? "bg-primary/15 text-primary font-semibold shadow-xs"
                            : "text-foreground/80 hover:bg-muted/80 hover:text-foreground",
                        )}
                      >
                        <item.icon
                          className={cn(
                            "size-4.5 shrink-0 transition-colors",
                            isActive
                              ? "text-primary"
                              : "text-muted-foreground group-hover:text-foreground",
                          )}
                        />
                        <span className="truncate flex-1">{item.title}</span>
                        {showUnread && (
                          <Badge
                            variant="default"
                            className="ml-auto h-5 min-w-5 px-1.5 text-[10px] font-bold"
                          >
                            {unreadNotificationsCount > 99
                              ? "99+"
                              : unreadNotificationsCount}
                          </Badge>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* Account & Active Roles Footer */}
          <div className="shrink-0 space-y-2.5 border-t border-border/60 bg-muted/20 p-3">
            <div className="flex items-center gap-2.5 min-w-0 px-1">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full border border-border bg-primary/10 text-xs font-semibold text-primary">
                {getInitials(user.name, user.email)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-foreground leading-tight" title={user.name ?? user.email}>
                  {user.name || user.email}
                </p>
                {user.name && (
                  <p className="truncate text-[11px] text-muted-foreground leading-tight" title={user.email}>
                    {user.email}
                  </p>
                )}
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              disabled={logoutMutation.isPending}
              className="w-full justify-center text-xs text-muted-foreground hover:text-destructive hover:border-destructive/30 hover:bg-destructive/5"
            >
              {logoutMutation.isPending ? (
                <>
                  <Loader2 className="size-3.5 animate-spin mr-1.5" />
                  <span>Signing out...</span>
                </>
              ) : (
                <>
                  <LogOut className="size-3.5 mr-1.5" />
                  <span>Sign out</span>
                </>
              )}
            </Button>

            {roles.length > 0 && (
              <div className="flex items-center justify-between gap-2 border-t border-border/40 px-1 pt-1 text-[11px] text-muted-foreground">
                <span>Active Roles</span>
                <WorkspaceRoleSummary roles={roles} />
              </div>
            )}
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
