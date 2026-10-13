"use client";

import { useState } from "react";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatStatusLabel, getStatusTone } from "./research-status";
import { useReferenceUsageHistory } from "./use-research";

type ReferenceUsageHistoryModalProps = {
  etsyListingId: string | null;
  onClose: () => void;
  onOpenItemDetail: (researchItemId: string) => void;
  open: boolean;
  workspaceId: string;
};

const HISTORY_LIMIT = 10;

export function ReferenceUsageHistoryModal({
  etsyListingId,
  onClose,
  onOpenItemDetail,
  open,
  workspaceId,
}: ReferenceUsageHistoryModalProps) {
  const [page, setPage] = useState(1);
  const historyQuery = useReferenceUsageHistory(
    workspaceId,
    etsyListingId ?? "",
    { limit: HISTORY_LIMIT, page },
    open && Boolean(etsyListingId),
  );
  const history = historyQuery.data?.data;
  const pagination = history?.pagination;
  const errorMessage =
    historyQuery.error instanceof Error
      ? historyQuery.error.message
      : "Unable to load reference history. Please try again.";

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="max-h-[85vh] w-[calc(100vw-2rem)] overflow-y-auto p-6 sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Reference Usage History</DialogTitle>
          <DialogDescription>
            All research items in this workspace referencing Etsy listing #{etsyListingId}.
          </DialogDescription>
          {pagination && (
            <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
              Used {pagination.total} times in this workspace
            </p>
          )}
        </DialogHeader>

        {historyQuery.isLoading ? (
          <div className="flex min-h-40 flex-col items-center justify-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="size-5 animate-spin text-primary" />
            <span>Loading reference history...</span>
          </div>
        ) : historyQuery.isError ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-xs text-destructive">
            <div className="flex items-center gap-2 font-medium">
              <AlertCircle className="size-4" />
              <span>Failed to load reference history</span>
            </div>
            <p className="mt-2 text-destructive/90">{errorMessage}</p>
            <Button
              className="mt-3 gap-1"
              onClick={() => void historyQuery.refetch()}
              size="xs"
              variant="outline"
            >
              <RefreshCw className="size-3" />
              Retry
            </Button>
          </div>
        ) : history && history.items.length === 0 ? (
          <p className="py-8 text-center text-xs text-muted-foreground">
            No previous occurrences found for this reference.
          </p>
        ) : history ? (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/30 font-medium text-muted-foreground">
                  <th className="w-10 px-3 py-3 text-center" scope="col">#</th>
                  <th className="px-3 py-3" scope="col">Added By</th>
                  <th className="px-3 py-3" scope="col">Date Added</th>
                  <th className="px-3 py-3" scope="col">Status</th>
                  <th className="px-3 py-3" scope="col">Product / Use</th>
                  <th className="px-3 py-3 text-right" scope="col">View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {history.items.map((item, index) => (
                  <tr className="hover:bg-muted/20" key={item.id}>
                    <td className="px-3 py-3 text-center font-mono tabular-nums text-muted-foreground">
                      {(page - 1) * HISTORY_LIMIT + index + 1}
                    </td>
                    <td className="px-3 py-3 font-medium text-foreground">
                      {item.createdBy.name || "Unnamed Researcher"}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-muted-foreground">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">
                      <StatusBadge
                        label={formatStatusLabel(item.status)}
                        tone={getStatusTone(item.status)}
                      />
                    </td>
                    <td className="max-w-40 px-3 py-3 text-muted-foreground">
                      <span className="line-clamp-2">{item.targetProduct || "—"}</span>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <Button
                        onClick={() => {
                          onClose();
                          onOpenItemDetail(item.id);
                        }}
                        size="xs"
                        variant="outline"
                      >
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        <DialogFooter>
          {pagination && pagination.totalPages > 1 && (
            <div className="flex w-full items-center justify-end gap-2 text-xs text-muted-foreground">
              <Button
                disabled={page <= 1}
                onClick={() => setPage((currentPage) => currentPage - 1)}
                size="xs"
                variant="outline"
              >
                <ChevronLeft className="size-3.5" />
                Previous
              </Button>
              <span className="px-2 font-medium text-foreground">
                Page {page} of {pagination.totalPages}
              </span>
              <Button
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((currentPage) => currentPage + 1)}
                size="xs"
                variant="outline"
              >
                Next
                <ChevronRight className="size-3.5" />
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
