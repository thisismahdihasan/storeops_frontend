"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus } from "lucide-react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { useCreateWorkspace } from "./use-create-workspace";
import { createWorkspaceInputSchema } from "./workspace.schemas";
import type { CreateWorkspaceInput } from "./workspace.types";

export function CreateWorkspaceForm() {
  const createWorkspaceMutation = useCreateWorkspace();

  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<CreateWorkspaceInput>({
    defaultValues: {
      name: "",
    },
    resolver: zodResolver(createWorkspaceInputSchema),
  });

  const onSubmit = (values: CreateWorkspaceInput) => {
    createWorkspaceMutation.mutate({
      name: values.name.trim(),
    });
  };

  return (
    <div className="w-full space-y-4">
      {createWorkspaceMutation.isError && (
        <div
          className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive"
          role="alert"
        >
          {createWorkspaceMutation.error.message ||
            "Failed to create workspace. Please try again."}
        </div>
      )}

      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-2">
          <Label htmlFor="workspace-name">Workspace Name</Label>
          <Input
            id="workspace-name"
            placeholder="e.g. Acme Production"
            disabled={createWorkspaceMutation.isPending}
            autoFocus
            aria-invalid={errors.name ? "true" : "false"}
            aria-describedby={errors.name ? "workspace-name-error" : undefined}
            {...register("name")}
          />
          {errors.name && (
            <p
              id="workspace-name-error"
              className="text-xs font-medium text-destructive"
            >
              {errors.name.message}
            </p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={createWorkspaceMutation.isPending}
        >
          {createWorkspaceMutation.isPending ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Creating workspace...
            </>
          ) : (
            <>
              <Plus className="mr-1.5 size-4" />
              Create Workspace
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
