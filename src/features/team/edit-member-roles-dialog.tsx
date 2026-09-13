"use client";

import { Loader2 } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { WorkspaceRole } from "@/features/workspace/workspace.types";

import { getMemberMutationErrorMessage } from "./member-mutation-errors";
import type { TeamMember } from "./team.types";

const ROLE_OPTIONS: Array<{
  description: string;
  label: string;
  value: WorkspaceRole;
}> = [
  { description: "Manage workspace settings and review work.", label: "Admin", value: "ADMIN" },
  { description: "Create and manage research items.", label: "Researcher", value: "RESEARCHER" },
  { description: "Work on assigned design tasks.", label: "Designer", value: "DESIGNER" },
  { description: "Prepare approved designs for listing.", label: "Lister", value: "LISTER" },
];

type EditMemberRolesDialogProps = {
  member: TeamMember | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (roles: WorkspaceRole[]) => Promise<void>;
  open: boolean;
  submitting: boolean;
};

function sameRoles(left: WorkspaceRole[], right: WorkspaceRole[]) {
  return left.length === right.length && left.every((role) => right.includes(role));
}

export function EditMemberRolesDialog({
  member,
  onOpenChange,
  onSubmit,
  open,
  submitting,
}: EditMemberRolesDialogProps) {
  const [roles, setRoles] = useState<WorkspaceRole[]>(member?.roles ?? []);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  const isUnchanged = useMemo(
    () => (member ? sameRoles(roles, member.roles) : true),
    [member, roles],
  );

  if (!member) {
    return null;
  }

  const toggleRole = (role: WorkspaceRole) => {
    setRoles((currentRoles) =>
      currentRoles.includes(role)
        ? currentRoles.filter((currentRole) => currentRole !== role)
        : [...currentRoles, role],
    );
    setSubmissionError(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (roles.length === 0) {
      setSubmissionError("Select at least one role.");
      return;
    }

    setSubmissionError(null);
    try {
      await onSubmit(roles);
      onOpenChange(false);
    } catch (error) {
      setSubmissionError(getMemberMutationErrorMessage(error, "roles"));
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setSubmissionError(null);
    }
    onOpenChange(nextOpen);
  };

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit member roles</DialogTitle>
          <DialogDescription>
            Update the explicit workspace roles for {member.name ?? member.email}.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="rounded-lg border border-border bg-muted/30 p-3">
            {member.name && <p className="font-medium text-foreground">{member.name}</p>}
            <p className="text-sm text-muted-foreground">{member.email}</p>
          </div>
          {submissionError && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive" role="alert">
              {submissionError}
            </div>
          )}
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-foreground">Roles</legend>
            <p className="text-xs text-muted-foreground">Select every role this member should retain.</p>
            <div className="grid gap-2 pt-1 sm:grid-cols-2">
              {ROLE_OPTIONS.map((role) => {
                const inputId = `team-member-role-${member.userId}-${role.value.toLowerCase()}`;
                const selected = roles.includes(role.value);

                return (
                  <label
                    className="flex cursor-pointer gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                    htmlFor={inputId}
                    key={role.value}
                  >
                    <input
                      checked={selected}
                      className="mt-0.5 size-4 shrink-0 accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      disabled={submitting}
                      id={inputId}
                      onChange={() => toggleRole(role.value)}
                      type="checkbox"
                    />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium">{role.label}</span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">{role.description}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>
          <DialogFooter>
            <Button disabled={submitting} onClick={() => handleOpenChange(false)} type="button" variant="outline">
              Cancel
            </Button>
            <Button disabled={submitting || isUnchanged || roles.length === 0} type="submit">
              {submitting && <Loader2 className="size-3.5 animate-spin" />}
              Save roles
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
