import type { Metadata } from "next";

import { DesignsView } from "@/features/designs/designs-view";

export const metadata: Metadata = {
  description: "Operational management of workspace designs and assignments",
  title: "Designs — StoreOps",
};

type DesignsPageProps = {
  params: Promise<{ workspaceId: string }>;
};

export default async function DesignsPage({ params }: DesignsPageProps) {
  const { workspaceId } = await params;

  return <DesignsView workspaceId={workspaceId} />;
}
