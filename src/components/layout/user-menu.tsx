"use client";

import { LogOut, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
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
  user: CurrentUser;
};

export function getInitials(name: string | null | undefined, email: string): string {
  const cleanName = (name ?? "").trim();
  if (cleanName.length > 0) {
    const parts = cleanName.split(/\s+/);
    if (parts.length >= 2 && parts[0] && parts[1]) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return cleanName.slice(0, 2).toUpperCase();
  }

  return email.slice(0, 2).toUpperCase();
}

export function UserMenu({ activeRoles = [], user }: UserMenuProps) {
  const logoutMutation = useLogout();
  const initials = getInitials(user.name, user.email);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex size-8 items-center justify-center rounded-full border border-border bg-primary/10 text-xs font-semibold text-primary shadow-xs transition-opacity hover:opacity-80 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="User account menu"
      >
        {initials}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-semibold leading-none text-foreground">
              {user.name}
            </p>
            <p className="text-xs leading-none text-muted-foreground truncate">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>

        {activeRoles.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="px-2 py-1.5">
              <div className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground mb-1.5">
                <ShieldCheck className="size-3 text-primary" />
                <span>Active Roles</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {activeRoles.map((role) => (
                  <Badge key={role} variant="secondary" className="text-[10px] px-1.5 py-0 font-mono">
                    {role}
                  </Badge>
                ))}
              </div>
            </div>
          </>
        )}

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
