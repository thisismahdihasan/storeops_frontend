"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";

import { resolveDefaultRouteForRoles } from "@/components/layout/navigation.config";
import { useWorkspaces } from "@/features/workspace/use-workspaces";

type WorkspaceIndexPageProps = {
  params: Promise<{
    workspaceId: string;
  }>;
};

export default function WorkspaceIndexPage({ params }: WorkspaceIndexPageProps) {
  const { workspaceId } = use(params);
  const router = useRouter();
  const workspacesQuery = useWorkspaces();

  useEffect(() => {
    if (!workspacesQuery.isSuccess) {
      return;
    }

    const workspaces = workspacesQuery.data.data.workspaces;
    const activeWorkspace = workspaces.find((ws) => ws.id === workspaceId);

    if (activeWorkspace) {
      const targetRoute = resolveDefaultRouteForRoles(
        activeWorkspace.membership.roles,
        workspaceId,
      );
      router.replace(targetRoute);
    }
  }, [workspacesQuery.isSuccess, workspacesQuery.data, workspaceId, router]);

  return (
    <div className="flex h-64 items-center justify-center">
      <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
        <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <span>Navigating to your workspace view...</span>
      </div>
    </div>
  );
}
