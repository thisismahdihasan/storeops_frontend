"use client";

import { CalendarClock, Ellipsis, Pencil, UserRoundMinus } from "lucide-react";

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
  member: TeamMember;
  onAssignmentAvailability: (member: TeamMember) => void;
  onEditRoles: (member: TeamMember) => void;
  onRemove: (member: TeamMember) => void;
};

export function TeamMemberActions({ member, onAssignmentAvailability, onEditRoles, onRemove }: TeamMemberActionsProps) {
  const memberLabel = member.name ?? member.email;
  const hasWorkerRole = member.roles.includes("DESIGNER") || member.roles.includes("LISTER");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button aria-label={`Manage ${memberLabel}`} size="icon-sm" variant="outline" />}>
        <Ellipsis />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onEditRoles(member)}>
          <Pencil />
          Edit roles
        </DropdownMenuItem>
        {hasWorkerRole && (
          <DropdownMenuItem onClick={() => onAssignmentAvailability(member)}>
            <CalendarClock />
            Assignment availability
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onRemove(member)} variant="destructive">
          <UserRoundMinus />
          Remove member
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
