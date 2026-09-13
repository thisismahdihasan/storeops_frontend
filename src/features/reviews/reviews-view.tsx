"use client";

import {
  AlertCircle,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Inbox,
  ShieldAlert,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { useWorkspaces } from "@/features/workspace/use-workspaces";

import { ReviewList } from "./review-list";
import { useReviewQueue } from "./use-reviews";

type ReviewsViewProps = {
  workspaceId: string;
};

const DEFAULT_PAGE_LIMIT = 20;

function parsePage(value: string | null): number {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

function AccessDenied() {
  return (
    <main className="mx-auto max-w-lg p-6">
      <section
        className="rounded-2xl border border-destructive/20 bg-card p-8 text-center shadow-xs"
        role="alert"
      >
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <ShieldAlert className="size-6" />
        </div>
        <h1 className="mt-4 text-xl font-semibold text-foreground">
          Admin access required
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Only workspace Admins can access and manage the design review queue.
        </p>
      </section>
    </main>
  );
}

function RequestError({ onRetry }: { onRetry: () => void }) {
  return (
    <section
      className="rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center"
      role="alert"
    >
      <AlertCircle className="mx-auto size-8 text-destructive" />
      <h2 className="mt-3 text-base font-semibold text-foreground">
        Unable to load review queue
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        There was a problem retrieving review submissions. Please try again.
      </p>
      <Button className="mt-4" onClick={onRetry} type="button" variant="outline">
        Try again
      </Button>
    </section>
  );
}

function LoadingSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          className="h-72 animate-pulse rounded-2xl border border-border bg-muted/20"
          key={i}
        />
      ))}
    </div>
  );
}

export function ReviewsView({ workspaceId }: ReviewsViewProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const workspacesQuery = useWorkspaces();
  const activeWorkspace = workspacesQuery.data?.data.workspaces.find(
    (w) => w.id === workspaceId,
  );
  const isAdmin =
    activeWorkspace?.membership.roles.includes("ADMIN") ?? false;

  const page = parsePage(searchParams.get("page"));
  const queueQuery = useReviewQueue(
    workspaceId,
    page,
    DEFAULT_PAGE_LIMIT,
    isAdmin,
  );

  function handlePageChange(newPage: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (newPage <= 1) {
      params.delete("page");
    } else {
      params.set("page", String(newPage));
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  if (workspacesQuery.isLoading) {
    return (
      <div className="mx-auto max-w-screen-2xl space-y-6 p-4 sm:p-6 lg:p-8">
        <div className="h-8 w-48 animate-pulse rounded-md bg-muted" />
        <LoadingSkeleton />
      </div>
    );
  }

  if (!isAdmin) {
    return <AccessDenied />;
  }

  const queueData = queueQuery.data?.data;
  const items = queueData?.items ?? [];
  const pagination = queueData?.pagination;
  const totalPages = pagination?.totalPages ?? 0;
  const totalItems = pagination?.total ?? 0;

  return (
    <div className="mx-auto max-w-screen-2xl space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Queue Header */}
      <header className="flex flex-col gap-2 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            Quality Assurance
          </p>
          <h1 className="mt-1 flex items-center gap-2.5 text-2xl font-bold tracking-tight sm:text-3xl text-foreground">
            <CheckSquare className="size-7 text-primary" />
            Design Reviews
            {totalItems > 0 && (
              <span className="ml-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                {totalItems}
              </span>
            )}
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Evaluate submitted designer artwork, provide point annotations, and
            either approve designs or request revisions.
          </p>
        </div>
      </header>

      {/* Main Content Area */}
      {queueQuery.isLoading ? (
        <LoadingSkeleton />
      ) : queueQuery.isError ? (
        <RequestError onRetry={() => void queueQuery.refetch()} />
      ) : items.length === 0 ? (
        <section
          className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card p-8 text-center"
          role="status"
        >
          <div className="flex size-14 items-center justify-center rounded-full bg-muted/60 text-muted-foreground">
            <Inbox className="size-7 stroke-[1.5]" />
          </div>
          <h2 className="mt-4 text-base font-semibold text-foreground">
            No reviews waiting.
          </h2>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Submitted design reviews will appear here when Admin action is
            required.
          </p>
        </section>
      ) : (
        <div className="space-y-6">
          <ReviewList items={items} workspaceId={workspaceId} />

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border pt-4">
              <p className="text-xs text-muted-foreground">
                Page <span className="font-medium text-foreground">{page}</span> of{" "}
                <span className="font-medium text-foreground">{totalPages}</span> ({totalItems}{" "}
                total)
              </p>
              <div className="flex items-center gap-2">
                <Button
                  disabled={page <= 1 || queueQuery.isFetching}
                  onClick={() => handlePageChange(page - 1)}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  <ChevronLeft className="size-4" />
                  Previous
                </Button>
                <Button
                  disabled={page >= totalPages || queueQuery.isFetching}
                  onClick={() => handlePageChange(page + 1)}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  Next
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
