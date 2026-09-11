"use client";

import { Loader2, RefreshCw, Send, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import type { PendingWorkspaceInvite } from "./team.types";

const RESEND_COOLDOWN_MS = 5 * 60 * 1000;

const ROLE_LABELS = {
  ADMIN: "Admin",
  DESIGNER: "Designer",
  LISTER: "Lister",
  RESEARCHER: "Researcher",
} as const;

type PendingInvitesListProps = {
  cooldownEndsAtByInviteId: Record<string, number>;
  errorMessage?: string;
  invites: PendingWorkspaceInvite[];
  isError: boolean;
  isLoading: boolean;
  isResendingInviteId?: string;
  onResend: (invite: PendingWorkspaceInvite) => void;
  onRetry: () => void;
  onRevoke: (invite: PendingWorkspaceInvite) => Promise<void>;
};

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.valueOf())) {
    return "Unavailable";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getLocalCooldownEndsAt(invite: PendingWorkspaceInvite) {
  if (!invite.lastSentAt) {
    return 0;
  }

  const sentAt = new Date(invite.lastSentAt).valueOf();

  return Number.isNaN(sentAt) ? 0 : sentAt + RESEND_COOLDOWN_MS;
}

function formatRemainingDuration(remainingSeconds: number) {
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;

  return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
}

function InviteRoles({ invite }: { invite: PendingWorkspaceInvite }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {invite.roles.map((role) => (
        <Badge className="font-mono text-[11px]" key={role} variant="secondary">
          {ROLE_LABELS[role]}
        </Badge>
      ))}
    </div>
  );
}

function InviteStatus({ invite }: { invite: PendingWorkspaceInvite }) {
  return (
    <Badge variant={invite.status === "PENDING" ? "secondary" : "outline"}>
      {invite.status === "PENDING" ? "Pending" : "Expired"}
    </Badge>
  );
}

function InviteActions({
  isResending,
  onResend,
  onRevoke,
  remainingSeconds,
}: {
  isResending: boolean;
  onResend: () => void;
  onRevoke: () => Promise<void>;
  remainingSeconds: number;
}) {
  const isCoolingDown = remainingSeconds > 0;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        disabled={isCoolingDown || isResending}
        onClick={onResend}
        size="sm"
        type="button"
        variant="outline"
      >
        {isResending ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
        {isCoolingDown ? `Resend in ${formatRemainingDuration(remainingSeconds)}` : "Resend invite"}
      </Button>
      <ConfirmDialog
        confirmLabel="Revoke invitation"
        description="Revoke this invitation? The existing invitation link will stop working."
        onConfirm={onRevoke}
        title="Revoke invitation"
        trigger={
          <Button disabled={isResending} size="sm" type="button" variant="destructive">
            <Trash2 className="size-3.5" />
            Revoke
          </Button>
        }
      />
    </div>
  );
}

export function PendingInvitesList({
  cooldownEndsAtByInviteId,
  errorMessage,
  invites,
  isError,
  isLoading,
  isResendingInviteId,
  onResend,
  onRetry,
  onRevoke,
}: PendingInvitesListProps) {
  const [now, setNow] = useState(() => Date.now());
  const hasActiveCooldown = invites.some((invite) => {
    const cooldownEndsAt = Math.max(
      getLocalCooldownEndsAt(invite),
      cooldownEndsAtByInviteId[invite.id] ?? 0,
    );

    return cooldownEndsAt > now;
  });

  useEffect(() => {
    if (!hasActiveCooldown) {
      return;
    }

    const intervalId = window.setInterval(() => setNow(Date.now()), 1_000);

    return () => window.clearInterval(intervalId);
  }, [hasActiveCooldown]);

  if (isLoading) {
    return (
      <div className="flex min-h-48 items-center justify-center gap-2 rounded-xl border border-border bg-card p-6" role="status">
        <Loader2 className="size-5 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground">Loading pending invitations…</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center" role="alert">
        <p className="font-medium text-destructive">Could not load pending invitations</p>
        <p className="mt-1 text-sm text-muted-foreground">{errorMessage ?? "Please try again."}</p>
        <Button className="mt-4" onClick={onRetry} type="button" variant="outline">Try again</Button>
      </div>
    );
  }

  if (invites.length === 0) {
    return (
      <div className="flex min-h-48 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card p-6 text-center">
        <Send className="size-8 text-muted-foreground" />
        <p className="mt-3 font-medium">No pending invitations.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-muted/40 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-5 py-3" scope="col">Email</th>
              <th className="px-5 py-3" scope="col">Roles</th>
              <th className="px-5 py-3" scope="col">Status</th>
              <th className="px-5 py-3" scope="col">Sent</th>
              <th className="px-5 py-3" scope="col">Expires</th>
              <th className="px-5 py-3" scope="col"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {invites.map((invite) => {
              const cooldownEndsAt = Math.max(
                getLocalCooldownEndsAt(invite),
                cooldownEndsAtByInviteId[invite.id] ?? 0,
              );
              const remainingSeconds = Math.max(0, Math.ceil((cooldownEndsAt - now) / 1_000));

              return (
                <tr className="align-middle" key={invite.id}>
                  <td className="max-w-64 px-5 py-4 font-medium">{invite.email}</td>
                  <td className="px-5 py-4"><InviteRoles invite={invite} /></td>
                  <td className="px-5 py-4"><InviteStatus invite={invite} /></td>
                  <td className="whitespace-nowrap px-5 py-4 text-muted-foreground">{formatDateTime(invite.lastSentAt ?? invite.createdAt)}</td>
                  <td className="whitespace-nowrap px-5 py-4 text-muted-foreground">{formatDateTime(invite.expiresAt)}</td>
                  <td className="px-5 py-4"><InviteActions isResending={isResendingInviteId === invite.id} onResend={() => onResend(invite)} onRevoke={() => onRevoke(invite)} remainingSeconds={remainingSeconds} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <ul className="divide-y divide-border lg:hidden">
        {invites.map((invite) => {
          const cooldownEndsAt = Math.max(
            getLocalCooldownEndsAt(invite),
            cooldownEndsAtByInviteId[invite.id] ?? 0,
          );
          const remainingSeconds = Math.max(0, Math.ceil((cooldownEndsAt - now) / 1_000));

          return (
            <li className="space-y-3 p-4" key={invite.id}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="min-w-0 break-all font-medium">{invite.email}</p>
                <InviteStatus invite={invite} />
              </div>
              <InviteRoles invite={invite} />
              <div className="grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
                <p>Invite sent {formatDateTime(invite.lastSentAt ?? invite.createdAt)}</p>
                <p>Expires {formatDateTime(invite.expiresAt)}</p>
              </div>
              <InviteActions isResending={isResendingInviteId === invite.id} onResend={() => onResend(invite)} onRevoke={() => onRevoke(invite)} remainingSeconds={remainingSeconds} />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
