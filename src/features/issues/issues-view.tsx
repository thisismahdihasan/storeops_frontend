"use client";

import { useState } from "react";
import { AlertCircle, ShieldAlert } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useTeamMembers } from "@/features/team/use-team";
import { useWorkspaces } from "@/features/workspace/use-workspaces";

import { IssueDetailDialog } from "./issue-detail-dialog";
import { IssueList } from "./issue-list";
import { IssuesFilters } from "./issues-filters";
import type { ActiveIssue } from "./issues.types";
import { ReassignIssueDialog } from "./reassign-issue-dialog";
import { useIssueItems, useReassignIssue } from "./use-issues";

const ISSUE_PAGE_LIMIT = 20;

function parsePage(value: string | null): number {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

function RequestError({ onRetry }: { onRetry: () => void }) {
  return (
    <section className="rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center" role="alert">
      <AlertCircle className="mx-auto size-7 text-destructive" />
      <h2 className="mt-3 font-semibold">Unable to load active issues</h2>
      <p className="mt-1 text-sm text-muted-foreground">Please try again.</p>
      <Button className="mt-4" onClick={onRetry} type="button" variant="outline">Try again</Button>
    </section>
  );
}

function AccessDenied() {
  return (
    <main className="mx-auto max-w-lg p-6">
      <section className="rounded-xl border border-destructive/20 bg-card p-6 text-center shadow-xs">
        <ShieldAlert className="mx-auto size-8 text-destructive" />
        <h1 className="mt-3 text-xl font-semibold">Admin access required</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Only workspace Admins can view and reassign active design issues.
        </p>
      </section>
    </main>
  );
}

type IssuesViewProps = {
  workspaceId: string;
};

export function IssuesView({ workspaceId }: IssuesViewProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const workspacesQuery = useWorkspaces();
  const activeWorkspace = workspacesQuery.data?.data.workspaces.find(
    (workspace) => workspace.id === workspaceId,
  );
  const isAdmin = activeWorkspace?.membership.roles.includes("ADMIN") ?? false;
  const search = searchParams.get("search")?.trim() || undefined;
  const page = parsePage(searchParams.get("page"));
  const issuesQuery = useIssueItems(
    workspaceId,
    { limit: ISSUE_PAGE_LIMIT, page, search },
    isAdmin,
  );
  const membersQuery = useTeamMembers(workspaceId, isAdmin);
  const reassignMutation = useReassignIssue(workspaceId);
  const [detailIssue, setDetailIssue] = useState<ActiveIssue | null>(null);
  const [reassignIssue, setReassignIssue] = useState<ActiveIssue | null>(null);

  if (workspacesQuery.isLoading) {
    return <IssuesLoadingState />;
  }

  if (!isAdmin) {
    return <AccessDenied />;
  }

  const issues: ActiveIssue[] = (issuesQuery.data?.data.items ?? []).filter(
    (item): item is ActiveIssue => item.latestIssueReport !== null,
  );
  const designers = (membersQuery.data?.data.members ?? []).filter((member) =>
    member.roles.includes("DESIGNER"),
  );
  const canReassign = (issue: ActiveIssue) =>
    designers.some((designer) => designer.userId !== issue.currentDesigner?.id);
  const pagination = issuesQuery.data?.data.pagination;

  const handlePageChange = (nextPage: number) => {
    const nextParams = new URLSearchParams(searchParams.toString());
    if (nextPage > 1) {
      nextParams.set("page", String(nextPage));
    } else {
      nextParams.delete("page");
    }
    const query = nextParams.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  };

  const handleReassign = async (designerId: string) => {
    if (!reassignIssue) return;

    try {
      await reassignMutation.mutateAsync({
        designerId,
        researchItemId: reassignIssue.id,
      });
      toast.success("Work reassigned successfully.");
      setReassignIssue(null);
      setDetailIssue(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to reassign work.");
    }
  };

  return (
    <main className="mx-auto max-w-screen-2xl space-y-6 p-4 sm:p-6 lg:p-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">Issues</h1>
          <p className="mt-1 text-sm text-muted-foreground">Designer-reported items waiting for Admin action.</p>
        </div>
        <p className="rounded-full bg-destructive/10 px-3 py-1.5 text-xs font-semibold text-destructive">
          {pagination?.total ?? 0} active issue{pagination?.total === 1 ? "" : "s"}
        </p>
      </header>

      <IssuesFilters search={search} />

      {issuesQuery.isLoading ? (
        <IssuesLoadingState />
      ) : issuesQuery.isError ? (
        <RequestError onRetry={() => void issuesQuery.refetch()} />
      ) : (
        <>
          <IssueList
            canReassign={canReassign}
            designersLoading={membersQuery.isLoading || membersQuery.isError}
            issues={issues}
            onOpenIssue={setDetailIssue}
            onReassignIssue={setReassignIssue}
            workspaceId={workspaceId}
          />
          {pagination && pagination.totalPages > 1 && (
            <nav aria-label="Issue pages" className="flex items-center justify-between gap-3">
              <Button disabled={pagination.page <= 1} onClick={() => handlePageChange(pagination.page - 1)} type="button" variant="outline">Previous</Button>
              <p className="text-xs text-muted-foreground">Page {pagination.page} of {pagination.totalPages}</p>
              <Button disabled={pagination.page >= pagination.totalPages} onClick={() => handlePageChange(pagination.page + 1)} type="button" variant="outline">Next</Button>
            </nav>
          )}
        </>
      )}

      <IssueDetailDialog issue={detailIssue} onOpenChange={(open) => !open && setDetailIssue(null)} open={detailIssue !== null} workspaceId={workspaceId} />
      <ReassignIssueDialog
        designers={designers}
        isLoadingDesigners={membersQuery.isLoading || membersQuery.isError}
        isReassigning={reassignMutation.isPending}
        issue={reassignIssue}
        onOpenChange={(open) => !open && setReassignIssue(null)}
        onReassign={handleReassign}
        open={reassignIssue !== null}
      />
    </main>
  );
}

function IssuesLoadingState() {
  return (
    <div className="mx-auto max-w-screen-2xl space-y-4 p-4 sm:p-6 lg:p-8">
      <div className="h-16 rounded-xl bg-muted/60 animate-pulse" />
      <div className="h-12 rounded-xl bg-muted/50 animate-pulse" />
      {Array.from({ length: 3 }).map((_, index) => (
        <div className="h-48 rounded-xl border border-border bg-muted/40 animate-pulse" key={index} />
      ))}
    </div>
  );
}
