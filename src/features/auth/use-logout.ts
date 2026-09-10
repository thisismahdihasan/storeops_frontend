"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { workspacesQueryKey } from "@/features/workspace/workspace.api";

import { logoutUser } from "./auth.api";
import { currentSessionQueryKey } from "./use-current-session";

export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: () => logoutUser(),
    onError: (error: Error) => {
      toast.error(error.message || "Failed to log out. Please try again.");
    },
    onSuccess: async () => {
      // Invalidate and remove cached auth/workspace data
      queryClient.removeQueries({ queryKey: currentSessionQueryKey });
      queryClient.removeQueries({ queryKey: workspacesQueryKey });
      await queryClient.resetQueries({ queryKey: currentSessionQueryKey, exact: false });

      toast.info("You have signed out.");
      router.push("/login");
    },
  });
}
