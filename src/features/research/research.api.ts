import { ApiError, apiRequest } from "@/lib/api";

import {
  bulkAssignResearchResponseSchema,
  createResearchResponseSchema,
  deleteResearchItemResponseSchema,
  duplicateResearchDataSchema,
  previewResearchResponseSchema,
  reassignResearchResponseSchema,
  researchDetailResponseSchema,
  researchListResponseSchema,
  syncAssignmentsResponseSchema,
  updateResearchItemResponseSchema,
  uploadReferenceImageResponseSchema,
} from "./research.schemas";
import type {
  BulkAssignResearchInput,
  BulkAssignResearchResponse,
  CreateResearchInput,
  CreateResearchResponse,
  DeleteResearchItemResponse,
  DuplicateResearchData,
  IssueListFilterParams,
  PreviewResearchResponse,
  ReassignResearchResponse,
  ResearchDetailResponse,
  ResearchListFilterParams,
  ResearchListResponse,
  SyncAssignmentsResponse,
  UpdateResearchItemResponse,
  UploadReferenceImageResponse,
} from "./research.types";

export class DuplicateResearchError extends ApiError {
  public readonly duplicateData: DuplicateResearchData;

  public constructor(
    status: number,
    message: string,
    duplicateData: DuplicateResearchData,
  ) {
    super(status, message, duplicateData);
    this.name = "DuplicateResearchError";
    this.duplicateData = duplicateData;
  }
}

function buildResearchListQueryString(filter?: ResearchListFilterParams): string {
  if (!filter) {
    return "";
  }

  const searchParams = new URLSearchParams();

  if (filter.status) {
    searchParams.set("status", filter.status);
  }

  if (filter.assignment === "UNASSIGNED") {
    searchParams.set("assignment", filter.assignment);
  }

  if (filter.search && filter.search.trim().length > 0) {
    searchParams.set("search", filter.search.trim());
  }

  if (filter.date && filter.date.trim().length > 0) {
    searchParams.set("date", filter.date.trim());
  }

  if (filter.createdBy && filter.createdBy.trim().length > 0) {
    searchParams.set("createdBy", filter.createdBy.trim());
  }

  if (filter.page && filter.page > 1) {
    searchParams.set("page", filter.page.toString());
  }

  if (filter.limit && filter.limit !== 20) {
    searchParams.set("limit", filter.limit.toString());
  }

  const query = searchParams.toString();
  return query.length > 0 ? `?${query}` : "";
}

export function getReferenceImageProxyUrl(
  workspaceId: string,
  researchItemId: string,
  download = false,
): string {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") ?? "";
  const query = download ? "?download=true" : "";
  return `${baseUrl}/api/v1/workspaces/${workspaceId}/research-items/${researchItemId}/reference-image${query}`;
}

export async function createResearchItem(
  workspaceId: string,
  input: CreateResearchInput,
): Promise<CreateResearchResponse> {
  try {
    const manualImage = input.image instanceof File ? input.image : undefined;
    const requestOptions = manualImage
      ? (() => {
          const formData = new FormData();
          formData.append("etsyUrl", input.etsyUrl.trim());
          formData.append("image", manualImage);
          return { body: formData, method: "POST" as const };
        })()
      : {
          json: { etsyUrl: input.etsyUrl.trim() },
          method: "POST" as const,
        };

    const response = await apiRequest<unknown>(
      `/api/v1/workspaces/${workspaceId}/research-items`,
      requestOptions,
    );

    const parsed = createResearchResponseSchema.safeParse(response);
    if (!parsed.success) {
      throw new ApiError(502, "Unexpected research creation response format.");
    }

    return parsed.data;
  } catch (error) {
    if (error instanceof ApiError && error.status === 409 && error.data) {
      const parsedDuplicate = duplicateResearchDataSchema.safeParse(error.data);
      if (parsedDuplicate.success) {
        throw new DuplicateResearchError(
          409,
          error.message,
          parsedDuplicate.data,
        );
      }
    }
    throw error;
  }
}

export async function getResearchItems(
  workspaceId: string,
  filter?: ResearchListFilterParams,
): Promise<ResearchListResponse> {
  const query = buildResearchListQueryString(filter);
  const response = await apiRequest<unknown>(
    `/api/v1/workspaces/${workspaceId}/research-items${query}`,
  );

  const parsed = researchListResponseSchema.safeParse(response);
  if (!parsed.success) {
    throw new ApiError(502, "Unexpected research list response format.");
  }

  return parsed.data;
}

export async function getIssueItems(
  workspaceId: string,
  filter: IssueListFilterParams,
): Promise<ResearchListResponse> {
  const searchParams = new URLSearchParams({
    limit: String(filter.limit ?? 20),
    page: String(filter.page ?? 1),
  });

  if (filter.search?.trim()) {
    searchParams.set("search", filter.search.trim());
  }

  const response = await apiRequest<unknown>(
    `/api/v1/workspaces/${workspaceId}/research-items/issues?${searchParams.toString()}`,
  );
  const parsed = researchListResponseSchema.safeParse(response);

  if (!parsed.success) {
    throw new ApiError(502, "Unexpected issue list response format.");
  }

  return parsed.data;
}

export async function getResearchItemById(
  workspaceId: string,
  researchItemId: string,
): Promise<ResearchDetailResponse> {
  const response = await apiRequest<unknown>(
    `/api/v1/workspaces/${workspaceId}/research-items/${researchItemId}`,
  );

  const parsed = researchDetailResponseSchema.safeParse(response);
  if (!parsed.success) {
    throw new ApiError(502, "Unexpected research detail response format.");
  }

  return parsed.data;
}

