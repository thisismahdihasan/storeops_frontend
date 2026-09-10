import { ApiError, apiRequest } from "@/lib/api";

import {
  createWorkspaceResponseSchema,
  workspacesResponseSchema,
} from "./workspace.schemas";
import type {
  CreateWorkspaceInput,
  CreateWorkspaceResponse,
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
