/* eslint-disable @next/next/no-img-element */
"use client";

import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Calendar,
  Clock,
  ExternalLink,
  ImageIcon,
  RotateCcw,
  Search,
  ShieldAlert,
  User,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  formatWorkDate,
  type DesignerWorkFilters as DesignerWorkFiltersValue,
  type DesignerWorkItem,
} from "@/features/designer-work/designer-work.types";
import { useDesignerWorkQueue } from "@/features/designer-work/use-designer-work";
import { useWorkspaces } from "@/features/workspace/use-workspaces";

type CorrectionsViewProps = {
  workspaceId: string;
};

function parseCorrectionsFilters(
  searchParams: URLSearchParams,
): DesignerWorkFiltersValue {
  const page = Number(searchParams.get("page"));
  return {
    limit: 20,
    page: Number.isInteger(page) && page > 0 ? page : 1,
    search: searchParams.get("search")?.trim() || undefined,
    status: "CORRECTION_NEEDED",
  };
}

function AccessDenied({ workspaceId }: { workspaceId: string }) {
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
          Designer access required
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This queue is available only to members with the explicit Designer role
          in this workspace.
        </p>
        <div className="mt-6 flex justify-center">
          <Button
            nativeButton={false}
            render={<Link href={`/w/${workspaceId}`} />}
            variant="outline"
          >
            Back to Workspace
          </Button>
        </div>
      </section>
    </main>
  );
}

function LoadingSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div
          className="flex h-72 animate-pulse flex-col justify-between rounded-2xl border border-border bg-card p-5"
          key={i}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="size-16 rounded-xl bg-muted" />
              <div className="h-5 w-24 rounded-full bg-muted" />
            </div>
            <div className="h-4 w-3/4 rounded bg-muted" />
            <div className="h-3 w-1/2 rounded bg-muted" />
          </div>
          <div className="space-y-2">
            <div className="h-3 w-2/3 rounded bg-muted" />
            <div className="h-8 w-full rounded-lg bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="mx-auto max-w-lg p-6">
      <section
        className="rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center"
        role="alert"
      >
        <AlertCircle className="mx-auto size-8 text-destructive" />
        <h2 className="mt-3 text-base font-semibold text-foreground">
          Unable to load corrections
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Could not fetch pending corrections. Check your connection and try again.
        </p>
        <Button className="mt-4" onClick={onRetry} type="button" variant="outline">
          Try again
        </Button>
      </section>
    </div>
  );
}

export function CorrectionsView({ workspaceId }: CorrectionsViewProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const filters = parseCorrectionsFilters(searchParams);
  const [searchInput, setSearchInput] = useState(filters.search ?? "");

  const workspacesQuery = useWorkspaces();
  const activeWorkspace = workspacesQuery.data?.data.workspaces.find(
    (w) => w.id === workspaceId,
  );
  const hasDesignerRole =
    activeWorkspace?.membership.roles.includes("DESIGNER") ?? false;

  const queueQuery = useDesignerWorkQueue(
    workspaceId,
    filters,
    hasDesignerRole,
  );

  const updateFilters = useCallback(
    (changes: Partial<DesignerWorkFiltersValue>) => {
      const next = { ...filters, ...changes };
      const params = new URLSearchParams();
      if (next.search) params.set("search", next.search);
      if (next.page && next.page > 1) params.set("page", next.page.toString());
      const query = params.toString();
      router.push(query ? `${pathname}?${query}` : pathname);
    },
    [filters, pathname, router],
  );

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchInput.trim();
    updateFilters({ page: 1, search: trimmed || undefined });
  };

  const handleClearSearch = () => {
    setSearchInput("");
    updateFilters({ page: 1, search: undefined });
  };

  if (workspacesQuery.isLoading) {
    return (
      <div className="mx-auto max-w-screen-2xl space-y-5 p-4 sm:p-6 lg:p-8">
        <LoadingSkeleton />
      </div>
    );
  }

  if (!hasDesignerRole) {
    return <AccessDenied workspaceId={workspaceId} />;
  }

  const data = queueQuery.data?.data;
  const total = data?.pagination.total ?? 0;
  const totalPages = data?.pagination.totalPages ?? 0;
  const currentPage = filters.page;

  return (
    <div className="mx-auto max-w-screen-2xl space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header Banner */}
      <header className="flex flex-col gap-3 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            Designer workflow
          </p>
          <div className="mt-1 flex items-center gap-2.5">
            <RotateCcw className="size-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Corrections
            </h1>
            {queueQuery.data && (
              <Badge
                className="ml-1 font-semibold"
                variant="secondary"
              >
                {total} {total === 1 ? "correction" : "corrections"}
              </Badge>
            )}
          </div>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Review requested changes and continue your design revisions.
          </p>
        </div>
      </header>

      {/* Search Filter */}
      <form
        className="flex max-w-md items-center gap-2"
        onSubmit={handleSearchSubmit}
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            aria-label="Search corrections"
            className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-8 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by title, Etsy ID, or URL…"
            type="search"
            value={searchInput}
          />
          {searchInput.length > 0 && (
            <button
              aria-label="Clear search query"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={handleClearSearch}
              type="button"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
        <Button size="sm" type="submit" variant="secondary">
          Search
        </Button>
      </form>

      {/* Content Area */}
      {queueQuery.isLoading ? (
        <LoadingSkeleton />
      ) : queueQuery.isError ? (
        <ErrorState onRetry={() => void queueQuery.refetch()} />
      ) : !data || data.items.length === 0 ? (
        filters.search ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-12 text-center">
            <Search className="mx-auto size-10 text-muted-foreground/60" />
            <h3 className="mt-3 text-base font-semibold text-foreground">
              No corrections matching &ldquo;{filters.search}&rdquo;
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Try checking for spelling errors or clearing your search term.
            </p>
            <Button
              className="mt-4"
              onClick={handleClearSearch}
              size="sm"
              type="button"
              variant="outline"
            >
              Clear search
            </Button>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-12 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <RotateCcw className="size-6" />
            </div>
            <h3 className="mt-3 text-base font-semibold text-foreground">
              No pending corrections
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Items that need design revisions will appear here.
            </p>
          </div>
        )
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.items.map((work) => (
              <CorrectionCard
                key={work.assignmentId}
                work={work}
                workspaceId={workspaceId}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <nav
              aria-label="Corrections pagination"
              className="flex items-center justify-between border-t border-border pt-4 text-sm text-muted-foreground"
            >
              <div>
                Page {currentPage} of {totalPages} ({total} total)
              </div>
              <div className="flex items-center gap-2">
                <Button
                  disabled={currentPage <= 1}
                  onClick={() => updateFilters({ page: currentPage - 1 })}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  <ArrowLeft className="size-3.5" />
                  Previous
                </Button>
                <Button
                  disabled={currentPage >= totalPages}
                  onClick={() => updateFilters({ page: currentPage + 1 })}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  Next
                  <ArrowRight className="size-3.5" />
                </Button>
              </div>
            </nav>
          )}
        </div>
      )}
    </div>
  );
}