export async function reassignResearchDesigner(
  workspaceId: string,
  researchItemId: string,
  designerId: string,
): Promise<ReassignResearchResponse> {
  const response = await apiRequest<unknown>(
    `/api/v1/workspaces/${workspaceId}/research-items/${researchItemId}/designer`,
    {
      json: { designerId },
      method: "PATCH",
    },
  );

  const parsed = reassignResearchResponseSchema.safeParse(response);
  if (!parsed.success) {
    throw new ApiError(502, "Unexpected designer reassignment response format.");
  }

  return parsed.data;
}

export async function bulkAssignResearchDesigners(
  workspaceId: string,
  input: BulkAssignResearchInput,
): Promise<BulkAssignResearchResponse> {
  const response = await apiRequest<unknown>(
    `/api/v1/workspaces/${workspaceId}/research-items/bulk-assign`,
    {
      json: input,
      method: "POST",
    },
  );
  const parsed = bulkAssignResearchResponseSchema.safeParse(response);

  if (!parsed.success) {
    throw new ApiError(502, "Unexpected bulk Designer assignment response format.");
  }

  return parsed.data;
}

export async function previewResearchItem(
  workspaceId: string,
  etsyUrl: string,
): Promise<PreviewResearchResponse> {
  const response = await apiRequest<unknown>(
    `/api/v1/workspaces/${workspaceId}/research-items/preview`,
    {
      json: { etsyUrl: etsyUrl.trim() },
      method: "POST",
    },
  );

  const parsed = previewResearchResponseSchema.safeParse(response);
  if (!parsed.success) {
    throw new ApiError(502, "Unexpected research preview response format.");
  }

  return parsed.data;
}

export async function uploadResearchReferenceImage(
  workspaceId: string,
  researchItemId: string,
  file: File,
): Promise<UploadReferenceImageResponse> {
  const formData = new FormData();
  formData.append("image", file);

  const response = await apiRequest<unknown>(
    `/api/v1/workspaces/${workspaceId}/research-items/${researchItemId}/reference-image`,
    {
      body: formData,
      method: "POST",
    },
  );

  const parsed = uploadReferenceImageResponseSchema.safeParse(response);
  if (!parsed.success) {
    throw new ApiError(
      502,
      "Unexpected upload reference image response format.",
    );
  }

  return parsed.data;
}

export async function updateResearchItemTitle(
  workspaceId: string,
  researchItemId: string,
  title: string | null,
): Promise<UpdateResearchItemResponse> {
  const normalizedTitle =
    title === null || title.trim().length === 0 ? null : title.trim();

  const response = await apiRequest<unknown>(
    `/api/v1/workspaces/${workspaceId}/research-items/${researchItemId}`,
    {
      json: { title: normalizedTitle },
      method: "PATCH",
    },
  );

  const parsed = updateResearchItemResponseSchema.safeParse(response);
  if (!parsed.success) {
    throw new ApiError(502, "Unexpected research update response format.");
  }

  return parsed.data;
}

export async function deleteResearchItem(
  workspaceId: string,
  researchItemId: string,
): Promise<DeleteResearchItemResponse> {
  const response = await apiRequest<unknown>(
    `/api/v1/workspaces/${workspaceId}/research-items/${researchItemId}`,
    {
      method: "DELETE",
    },
  );

  const parsed = deleteResearchItemResponseSchema.safeParse(response);
  if (!parsed.success) {
    throw new ApiError(502, "Unexpected research deletion response format.");
  }

  return parsed.data;
}

export async function getResearchReferenceImageBlob(
  workspaceId: string,
  researchItemId: string,
): Promise<Blob> {
  const blob = await apiRequest<Blob>(
    `/api/v1/workspaces/${workspaceId}/research-items/${researchItemId}/reference-image`,
    {
      method: "GET",
      responseType: "blob",
    },
  );

  if (!blob) {
    throw new ApiError(404, "Reference image not found.");
  }

  return blob;
}

export async function downloadResearchReferenceImage(
  workspaceId: string,
  researchItemId: string,
  fallbackFilename?: string,
): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") ?? "";
  const response = await fetch(
    `${baseUrl}/api/v1/workspaces/${workspaceId}/research-items/${researchItemId}/reference-image?download=true`,
    {
      credentials: "include",
      method: "GET",
    },
  );

  if (!response.ok) {
    throw new ApiError(response.status, "Failed to download reference image.");
  }

  const contentDisposition = response.headers.get("content-disposition");
  let filename = fallbackFilename || `research-reference-${researchItemId}.png`;

  if (contentDisposition) {
    const match = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/i.exec(
      contentDisposition,
    );
    if (match && match[1]) {
      filename = match[1].replace(/['"]/g, "").trim();
    }
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function syncResearchAssignments(
  workspaceId: string,
): Promise<SyncAssignmentsResponse> {
  const response = await apiRequest<unknown>(
    `/api/v1/workspaces/${workspaceId}/research-items/sync-assignments`,
    { method: "POST" },
  );

  const parsed = syncAssignmentsResponseSchema.safeParse(response);
  if (!parsed.success) {
    throw new ApiError(502, "Unexpected sync assignments response format.");
  }

  return parsed.data;
}
