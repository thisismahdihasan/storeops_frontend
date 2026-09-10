import type { Metadata } from "next";

import { AppShell } from "@/components/layout/app-shell";

export const metadata: Metadata = {
  description: "StoreOps Workspace Dashboard and Operations",
  title: "Workspace — StoreOps",
};

type WorkspaceLayoutProps = {
  children: React.ReactNode;
  params: Promise<{
    workspaceId: string;
  }>;
};

export default async function WorkspaceLayout({
  children,
  params,
}: WorkspaceLayoutProps) {
  const { workspaceId } = await params;

  return <AppShell activeWorkspaceId={workspaceId}>{children}</AppShell>;
}
