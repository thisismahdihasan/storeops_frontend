"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UserAvatar } from "@/components/ui/user-avatar";
import { ApiError } from "@/lib/api";

import type { TeamMember } from "./team.types";

const ROLE_LABELS = {
  ADMIN: "Admin",
  DESIGNER: "Designer",
  LISTER: "Lister",
  RESEARCHER: "Researcher",
} as const;

type TransferOwnershipDialogProps = {
  member: TeamMember | null;
  onConfirm: () => Promise<void>;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  submitting: boolean;
  workspaceName: string | undefined;
};

export function TransferOwnershipDialog({
  member,
  onConfirm,
  onOpenChange,
  open,
  submitting,
  workspaceName,
}: TransferOwnershipDialogProps) {
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  if (!member) {
    return null;
  }

  const memberName = member.name ?? member.email;

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setSubmissionError(null);
    }
    onOpenChange(nextOpen);
  };

  const handleConfirm = async () => {
    setSubmissionError(null);
    try {
      await onConfirm();
      handleOpenChange(false);
    } catch (error) {
      setSubmissionError(
        error instanceof ApiError
          ? error.message
          : "Could not transfer workspace ownership. Please try again.",
      );
    }
  };

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Transfer workspace ownership</DialogTitle>
          <DialogDescription>
            Transfer primary ownership of {workspaceName ?? "this workspace"} to a current member.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-3">
            <UserAvatar
              email={member.email}
              name={member.name}
              profileImageUrl={member.profileImageUrl}
              size="md"
            />
            <div className="min-w-0">
              <p className="truncate font-medium text-foreground">{memberName}</p>
              <p className="truncate text-sm text-muted-foreground">{member.email}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {member.roles.map((role) => (
                  <Badge className="font-mono text-[11px]" key={role} variant="secondary">
                    {ROLE_LABELS[role]}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-950 dark:text-amber-100">
            <p>
              You are transferring primary ownership of this workspace to {memberName}. You will remain an Admin member.
            </p>
            <p className="mt-2">This changes who has Owner authority immediately.</p>
          </div>
          {submissionError && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive" role="alert">
              {submissionError}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button disabled={submitting} onClick={() => handleOpenChange(false)} type="button" variant="outline">
            Cancel
          </Button>
          <Button disabled={submitting} onClick={() => void handleConfirm()} type="button" variant="default">
            {submitting && <Loader2 className="size-3.5 animate-spin" />}
            Transfer ownership
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