function CorrectionCard({
  work,
  workspaceId,
}: {
  work: DesignerWorkItem;
  workspaceId: string;
}) {
  const { researchItem } = work;
  const title = researchItem.title || `Etsy Listing #${researchItem.etsyListingId}`;
  const researcherName =
    researchItem.createdBy.name || researchItem.createdBy.email;

  return (
    <article className="flex flex-col justify-between rounded-2xl border border-border bg-card p-5 shadow-xs transition-all hover:border-border/80">
      <div className="space-y-4">
        {/* Card Header: Thumbnail + Status Badge */}
        <div className="flex items-start justify-between gap-3">
          <div className="size-16 shrink-0 overflow-hidden rounded-xl border border-border/80 bg-muted/30">
            {researchItem.referenceImageUrl ? (
              <img
                alt={title}
                className="size-full object-cover"
                loading="lazy"
                src={researchItem.referenceImageUrl}
              />
            ) : (
              <div className="flex size-full items-center justify-center text-muted-foreground/60">
                <ImageIcon className="size-6" />
              </div>
            )}
          </div>

          <Badge
            className="border-amber-500/30 bg-amber-500/10 text-[11px] font-semibold text-amber-600 dark:text-amber-400"
            variant="outline"
          >
            Correction Needed
          </Badge>
        </div>

        {/* Title & Etsy ID */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
            <span>Etsy #{researchItem.etsyListingId}</span>
            {researchItem.originalUrl && (
              <a
                aria-label={`Open Etsy listing ${researchItem.etsyListingId} in new tab`}
                className="text-muted-foreground hover:text-foreground"
                href={researchItem.originalUrl}
                rel="noreferrer"
                target="_blank"
              >
                <ExternalLink className="size-3" />
              </a>
            )}
          </div>
          <h2
            className="line-clamp-2 text-sm font-semibold text-foreground leading-snug"
            title={title}
          >
            {title}
          </h2>
        </div>

        {/* Context metadata */}
        <div className="space-y-1.5 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5 truncate">
            <User className="size-3.5 shrink-0 text-muted-foreground/70" />
            <span className="truncate">Researcher: {researcherName}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="size-3.5 shrink-0 text-muted-foreground/70" />
            <span>Assigned {formatWorkDate(work.assignedAt)}</span>
          </div>
          {work.startedAt && (
            <div className="flex items-center gap-1.5">
              <Clock className="size-3.5 shrink-0 text-muted-foreground/70" />
              <span>Started {formatWorkDate(work.startedAt)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Primary CTA Button: Fix Correction */}
      <div className="mt-5 pt-3 border-t border-border/60">
        <Button
          className="w-full justify-center gap-1.5 bg-amber-600 text-white hover:bg-amber-700 dark:bg-amber-500 dark:text-neutral-950 dark:hover:bg-amber-400 border-transparent shadow-xs font-semibold"
          nativeButton={false}
          render={
            <Link href={`/w/${workspaceId}/design/${researchItem.id}`} />
          }
          size="sm"
        >
          <RotateCcw className="size-3.5" />
          <span>Fix Correction</span>
        </Button>
      </div>
    </article>
  );
}
