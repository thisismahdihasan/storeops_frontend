"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  requestPasswordReset,
  resetPassword,
  verifyPasswordResetCode,
} from "./auth.api";
import type {
  ForgotPasswordRequestInput,
  ForgotPasswordResetInput,
  ForgotPasswordVerifyInput,
} from "./auth.types";
import { currentSessionQueryKey } from "./use-current-session";

export function useRequestPasswordReset() {
  return useMutation({
    mutationFn: (input: ForgotPasswordRequestInput) =>
      requestPasswordReset(input),
  });
}

export function useVerifyPasswordReset() {
  return useMutation({
    mutationFn: (input: ForgotPasswordVerifyInput) =>
      verifyPasswordResetCode(input),
  });
}

export function useResetPassword() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ForgotPasswordResetInput) => resetPassword(input),
    onSuccess: async () => {
      // Invalidate any existing auth session cache in React Query
      await queryClient.invalidateQueries({
        queryKey: currentSessionQueryKey,
      });
      queryClient.setQueryData(currentSessionQueryKey, null);
    },
  });
}
