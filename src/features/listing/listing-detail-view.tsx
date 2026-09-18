"use client";

import { AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { useWorkspaces } from "@/features/workspace/use-workspaces";
import { ApiError } from "@/lib/api";

import { FinalAssetDownloadList } from "./final-asset-download-list";
import { ListingAccessState } from "./listing-access-state";
import {
  AssignmentMetadata,
  PeoplePanel,
  ReferenceCheck,
} from "./listing-detail-sections";
import { getListingStatusMeta } from "./listing.types";
import type { CompleteListingFormValues } from "./listing.types";
import { ListingWorkflowPanel } from "./listing-workflow-panel";
import {
  useCompleteListing,
  useListingDetail,
  useStartListing,
} from "./use-listing";

type ListingDetailViewProps = {
  researchItemId: string;
  workspaceId: string;
};

export function ListingDetailView({
  researchItemId,
  workspaceId,
}: ListingDetailViewProps) {
  const router = useRouter();
  const workspacesQuery = useWorkspaces();
  const workspace = workspacesQuery.data?.data.workspaces.find(
    (item) => item.id === workspaceId,
  );
  const hasListerRole = workspace?.membership.roles.includes("LISTER") ?? false;
  const isAdmin = workspace?.membership.roles.includes("ADMIN") ?? false;
  const detailQuery = useListingDetail(
    workspaceId,
    researchItemId,
    hasListerRole,
  );
  const startMutation = useStartListing(workspaceId, researchItemId);
  const completeMutation = useCompleteListing(workspaceId, researchItemId);

  if (
    workspacesQuery.isLoading ||
    (hasListerRole && detailQuery.isLoading)
  ) {
    return <ListingDetailSkeleton />;
  }

  if (workspacesQuery.isError) {
    return (
      <ListingDetailError
        error={workspacesQuery.error}
        onRetry={() => void workspacesQuery.refetch()}
        workspaceId={workspaceId}
      />
    );
  }

  if (workspacesQuery.data && !hasListerRole) {
    return <ListingAccessState workspaceId={workspaceId} />;
  }

  if (detailQuery.isError) {
    const status = detailQuery.error instanceof ApiError ? detailQuery.error.status : 0;
    if (status === 403) {
      return (
        <ListingAccessState
          description="Only the currently assigned Lister can open this listing."
          title="You cannot access this listing"
          workspaceId={workspaceId}
        />
      );
    }

    return (
      <ListingDetailError
        error={detailQuery.error}
        onRetry={() => void detailQuery.refetch()}
        workspaceId={workspaceId}
      />
    );
  }

  if (!detailQuery.data) return <ListingDetailSkeleton />;

  const detail = detailQuery.data.data;
  const title =
    detail.researchItem.title ||
    `Etsy Listing #${detail.researchItem.etsyListingId}`;
  const statusMeta = getListingStatusMeta(detail.researchItem.status);

  const handleStart = async () => {
    try {
      await startMutation.mutateAsync();
      toast.success("Listing work started.");
    } catch (error) {
      toast.error(actionErrorMessage(error, "Unable to start listing work."));
      if (error instanceof ApiError && error.status === 409) {
        void detailQuery.refetch();
      }
    }
  };

  const handleComplete = async (values: CompleteListingFormValues) => {
    try {
      await completeMutation.mutateAsync(values);
      toast.success("Listing marked as listed.");
      router.push(`/w/${workspaceId}/listing`);
    } catch (error) {
      toast.error(actionErrorMessage(error, "Unable to mark this listing as listed."));
      if (error instanceof ApiError && error.status === 409) {
        void detailQuery.refetch();
      }
    }
  };

  return (
    <main className="mx-auto max-w-screen-2xl space-y-5 p-4 sm:p-6 lg:p-8">
      <header className="space-y-4 border-b border-border pb-5">
        <Button
          nativeButton={false}
          render={<Link href={`/w/${workspaceId}/listing`} />}
          size="sm"
          variant="ghost"
        >
          <ArrowLeft /> Back to Listing
        </Button>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="font-mono text-xs text-muted-foreground">
              Etsy #{detail.researchItem.etsyListingId}
            </p>
            <h1 className="mt-1 break-words text-2xl font-bold tracking-tight sm:text-3xl">
              {title}
            </h1>
          </div>
          <StatusBadge label={statusMeta.label} tone={statusMeta.tone} />
        </div>
      </header>

      <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <aside className="order-1 min-w-0 space-y-5 lg:order-2">
          <ListingWorkflowPanel
            detail={detail}
            isCompleting={completeMutation.isPending}
            isStarting={startMutation.isPending}
            onComplete={(values) => void handleComplete(values)}
            onStart={() => void handleStart()}
          />
          <FinalAssetDownloadList
            assets={detail.finalAssets}
            researchItemId={researchItemId}
            workspaceId={workspaceId}
          />
        </aside>
        <div className="order-2 min-w-0 lg:order-1">
          <ReferenceCheck detail={detail} workspaceId={workspaceId} />
        </div>
      </div>
      {isAdmin && <PeoplePanel detail={detail} />}
      <AssignmentMetadata detail={detail} />
    </main>
  );
}

function actionErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError && error.status === 409) {
    return `${error.message} Listing data has been refreshed.`;
  }
  return error instanceof Error ? error.message : fallback;
}

function ListingDetailError({ error, onRetry, workspaceId }: { error: unknown; onRetry: () => void; workspaceId: string }) {
  const status = error instanceof ApiError ? error.status : 0;
  const title = status === 404 ? "Listing not found" : status === 401 ? "Your session has expired" : status === 409 ? "Listing is no longer active" : "Unable to load listing";
  const message = status === 409 ? "This listing may have moved out of the active workflow." : error instanceof Error ? error.message : "Check your connection and try again.";
  return <main className="mx-auto max-w-lg p-4 sm:p-6"><section className="rounded-xl border border-border bg-card p-6 text-center"><AlertCircle className="mx-auto size-8 text-destructive" /><h1 className="mt-3 text-xl font-semibold">{title}</h1><p className="mt-2 text-sm text-muted-foreground">{message}</p><div className="mt-4 flex flex-col justify-center gap-2 sm:flex-row"><Button onClick={onRetry} type="button" variant="outline">Retry</Button><Button nativeButton={false} render={<Link href={`/w/${workspaceId}/listing`} />} variant="outline">Back to Listing</Button></div></section></main>;
}

export function ListingDetailSkeleton() {
  return (
    <main aria-label="Loading listing detail" className="mx-auto max-w-screen-2xl animate-pulse space-y-5 p-4 sm:p-6 lg:p-8" role="status">
      <div className="h-24 rounded-xl bg-muted" />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="order-1 h-52 rounded-xl bg-muted lg:order-2" />
        <div className="order-2 h-64 rounded-xl bg-muted lg:order-1" />
      </div>
      <div className="h-24 rounded-xl bg-muted" />
    </main>
  );
}
