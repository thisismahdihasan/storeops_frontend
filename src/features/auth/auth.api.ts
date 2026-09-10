import { ApiError, apiRequest } from "@/lib/api";

import {
  authResponseSchema,
  currentSessionResponseSchema,
  logoutResponseSchema,
} from "./auth.schemas";
import type {
  AuthResponse,
  CurrentSessionResponse,
  LoginInput,
  RegisterInput,
} from "./auth.types";

export async function getCurrentSession(): Promise<CurrentSessionResponse> {
  const response = await apiRequest<unknown>("/api/v1/auth/me");
  const parsedResponse = currentSessionResponseSchema.safeParse(response);

  if (!parsedResponse.success) {
    throw new ApiError(502, "The service returned an unexpected session response.");
  }

  return parsedResponse.data;
}

export async function loginUser(payload: LoginInput): Promise<AuthResponse> {
  const response = await apiRequest<unknown>("/api/v1/auth/login", {
    json: {
      email: payload.email,
      password: payload.password,
    },
    method: "POST",
  });

  const parsedResponse = authResponseSchema.safeParse(response);

  if (!parsedResponse.success) {
    throw new ApiError(502, "The service returned an unexpected login response.");
  }

  return parsedResponse.data;
}

export async function registerUser(payload: RegisterInput): Promise<AuthResponse> {
  const requestBody: { email: string; name?: string; password: string } = {
    email: payload.email,
    password: payload.password,
  };

  const trimmedName = payload.name?.trim();
  if (trimmedName && trimmedName.length > 0) {
    requestBody.name = trimmedName;
  }

  const response = await apiRequest<unknown>("/api/v1/auth/register", {
    json: requestBody,
    method: "POST",
  });

  const parsedResponse = authResponseSchema.safeParse(response);

  if (!parsedResponse.success) {
    throw new ApiError(502, "The service returned an unexpected registration response.");
  }

  return parsedResponse.data;
}

export async function logoutUser(): Promise<{ message: string; success: true }> {
  const response = await apiRequest<unknown>("/api/v1/auth/logout", {
    method: "POST",
  });

  const parsedResponse = logoutResponseSchema.safeParse(response);

  if (!parsedResponse.success) {
    throw new ApiError(502, "The service returned an unexpected logout response.");
  }

  return parsedResponse.data;
}
