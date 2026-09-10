"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { getWorkspaces, workspacesQueryKey } from "@/features/workspace/workspace.api";

import { registerUser } from "./auth.api";
import type { RegisterInput } from "./auth.types";
import { resolvePostAuthDestination } from "./post-auth-redirect";
import { currentSessionQueryKey } from "./use-current-session";

export function useRegister() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get("redirect");

  return useMutation({
    mutationFn: (input: RegisterInput) => registerUser(input),
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create account. Please try again.");
    },
    onSuccess: async () => {
      // Refresh current session
      await queryClient.invalidateQueries({ queryKey: currentSessionQueryKey });

      // Fetch available workspaces for role discovery & redirect resolution
      let destination = "/";
      try {
        const workspacesResponse = await queryClient.fetchQuery({
          queryFn: getWorkspaces,
          queryKey: workspacesQueryKey,
        });
        destination = resolvePostAuthDestination(
          workspacesResponse.data.workspaces,
          redirectParam
        );
      } catch {
        destination = resolvePostAuthDestination([], redirectParam);
      }

      toast.success("Account created successfully.");
      router.push(destination);
    },
  });
}
