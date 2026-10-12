"use client";

import { useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  ExternalLink,
  FileSearch,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { etsyExternalInlineClass } from "@/lib/etsy-styles";
import { cn } from "@/lib/utils";
import { DesignPreviewLightbox } from "@/features/design-workspace/design-preview-lightbox";
import { AuthenticatedReferenceImage } from "@/features/research/authenticated-reference-image";
import type { DesignerHistoryResponse } from "@/features/role-activity/role-activity.types";

type Props = {
  data?: DesignerHistoryResponse["data"];
  isError: boolean;
  isLoading: boolean;
  onPageChange: (page: number) => void;
  onReset: () => void;
  onRetry: () => void;
  workspaceId: string;
};

export function DesignerCompletedList({
  data,
  isError,
  isLoading,
  onPageChange,
  onReset,
  onRetry,
  workspaceId,
}: Props) {
  const [preview, setPreview] = useState<{ title: string; url: string } | null>(
    null
  );

  if (isLoading) {
    return (
      <div className="grid gap-3">
        {[0, 1, 2].map((item) => (
          <div className="h-28 animate-pulse rounded-xl border bg-muted" key={item} />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <section className="rounded-xl border border-dashed p-6 text-center">
        <AlertCircle className="mx-auto size-7 text-destructive" />
        <p className="mt-2 text-sm">Unable to load completed designs.</p>
        <Button className="mt-3" onClick={onRetry} size="sm" type="button" variant="outline">
          Retry
        </Button>
      </section>
    );
  }

  if (!data || !data.items.length) {
    return (
      <section className="rounded-xl border border-dashed p-6 text-center">
        <FileSearch className="mx-auto size-8 text-muted-foreground" />
        <h2 className="mt-2 font-medium">No completed designs found for this time period.</h2>
        <Button className="mt-3" onClick={onReset} size="sm" type="button" variant="outline">
          Reset filters
        </Button>
      </section>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {data.items.map((item) => {
          const fileName = item.researchItem.finalAssets[0]?.fileName;
          const listingTitle = item.researchItem.title ?? "Untitled listing";
          const referenceAlt = `${item.researchItem.title ?? `Etsy listing ${item.researchItem.etsyListingId}`} reference`;

          return (
            <article className="flex gap-3 rounded-xl border bg-card p-3" key={item.id}>
              <div className="size-20 shrink-0 overflow-hidden rounded-md border">
                <AuthenticatedReferenceImage
                  alt={referenceAlt}
                  className="size-full object-cover"
                  containerClassName="min-h-0 size-full p-0"
                  hasImage={Boolean(item.researchItem.referenceImageUrl)}
                  onOpenImage={(url) => setPreview({ url, title: listingTitle })}
                  researchItemId={item.researchItem.id}
                  version={item.completedAt}
                  workspaceId={workspaceId}
                />
              </div>
              <div className="flex min-w-0 flex-1 flex-col justify-between gap-3 sm:flex-row sm:items-start">
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-xs text-muted-foreground">
                    Etsy #{item.researchItem.etsyListingId}
                  </p>
                  <h2 className="mt-1 break-words text-sm font-medium">{listingTitle}</h2>
                  <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                    <CalendarDays className="size-3.5" />
                    Completed{" "}
                    {new Intl.DateTimeFormat(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(new Date(item.completedAt))}
                  </p>
                  <a
                    className={cn("mt-2 inline-flex items-center gap-1 text-xs", etsyExternalInlineClass)}
                    href={item.researchItem.normalizedUrl}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    Original Etsy <ExternalLink className="size-3" />
                  </a>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2 text-right">
                  <StatusBadge
                    label={item.researchItem.status.replaceAll("_", " ")}
                    tone="neutral"
                  />
                  {fileName ? (
                    <div className="min-w-0 text-right">
                      <p className="text-[11px] text-muted-foreground">Uploaded file</p>
                      <p
                        className="max-w-[240px] truncate font-mono text-sm font-semibold text-foreground sm:max-w-[260px]"
                        title={fileName}
                      >
                        {fileName}
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>
            </article>
          );
        })}
        <HistoryPagination onPageChange={onPageChange} pagination={data.pagination} />
      </div>
      <DesignPreviewLightbox
        imageUrl={preview?.url ?? null}
        onOpenChange={(open) => !open && setPreview(null)}
        open={Boolean(preview)}
        title={preview?.title ?? "Reference image"}
      />
    </>
  );
}

function HistoryPagination({
  onPageChange,
  pagination,
}: {
  onPageChange: (page: number) => void;
  pagination: DesignerHistoryResponse["data"]["pagination"];
}) {
  if (pagination.totalPages <= 1) return null;

  return (
    <nav aria-label="Completed designs pagination" className="flex items-center justify-between rounded-xl border bg-card p-3">
      <Button
        disabled={pagination.page <= 1}
        onClick={() => onPageChange(pagination.page - 1)}
        size="sm"
        type="button"
        variant="outline"
      >
        Previous
      </Button>
      <span className="text-xs text-muted-foreground">
        Page {pagination.page} of {pagination.totalPages}
      </span>
      <Button
        disabled={pagination.page >= pagination.totalPages}
        onClick={() => onPageChange(pagination.page + 1)}
        size="sm"
        type="button"
        variant="outline"
      >
        Next
      </Button>
    </nav>
  );
}
