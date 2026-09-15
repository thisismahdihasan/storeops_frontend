"use client";

import { useCallback, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Palette } from "lucide-react";
import { toast } from "sonner";

import { ApiError } from "@/lib/api";
import { useWorkspaces } from "@/features/workspace/use-workspaces";

import { WorkerAssignmentStatusBanner } from "@/features/workspace/worker-assignment-status-banner";
import { DesignerWorkFilters } from "./designer-work-filters";
import { DesignerWorkList } from "./designer-work-list";
import { ReportIssueDialog } from "./report-issue-dialog";
import { designerWorkFiltersSchema } from "./designer-work.schemas";
import type { DesignerWorkFilters as DesignerWorkFiltersValue, DesignerWorkItem, ReportIssueFormValues } from "./designer-work.types";
import { useDesignerWorkQueue, useReportDesignIssue, useStartCorrection, useStartDesignWork } from "./use-designer-work";

function parseDesignerWorkFilters(searchParams: URLSearchParams): DesignerWorkFiltersValue {
  const page = Number(searchParams.get("page"));
  const candidate = { limit: 20, page: Number.isInteger(page) && page > 0 ? page : 1, search: searchParams.get("search")?.trim() || undefined, status: searchParams.get("status") || undefined };
  const parsed = designerWorkFiltersSchema.safeParse(candidate);
  return parsed.success ? parsed.data : { limit: 20, page: 1 };
}

function getActionErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError && error.status === 409) return `${error.message} The queue has been refreshed.`;
  return error instanceof Error ? error.message : fallback;
}

type DesignerWorkViewProps = { workspaceId: string };

export function DesignerWorkView({ workspaceId }: DesignerWorkViewProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const filters = parseDesignerWorkFilters(searchParams);
  const workspacesQuery = useWorkspaces();
  const activeWorkspace = workspacesQuery.data?.data.workspaces.find((workspace) => workspace.id === workspaceId);
  const hasDesignerRole = activeWorkspace?.membership.roles.includes("DESIGNER") ?? false;
  const queueQuery = useDesignerWorkQueue(workspaceId, filters, hasDesignerRole);
  const startWorkMutation = useStartDesignWork(workspaceId);
  const reportIssueMutation = useReportDesignIssue(workspaceId);
  const startCorrectionMutation = useStartCorrection(workspaceId);
  const [issueWork, setIssueWork] = useState<DesignerWorkItem | null>(null);

  const updateFilters = useCallback((changes: Partial<DesignerWorkFiltersValue>) => {
    const next = { ...filters, ...changes };
    const params = new URLSearchParams();
    if (next.status) params.set("status", next.status);
    if (next.search) params.set("search", next.search);
    if (next.page > 1) params.set("page", next.page.toString());
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }, [filters, pathname, router]);

  const refreshQueueAfterConflict = () => { void queueQuery.refetch(); };
  const handleOpenWork = (work: DesignerWorkItem) => {
    router.push(`/w/${workspaceId}/design/${work.researchItem.id}`);
  };
  const handleStartWork = async (work: DesignerWorkItem) => {
    try {
      await startWorkMutation.mutateAsync(work.researchItem.id);
      toast.success("Design work started.");
      router.push(`/w/${workspaceId}/design/${work.researchItem.id}`);
    } catch (error) {
      toast.error(getActionErrorMessage(error, "Unable to start work."));
      if (error instanceof ApiError && error.status === 409) refreshQueueAfterConflict();
    }
  };
  const handleStartCorrection = async (work: DesignerWorkItem) => {
    try { await startCorrectionMutation.mutateAsync(work.researchItem.id); toast.success("Correction work started."); }
    catch (error) { toast.error(getActionErrorMessage(error, "Unable to start correction.")); if (error instanceof ApiError && error.status === 409) refreshQueueAfterConflict(); }
  };
  const handleReportIssue = async (values: ReportIssueFormValues) => {
    if (!issueWork) return;
    try { await reportIssueMutation.mutateAsync({ researchItemId: issueWork.researchItem.id, values }); toast.success("Design issue reported. Waiting for Admin action."); setIssueWork(null); }
    catch (error) { toast.error(getActionErrorMessage(error, "Unable to report the issue.")); if (error instanceof ApiError && error.status === 409) refreshQueueAfterConflict(); }
  };

  return (
    <div className="mx-auto max-w-screen-2xl space-y-5 p-4 sm:p-6 lg:p-8">
      <header className="flex flex-col gap-3 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-widest text-primary">Designer workflow</p><h1 className="mt-1 flex items-center gap-2 text-2xl font-bold tracking-tight sm:text-3xl"><Palette className="size-6 text-primary" />My Work</h1><p className="mt-1 max-w-2xl text-sm text-muted-foreground">Your active design assignments, ordered by most recently assigned.</p></div>{queueQuery.data && <p className="text-sm text-muted-foreground">{queueQuery.data.data.pagination.total} active assignment{queueQuery.data.data.pagination.total === 1 ? "" : "s"}</p>}</header>
      {activeWorkspace ? (
        <WorkerAssignmentStatusBanner
          membership={activeWorkspace.membership}
          role="DESIGNER"
        />
      ) : null}
      <DesignerWorkFilters key={filters.search ?? ""} filters={filters} onChange={updateFilters} />
      <DesignerWorkList data={queueQuery.data?.data} filtersActive={Boolean(filters.search || filters.status)} isError={queueQuery.isError} isLoading={queueQuery.isLoading || workspacesQuery.isLoading} onOpenWork={handleOpenWork} onPageChange={(page) => updateFilters({ page })} onReportIssue={setIssueWork} onRetry={() => void queueQuery.refetch()} onStartCorrection={(work) => void handleStartCorrection(work)} onStartWork={(work) => void handleStartWork(work)} startingCorrectionItemId={startCorrectionMutation.isPending ? startCorrectionMutation.variables : undefined} startingWorkItemId={startWorkMutation.isPending ? startWorkMutation.variables : undefined} workspaceId={workspaceId} />
      <ReportIssueDialog isSubmitting={reportIssueMutation.isPending} onOpenChange={(open) => !open && setIssueWork(null)} onSubmit={(values) => void handleReportIssue(values)} open={issueWork !== null} workTitle={issueWork?.researchItem.title || `Etsy Listing #${issueWork?.researchItem.etsyListingId ?? ""}`} />
    </div>
  );
}
