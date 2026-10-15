"use client";

import { AlertCircle, Copy } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { BackLink } from "@/components/ui/back-link";
import { StatusBadge } from "@/components/ui/status-badge";
import { useWorkspaces } from "@/features/workspace/use-workspaces";
import { ApiError } from "@/lib/api";
import { getValidWorkspaceReturnTo } from "@/lib/navigation/return-to";

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
  const searchParams = useSearchParams();
  const requestedReturnTo = getValidWorkspaceReturnTo(
    searchParams.get("returnTo"),
    workspaceId,
  );
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
        returnTo={requestedReturnTo ?? `/w/${workspaceId}/listing`}
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
        returnTo={requestedReturnTo ?? `/w/${workspaceId}/listing`}
      />
    );
  }

  if (!detailQuery.data) return <ListingDetailSkeleton />;

  const detail = detailQuery.data.data;
  const storedTitle = detail.researchItem.title;
  const title = storedTitle || `Etsy Listing #${detail.researchItem.etsyListingId}`;
  const statusMeta = getListingStatusMeta(detail.researchItem.status);
  const returnTo =
    requestedReturnTo ??
    listingFallback(workspaceId, detail.researchItem.status);

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
      router.push(returnTo);
    } catch (error) {
      toast.error(actionErrorMessage(error, "Unable to mark this listing as listed."));
      if (error instanceof ApiError && error.status === 409) {
        void detailQuery.refetch();
      }
    }
  };

  const handleCopyTitle = async () => {
    if (!storedTitle) return;

    try {
      await navigator.clipboard.writeText(storedTitle);
      toast.success("Listing title copied");
    } catch {
      toast.error("Could not copy listing title");
    }
  };

  return (
    <main className="mx-auto max-w-screen-2xl space-y-5 p-4 sm:p-6 lg:p-8">
      <header className="space-y-4 border-b border-border pb-5">
        <BackLink href={returnTo}>Back</BackLink>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="font-mono text-xs text-muted-foreground">
              Etsy #{detail.researchItem.etsyListingId}
            </p>
            <div className="mt-1 flex min-w-0 items-start gap-2">
              <h1 className="min-w-0 w-full max-w-3xl flex-1 break-words text-lg font-bold tracking-tight sm:text-xl">
                {storedTitle ? (
                  <button
                    className="block cursor-copy text-left"
                    onClick={() => void handleCopyTitle()}
                    title="Click to copy title"
                    type="button"
                  >
                    {title}
                  </button>
                ) : (
                  title
                )}
              </h1>
              {storedTitle && (
                <Button
                  aria-label="Copy listing title"
                  className="shrink-0"
                  onClick={() => void handleCopyTitle()}
                  size="icon-sm"
                  title="Copy listing title"
                  type="button"
                  variant="outline"
                >
                  <Copy className="size-3.5" />
                </Button>
              )}
            </div>
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

function ListingDetailError({ error, onRetry, returnTo }: { error: unknown; onRetry: () => void; returnTo: string }) {
  const status = error instanceof ApiError ? error.status : 0;
  const title = status === 404 ? "Listing not found" : status === 401 ? "Your session has expired" : status === 409 ? "Listing is no longer active" : "Unable to load listing";
  const message = status === 409 ? "This listing may have moved out of the active workflow." : error instanceof Error ? error.message : "Check your connection and try again.";
  return <main className="mx-auto max-w-lg p-4 sm:p-6"><section className="rounded-xl border border-border bg-card p-6 text-center"><AlertCircle className="mx-auto size-8 text-destructive" /><h1 className="mt-3 text-xl font-semibold">{title}</h1><p className="mt-2 text-sm text-muted-foreground">{message}</p><div className="mt-4 flex flex-col justify-center gap-2 sm:flex-row"><Button onClick={onRetry} type="button" variant="outline">Retry</Button><Button nativeButton={false} render={<Link href={returnTo} />} variant="outline">Back to Listing</Button></div></section></main>;
}

function listingFallback(workspaceId: string, status: string): string {
  return status === "LISTING_IN_PROGRESS"
    ? `/w/${workspaceId}/listing?status=LISTING_IN_PROGRESS`
    : `/w/${workspaceId}/listing`;
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
