"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { CreateWorkspaceForm } from "./create-workspace-form";

type CreateWorkspaceDialogProps = {
  onOpenChange: (open: boolean) => void;
  open: boolean;
};

export function CreateWorkspaceDialog({
  onOpenChange,
  open,
}: CreateWorkspaceDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create workspace</DialogTitle>
          <DialogDescription>
            Create a separate workspace for another team or store.
          </DialogDescription>
        </DialogHeader>
        <CreateWorkspaceForm onSuccess={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
