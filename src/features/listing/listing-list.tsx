"use client";

import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  CalendarDays,
  Clock3,
  FileSearch,
  Files,
  User,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { AuthenticatedReferenceImage } from "@/features/research/authenticated-reference-image";

import { ApprovedPreview } from "./approved-preview";
import {
  formatListingDate,
  getListingStatusMeta,
} from "./listing.types";
import type { ListingQueueItem, ListingQueueResponse, ListingStatus } from "./listing.types";

type ListingListProps = {
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
    return (
      <section className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card p-6 text-center">
        <FileSearch className="size-9 text-muted-foreground" />
        <h2 className="mt-3 font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {hasSearch ? "Try a different search." : "New work will appear here automatically."}
        </p>
      </section>
    );
  }

  return (
    <div className="space-y-4" id="listing-queue-results" role="tabpanel">
      <div className="grid gap-4 lg:grid-cols-2">
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

  return (
    <article className="min-w-0 overflow-hidden rounded-xl border border-border bg-card shadow-xs">
      <div className="grid grid-cols-2 border-b border-border">
        <figure className="min-w-0 border-r border-border">
          <figcaption className="border-b border-border px-3 py-2 text-xs font-medium text-muted-foreground">
            Original reference
          </figcaption>
          <AuthenticatedReferenceImage
            alt={`${title} original reference`}
            className="max-h-48 rounded-none"
            containerClassName="h-40 bg-muted/20 p-2 sm:h-48"
            hasImage={researchItem.hasReferenceImage}
            minHeightClassName="min-h-40 sm:min-h-48"
            researchItemId={researchItem.id}
            workspaceId={workspaceId}
          />
        </figure>
        <figure className="min-w-0">
          <figcaption className="border-b border-border px-3 py-2 text-xs font-medium text-muted-foreground">
            Approved design
          </figcaption>
          <ApprovedPreview
            alt={`${title} approved design`}
            className="h-40 sm:h-48"
            preview={item.preview}
          />
        </figure>
      </div>

      <div className="space-y-4 p-4">
        <div className="flex min-w-0 items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-mono text-xs text-muted-foreground">
              Etsy #{researchItem.etsyListingId}
            </p>
            <h2 className="mt-1 break-words font-semibold leading-snug">{title}</h2>
          </div>
          <StatusBadge label={statusMeta.label} tone={statusMeta.tone} />
        </div>

        <dl className="grid gap-x-4 gap-y-3 text-sm sm:grid-cols-2">
          <QueueDetail icon={<User className="size-3.5" />} label="Created by" value={researchItem.createdBy.name || researchItem.createdBy.email} />
          <QueueDetail icon={<CalendarDays className="size-3.5" />} label="Assigned" value={formatListingDate(item.assignedAt)} />
          {item.startedAt ? <QueueDetail icon={<Clock3 className="size-3.5" />} label="Started" value={formatListingDate(item.startedAt)} /> : null}
          <QueueDetail icon={<Files className="size-3.5" />} label="Final assets" value={`${item.finalAssets.length} file${item.finalAssets.length === 1 ? "" : "s"}`} />
          {item.preview ? <QueueDetail label="Approved review" value={`Round ${item.preview.roundNumber} · ${formatListingDate(item.preview.approvedAt)}`} /> : null}
        </dl>

        <Button
          className="w-full sm:w-auto"
          nativeButton={false}
          render={<Link href={`/w/${workspaceId}/listing/${researchItem.id}`} />}
        >
          Open Listing <ArrowRight />
        </Button>
      </div>
    </article>
  );
}

function QueueDetail({ icon, label, value }: { icon?: React.ReactNode; label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="flex items-center gap-1 text-xs font-medium text-muted-foreground">{icon}{label}</dt>
      <dd className="mt-1 break-words font-medium">{value}</dd>
    </div>
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
    <div aria-label="Loading listings" className="grid gap-4 lg:grid-cols-2" role="status">
      {[0, 1, 2, 3].map((item) => (
        <div className="overflow-hidden rounded-xl border border-border bg-card" key={item}>
          <div className="grid grid-cols-2 gap-px bg-border">
            <div className="h-44 animate-pulse bg-muted" />
            <div className="h-44 animate-pulse bg-muted" />
          </div>
          <div className="space-y-3 p-4">
            <div className="h-4 w-24 animate-pulse rounded bg-muted" />
            <div className="h-5 w-3/4 animate-pulse rounded bg-muted" />
            <div className="h-16 animate-pulse rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}
