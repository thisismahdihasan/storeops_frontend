"use client";

import Link from "next/link";
import { useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  Download,
  ExternalLink,
  FileSearch,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import type { AssignmentAvailabilityState } from "@/features/workspace/workspace-assignment-availability";
import { ApiError } from "@/lib/api";

import { ApprovedPreview } from "./approved-preview";
import { downloadListingAsset } from "./listing.api";
import { getListingStatusMeta } from "./listing.types";
import type { ListingQueueItem, ListingQueueResponse, ListingStatus } from "./listing.types";
import { useStartListing } from "./use-listing";

type ListingListProps = {
  availabilityState?: AssignmentAvailabilityState;
  data?: ListingQueueResponse["data"];
  hasSearch: boolean;
  isError: boolean;
  isLoading: boolean;
  onPageChange: (page: number) => void;
  onRetry: () => void;
  status: ListingStatus;
  workspaceId: string;
};

export function ListingList({
  availabilityState = "AVAILABLE",
  data,
  hasSearch,
  isError,
  isLoading,
  onPageChange,
  onRetry,
  status,
  workspaceId,
}: ListingListProps) {
  if (isLoading) return <ListingQueueSkeleton />;

  if (isError) {
    return (
      <section className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card p-6 text-center">
        <AlertCircle className="size-8 text-destructive" />
        <h2 className="mt-3 font-semibold">Unable to load listings</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Check your connection and try again.
        </p>
        <Button className="mt-4" onClick={onRetry} size="sm" type="button" variant="outline">
          Retry
        </Button>
      </section>
    );
  }

  if (!data || data.items.length === 0) {
    const title = hasSearch
      ? "No listings match your search"
      : status === "READY_FOR_LISTING"
        ? "No assigned listings"
        : "No listings in progress";
    const emptySubtitle = hasSearch
      ? "Try a different search."
      : availabilityState === "OFF"
        ? "Automatic assignments are currently turned off for your account."
        : availabilityState === "PAUSED"
          ? "Automatic assignments are currently paused for your account."
          : "New work will appear here automatically.";
    return (
      <section className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card p-6 text-center">
        <FileSearch className="size-9 text-muted-foreground" />
        <h2 className="mt-3 font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {emptySubtitle}
        </p>
      </section>
    );
  }

  return (
    <div className="space-y-4" id="listing-queue-results" role="tabpanel">
      <div className="grid gap-4 min-[640px]:grid-cols-2 min-[900px]:grid-cols-3 min-[1200px]:grid-cols-4">
        {data.items.map((item) => (
          <ListingCard item={item} key={item.assignmentId} workspaceId={workspaceId} />
        ))}
      </div>
      <Pagination
        onPageChange={onPageChange}
        pagination={data.pagination}
      />
    </div>
  );
}

function ListingCard({ item, workspaceId }: { item: ListingQueueItem; workspaceId: string }) {
  const { researchItem } = item;
  const title = researchItem.title?.trim() || null;
  const statusMeta = getListingStatusMeta(researchItem.status);
  const isReady = researchItem.status === "READY_FOR_LISTING";
  const detailActionLabel = isReady ? "Open" : "Continue";

  const [isLaunching, setIsLaunching] = useState(false);
  const startMutation = useStartListing(workspaceId, researchItem.id);

  const handleDownloadAndStart = async () => {
    if (isLaunching || startMutation.isPending) return;
    if (!item.finalAssetId) {
      toast.error("No final ZIP package available to download.");
      return;
    }

    setIsLaunching(true);
    try {
      await startMutation.mutateAsync();
      try {
        downloadListingAsset(workspaceId, item.finalAssetId);
        toast.success("Listing work started.");
      } catch {
        toast.error(
          "Listing started, but download failed to start. You can retry downloading.",
        );
      }
    } catch (error) {
      toast.error(actionErrorMessage(error, "Unable to start listing."));
    } finally {
      setIsLaunching(false);
    }
  };

  const handleDownloadZip = () => {
    if (isLaunching) return;
    if (!item.finalAssetId) {
      toast.error("No final ZIP package available to download.");
      return;
    }

    setIsLaunching(true);
    try {
      downloadListingAsset(workspaceId, item.finalAssetId);
      toast.success("Download started.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to download package.",
      );
    } finally {
      setTimeout(() => {
        setIsLaunching(false);
      }, 1000);
    }
  };

  return (
    <article className="@container min-w-0 overflow-hidden rounded-xl border border-border bg-card shadow-xs">
      <ApprovedPreview
        alt={
          title
            ? `${title} approved design`
            : `Etsy #${researchItem.etsyListingId} approved design`
        }
        className="!min-h-0 h-32 sm:h-40"
        preview={item.preview}
      />

      <div className="space-y-3.5 p-4 sm:p-4.5">
        <div className="space-y-2.5">
          <div className="flex min-w-0 items-center justify-between gap-2">
            <p className="min-w-0 font-mono text-xs text-muted-foreground">
              Etsy #{researchItem.etsyListingId}
            </p>
            <StatusBadge label={statusMeta.label} tone={statusMeta.tone} />
          </div>
          {title ? (
            <h2 className="break-words text-xs font-medium leading-snug">
              {title}
            </h2>
          ) : null}
        </div>

        <div className="grid grid-cols-2 items-center gap-1.5 pt-0.5 @[270px]:grid-cols-[1fr_auto_1fr]">
          <Button
            className="justify-self-start border-brand-accent/35 text-brand-accent hover:border-brand-accent/60 hover:bg-brand-accent/10 hover:text-brand-accent focus-visible:border-brand-accent focus-visible:ring-brand-accent/40 px-2"
            nativeButton={false}
            render={
              <a
                href={researchItem.originalUrl}
                rel="noopener noreferrer"
                target="_blank"
              />
            }
            size="sm"
            variant="outline"
          >
            <ExternalLink /> Etsy
          </Button>

          {isReady ? (
            <Button
              className="order-last col-span-2 justify-self-center px-2 @[270px]:order-none @[270px]:col-span-1"
              disabled={isLaunching || startMutation.isPending || !item.finalAssetId}
              onClick={() => void handleDownloadAndStart()}
              size="sm"
              type="button"
            >
              {isLaunching || startMutation.isPending ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Download />
              )}
              Download & Start
            </Button>
          ) : (
            <Button
              className="order-last col-span-2 justify-self-center px-2 @[270px]:order-none @[270px]:col-span-1"
              disabled={isLaunching || !item.finalAssetId}
              onClick={handleDownloadZip}
              size="sm"
              type="button"
            >
              {isLaunching ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Download />
              )}
              Download ZIP
            </Button>
          )}

          <Button
            className="justify-self-end px-2"
            nativeButton={false}
            render={<Link href={`/w/${workspaceId}/listing/${researchItem.id}`} />}
            size="sm"
            variant="outline"
          >
            {detailActionLabel} <ArrowRight />
          </Button>
        </div>
      </div>
    </article>
  );
}

function actionErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError && error.status === 409) {
    return `${error.message} Listing data has been refreshed.`;
  }
  return error instanceof Error ? error.message : fallback;
}

function Pagination({ onPageChange, pagination }: {
  onPageChange: (page: number) => void;
  pagination: ListingQueueResponse["data"]["pagination"];
}) {
  if (pagination.totalPages <= 1) return null;

  return (
    <nav aria-label="Listing queue pagination" className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-3">
      <Button disabled={pagination.page <= 1} onClick={() => onPageChange(pagination.page - 1)} size="sm" type="button" variant="outline">Previous</Button>
      <p className="text-sm text-muted-foreground">Page {pagination.page} of {pagination.totalPages}</p>
      <Button disabled={pagination.page >= pagination.totalPages} onClick={() => onPageChange(pagination.page + 1)} size="sm" type="button" variant="outline">Next</Button>
    </nav>
  );
}

export function ListingQueueSkeleton() {
  return (
    <div aria-label="Loading listings" className="grid gap-4 min-[640px]:grid-cols-2 min-[900px]:grid-cols-3 min-[1200px]:grid-cols-4" role="status">
      {[0, 1, 2, 3].map((item) => (
        <div className="overflow-hidden rounded-xl border border-border bg-card" key={item}>
          <div className="h-32 animate-pulse bg-muted sm:h-40" />
          <div className="space-y-3 p-4">
            <div className="h-4 w-24 animate-pulse rounded bg-muted" />
            <div className="h-5 w-3/4 animate-pulse rounded bg-muted" />
            <div className="h-8 w-32 animate-pulse rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}
