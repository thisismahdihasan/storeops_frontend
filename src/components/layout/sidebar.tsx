"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Layers } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { WorkspaceWithMembership } from "@/features/workspace/workspace.types";
import { cn } from "cn";
import { resolveNavigationForRoles } from "./navigation.config";
import { WorkspaceSwitcher } from "./workspace-switcher";

export type SidebarProps = {
  activeWorkspaceId: string;
  className?: string;
  unreadNotificationsCount?: number;
  workspaces: WorkspaceWithMembership[];
};

export function Sidebar({
  activeWorkspaceId,
  className,
  unreadNotificationsCount = 0,
  workspaces,
}: SidebarProps) {
  const pathname = usePathname();

  const activeWorkspace = workspaces.find((ws) => ws.id === activeWorkspaceId);
  const roles = activeWorkspace?.membership.roles ?? [];
  const navigationGroups = resolveNavigationForRoles(roles, activeWorkspaceId);

  return (
    <aside
      className={cn(
        "hidden lg:flex flex-col w-64 shrink-0 border-r border-border bg-card/70 backdrop-blur-xs h-screen sticky top-0 z-30",
        className,
      )}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center gap-2.5 px-5 border-b border-border">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs">
          <Layers className="size-4.5" />
        </div>
        <div className="flex flex-col">
          <span className="font-heading text-base font-bold tracking-tight text-foreground leading-tight">
            StoreOps
          </span>
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            Workspace Hub
          </span>
        </div>
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
                  pathname === item.href || pathname.startsWith(`${item.href}/`);
                const showUnread =
                  item.badgeKey === "unreadNotifications" &&
                  unreadNotificationsCount > 0;

                return (
                  <Link
                    key={item.id}
                    href={item.href}
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

      {/* Active Roles Summary Footer */}
      {roles.length > 0 && (
        <div className="p-3 border-t border-border/60 bg-muted/20">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground px-2 py-1">
            <span>Active Roles</span>
            <span className="font-mono font-medium text-foreground">
              {roles.join(", ")}
            </span>
          </div>
        </div>
      )}
    </aside>
  );
}
