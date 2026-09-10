import { ApiError, apiRequest } from "@/lib/api";

import { acceptInviteResponseSchema } from "./invite.schemas";
import type { AcceptInviteResponse } from "./invite.types";

export async function acceptInvite(token: string): Promise<AcceptInviteResponse> {
  const response = await apiRequest<unknown>(
    `/api/v1/workspace/invites/${encodeURIComponent(token)}/accept`,
    {
      method: "POST",
    }
  );

  const parsedResponse = acceptInviteResponseSchema.safeParse(response);

  if (!parsedResponse.success) {
    throw new ApiError(502, "The service returned an unexpected invitation response.");
  }

  return parsedResponse.data;
}
