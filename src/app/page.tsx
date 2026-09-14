"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, Mail } from "lucide-react";

import { resolveDefaultRouteForRoles } from "@/components/layout/navigation.config";
import { StoreOpsLogo } from "@/components/brand/storeops-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { useCurrentSession } from "@/features/auth/use-current-session";
import { useLogout } from "@/features/auth/use-logout";
import { CreateWorkspaceForm } from "@/features/workspace/create-workspace-form";
import { useWorkspaces } from "@/features/workspace/use-workspaces";

export default function HomePage() {
  const router = useRouter();
  const sessionQuery = useCurrentSession();
  const workspacesQuery = useWorkspaces(sessionQuery.isSuccess);
  const logoutMutation = useLogout();

  const currentUser = sessionQuery.data?.data.user;
  const workspaces = useMemo(
    () => workspacesQuery.data?.data.workspaces ?? [],
    [workspacesQuery.data?.data.workspaces],
  );

  useEffect(() => {
    if (currentUser && workspacesQuery.isSuccess && workspaces.length > 0) {
      const firstWs = workspaces[0];
      const targetRoute = resolveDefaultRouteForRoles(
        firstWs.membership.roles,
        firstWs.id,
      );
      router.replace(targetRoute);
    }
  }, [currentUser, workspacesQuery.isSuccess, workspaces, router]);

  if (sessionQuery.isPending || (currentUser && workspacesQuery.isPending)) {
    return (
      <main className="page-shell">
        <section className="surface max-w-md space-y-4 p-8 text-center" aria-busy="true">
          <div className="flex justify-center">
            <StoreOpsLogo variant="full" height={32} priority />
          </div>
          <h1 className="text-xl font-semibold text-foreground">
            Verifying session…
          </h1>
        </section>
      </main>
    );
  }

  // Unauthenticated landing
  if (!currentUser) {
    return (
      <main className="page-shell relative">
        <div className="absolute right-6 top-6">
          <ThemeToggle />
        </div>
        <section className="surface max-w-lg space-y-6 p-8">
          <div className="space-y-4">
            <StoreOpsLogo variant="full" height={36} priority />
            <div className="space-y-2">
              <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground">
                Internal Production Workflow
              </h1>
              <p className="text-sm leading-6 text-muted-foreground">
                Welcome to StoreOps. Sign in to your account or create one to
                access your workspace assignments and production pipelines.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button nativeButton={false} render={<Link href="/login" />}>
              Sign in
            </Button>
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link href="/register" />}
            >
              Create account
            </Button>
          </div>
        </section>
      </main>
    );
  }

  // Authenticated with 1+ workspaces will be redirected by useEffect,
  // render transition state if still here briefly
  if (workspaces.length > 0) {
    return (
      <main className="page-shell">
        <section className="surface max-w-md space-y-3 p-8 text-center">
          <div className="mx-auto size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm font-medium text-muted-foreground">
            Opening your workspace…
          </p>
        </section>
      </main>
    );
  }

  // Authenticated with 0 workspaces: Create Workspace & Invite guidance
  return (
    <main className="page-shell relative px-4 py-8 sm:px-6">
      <div className="absolute right-6 top-6 flex items-center gap-2">
        <ThemeToggle />
        <Button
          variant="outline"
          size="sm"
          onClick={() => logoutMutation.mutate()}
          disabled={logoutMutation.isPending}
        >
          <LogOut className="mr-1.5 size-4" />
          Sign out
        </Button>
      </div>

      <section className="surface w-full max-w-lg space-y-6 p-6 sm:p-8">
        <div className="space-y-3 border-b border-border pb-4">
          <StoreOpsLogo variant="full" height={30} priority />
          <div className="space-y-1.5">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              No Active Workspace
            </h1>
            <p className="text-sm text-muted-foreground">
              You can create your first workspace now, or join an existing one using an invitation link.
            </p>
          </div>
        </div>

        {/* Workspace Creation Form */}
        <CreateWorkspaceForm />

        {/* Invite Flow Guidance */}
        <div className="rounded-lg border border-border bg-muted/40 p-4 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-foreground">
            <Mail className="size-4 text-primary" />
            <span>Joining an existing team?</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            If your administrator has already emailed you an invitation link, open that link directly to join their workspace and activate your assigned roles.
          </p>
        </div>
      </section>
    </main>
  );
}
