import Link from "next/link";
import { Loader2, UsersRound } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import type { TeamMember } from "./team.types";

const ROLE_LABELS = {
  ADMIN: "Admin",
  DESIGNER: "Designer",
  LISTER: "Lister",
  RESEARCHER: "Researcher",
} as const;

type TeamMembersListProps = {
  errorMessage?: string;
  isError: boolean;
  isLoading: boolean;
  members: TeamMember[];
  onRetry: () => void;
  workspaceId: string;
};

function formatJoinedAt(joinedAt: string) {
  const date = new Date(joinedAt);
  if (Number.isNaN(date.valueOf())) return "Unavailable";
  return new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short", year: "numeric" }).format(date);
}

function MemberIdentity({ member }: { member: TeamMember }) {
  return <div className="min-w-0">{member.name && <p className="truncate font-medium text-foreground">{member.name}</p>}<p className="truncate text-sm text-muted-foreground">{member.email}</p></div>;
}

function MemberRoles({ member }: { member: TeamMember }) {
  return <div className="flex flex-wrap gap-1.5">{member.roles.map((role) => <Badge className="font-mono text-[11px]" key={role} variant="secondary">{ROLE_LABELS[role]}</Badge>)}</div>;
}

export function TeamMembersList({ errorMessage, isError, isLoading, members, onRetry, workspaceId }: TeamMembersListProps) {
  if (isLoading) return <div className="flex min-h-56 items-center justify-center gap-2 rounded-xl border border-border bg-card p-6" role="status"><Loader2 className="size-5 animate-spin text-primary" /><span className="text-sm text-muted-foreground">Loading members…</span></div>;
  if (isError) return <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center" role="alert"><p className="font-medium text-destructive">Could not load workspace members</p><p className="mt-1 text-sm text-muted-foreground">{errorMessage ?? "Please try again."}</p><Button className="mt-4" onClick={onRetry} type="button" variant="outline">Try again</Button></div>;
  if (members.length === 0) return <div className="flex min-h-56 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card p-6 text-center"><UsersRound className="size-8 text-muted-foreground" /><p className="mt-3 font-medium">No workspace members yet</p><p className="mt-1 max-w-sm text-sm text-muted-foreground">Members will appear here after they accept an invitation.</p></div>;

  return <div className="overflow-hidden rounded-xl border border-border bg-card"><div className="hidden overflow-x-auto sm:block"><table className="w-full text-left text-sm"><thead className="border-b border-border bg-muted/40 text-xs font-semibold uppercase tracking-wide text-muted-foreground"><tr><th className="px-5 py-3" scope="col">Member</th><th className="px-5 py-3" scope="col">Roles</th><th className="px-5 py-3" scope="col">Joined</th><th className="px-5 py-3 text-right" scope="col">Actions</th></tr></thead><tbody className="divide-y divide-border">{members.map((member) => <tr className="align-middle" key={member.membershipId}><td className="max-w-80 px-5 py-4"><MemberIdentity member={member} /></td><td className="px-5 py-4"><MemberRoles member={member} /></td><td className="whitespace-nowrap px-5 py-4 text-muted-foreground">{formatJoinedAt(member.joinedAt)}</td><td className="px-5 py-4 text-right"><Button nativeButton={false} render={<Link href={`/w/${workspaceId}/team/${member.userId}`} />} size="sm" variant="outline">View Activity</Button></td></tr>)}</tbody></table></div><ul className="divide-y divide-border sm:hidden">{members.map((member) => <li className="space-y-3 p-4" key={member.membershipId}><MemberIdentity member={member} /><div className="space-y-1"><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Roles</p><MemberRoles member={member} /></div><p className="text-xs text-muted-foreground">Joined {formatJoinedAt(member.joinedAt)}</p><Button className="w-full" nativeButton={false} render={<Link href={`/w/${workspaceId}/team/${member.userId}`} />} size="sm" variant="outline">View Activity</Button></li>)}</ul></div>;
}
