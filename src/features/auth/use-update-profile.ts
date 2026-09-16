"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { updateProfile } from "./auth.api";
import type { CurrentSessionResponse } from "./auth.types";
import { currentSessionQueryKey } from "./use-current-session";

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData: FormData) => updateProfile(formData),
    onSuccess: (response) => {
      queryClient.setQueryData<CurrentSessionResponse>(
        currentSessionQueryKey,
        response,
      );
      void queryClient.invalidateQueries({ queryKey: currentSessionQueryKey });
      void queryClient.invalidateQueries({ queryKey: ["research"] });
      void queryClient.invalidateQueries({ queryKey: ["designs"] });
      void queryClient.invalidateQueries({ queryKey: ["listings"] });
    },
  });
}
