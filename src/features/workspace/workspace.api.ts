import { ApiError, apiRequest } from "@/lib/api";

import {
  createWorkspaceResponseSchema,
  restoreWorkspaceResponseSchema,
  scheduleWorkspaceDeletionResponseSchema,
  updateWorkspaceSettingsResponseSchema,
  workspacesResponseSchema,
} from "./workspace.schemas";
import type {
  CreateWorkspaceInput,
  CreateWorkspaceResponse,
  RestoreWorkspaceResponse,
  ScheduleWorkspaceDeletionInput,
  ScheduleWorkspaceDeletionResponse,
  UpdateWorkspaceSettingsInput,
  UpdateWorkspaceSettingsResponse,
  WorkspacesResponse,
} from "./workspace.types";

export const workspacesQueryKey = ["workspaces"] as const;

export async function getWorkspaces(): Promise<WorkspacesResponse> {
  const response = await apiRequest<unknown>("/api/v1/workspaces");
  const parsedResponse = workspacesResponseSchema.safeParse(response);

  if (!parsedResponse.success) {
    throw new ApiError(502, "The service returned an unexpected workspace response.");
  }

  return parsedResponse.data;
}

export async function createWorkspace(
  input: CreateWorkspaceInput,
): Promise<CreateWorkspaceResponse> {
  const response = await apiRequest<unknown>("/api/v1/workspaces", {
    json: input,
    method: "POST",
  });
  const parsedResponse = createWorkspaceResponseSchema.safeParse(response);

  if (!parsedResponse.success) {
    throw new ApiError(502, "The service returned an unexpected workspace creation response.");
  }

  return parsedResponse.data;
}

export async function updateWorkspaceSettings(
  workspaceId: string,
  input: UpdateWorkspaceSettingsInput,
): Promise<UpdateWorkspaceSettingsResponse> {
  const response = await apiRequest<unknown>(`/api/v1/workspaces/${workspaceId}/settings`, {
    json: input,
    method: "PATCH",
  });
  
  const parsedResponse = updateWorkspaceSettingsResponseSchema.safeParse(response);

  if (!parsedResponse.success) {
    throw new ApiError(502, "The service returned an unexpected settings update response.");
  }

  return parsedResponse.data;
}

export async function scheduleWorkspaceDeletion(
  workspaceId: string,
  input: ScheduleWorkspaceDeletionInput,
): Promise<ScheduleWorkspaceDeletionResponse> {
  const response = await apiRequest<unknown>(
    `/api/v1/workspaces/${encodeURIComponent(workspaceId)}/schedule-deletion`,
    {
      json: { workspaceName: input.workspaceName },
      method: "POST",
    },
  );
  const parsedResponse = scheduleWorkspaceDeletionResponseSchema.safeParse(response);

  if (!parsedResponse.success) {
    throw new ApiError(502, "The service returned an unexpected deletion schedule response.");
  }

  return parsedResponse.data;
}

export async function restoreWorkspace(
  workspaceId: string,
): Promise<RestoreWorkspaceResponse> {
  const response = await apiRequest<unknown>(
    `/api/v1/workspaces/${encodeURIComponent(workspaceId)}/restore`,
    {
      json: {},
      method: "POST",
    },
  );
  const parsedResponse = restoreWorkspaceResponseSchema.safeParse(response);

  if (!parsedResponse.success) {
    throw new ApiError(502, "The service returned an unexpected workspace restore response.");
  }

  return parsedResponse.data;
}
