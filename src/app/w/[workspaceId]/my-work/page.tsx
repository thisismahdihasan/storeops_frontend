import { Suspense } from "react";
import type { Metadata } from "next";

import { DesignerWorkView } from "@/features/designer-work/designer-work-view";

export const metadata: Metadata = {
  description: "Your active StoreOps design assignments",
  title: "My Work — StoreOps",
};

type MyWorkPageProps = { params: Promise<{ workspaceId: string }> };

export default async function MyWorkPage({ params }: MyWorkPageProps) {
  const { workspaceId } = await params;
  return <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Loading My Work…</div>}><DesignerWorkView workspaceId={workspaceId} /></Suspense>;
}
