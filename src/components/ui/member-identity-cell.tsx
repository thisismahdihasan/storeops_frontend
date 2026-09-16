"use client";

import Link from "next/link";

import { UserAvatar } from "@/components/ui/user-avatar";

export type MemberIdentityCellProps = {
  email: string;
  fallbackLabel?: string;
  href?: string;
  name: string | null;
  profileImageUrl: string | null;
};

export function MemberIdentityCell({
  email,
  fallbackLabel,
  href,
  name,
  profileImageUrl,
}: MemberIdentityCellProps) {
  const visibleName = name || fallbackLabel || "Unnamed";
  const nameClassName = "min-w-0 truncate text-sm font-medium text-foreground";

  return (
    <div className="flex min-w-0 max-w-[200px] items-center gap-2">
      <div aria-hidden="true" className="shrink-0">
        <UserAvatar
          email={email}
          name={name}
          profileImageUrl={profileImageUrl}
          size="sm"
        />
      </div>
      {href ? (
        <Link className={`${nameClassName} hover:underline`} href={href}>
          {visibleName}
        </Link>
      ) : (
        <span className={nameClassName}>{visibleName}</span>
      )}
    </div>
  );
}
