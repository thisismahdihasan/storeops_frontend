"use client";

import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import type { TeamMember } from "@/features/team/team.types";

import type { ActiveIssue } from "./issues.types";

type ReassignIssueDialogProps = {
  designers: TeamMember[];
  isLoadingDesigners: boolean;
  isReassigning: boolean;
  issue: ActiveIssue | null;
  onOpenChange: (open: boolean) => void;
  onReassign: (designerId: string) => Promise<void>;
  open: boolean;
};

function displayName(name: string | null, email: string): string {
  return name || email;
}

export function ReassignIssueDialog({
  designers,
  isLoadingDesigners,
  isReassigning,
  issue,
  onOpenChange,
  onReassign,
  open,
}: ReassignIssueDialogProps) {
  if (!issue) return null;

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reassign design work</DialogTitle>
          <DialogDescription>
            This item will return to Assigned and the selected Designer will be notified.
          </DialogDescription>
        </DialogHeader>

        {open && <ReassignIssueForm designers={designers} isLoadingDesigners={isLoadingDesigners} isReassigning={isReassigning} issue={issue} onClose={() => onOpenChange(false)} onReassign={onReassign} />}
      </DialogContent>
    </Dialog>
  );
}

type ReassignIssueFormProps = {
  designers: TeamMember[];
  isLoadingDesigners: boolean;
  isReassigning: boolean;
  issue: ActiveIssue;
  onClose: () => void;
  onReassign: (designerId: string) => Promise<void>;
};

function ReassignIssueForm({ designers, isLoadingDesigners, isReassigning, issue, onClose, onReassign }: ReassignIssueFormProps) {
  const [designerId, setDesignerId] = useState("");
  const alternateDesigners = useMemo(
    () => designers.filter((designer) => designer.userId !== issue.currentDesigner?.id),
    [designers, issue.currentDesigner?.id],
  );
  const hasNoAlternateDesigner = !isLoadingDesigners && alternateDesigners.length === 0;

  const handleReassign = async () => {
    if (!designerId) return;
    await onReassign(designerId);
  };

  return (
    <>
      <div className="space-y-4">
        <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm">
          <p className="text-xs text-muted-foreground">Current Designer</p>
          {issue.currentDesigner ? (
            <>
              <p className="mt-1 font-medium">{displayName(issue.currentDesigner.name, issue.currentDesigner.email)}</p>
              <p className="text-xs text-muted-foreground">{issue.currentDesigner.email}</p>
            </>
          ) : (
            <p className="mt-1 font-medium">No current Designer</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="issue-reassignment-designer">New Designer</Label>
          <select
            aria-describedby={hasNoAlternateDesigner ? "issue-reassignment-help" : undefined}
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isLoadingDesigners || isReassigning || hasNoAlternateDesigner}
            id="issue-reassignment-designer"
            onChange={(event) => setDesignerId(event.target.value)}
            value={designerId}
          >
            <option value="">{isLoadingDesigners ? "Loading Designers..." : "Select a Designer"}</option>
            {alternateDesigners.map((designer) => (
              <option key={designer.userId} value={designer.userId}>
                {displayName(designer.name, designer.email)} — {designer.email}
              </option>
            ))}
          </select>
          {hasNoAlternateDesigner && (
            <p className="text-xs text-muted-foreground" id="issue-reassignment-help">
              No alternate Designer is available for reassignment.
            </p>
          )}
        </div>
      </div>

      <DialogFooter>
        <Button disabled={isReassigning} onClick={onClose} type="button" variant="outline">Cancel</Button>
        <Button disabled={!designerId || isLoadingDesigners || isReassigning || hasNoAlternateDesigner} onClick={() => void handleReassign()} type="button">
          {isReassigning && <Loader2 className="size-3.5 animate-spin" />}
          {isReassigning ? "Reassigning..." : "Reassign"}
        </Button>
      </DialogFooter>
    </>
  );
}
