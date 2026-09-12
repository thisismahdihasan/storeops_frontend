"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AlertCircle, ShieldAlert, Store } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useCurrentSession } from "@/features/auth/use-current-session";
import { useNotifications } from "@/features/notifications/use-notifications";
import { useWorkspaces } from "@/features/workspace/use-workspaces";
import { MobileNav } from "./mobile-nav";
import {
  isRouteAllowedForRoles,
  resolveDefaultRouteForRoles,
} from "./navigation.config";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

export type AppShellProps = {
  activeWorkspaceId: string;
  children: React.ReactNode;
};

export function AppShell({ activeWorkspaceId, children }: AppShellProps) {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const pathname = usePathname();

  const sessionQuery = useCurrentSession();
  const workspacesQuery = useWorkspaces(sessionQuery.isSuccess);
  const notificationsQuery = useNotifications(sessionQuery.isSuccess);

  const user = sessionQuery.data?.data.user;
  const workspaces = workspacesQuery.data?.data.workspaces ?? [];
  const unreadNotificationsCount =
    notificationsQuery.data?.data.unreadCount ?? 0;

  // Handle loading states
  if (sessionQuery.isLoading || workspacesQuery.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm font-medium text-muted-foreground">
            Loading workspace...
          </p>
        </div>
      </div>
    );
  }

  // Handle unauthorized or missing user
  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
        <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 text-center shadow-xs">
          <AlertCircle className="mx-auto size-10 text-destructive" />
          <h2 className="mt-4 text-lg font-bold text-foreground">
            Session Expired
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Please sign in to access your workspace.
          </p>
          <div className="mt-6">
            <Button
              nativeButton={false}
              render={<Link href="/login" />}
              className="w-full"
            >
              Sign In
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Handle workspace not found or no membership
  const activeWorkspace = workspaces.find((ws) => ws.id === activeWorkspaceId);
  if (!activeWorkspace) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
        <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 text-center shadow-xs">
          <Store className="mx-auto size-10 text-muted-foreground" />
          <h2 className="mt-4 text-lg font-bold text-foreground">
            Workspace Access Restricted
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            You do not have an active membership in this workspace, or it may not exist.
          </p>
          <div className="mt-6 flex flex-col gap-2">
            {workspaces.length > 0 ? (
              <Button
                nativeButton={false}
                render={<Link href={`/w/${workspaces[0].id}`} />}
                className="w-full"
              >
                Go to {workspaces[0].name}
              </Button>
            ) : (
              <Button
                nativeButton={false}
                render={<Link href="/" />}
                className="w-full"
              >
                Return to Home
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Check role-based route access for current sub-path
  const pathParts = pathname.split("/");
  const currentSegment = pathParts[3]; // /w/[workspaceId]/[segment]
  const isAllowed =
    !currentSegment ||
    isRouteAllowedForRoles(currentSegment, activeWorkspace.membership.roles);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <Sidebar
        activeWorkspaceId={activeWorkspaceId}
        unreadNotificationsCount={unreadNotificationsCount}
        user={user}
        workspaces={workspaces}
      />

      {/* Main content container */}
      <div className="flex flex-1 flex-col min-w-0">
        <Topbar
          activeWorkspaceId={activeWorkspaceId}
          onOpenMobileNav={() => setIsMobileNavOpen(true)}
          unreadNotificationsCount={unreadNotificationsCount}
          user={user}
          workspaces={workspaces}
        />

        <main className="flex-1 overflow-y-auto">
          {!isAllowed ? (
            <div className="flex h-96 flex-col items-center justify-center p-6 text-center">
              <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xs">
                <ShieldAlert className="mx-auto size-10 text-muted-foreground" />
                <h2 className="mt-4 text-lg font-bold text-foreground">
                  Access Restricted
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Your active role in this workspace does not have permission to view this section.
                </p>
                <div className="mt-6">
                  <Button
                    nativeButton={false}
                    render={
                      <Link
                        href={resolveDefaultRouteForRoles(
                          activeWorkspace.membership.roles,
                          activeWorkspaceId,
                        )}
                      />
                    }
                    className="w-full"
                  >
                    Return to Allowed View
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            children
          )}
        </main>
      </div>

      {/* Mobile Drawer */}
      <MobileNav
        activeWorkspaceId={activeWorkspaceId}
        onOpenChange={setIsMobileNavOpen}
        open={isMobileNavOpen}
        unreadNotificationsCount={unreadNotificationsCount}
        user={user}
        workspaces={workspaces}
      />
    </div>
  );
}
