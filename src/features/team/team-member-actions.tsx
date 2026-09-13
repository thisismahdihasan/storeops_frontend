"use client";

import { Ellipsis, Pencil, UserRoundMinus } from "lucide-react";

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
  onEditRoles: (member: TeamMember) => void;
  onRemove: (member: TeamMember) => void;
};

export function TeamMemberActions({ member, onEditRoles, onRemove }: TeamMemberActionsProps) {
  const memberLabel = member.name ?? member.email;

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
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onRemove(member)} variant="destructive">
          <UserRoundMinus />
          Remove member
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
