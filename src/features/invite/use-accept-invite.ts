"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { currentSessionQueryKey } from "@/features/auth/use-current-session";
import { workspacesQueryKey } from "@/features/workspace/workspace.api";

import { acceptInvite } from "./invite.api";

export function useAcceptInvite() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (token: string) => acceptInvite(token),
    onError: (error: Error) => {
      toast.error(error.message || "Could not accept invitation.");
    },
    onSuccess: async (data) => {
      // Refresh workspaces and session state
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: workspacesQueryKey }),
        queryClient.invalidateQueries({ queryKey: currentSessionQueryKey }),
      ]);

      toast.success(
        `Joined workspace "${data.data.workspace.name}" successfully!`
      );
      router.push("/");
    },
  });
}
