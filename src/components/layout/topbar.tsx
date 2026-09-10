"use client";

import Link from "next/link";
import { Bell, Menu } from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import type { CurrentUser } from "@/features/auth/auth.types";
import type { WorkspaceWithMembership } from "@/features/workspace/workspace.types";
import { UserMenu } from "./user-menu";

export type TopbarProps = {
  activeWorkspaceId: string;
  onOpenMobileNav: () => void;
  unreadNotificationsCount?: number;
  user: CurrentUser;
  workspaces: WorkspaceWithMembership[];
};

export function Topbar({
  activeWorkspaceId,
  onOpenMobileNav,
  unreadNotificationsCount = 0,
  user,
  workspaces,
}: TopbarProps) {
  const activeWorkspace = workspaces.find((ws) => ws.id === activeWorkspaceId);
  const activeRoles = activeWorkspace?.membership.roles ?? [];

  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-md sm:px-6">
      {/* Left side: Hamburger (mobile/tablet) + Breadcrumbs */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon-sm"
          className="lg:hidden"
          onClick={onOpenMobileNav}
          aria-label="Open navigation menu"
        >
          <Menu className="size-5" />
        </Button>

        <div className="flex items-center gap-2 text-sm">
          <span className="font-semibold text-foreground">StoreOps</span>
          <span className="text-muted-foreground">/</span>
          <span className="font-medium text-foreground truncate max-w-[160px] sm:max-w-[280px]">
            {activeWorkspace?.name ?? "Workspace"}
          </span>
        </div>
      </div>

      {/* Right side: Notifications, Theme Toggle, User Menu */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          nativeButton={false}
          render={<Link href={`/w/${activeWorkspaceId}/notifications`} />}
          aria-label="View notifications"
          className="relative text-muted-foreground hover:text-foreground"
        >
          <Bell className="size-4" />
          {unreadNotificationsCount > 0 && (
            <span className="absolute 1 top-1.5 right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground shadow-xs">
              {unreadNotificationsCount > 99 ? "99+" : unreadNotificationsCount}
            </span>
          )}
        </Button>

        <ThemeToggle />

        <div className="ml-1 pl-1 border-l border-border">
          <UserMenu user={user} activeRoles={activeRoles} />
        </div>
      </div>
    </header>
  );
}
