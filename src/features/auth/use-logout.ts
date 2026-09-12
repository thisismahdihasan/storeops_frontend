"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { logoutUser } from "./auth.api";

export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: () => logoutUser(),
    onSettled: (_data, error) => {
      queryClient.clear();
      if (error) {
        toast.info("Signed out locally. Server logout could not be confirmed.");
      } else {
        toast.info("You have signed out.");
      }
      router.replace("/login");
    },
  });
}
