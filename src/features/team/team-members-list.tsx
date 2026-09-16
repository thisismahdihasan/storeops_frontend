import Link from "next/link";
import { Loader2, UsersRound } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusBadge, type StatusBadgeTone } from "@/components/ui/status-badge";
import { UserAvatar } from "@/components/ui/user-avatar";

import {
  formatPausedUntil,
  getAssignmentAvailabilityState,
  getAssignmentPausedUntil,
} from "./assignment-availability";
import { TeamMemberActions } from "./team-member-actions";
import type { TeamMember } from "./team.types";

const ROLE_LABELS = {
  ADMIN: "Admin",
  DESIGNER: "Designer",
  LISTER: "Lister",
  RESEARCHER: "Researcher",
} as const;

type TeamMembersListProps = {
  canManageMembers: boolean;
  errorMessage?: string;
  isError: boolean;
  isLoading: boolean;
  members: TeamMember[];
  onAssignmentAvailability: (member: TeamMember) => void;
  onEditRoles: (member: TeamMember) => void;
  onRemove: (member: TeamMember) => void;
  onRetry: () => void;
  workspaceId: string;
};

function formatJoinedAt(joinedAt: string) {
  const date = new Date(joinedAt);
  if (Number.isNaN(date.valueOf())) return "Unavailable";
  return new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short", year: "numeric" }).format(date);
}

function MemberIdentity({ member }: { member: TeamMember }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div aria-hidden="true" className="shrink-0">
        <UserAvatar
          email={member.email}
          name={member.name}
          profileImageUrl={member.profileImageUrl}
          size="sm"
        />
      </div>
      <div className="min-w-0">
        {member.name ? (
          <p className="truncate font-medium text-foreground">{member.name}</p>
        ) : null}
        <p className="truncate text-xs text-muted-foreground">{member.email}</p>
      </div>
    </div>
  );
}

const AVAILABILITY_LABELS = { AVAILABLE: "Available", OFF: "Off", PAUSED: "Paused" } as const;
const AVAILABILITY_TONES: Record<keyof typeof AVAILABILITY_LABELS, StatusBadgeTone> = {
  AVAILABLE: "success",
  OFF: "danger",
  PAUSED: "warning",
};

function MemberRoles({ member }: { member: TeamMember }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {member.roles.map((role) => (
        <Badge className="font-mono text-[11px]" key={role} variant="secondary">
          {ROLE_LABELS[role]}
        </Badge>
      ))}
    </div>
  );
}

function MemberAssignmentStatus({ member }: { member: TeamMember }) {
  const workerRoles = member.roles.filter((r) => r === "DESIGNER" || r === "LISTER");

  if (workerRoles.length === 0) {
    return <span className="text-muted-foreground">—</span>;
  }

  return (
    <div className="flex flex-col gap-1.5">
      {workerRoles.map((role) => {
        const availability = getAssignmentAvailabilityState(member, role);
        const pausedUntil = getAssignmentPausedUntil(member, role);
        const formattedPaused = formatPausedUntil(pausedUntil);
        const tooltip =
          availability === "PAUSED" && formattedPaused
            ? `Paused until ${formattedPaused}`
            : undefined;

        return (
          <div
            className="inline-flex w-fit items-center gap-1 rounded-md border border-border/70 bg-muted/40 p-0.5"
            key={role}
            title={tooltip}
          >
            <Badge
              className="border-0 bg-transparent px-1.5 py-0 font-mono text-[11px] font-medium text-foreground shadow-none hover:bg-transparent"
              variant="secondary"
            >
              {ROLE_LABELS[role]}
            </Badge>
            <StatusBadge
              className="h-5 border-0 px-1.5 py-0 font-mono text-[10px] font-semibold"
              tone={AVAILABILITY_TONES[availability]}
            >
              {AVAILABILITY_LABELS[availability]}
            </StatusBadge>
          </div>
        );
      })}
    </div>
  );
}

export function TeamMembersList({
  canManageMembers,
  errorMessage,
  isError,
  isLoading,
  members,
  onAssignmentAvailability,
  onEditRoles,
  onRemove,
  onRetry,
  workspaceId,
}: TeamMembersListProps) {
  if (isLoading) return <div className="flex min-h-56 items-center justify-center gap-2 rounded-xl border border-border bg-card p-6" role="status"><Loader2 className="size-5 animate-spin text-primary" /><span className="text-sm text-muted-foreground">Loading members…</span></div>;
  if (isError) return <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center" role="alert"><p className="font-medium text-destructive">Could not load workspace members</p><p className="mt-1 text-sm text-muted-foreground">{errorMessage ?? "Please try again."}</p><Button className="mt-4" onClick={onRetry} type="button" variant="outline">Try again</Button></div>;
  if (members.length === 0) return <div className="flex min-h-56 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card p-6 text-center"><UsersRound className="size-8 text-muted-foreground" /><p className="mt-3 font-medium">No workspace members yet</p><p className="mt-1 max-w-sm text-sm text-muted-foreground">Members will appear here after they accept an invitation.</p></div>;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-muted/40 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-5 py-3" scope="col">Member</th>
              <th className="px-5 py-3" scope="col">Roles</th>
              <th className="px-5 py-3" scope="col">Assignment Status</th>
              <th className="px-5 py-3" scope="col">Joined</th>
              <th className="px-5 py-3 text-right" scope="col">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {members.map((member) => (
              <tr className="align-middle" key={member.membershipId}>
                <td className="max-w-80 px-5 py-4"><MemberIdentity member={member} /></td>
                <td className="px-5 py-4"><MemberRoles member={member} /></td>
                <td className="px-5 py-4"><MemberAssignmentStatus member={member} /></td>
                <td className="whitespace-nowrap px-5 py-4 text-muted-foreground">{formatJoinedAt(member.joinedAt)}</td>
                <td className="px-5 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <Button nativeButton={false} render={<Link href={`/w/${workspaceId}/team/${member.userId}`} />} size="sm" variant="outline">View Activity</Button>
                    {canManageMembers && <TeamMemberActions member={member} onAssignmentAvailability={onAssignmentAvailability} onEditRoles={onEditRoles} onRemove={onRemove} />}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="divide-y divide-border sm:hidden">
        {members.map((member) => (
          <li className="space-y-3 p-4" key={member.membershipId}>
            <MemberIdentity member={member} />
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Roles</p>
              <MemberRoles member={member} />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Assignment Status</p>
              <MemberAssignmentStatus member={member} />
            </div>
            <p className="text-xs text-muted-foreground">Joined {formatJoinedAt(member.joinedAt)}</p>
            <div className="flex gap-2">
              <Button className="min-w-0 flex-1" nativeButton={false} render={<Link href={`/w/${workspaceId}/team/${member.userId}`} />} size="sm" variant="outline">View Activity</Button>
              {canManageMembers && <TeamMemberActions member={member} onAssignmentAvailability={onAssignmentAvailability} onEditRoles={onEditRoles} onRemove={onRemove} />}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
