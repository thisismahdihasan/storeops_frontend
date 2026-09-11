import { ApiError, apiRequest } from "@/lib/api";

import {
  designerQueueResponseSchema,
  reportIssueResponseSchema,
  workflowActionResponseSchema,
} from "./designer-work.schemas";
import type {
  DesignerQueueResponse,
  DesignerWorkFilters,
  ReportIssueFormValues,
} from "./designer-work.types";

function buildQueueQuery(filters: DesignerWorkFilters): string {
  const searchParams = new URLSearchParams();
  if (filters.page > 1) searchParams.set("page", filters.page.toString());
  if (filters.status) searchParams.set("status", filters.status);
  if (filters.search) searchParams.set("search", filters.search);
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export async function getDesignerWorkQueue(workspaceId: string, filters: DesignerWorkFilters): Promise<DesignerQueueResponse> {
  const response = await apiRequest<unknown>(`/api/v1/workspaces/${workspaceId}/designer/my-work${buildQueueQuery(filters)}`);
  const parsed = designerQueueResponseSchema.safeParse(response);
  if (!parsed.success) throw new ApiError(502, "Unexpected Designer My Work response format.");
  return parsed.data;
}

async function postWorkflowAction(workspaceId: string, researchItemId: string, action: "start" | "start-correction") {
  const response = await apiRequest<unknown>(`/api/v1/workspaces/${workspaceId}/design/${researchItemId}/${action}`, { method: "POST" });
  const parsed = workflowActionResponseSchema.safeParse(response);
  if (!parsed.success) throw new ApiError(502, "Unexpected design workflow response format.");
  return parsed.data;
}

export function startDesignWork(workspaceId: string, researchItemId: string) {
  return postWorkflowAction(workspaceId, researchItemId, "start");
}

export function startCorrection(workspaceId: string, researchItemId: string) {
  return postWorkflowAction(workspaceId, researchItemId, "start-correction");
}

export async function reportDesignIssue(workspaceId: string, researchItemId: string, values: ReportIssueFormValues) {
  const details = values.details?.trim();
  const response = await apiRequest<unknown>(`/api/v1/workspaces/${workspaceId}/design/${researchItemId}/report-issue`, {
    json: { reason: values.reason, ...(details ? { details } : {}) }, method: "POST",
  });
  const parsed = reportIssueResponseSchema.safeParse(response);
  if (!parsed.success) throw new ApiError(502, "Unexpected design issue response format.");
  return parsed.data;
}
