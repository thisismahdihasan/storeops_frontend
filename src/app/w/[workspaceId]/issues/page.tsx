import type { Metadata } from "next";
import { Suspense } from "react";

import { IssuesView } from "@/features/issues/issues-view";

export const metadata: Metadata = {
  description: "Designer-reported items waiting for Admin action",
  title: "Issues — StoreOps",
};

type IssuesPageProps = {
  params: Promise<{
    workspaceId: string;
  }>;
};

export default async function IssuesPage({ params }: IssuesPageProps) {
  const { workspaceId } = await params;

  return (
    <Suspense fallback={null}>
      <IssuesView workspaceId={workspaceId} />
    </Suspense>
  );
}
