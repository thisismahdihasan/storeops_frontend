import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, HardDrive } from "lucide-react";

import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  description: "Manage and clean up production ZIP storage for listed items",
  title: "Storage Management — StoreOps",
};

type StorageManagementPageProps = {
  params: Promise<{
    workspaceId: string;
  }>;
};

export default async function StorageManagementPage({
  params,
}: StorageManagementPageProps) {
  const { workspaceId } = await params;

  return (
    <main className="mx-auto max-w-screen-2xl space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header with back link */}
      <div className="flex flex-col gap-2 border-b border-border pb-5">
        <div>
          <Button
            nativeButton={false}
            render={<Link href={`/w/${workspaceId}/settings`} />}
            size="xs"
            variant="ghost"
            className="gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" />
            <span>Back to Workspace Settings</span>
          </Button>
        </div>
        <h1 className="mt-1 text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          Storage Management
        </h1>
        <p className="text-sm text-muted-foreground">
          Review and permanently remove production ZIP packages for listed items to reclaim storage.
        </p>
      </div>

      {/* Placeholder content for Phase F */}
      <section className="rounded-xl border border-dashed border-border bg-card p-12 text-center shadow-xs">
        <HardDrive className="mx-auto size-10 text-muted-foreground/80" />
        <h2 className="mt-4 text-base font-semibold text-foreground">
          Manual Storage Cleanup
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Candidate listing, search, single deletion, and bulk cleanup will be available in Phase F.
        </p>
      </section>
    </main>
  );
}
