"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AlertCircle, ShieldAlert, Store } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { EditProfileDialog } from "@/features/auth/edit-profile-dialog";
import { useCurrentSession } from "@/features/auth/use-current-session";
import { NOTIFICATIONS_PAGE_LIMIT } from "@/features/notifications/notifications.constants";
import { useNotifications } from "@/features/notifications/use-notifications";
import { useWorkspaces } from "@/features/workspace/use-workspaces";
import { useRestoreWorkspace } from "@/features/workspace/use-workspace-deletion";
import { MobileNav } from "./mobile-nav";
import { NavigationContextProvider } from "./navigation-context";
import {
  isRouteAllowedForRoles,
  resolveDefaultNavigationMode,
  resolveDefaultRouteForNavigationMode,
  resolveDefaultRouteForRoles,
  resolveNavigationModeForRouteSegments,
  type NavigationMode,
} from "./navigation.config";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { PendingWorkspaceOverlay } from "./pending-workspace-overlay";

export type AppShellProps = {
  activeWorkspaceId: string;
  children: React.ReactNode;
};

type SelectedNavigationMode = {
  mode: NavigationMode;
  workspaceId: string;
};

export function AppShell({ activeWorkspaceId, children }: AppShellProps) {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [selectedNavigationMode, setSelectedNavigationMode] =
    useState<SelectedNavigationMode | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  const sessionQuery = useCurrentSession();
  const workspacesQuery = useWorkspaces(sessionQuery.isSuccess);
  const user = sessionQuery.data?.data.user;
  const workspaceList = workspacesQuery.data?.data.workspaces;
  const workspaces = workspaceList ?? [];
  const activeWorkspace = workspaces.find((ws) => ws.id === activeWorkspaceId);
  const currentUserId = user?.id;
  const isPending = activeWorkspace?.deletionScheduledAt != null;
  const isOwner = activeWorkspace?.ownerId === currentUserId;
  const wasWorkspaceKnownRef = useRef(Boolean(activeWorkspace));
  const redirectedRef = useRef(false);
  const notificationsQuery = useNotifications(
    activeWorkspaceId,
    1,
    NOTIFICATIONS_PAGE_LIMIT,
    sessionQuery.isSuccess &&
      !workspacesQuery.isLoading &&
      Boolean(activeWorkspace) &&
      !isPending,
  );
  const restoreWorkspaceMutation = useRestoreWorkspace(activeWorkspaceId);

  const roles = activeWorkspace?.membership.roles ?? [];
  const routeSegments = pathname.split("/").slice(3);
  const routeNavigationMode = resolveNavigationModeForRouteSegments(
    roles,
    routeSegments,
  );
  const unreadNotificationsCount =
    notificationsQuery.data?.data.unreadCount ?? 0;
  const alternativeWorkspace = workspaces.find(
    (workspace) =>
      workspace.id !== activeWorkspaceId && workspace.deletionScheduledAt === null,
  );
  const alternativeWorkspaceRoute = alternativeWorkspace
    ? resolveDefaultRouteForRoles(
        alternativeWorkspace.membership.roles,
        alternativeWorkspace.id,
      )
    : "/";

  const selectedModeForWorkspace =
    selectedNavigationMode?.workspaceId === activeWorkspaceId
      ? selectedNavigationMode.mode
      : null;
  const navigationMode =
    routeNavigationMode ??
    selectedModeForWorkspace ??
    resolveDefaultNavigationMode(roles);

  const handleNavigationModeChange = (nextMode: NavigationMode) => {
    if (nextMode === navigationMode) {
      return;
    }

    setSelectedNavigationMode({ mode: nextMode, workspaceId: activeWorkspaceId });

    if (routeNavigationMode !== null && routeNavigationMode !== nextMode) {
      router.push(
        resolveDefaultRouteForNavigationMode(
          roles,
          activeWorkspaceId,
          nextMode,
        ),
      );
    } else if (routeSegments[0] === "research") {
      router.push(`/w/${activeWorkspaceId}/research`);
    }
  };

  useEffect(() => {
    if (activeWorkspace) {
      wasWorkspaceKnownRef.current = true;
      return;
    }

    if (
      !wasWorkspaceKnownRef.current ||
      !sessionQuery.isSuccess ||
      !workspacesQuery.isSuccess ||
      redirectedRef.current
    ) {
      return;
    }

    redirectedRef.current = true;
    const nextWorkspace = workspaceList?.find(
      (workspace) =>
        workspace.id !== activeWorkspaceId &&
        workspace.deletionScheduledAt === null,
    );
    const targetRoute = nextWorkspace
      ? resolveDefaultRouteForRoles(nextWorkspace.membership.roles, nextWorkspace.id)
      : "/";

    toast.warning("This workspace is no longer available.");
    router.replace(targetRoute);
  }, [
    activeWorkspace,
    activeWorkspaceId,
    router,
    sessionQuery.isSuccess,
    workspaceList,
    workspacesQuery.isSuccess,
  ]);

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
            {alternativeWorkspace ? (
              <Button
                nativeButton={false}
                render={
                  <Link
                    href={resolveDefaultRouteForRoles(
                      alternativeWorkspace.membership.roles,
                      alternativeWorkspace.id,
                    )}
                  />
                }
                className="w-full"
              >
                Go to {alternativeWorkspace.name}
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
  const isAllowed =
    routeSegments.length === 0 ||
    isRouteAllowedForRoles(routeSegments, activeWorkspace.membership.roles);

  return (
    <NavigationContextProvider mode={navigationMode}>
      <div
        aria-hidden={isPending}
        className={`flex min-h-screen bg-background ${isPending ? "pointer-events-none blur-sm opacity-40" : ""}`}
        inert={isPending}
      >
      {/* Desktop Sidebar */}
      <Sidebar
        activeWorkspaceId={activeWorkspaceId}
        navigationMode={navigationMode}
        onEditProfile={() => setIsEditProfileOpen(true)}
        onNavigationModeChange={handleNavigationModeChange}
        unreadNotificationsCount={unreadNotificationsCount}
        user={user}
        workspaces={workspaces}
      />

      {/* Main content container */}
      <div className="flex flex-1 flex-col min-w-0">
        <Topbar
          activeWorkspaceId={activeWorkspaceId}
          onEditProfile={() => setIsEditProfileOpen(true)}
          onOpenMobileNav={() => setIsMobileNavOpen(true)}
          unreadNotificationsCount={unreadNotificationsCount}
          user={user}
          workspaces={workspaces}
        />

        <main className="flex-1 overflow-y-auto">
          {isPending ? (
            <div className="min-h-full bg-muted/20" />
          ) : !isAllowed ? (
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
        onEditProfile={() => setIsEditProfileOpen(true)}
        onOpenChange={setIsMobileNavOpen}
        open={isMobileNavOpen}
        navigationMode={navigationMode}
        onNavigationModeChange={handleNavigationModeChange}
        unreadNotificationsCount={unreadNotificationsCount}
        user={user}
        workspaces={workspaces}
      />
      <EditProfileDialog
        onOpenChange={setIsEditProfileOpen}
        open={isEditProfileOpen}
        user={user}
      />
      </div>
      {isPending && (
        <PendingWorkspaceOverlay
          alternativeWorkspaceRoute={alternativeWorkspaceRoute}
          isOwner={isOwner}
          onRestore={async () => {
            await restoreWorkspaceMutation.mutateAsync();
          }}
          permanentDeletionAt={activeWorkspace.permanentDeletionAt}
          restoring={restoreWorkspaceMutation.isPending}
          workspaceId={activeWorkspace.id}
          workspaceName={activeWorkspace.name}
        />
      )}
    </NavigationContextProvider>
  );
}
