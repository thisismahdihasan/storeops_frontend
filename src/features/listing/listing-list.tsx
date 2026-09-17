"use client";

import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  ExternalLink,
  FileSearch,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import type { AssignmentAvailabilityState } from "@/features/workspace/workspace-assignment-availability";

import { ApprovedPreview } from "./approved-preview";
import { getListingStatusMeta } from "./listing.types";
import type { ListingQueueItem, ListingQueueResponse, ListingStatus } from "./listing.types";

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
  const title = researchItem.title || `Etsy Listing #${researchItem.etsyListingId}`;
  const statusMeta = getListingStatusMeta(researchItem.status);
  const detailActionLabel =
    researchItem.status === "READY_FOR_LISTING" ? "Open" : "Continue";

  return (
    <article className="min-w-0 overflow-hidden rounded-xl border border-border bg-card shadow-xs">
      <ApprovedPreview
        alt={`${title} approved design`}
        className="!min-h-0 h-32 sm:h-40"
        preview={item.preview}
      />

      <div className="space-y-3 p-4">
        <div className="space-y-2.5">
          <div className="flex min-w-0 items-center justify-between gap-2">
            <p className="min-w-0 font-mono text-xs text-muted-foreground">
              Etsy #{researchItem.etsyListingId}
            </p>
          <StatusBadge label={statusMeta.label} tone={statusMeta.tone} />
          </div>
          <h2 className="break-words text-xs font-medium leading-snug">{title}</h2>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <Button
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
            <ExternalLink /> View Etsy
          </Button>
          <Button
            nativeButton={false}
            render={<Link href={`/w/${workspaceId}/listing/${researchItem.id}`} />}
            size="sm"
          >
            {detailActionLabel} <ArrowRight />
          </Button>
        </div>
      </div>
    </article>
  );
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
