/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";

import { cn } from "cn";

export type UserAvatarSize = "xs" | "sm" | "md" | "lg" | "xl";

export type UserAvatarProps = {
  className?: string;
  email?: string | null;
  name: string | null | undefined;
  profileImageUrl?: string | null;
  size?: UserAvatarSize;
};

const avatarSizeClasses: Record<UserAvatarSize, string> = {
  xs: "size-6 text-[10px]",
  sm: "size-8 text-xs",
  md: "size-10 text-sm",
  lg: "size-12 text-base",
  xl: "size-20 text-xl",
};

export function getInitials(
  name: string | null | undefined,
  email?: string | null,
): string {
  const cleanName = (name ?? "").trim();

  if (cleanName.length > 0) {
    const parts = cleanName.split(/\s+/);
    const firstInitial = parts[0]?.[0] ?? "";
    const secondInitial = parts[1]?.[0] ?? "";

    return (firstInitial + secondInitial || cleanName.slice(0, 2)).toUpperCase();
  }

  return email?.slice(0, 2).toUpperCase() || "?";
}

export function UserAvatar({
  className,
  email,
  name,
  profileImageUrl,
  size = "sm",
}: UserAvatarProps) {
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null);
  const displayName = name?.trim() || email || "Unknown member";
  const imageFailed = failedImageUrl === profileImageUrl;

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-primary/10 font-semibold text-primary shadow-xs",
        avatarSizeClasses[size],
        className,
      )}
    >
      {profileImageUrl && !imageFailed ? (
        <img
          alt={`${displayName} profile photo`}
          className="size-full object-cover"
          onError={() => setFailedImageUrl(profileImageUrl)}
          src={profileImageUrl}
        />
      ) : (
        <span aria-label={`${displayName} initials`}>{getInitials(name, email)}</span>
      )}
    </div>
  );
}
