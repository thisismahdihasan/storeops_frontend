import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type CountBadgeProps = {
  className?: string;
  count: number;
  label?: string;
  pluralLabel?: string;
  children?: ReactNode;
};

export function CountBadge({
  className,
  count,
  label,
  pluralLabel,
  children,
}: CountBadgeProps) {
  const displayContent =
    children ??
    (label
      ? `${count} ${count === 1 ? label : (pluralLabel ?? `${label}s`)}`
      : count);

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full border border-amber-500/30 bg-amber-500/15 px-2.5 py-0.5 font-mono text-xs font-semibold tabular-nums text-amber-900 transition-colors dark:border-amber-500/30 dark:bg-amber-500/20 dark:text-amber-300",
        className,
      )}
    >
      {displayContent}
    </span>
  );
}
