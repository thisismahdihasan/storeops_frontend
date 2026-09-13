import type { Metadata } from "next";

import { TeamMemberActivityView } from "@/features/team/team-member-activity-view";

export const metadata: Metadata = {
  description: "Workspace member performance and recent item activity",
  title: "Member Activity — StoreOps",
};

type TeamMemberActivityPageProps = {
  params: Promise<{ userId: string; workspaceId: string }>;
};

export default async function TeamMemberActivityPage({
  params,
}: TeamMemberActivityPageProps) {
  const { userId, workspaceId } = await params;

  return <TeamMemberActivityView userId={userId} workspaceId={workspaceId} />;
}
