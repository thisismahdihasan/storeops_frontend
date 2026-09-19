"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api";
import { formatFileSize } from "@/lib/format-file-size";

import { StorageBulkDeleteDialog } from "./storage-bulk-delete-dialog";
import { StorageCleanupFilters } from "./storage-cleanup-filters";
import { StorageCleanupTable } from "./storage-cleanup-table";
import { StorageDeleteDialog } from "./storage-delete-dialog";
import type {
  BulkFinalAssetCleanupFailure,
  StorageCleanupCandidate,
  StorageCleanupFilter,
} from "./storage-cleanup.types";
import { useStorageCandidates } from "./use-storage-candidates";
import { useStorageMetrics } from "./use-storage-metrics";
import {
  useBulkDeleteFinalAssets,
  useDeleteFinalAsset,
} from "./use-storage-mutations";

type StorageCleanupViewProps = {
  workspaceId: string;
};

export function StorageCleanupView({ workspaceId }: StorageCleanupViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // URL Query Parameters
  const pageParam = searchParams.get("page");
  const filterParam = searchParams.get("filter");
  const searchParam = searchParams.get("search") ?? "";

  const currentPage =
    pageParam && !Number.isNaN(Number(pageParam)) && Number(pageParam) > 0
      ? Number(pageParam)
      : 1;

  const currentFilter: StorageCleanupFilter =
    filterParam === "CLEANED" || filterParam === "ALL"
      ? filterParam
      : "ELIGIBLE";

  // Data Queries
  const metricsQuery = useStorageMetrics(workspaceId);
  const candidatesQuery = useStorageCandidates(workspaceId, {
    filter: currentFilter,
    limit: 20,
    page: currentPage,
    search: searchParam,
  });

  // Mutations
  const deleteMutation = useDeleteFinalAsset(workspaceId);
  const bulkDeleteMutation = useBulkDeleteFinalAssets(workspaceId);

  // Local State
  const [candidateToDelete, setCandidateToDelete] =
    useState<StorageCleanupCandidate | null>(null);
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
  const [bulkFailures, setBulkFailures] = useState<
    BulkFinalAssetCleanupFailure[] | null
  >(null);

  // Selection state
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<string[]>([]);
  const [prevScopeKey, setPrevScopeKey] = useState("");

  const currentScopeKey = `${workspaceId}:${searchParams.toString()}`;
  if (currentScopeKey !== prevScopeKey) {
    setPrevScopeKey(currentScopeKey);
    setSelectedCandidateIds([]);
  }

  const candidateItems = candidatesQuery.data?.data.items;
  const items = useMemo(() => candidateItems ?? [], [candidateItems]);
  const pagination = candidatesQuery.data?.data.pagination;

  // Reconciled selected candidates
  const selectedCandidates = useMemo(() => {
    const selectedIdSet = new Set(selectedCandidateIds);
    return items.filter(
      (item) => selectedIdSet.has(item.finalAssetId) && item.storageDeletedAt === null,
    );
  }, [items, selectedCandidateIds]);

  const totalSelectedSizeFormatted = useMemo(() => {
    let totalBytes = BigInt(0);
    for (const item of selectedCandidates) {
      try {
        totalBytes += BigInt(item.fileSize);
      } catch {
        // ignore invalid
      }
    }
    return formatFileSize(totalBytes.toString());
  }, [selectedCandidates]);

  // URL Navigation Handlers
  const handleFilterChange = (newFilter: StorageCleanupFilter) => {
    const params = new URLSearchParams(searchParams.toString());
    if (newFilter !== "ELIGIBLE") {
      params.set("filter", newFilter);
    } else {
      params.delete("filter");
    }
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleSearchChange = (newSearch: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (newSearch) {
      params.set("search", newSearch);
    } else {
      params.delete("search");
    }
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  };

  const handlePageChange = useCallback(
    (newPage: number) => {
      const params = new URLSearchParams(searchParams.toString());
      if (newPage > 1) {
        params.set("page", String(newPage));
      } else {
        params.delete("page");
      }
      router.push(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams],
  );

  // Selection Handlers
  const handleToggleCandidateSelection = (finalAssetId: string) => {
    setSelectedCandidateIds((prev) => {
      if (prev.includes(finalAssetId)) {
        return prev.filter((id) => id !== finalAssetId);
      }
      if (prev.length >= 100) {
        toast.error("Cannot select more than 100 items at once.");
        return prev;
      }
      return [...prev, finalAssetId];
    });
  };

  const handleToggleAllEligibleOnPage = () => {
    const eligibleIdsOnPage = items
      .filter((item) => item.storageDeletedAt === null)
      .map((item) => item.finalAssetId);

    const areAllSelected =
      eligibleIdsOnPage.length > 0 &&
      eligibleIdsOnPage.every((id) => selectedCandidateIds.includes(id));

    if (areAllSelected) {
      setSelectedCandidateIds((prev) =>
        prev.filter((id) => !eligibleIdsOnPage.includes(id)),
      );
    } else {
      const combined = Array.from(
        new Set([...selectedCandidateIds, ...eligibleIdsOnPage]),
      ).slice(0, 100);
      setSelectedCandidateIds(combined);
    }
  };

  // Single Deletion Execution
  const handleConfirmSingleDelete = async () => {
    if (!candidateToDelete) return;

    try {
      const response = await deleteMutation.mutateAsync(
        candidateToDelete.finalAssetId,
      );
      const result = response.data;

      if (result.status === "CLEANED") {
        toast.success(
          `Final ZIP permanently deleted · reclaimed ${formatFileSize(result.reclaimedBytes)}.`,
        );
      } else {
        toast.info("Final ZIP had already been cleaned up.");
      }

      setSelectedCandidateIds((prev) =>
        prev.filter((id) => id !== candidateToDelete.finalAssetId),
      );
      setCandidateToDelete(null);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete Final ZIP package.",
      );
    }
  };

  // Bulk Deletion Execution
  const handleConfirmBulkDelete = async () => {
    if (selectedCandidates.length === 0) return;
    const idsToDelete = selectedCandidates.map((c) => c.finalAssetId);

    try {
      const response = await bulkDeleteMutation.mutateAsync(idsToDelete);
      const result = response.data;

      if (result.failedCount === 0) {
        if (result.cleanedCount > 0) {
          const alreadyCleanedNote =
            result.alreadyCleanedCount > 0
              ? ` (${result.alreadyCleanedCount} already cleaned)`
              : "";
          toast.success(
            `Removed ${result.cleanedCount} ZIP package${result.cleanedCount === 1 ? "" : "s"} · reclaimed ${formatFileSize(result.reclaimedBytes)}${alreadyCleanedNote}.`,
          );
        } else if (result.alreadyCleanedCount > 0) {
          toast.info("Selected packages had already been cleaned up.");
        } else {
          toast.info("No packages were removed.");
        }
        setSelectedCandidateIds([]);
        setBulkFailures(null);
        setIsBulkDialogOpen(false);
      } else {
        const alreadyCleanedNote =
          result.alreadyCleanedCount > 0
            ? ` (${result.alreadyCleanedCount} already cleaned)`
            : "";
        toast.warning(
          `Removed ${result.cleanedCount} package${result.cleanedCount === 1 ? "" : "s"} · reclaimed ${formatFileSize(result.reclaimedBytes)}${alreadyCleanedNote}. ${result.failedCount} could not be removed.`,
        );
        setBulkFailures(result.failed);
        const failedIdSet = new Set(result.failed.map((f) => f.finalAssetId));
        setSelectedCandidateIds((prev) => prev.filter((id) => failedIdSet.has(id)));
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to process bulk deletion.",
      );
    }
  };

  // Auto-recover if current page is out of bounds after deletion
  useEffect(() => {
    if (
      pagination &&
      pagination.total > 0 &&
      pagination.totalPages > 0 &&
      currentPage > pagination.totalPages
    ) {
      handlePageChange(pagination.totalPages);
    }
  }, [pagination, currentPage, handlePageChange]);


  const isPermissionDenied =
    candidatesQuery.error instanceof ApiError &&
    candidatesQuery.error.status === 403;

  const metrics = metricsQuery.data?.data;

  return (
    <main className="mx-auto max-w-screen-2xl space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header with back link */}
      <div className="flex flex-col gap-2 border-b border-border pb-5">
        <div>
          <Button
            className="gap-1.5 text-muted-foreground hover:text-foreground"
            nativeButton={false}
            render={<Link href={`/w/${workspaceId}/settings`} />}
            size="xs"
            variant="ghost"
          >
            <ArrowLeft className="size-3.5" />
            <span>Back to Workspace Settings</span>
          </Button>
        </div>
        <h1 className="mt-1 text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          Storage Management
        </h1>
        <p className="text-sm text-muted-foreground">
          Review and permanently remove production ZIP packages for listed items to reclaim managed storage.
        </p>
      </div>

      {/* Metrics Summary Cards */}
      <section aria-label="Storage Metrics Summary">
        {metricsQuery.isLoading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                className="rounded-lg border border-border/70 bg-card p-3 shadow-2xs"
                key={`metric-skel-${i}`}
              >
                <div className="h-3 w-24 animate-pulse rounded bg-muted" />
                <div className="mt-2 h-4 w-16 animate-pulse rounded bg-muted" />
              </div>
            ))}
          </div>
        ) : metricsQuery.isError ? (
          <div className="rounded-lg border border-border/50 bg-muted/10 p-3 text-xs text-muted-foreground">
            Storage metrics temporarily unavailable.
          </div>
        ) : metrics ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-border/70 bg-card p-3 shadow-2xs">
              <p className="text-xs font-medium text-muted-foreground">
                Active Packages
              </p>
              <p className="mt-1 text-sm font-semibold text-foreground">
                {metrics.active.count}{" "}
                <span className="text-xs font-normal text-muted-foreground">
                  ({formatFileSize(metrics.active.bytes)})
                </span>
              </p>
            </div>

            <div className="rounded-lg border border-border/70 bg-card p-3 shadow-2xs">
              <p className="text-xs font-medium text-muted-foreground">
                Reclaimable Listed ZIPs
              </p>
              <p className="mt-1 text-sm font-semibold text-foreground">
                {metrics.reclaimable.count}{" "}
                <span className="text-xs font-normal text-muted-foreground">
                  ({formatFileSize(metrics.reclaimable.bytes)})
                </span>
              </p>
            </div>

            <div className="rounded-lg border border-border/70 bg-card p-3 shadow-2xs">
              <p className="text-xs font-medium text-muted-foreground">
                Cleaned Up to Date
              </p>
              <p className="mt-1 text-sm font-semibold text-foreground">
                {metrics.cleaned.count}{" "}
                <span className="text-xs font-normal text-muted-foreground">
                  ({formatFileSize(metrics.cleaned.bytes)})
                </span>
              </p>
            </div>
          </div>
        ) : null}
      </section>

      {/* Toolbar: Filters & Count */}
      <StorageCleanupFilters
        filter={currentFilter}
        onFilterChange={handleFilterChange}
        onSearchChange={handleSearchChange}
        search={searchParam}
        totalCount={pagination?.total}
      />

      {/* Candidate Table */}
      <StorageCleanupTable
        errorMessage={
          candidatesQuery.error instanceof Error
            ? candidatesQuery.error.message
            : undefined
        }
        filter={currentFilter}
        hasSearch={searchParam.trim().length > 0}
        isError={candidatesQuery.isError}
        isLoading={candidatesQuery.isLoading}
        isPermissionDenied={isPermissionDenied}
        items={items}
        onDeleteCandidate={(candidate) => setCandidateToDelete(candidate)}
        onPageChange={handlePageChange}
        onRetry={() => void candidatesQuery.refetch()}
        onToggleAllEligibleOnPage={handleToggleAllEligibleOnPage}
        onToggleCandidateSelection={handleToggleCandidateSelection}
        pagination={pagination}
        selectedFinalAssetIds={selectedCandidateIds}
      />

      {/* Sticky Bulk Action Bar */}
      {selectedCandidates.length > 0 && (
        <div className="sticky bottom-4 z-20 flex flex-col sm:flex-row items-center justify-between gap-3 rounded-xl border border-border bg-card/95 backdrop-blur-xs p-4 shadow-lg">
          <div className="flex items-center gap-3">
            <p className="text-sm font-medium text-foreground">
              Selected: <span className="font-semibold">{selectedCandidates.length}</span>{" "}
              {selectedCandidates.length === 1 ? "package" : "packages"}
            </p>
            <span className="text-muted-foreground text-xs">·</span>
            <p className="text-xs text-muted-foreground">
              Total size:{" "}
              <span className="font-medium text-foreground">
                {totalSelectedSizeFormatted}
              </span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setSelectedCandidateIds([])}
              size="xs"
              type="button"
              variant="outline"
            >
              Clear
            </Button>
            <Button
              onClick={() => setIsBulkDialogOpen(true)}
              size="xs"
              type="button"
              variant="destructive"
            >
              Delete Selected ZIPs
            </Button>
          </div>
        </div>
      )}

      {/* Single Delete Confirmation Dialog */}
      <StorageDeleteDialog
        candidate={candidateToDelete}
        isDeleting={deleteMutation.isPending}
        onConfirm={handleConfirmSingleDelete}
        onOpenChange={(open) => !open && setCandidateToDelete(null)}
        open={Boolean(candidateToDelete)}
      />

      {/* Bulk Delete Confirmation Dialog */}
      <StorageBulkDeleteDialog
        failures={bulkFailures}
        isDeleting={bulkDeleteMutation.isPending}
        onClearFailures={() => {
          setBulkFailures(null);
          setSelectedCandidateIds([]);
        }}
        onConfirm={handleConfirmBulkDelete}
        onOpenChange={setIsBulkDialogOpen}
        open={isBulkDialogOpen}
        selectedCandidates={selectedCandidates}
      />
    </main>
  );
}
