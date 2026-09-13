import { Suspense } from "react";
import type { Metadata } from "next";

import { CorrectionsView } from "@/features/corrections/corrections-view";

export const metadata: Metadata = {
  description: "Review requested changes and continue your design revisions",
  title: "Corrections — StoreOps",
};

type CorrectionsPageProps = {
  params: Promise<{
    workspaceId: string;
  }>;
};

export default async function CorrectionsPage({
  params,
}: CorrectionsPageProps) {
  const { workspaceId } = await params;

  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-screen-2xl p-6 text-sm text-muted-foreground">
          Loading corrections…
        </div>
      }
    >
      <CorrectionsView workspaceId={workspaceId} />
    </Suspense>
  );
}
