"use client";

import { ArrowRightLeft, CalendarClock, Ellipsis, Pencil, UserRoundMinus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import type { TeamMember } from "./team.types";

type TeamMemberActionsProps = {
  canTransferOwnership: boolean;
  isActorAdmin: boolean;
  isActorOwner: boolean;
  isSelf: boolean;
  isTargetOwner: boolean;
  member: TeamMember;
  onAssignmentAvailability: (member: TeamMember) => void;
  onEditRoles: (member: TeamMember) => void;
  onRemove: (member: TeamMember) => void;
  onTransferOwnership: (member: TeamMember) => void;
};

export function TeamMemberActions({
  canTransferOwnership,
  isActorAdmin,
  isActorOwner,
  isSelf,
  isTargetOwner,
  member,
  onAssignmentAvailability,
  onEditRoles,
  onRemove,
  onTransferOwnership,
}: TeamMemberActionsProps) {
  const memberLabel = member.name ?? member.email;
  const hasWorkerRole = member.roles.includes("DESIGNER") || member.roles.includes("LISTER");
  const targetIsAdmin = member.roles.includes("ADMIN");
  const canManageRoles = isActorOwner || (!isTargetOwner && isActorAdmin);
  const canRemove =
    !isTargetOwner &&
    !isSelf &&
    (isActorOwner || (!targetIsAdmin && isActorAdmin));
  const canManageAssignmentAvailability = canManageRoles && hasWorkerRole;

  if (!canManageRoles && !canRemove && !canTransferOwnership) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button aria-label={`Manage ${memberLabel}`} size="icon-sm" variant="outline" />}>
        <Ellipsis />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {canManageRoles && (
          <DropdownMenuItem onClick={() => onEditRoles(member)}>
            <Pencil />
            Edit roles
          </DropdownMenuItem>
        )}
        {canManageAssignmentAvailability && (
          <DropdownMenuItem onClick={() => onAssignmentAvailability(member)}>
            <CalendarClock />
            Assignment availability
          </DropdownMenuItem>
        )}
        {(canRemove || canTransferOwnership) && <DropdownMenuSeparator />}
        {canTransferOwnership && (
          <DropdownMenuItem className="text-amber-700 focus:text-amber-800 dark:text-amber-400 dark:focus:text-amber-300" onClick={() => onTransferOwnership(member)}>
            <ArrowRightLeft />
            Transfer ownership
          </DropdownMenuItem>
        )}
        {canRemove && (
          <DropdownMenuItem onClick={() => onRemove(member)} variant="destructive">
            <UserRoundMinus />
            Remove member
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
