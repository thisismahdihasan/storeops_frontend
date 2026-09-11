"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api";

import { createWorkspaceInviteInputSchema } from "./team.schemas";
import type { CreateWorkspaceInviteInput, WorkspaceInvite } from "./team.types";
import { useCreateWorkspaceInvite } from "./use-team";

const ROLE_OPTIONS: Array<{ description: string; label: string; value: CreateWorkspaceInviteInput["roles"][number] }> = [
  { description: "Manage workspace access and operations.", label: "Admin", value: "ADMIN" },
  { description: "Research and add marketplace listings.", label: "Researcher", value: "RESEARCHER" },
  { description: "Create and submit design work.", label: "Designer", value: "DESIGNER" },
  { description: "Prepare approved work for listing.", label: "Lister", value: "LISTER" },
];

const defaultValues: CreateWorkspaceInviteInput = { email: "", roles: [] };

type InviteMemberDialogProps = {
  onOpenChange: (open: boolean) => void;
  open: boolean;
  workspaceId: string;
};

function formatExpiry(expiresAt: string) {
  const date = new Date(expiresAt);
  if (Number.isNaN(date.valueOf())) return "the expiry time provided in the invitation";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function getInviteErrorMessage(error: unknown) {
  if (error instanceof ApiError && error.status === 409) {
    const message = error.message.toLowerCase();
    if (message.includes("member")) return "This email already belongs to a workspace member.";
    if (message.includes("invite")) return "An active invitation already exists for this email. You can resend or revoke it from Pending Invites.";
    return "This email already belongs to a workspace member or has an active invitation.";
  }
  return error instanceof Error ? error.message : "Could not create the invitation. Please try again.";
}

function InviteSuccess({ invite, onDone }: { invite: WorkspaceInvite; onDone: () => void }) {
  return <><DialogHeader><CheckCircle2 className="size-8 text-primary" /><DialogTitle>Invitation sent</DialogTitle><DialogDescription>{invite.email} has been invited with {invite.roles.map((role) => role.toLowerCase()).join(", ")} access.</DialogDescription></DialogHeader><div className="space-y-3 rounded-lg border border-border bg-muted/40 p-4 text-sm"><div><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Expires</p><p className="mt-1 font-medium">{formatExpiry(invite.expiresAt)}</p></div><p className="text-muted-foreground">The recipient should register or sign in using this email address and open the invitation link from their email.</p></div><DialogFooter><Button onClick={onDone} type="button">Done</Button></DialogFooter></>;
}

export function InviteMemberDialog({ onOpenChange, open, workspaceId }: InviteMemberDialogProps) {
  const inviteMutation = useCreateWorkspaceInvite(workspaceId);
  const [invite, setInvite] = useState<WorkspaceInvite | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const form = useForm<CreateWorkspaceInviteInput>({ defaultValues, resolver: zodResolver(createWorkspaceInviteInputSchema) });
  const selectedRoles = useWatch({ control: form.control, name: "roles" }) ?? [];

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      form.reset(defaultValues);
      inviteMutation.reset();
      setInvite(null);
      setSubmissionError(null);
    }

    onOpenChange(nextOpen);
  };

  const handleSubmit = async (values: CreateWorkspaceInviteInput) => {
    setSubmissionError(null);
    try {
      const response = await inviteMutation.mutateAsync(values);
      setInvite(response.data.invite);
      form.reset(defaultValues);
      toast.success("Invitation sent successfully.");
    } catch (error) {
      const message = getInviteErrorMessage(error);
      setSubmissionError(message);
      toast.error(message);
    }
  };

  return <Dialog onOpenChange={handleOpenChange} open={open}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg" showCloseButton={!invite}>{invite ? <InviteSuccess invite={invite} onDone={() => handleOpenChange(false)} /> : <><DialogHeader><DialogTitle>Invite member</DialogTitle><DialogDescription>Send a StoreOps workspace invitation with one or more supported roles.</DialogDescription></DialogHeader><form className="space-y-5" onSubmit={form.handleSubmit(handleSubmit)}>{submissionError && <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive" role="alert">{submissionError}</div>}<div className="space-y-2"><Label htmlFor="team-invite-email">Email</Label><Input aria-describedby={form.formState.errors.email ? "team-invite-email-error" : undefined} aria-invalid={Boolean(form.formState.errors.email)} autoComplete="email" disabled={inviteMutation.isPending} id="team-invite-email" placeholder="name@example.com" type="email" {...form.register("email")} />{form.formState.errors.email && <p className="text-xs font-medium text-destructive" id="team-invite-email-error">{form.formState.errors.email.message}</p>}</div><fieldset aria-describedby={form.formState.errors.roles ? "team-invite-roles-error" : undefined} className="space-y-2"><legend className="text-sm font-medium text-foreground">Roles</legend><p className="text-xs text-muted-foreground">Select every role this member should receive.</p><div className="grid gap-2 pt-1 sm:grid-cols-2">{ROLE_OPTIONS.map((role) => { const inputId = `team-invite-role-${role.value.toLowerCase()}`; const selected = selectedRoles.includes(role.value); return <label className="flex cursor-pointer gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5" htmlFor={inputId} key={role.value}><input className="mt-0.5 size-4 shrink-0 accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" disabled={inviteMutation.isPending} id={inputId} type="checkbox" value={role.value} {...form.register("roles")} /><span className="min-w-0"><span className="block text-sm font-medium">{role.label}</span><span className="mt-0.5 block text-xs text-muted-foreground">{role.description}</span></span><span className="sr-only">{selected ? "Selected" : "Not selected"}</span></label>; })}</div>{form.formState.errors.roles && <p className="text-xs font-medium text-destructive" id="team-invite-roles-error">{form.formState.errors.roles.message}</p>}</fieldset><DialogFooter><Button disabled={inviteMutation.isPending} onClick={() => handleOpenChange(false)} type="button" variant="outline">Cancel</Button><Button disabled={inviteMutation.isPending} type="submit">{inviteMutation.isPending && <Loader2 className="size-3.5 animate-spin" />}Send invitation</Button></DialogFooter></form></>}</DialogContent></Dialog>;
}
