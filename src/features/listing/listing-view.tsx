"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Tag } from "lucide-react";

import { useWorkspaces } from "@/features/workspace/use-workspaces";
import { ApiError } from "@/lib/api";

import { WorkerAssignmentStatusBanner } from "@/features/workspace/worker-assignment-status-banner";
import { ListingAccessState } from "./listing-access-state";
import { ListingFilters } from "./listing-filters";
import { ListingList } from "./listing-list";
import { listingFiltersSchema } from "./listing.schemas";
import type { ListingFilters as ListingFiltersValue } from "./listing.types";
import { useListingQueue } from "./use-listing";

type SearchParamsReader = Pick<URLSearchParams, "get">;

function parseListingFilters(searchParams: SearchParamsReader): ListingFiltersValue {
  const page = Number(searchParams.get("page"));
  const parsed = listingFiltersSchema.safeParse({
    limit: 20,
    page: Number.isInteger(page) && page > 0 ? page : 1,
    search: searchParams.get("search")?.trim() || undefined,
    status: searchParams.get("status") || "READY_FOR_LISTING",
  });

  return parsed.success
    ? parsed.data
    : { limit: 20, page: 1, status: "READY_FOR_LISTING" };
}

type ListingViewProps = { workspaceId: string };

export function ListingView({ workspaceId }: ListingViewProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const filters = parseListingFilters(searchParams);
  const workspacesQuery = useWorkspaces();
  const workspace = workspacesQuery.data?.data.workspaces.find(
    (item) => item.id === workspaceId,
  );
  const hasListerRole = workspace?.membership.roles.includes("LISTER") ?? false;
  const queueQuery = useListingQueue(workspaceId, filters, hasListerRole);

  const updateFilters = useCallback(
    (changes: Partial<ListingFiltersValue>) => {
      const next = { ...filters, ...changes };
      const params = new URLSearchParams();
      if (next.status !== "READY_FOR_LISTING") {
        params.set("status", next.status);
      }
      if (next.search) params.set("search", next.search);
      if (next.page > 1) params.set("page", next.page.toString());
      const query = params.toString();
      router.push(query ? `${pathname}?${query}` : pathname);
    },
    [filters, pathname, router],
  );

  if (
    workspacesQuery.data &&
    !hasListerRole
  ) {
    return <ListingAccessState workspaceId={workspaceId} />;
  }

  if (queueQuery.error instanceof ApiError && queueQuery.error.status === 403) {
    return (
      <ListingAccessState
        description="Only a Lister with access to this workspace can open the listing queue."
        title="You cannot access this listing queue"
        workspaceId={workspaceId}
      />
    );
  }

  return (
    <main className="mx-auto max-w-screen-2xl space-y-5 p-4 sm:p-6 lg:p-8">
      <header className="flex flex-col gap-3 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            Lister workflow
          </p>
          <h1 className="mt-1 flex items-center gap-2 text-2xl font-bold tracking-tight sm:text-3xl">
            <Tag className="size-6 text-primary" /> Listing
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Inspect approved work, download production files, and publish your assigned listings.
          </p>
        </div>
        {queueQuery.data ? (
          <p className="text-sm text-muted-foreground">
            {queueQuery.data.data.pagination.total} listing
            {queueQuery.data.data.pagination.total === 1 ? "" : "s"}
          </p>
        ) : null}
      </header>

      {workspace ? (
        <WorkerAssignmentStatusBanner
          membership={workspace.membership}
          role="LISTER"
        />
      ) : null}

      <ListingFilters
        filters={filters}
        key={filters.search ?? ""}
        onChange={updateFilters}
      />
      <ListingList
        data={queueQuery.data?.data}
        hasSearch={Boolean(filters.search)}
        isError={queueQuery.isError || workspacesQuery.isError}
        isLoading={queueQuery.isLoading || workspacesQuery.isLoading}
        onPageChange={(page) => updateFilters({ page })}
        onRetry={() => {
          void workspacesQuery.refetch();
          void queueQuery.refetch();
        }}
        status={filters.status}
        workspaceId={workspaceId}
      />
    </main>
  );
}
