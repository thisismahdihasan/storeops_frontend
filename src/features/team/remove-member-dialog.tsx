"use client";

import { Loader2, TriangleAlert } from "lucide-react";
import { useState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

import { getMemberMutationErrorMessage } from "./member-mutation-errors";
import type { TeamMember } from "./team.types";

type RemoveMemberDialogProps = {
  member: TeamMember | null;
  onOpenChange: (open: boolean) => void;
  onRemove: () => Promise<void>;
  open: boolean;
  submitting: boolean;
};

export function RemoveMemberDialog({
  member,
  onOpenChange,
  onRemove,
  open,
  submitting,
}: RemoveMemberDialogProps) {
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  if (!member) {
    return null;
  }

  const handleRemove = async () => {
    setSubmissionError(null);
    try {
      await onRemove();
      onOpenChange(false);
    } catch (error) {
      setSubmissionError(getMemberMutationErrorMessage(error, "remove"));
    }
  };

  return (
    <AlertDialog onOpenChange={onOpenChange} open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-destructive/10 text-destructive">
            <TriangleAlert />
          </AlertDialogMedia>
          <AlertDialogTitle>Remove member?</AlertDialogTitle>
          <AlertDialogDescription>
            Removing this member removes workspace access but preserves historical work.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm">
          {member.name && <p className="font-medium text-foreground">{member.name}</p>}
          <p className="text-muted-foreground">{member.email}</p>
          <p className="mt-2 text-xs text-muted-foreground">Current roles: {member.roles.join(", ")}</p>
        </div>
        {submissionError && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive" role="alert">
            {submissionError}
          </div>
        )}
        <AlertDialogFooter>
          <Button disabled={submitting} onClick={() => onOpenChange(false)} type="button" variant="outline">
            Cancel
          </Button>
          <AlertDialogAction
            disabled={submitting}
            onClick={(event) => {
              event.preventDefault();
              void handleRemove();
            }}
            variant="destructive"
          >
            {submitting && <Loader2 className="size-3.5 animate-spin" />}
            Remove member
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
