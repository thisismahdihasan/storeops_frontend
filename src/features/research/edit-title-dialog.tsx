"use client";

import { useState } from "react";
import { Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useUpdateResearchTitle } from "./use-research";

type EditTitleDialogProps = {
  currentTitle: string | null;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (newTitle: string | null) => void;
  open: boolean;
  researchItemId: string;
  workspaceId: string;
};

type EditTitleFormProps = {
  currentTitle: string | null;
  onClose: () => void;
  onSuccess?: (newTitle: string | null) => void;
  researchItemId: string;
  workspaceId: string;
};

function EditTitleForm({
  currentTitle,
  onClose,
  onSuccess,
  researchItemId,
  workspaceId,
}: EditTitleFormProps) {
  const [titleValue, setTitleValue] = useState(() => currentTitle ?? "");
  const [error, setError] = useState<string | null>(null);

  const updateMutation = useUpdateResearchTitle(workspaceId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmed = titleValue.trim();
    if (trimmed.length > 300) {
      setError("Title cannot exceed 300 characters.");
      return;
    }

    try {
      const result = await updateMutation.mutateAsync({
        researchItemId,
        title: trimmed.length > 0 ? trimmed : null,
      });

      toast.success("Title updated successfully.");
      onClose();
      onSuccess?.(result.data.researchItem.title);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to update title. Please try again.";
      setError(message);
      toast.error(message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-base">
          <Pencil className="size-4" />
          <span>Edit Research Title</span>
        </DialogTitle>
        <DialogDescription className="text-xs">
          Update the title for this research item. Leave empty to clear the title.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-2">
        <label
          htmlFor="edit-research-title"
          className="text-xs font-medium text-foreground"
        >
          Title
        </label>
        <Input
          id="edit-research-title"
          value={titleValue}
          onChange={(e) => {
            setTitleValue(e.target.value);
            if (error) setError(null);
          }}
          placeholder="e.g. Minimalist Ceramic Mug (leave empty to clear)"
          maxLength={300}
          disabled={updateMutation.isPending}
          className="text-xs"
        />
        {error && (
          <p className="text-xs font-medium text-destructive">{error}</p>
        )}
      </div>

      <DialogFooter className="mt-4 flex-row justify-end gap-2 sm:flex-row">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onClose}
          disabled={updateMutation.isPending}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          size="sm"
          disabled={updateMutation.isPending}
          className="gap-1.5"
        >
          {updateMutation.isPending ? (
            <>
              <Loader2 className="size-3.5 animate-spin" />
              <span>Saving…</span>
            </>
          ) : (
            <span>Save</span>
          )}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function EditTitleDialog({
  currentTitle,
  onOpenChange,
  onSuccess,
  open,
  researchItemId,
  workspaceId,
}: EditTitleDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6">
        {open && (
          <EditTitleForm
            currentTitle={currentTitle}
            onClose={() => onOpenChange(false)}
            onSuccess={onSuccess}
            researchItemId={researchItemId}
            workspaceId={workspaceId}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
