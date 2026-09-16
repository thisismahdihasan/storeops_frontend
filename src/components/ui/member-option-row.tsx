import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

import { UserAvatar } from "./user-avatar";

export type MemberOptionRowProps = {
  className?: string;
  email: string;
  name: string | null;
  profileImageUrl: string | null;
  selected?: boolean;
  showEmail?: boolean;
  statusLabel?: string;
};

export function MemberOptionRow({
  className,
  email,
  name,
  profileImageUrl,
  selected = false,
  showEmail = true,
  statusLabel,
}: MemberOptionRowProps) {
  const primaryLabel = name || email;
  const showEmailSubtitle = showEmail && Boolean(name);

  return (
    <div className={cn("flex min-w-0 flex-1 items-center gap-2", className)}>
      <div aria-hidden="true" className="shrink-0">
        <UserAvatar
          email={email}
          name={name}
          profileImageUrl={profileImageUrl}
          size="xs"
        />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-xs font-medium text-foreground">
          {primaryLabel}
        </div>
        {showEmailSubtitle && (
          <div className="truncate text-[11px] text-muted-foreground">
            {email}
          </div>
        )}
      </div>
      {statusLabel && (
        <span className="shrink-0 text-[11px] text-muted-foreground">
          {statusLabel}
        </span>
      )}
      {selected && <Check aria-hidden="true" className="size-3.5 shrink-0 text-primary" />}
    </div>
  );
}
