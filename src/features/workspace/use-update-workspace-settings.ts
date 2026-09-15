import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { ApiError } from "@/lib/api";
import { updateWorkspaceSettings, workspacesQueryKey } from "./workspace.api";
import type { UpdateWorkspaceSettingsInput, WorkspacesResponse } from "./workspace.types";

export function useUpdateWorkspaceSettings(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateWorkspaceSettingsInput) =>
      updateWorkspaceSettings(workspaceId, input),

    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: workspacesQueryKey });

      const currentWorkspacesResponse = queryClient.getQueryData<WorkspacesResponse>(workspacesQueryKey);
      const rollbackContext = { workspaceId, previous: {} as Partial<UpdateWorkspaceSettingsInput> };

      if (currentWorkspacesResponse) {
        const targetWorkspace = currentWorkspacesResponse.data.workspaces.find(
          (ws) => ws.id === workspaceId
        );
        
        if (targetWorkspace) {
          if (input.designerAutoAssignmentEnabled !== undefined) {
            rollbackContext.previous.designerAutoAssignmentEnabled = targetWorkspace.designerAutoAssignmentEnabled;
          }
          if (input.listerAutoAssignmentEnabled !== undefined) {
            rollbackContext.previous.listerAutoAssignmentEnabled = targetWorkspace.listerAutoAssignmentEnabled;
          }
        }

        queryClient.setQueryData<WorkspacesResponse>(workspacesQueryKey, {
          ...currentWorkspacesResponse,
          data: {
            ...currentWorkspacesResponse.data,
            workspaces: currentWorkspacesResponse.data.workspaces.map((ws) =>
              ws.id === workspaceId
                ? {
                    ...ws,
                    ...(input.designerAutoAssignmentEnabled !== undefined && {
                      designerAutoAssignmentEnabled: input.designerAutoAssignmentEnabled,
                    }),
                    ...(input.listerAutoAssignmentEnabled !== undefined && {
                      listerAutoAssignmentEnabled: input.listerAutoAssignmentEnabled,
                    }),
                  }
                : ws
            ),
          },
        });
      }

      return { rollbackContext };
    },

    onError: (err, variables, context) => {
      if (context?.rollbackContext) {
        const { workspaceId: targetId, previous } = context.rollbackContext;
        
        queryClient.setQueryData<WorkspacesResponse>(workspacesQueryKey, (old) => {
          if (!old) return old;
          return {
            ...old,
            data: {
              ...old.data,
              workspaces: old.data.workspaces.map((ws) =>
                ws.id === targetId
                  ? {
                      ...ws,
                      ...(previous.designerAutoAssignmentEnabled !== undefined && {
                        designerAutoAssignmentEnabled: previous.designerAutoAssignmentEnabled,
                      }),
                      ...(previous.listerAutoAssignmentEnabled !== undefined && {
                        listerAutoAssignmentEnabled: previous.listerAutoAssignmentEnabled,
                      }),
                    }
                  : ws
              ),
            },
          };
        });
      }

      const message =
        err instanceof ApiError ? err.message : "Failed to update workspace settings.";
      toast.error(message);
    },

    onSuccess: (data, variables) => {
      if (variables.designerAutoAssignmentEnabled !== undefined) {
        toast.success(
          `Designer auto-assignment turned ${variables.designerAutoAssignmentEnabled ? "on" : "off"}.`
        );
      }
      if (variables.listerAutoAssignmentEnabled !== undefined) {
        toast.success(
          `Lister auto-assignment turned ${variables.listerAutoAssignmentEnabled ? "on" : "off"}.`
        );
      }
    },

    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: workspacesQueryKey });
    },
  });
}
