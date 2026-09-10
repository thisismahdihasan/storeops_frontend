import { ApiError, apiRequest } from "@/lib/api";

import { currentSessionResponseSchema } from "./auth.schemas";
import type { CurrentSessionResponse } from "./auth.types";

export async function getCurrentSession(): Promise<CurrentSessionResponse> {
  const response = await apiRequest<unknown>("/api/v1/auth/me");
  const parsedResponse = currentSessionResponseSchema.safeParse(response);

  if (!parsedResponse.success) {
    throw new ApiError(502, "The service returned an unexpected response.");
  }

  return parsedResponse.data;
}
