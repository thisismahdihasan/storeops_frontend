"use client";

import { LogOut, Pencil, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/ui/user-avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { CurrentUser } from "@/features/auth/auth.types";
import { useLogout } from "@/features/auth/use-logout";
import type { WorkspaceRole } from "@/features/workspace/workspace.types";

export type UserMenuProps = {
  activeRoles?: WorkspaceRole[];
  onEditProfile: () => void;
  user: CurrentUser;
};

export function UserMenu({ activeRoles = [], onEditProfile, user }: UserMenuProps) {
  const logoutMutation = useLogout();
  const visibleRoles = activeRoles.slice(0, 2);
  const hiddenRolesCount = activeRoles.length - visibleRoles.length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            aria-label="Open profile menu"
            className="rounded-full p-0 transition-opacity hover:opacity-80"
            size="icon"
            variant="ghost"
          />
        }
      >
        <UserAvatar
          email={user.email}
          name={user.name}
          profileImageUrl={user.profileImageUrl}
        />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64 max-w-[calc(100vw-1rem)] p-1.5">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="font-normal">
            <div className="flex items-center gap-3 p-1">
              <UserAvatar
                email={user.email}
                name={user.name}
                profileImageUrl={user.profileImageUrl}
                size="md"
              />
              <div className="min-w-0 space-y-1">
                <p className="truncate text-sm font-semibold leading-none text-foreground">
                  {user.name || user.email}
                </p>
                <p className="truncate text-xs leading-none text-muted-foreground">
                  {user.email}
                </p>
              </div>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>

        {activeRoles.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="px-2 py-1.5">
              <div className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground mb-1.5">
                <ShieldCheck className="size-3 text-primary" />
                <span>Active Roles</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {visibleRoles.map((role) => (
                  <Badge key={role} variant="secondary" className="text-[10px] px-1.5 py-0 font-mono">
                    {role}
                  </Badge>
                ))}
                {hiddenRolesCount > 0 ? (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-mono">
                    +{hiddenRolesCount}
                  </Badge>
                ) : null}
              </div>
            </div>
          </>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onEditProfile} className="cursor-pointer">
          <Pencil className="mr-2 size-4" />
          <span>Edit profile</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          disabled={logoutMutation.isPending}
          onClick={() => logoutMutation.mutate()}
          className="cursor-pointer"
        >
          <LogOut className="size-4 mr-2" />
          <span>{logoutMutation.isPending ? "Signing out..." : "Sign out"}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
