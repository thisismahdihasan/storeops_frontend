import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type StatusBadgeTone = "danger" | "info" | "neutral" | "success" | "warning";

export type StatusBadgeProps = {
  children?: ReactNode;
  className?: string;
  label?: string;
  tone?: StatusBadgeTone;
};

export const STATUS_TONE_TEXT_CLASSES: Record<StatusBadgeTone, string> = {
  danger: "text-red-700 dark:text-red-400",
  info: "text-blue-700 dark:text-blue-400",
  neutral: "text-muted-foreground",
  success: "text-emerald-700 dark:text-emerald-400",
  warning: "text-amber-800 dark:text-amber-400",
};

export const STATUS_TONE_BADGE_CLASSES: Record<StatusBadgeTone, string> = {
  danger: "bg-red-500/10 text-red-700 dark:text-red-400 hover:bg-red-500/15",
  info: "bg-blue-500/10 text-blue-700 dark:text-blue-400 hover:bg-blue-500/15",
  neutral: "bg-muted text-muted-foreground hover:bg-muted/80",
  success: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/15",
  warning: "bg-amber-500/10 text-amber-800 dark:text-amber-400 hover:bg-amber-500/15",
};

export function StatusBadge({
  children,
  className,
  label,
  tone = "neutral",
}: StatusBadgeProps) {
  return (
    <Badge
      className={cn("border-0", STATUS_TONE_BADGE_CLASSES[tone], className)}
      variant="secondary"
    >
      {children ?? label}
    </Badge>
  );
}
