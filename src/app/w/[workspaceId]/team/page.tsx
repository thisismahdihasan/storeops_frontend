import type { Metadata } from "next";

import { TeamView } from "@/features/team/team-view";

export const metadata: Metadata = {
  description: "Workspace team members and role assignments",
  title: "Team — StoreOps",
};

type TeamPageProps = { params: Promise<{ workspaceId: string }> };

export default async function TeamPage({ params }: TeamPageProps) {
  const { workspaceId } = await params;

  return <TeamView workspaceId={workspaceId} />;
}
