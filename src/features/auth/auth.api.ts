import { ApiError, apiRequest } from "@/lib/api";

import {
  authResponseSchema,
  currentSessionResponseSchema,
  forgotPasswordVerifyResponseSchema,
  genericAuthResponseSchema,
  logoutResponseSchema,
} from "./auth.schemas";
import type {
  AuthResponse,
  CurrentSessionResponse,
  ForgotPasswordResetInput,
  ForgotPasswordRequestInput,
  ForgotPasswordVerifyInput,
  ForgotPasswordVerifyResponse,
  GenericAuthResponse,
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

export async function updateProfile(
  formData: FormData,
): Promise<CurrentSessionResponse> {
  const response = await apiRequest<unknown>("/api/v1/auth/profile", {
    body: formData,
    method: "PATCH",
  });
  const parsedResponse = currentSessionResponseSchema.safeParse(response);

  if (!parsedResponse.success) {
    throw new ApiError(502, "The service returned an unexpected profile response.");
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

export async function requestPasswordReset(
  payload: ForgotPasswordRequestInput
): Promise<GenericAuthResponse> {
  const response = await apiRequest<unknown>(
    "/api/v1/auth/forgot-password/request",
    {
      json: {
        email: payload.email,
      },
      method: "POST",
    }
  );

  const parsedResponse = genericAuthResponseSchema.safeParse(response);

  if (!parsedResponse.success) {
    throw new ApiError(
      502,
      "The service returned an unexpected password reset request response."
    );
  }

  return parsedResponse.data;
}

export async function verifyPasswordResetCode(
  payload: ForgotPasswordVerifyInput
): Promise<ForgotPasswordVerifyResponse> {
  const response = await apiRequest<unknown>(
    "/api/v1/auth/forgot-password/verify",
    {
      json: {
        code: payload.code,
        email: payload.email,
      },
      method: "POST",
    }
  );

  const parsedResponse = forgotPasswordVerifyResponseSchema.safeParse(response);

  if (!parsedResponse.success) {
    throw new ApiError(
      502,
      "The service returned an unexpected verification response."
    );
  }

  return parsedResponse.data;
}

export async function resetPassword(
  payload: ForgotPasswordResetInput
): Promise<GenericAuthResponse> {
  const response = await apiRequest<unknown>(
    "/api/v1/auth/forgot-password/reset",
    {
      json: {
        confirmPassword: payload.confirmPassword,
        email: payload.email,
        password: payload.password,
        resetToken: payload.resetToken,
      },
      method: "POST",
    }
  );

  const parsedResponse = genericAuthResponseSchema.safeParse(response);

  if (!parsedResponse.success) {
    throw new ApiError(
      502,
      "The service returned an unexpected password reset response."
    );
  }

  return parsedResponse.data;
}
