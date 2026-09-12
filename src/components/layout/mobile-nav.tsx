"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { Layers, Loader2, LogOut, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { CurrentUser } from "@/features/auth/auth.types";
import { useLogout } from "@/features/auth/use-logout";
import type { WorkspaceWithMembership } from "@/features/workspace/workspace.types";
import { cn } from "cn";
import { resolveNavigationForRoles } from "./navigation.config";
import { getInitials } from "./user-menu";
import { WorkspaceSwitcher } from "./workspace-switcher";

export type MobileNavProps = {
  activeWorkspaceId: string;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  unreadNotificationsCount?: number;
  user: CurrentUser;
  workspaces: WorkspaceWithMembership[];
};

export function MobileNav({
  activeWorkspaceId,
  onOpenChange,
  open,
  unreadNotificationsCount = 0,
  user,
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
  const navigationGroups = resolveNavigationForRoles(roles, activeWorkspaceId);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 isolate z-50 bg-black/40 backdrop-blur-xs duration-150 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
        <DialogPrimitive.Popup className="fixed inset-y-0 left-0 z-50 flex flex-col w-72 max-w-[85vw] bg-card border-r border-border shadow-xl duration-200 outline-none data-open:animate-in data-open:slide-in-from-left data-closed:animate-out data-closed:slide-out-to-left">
          {/* Header */}
          <div className="flex h-16 items-center justify-between px-4 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs">
                <Layers className="size-4.5" />
              </div>
              <span className="font-heading text-base font-bold text-foreground">
                StoreOps
              </span>
            </div>
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
          <div className="p-3 border-b border-border/60">
            <WorkspaceSwitcher
              activeWorkspaceId={activeWorkspaceId}
              workspaces={workspaces}
            />
          </div>

          {/* Navigation Groups */}
          <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
            {navigationGroups.map((group) => (
              <div key={group.title} className="space-y-1">
                <h3 className="px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {group.title}
                </h3>
                <div className="mt-1 space-y-0.5">
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
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                          isActive
                            ? "bg-primary/10 text-primary font-semibold"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground",
                        )}
                      >
                        <item.icon className="size-4 shrink-0" />
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
          <div className="p-3 border-t border-border/60 bg-muted/20 space-y-2.5">
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
              <div className="flex items-center justify-between text-[11px] text-muted-foreground px-1 pt-1 border-t border-border/40">
                <span>Active Roles</span>
                <span className="font-mono font-medium text-foreground">
                  {roles.join(", ")}
                </span>
              </div>
            )}
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
