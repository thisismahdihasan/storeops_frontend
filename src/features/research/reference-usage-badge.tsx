import { cn } from "@/lib/utils";

type ReferenceUsageBadgeProps = {
  onClick?: () => void;
  usageCount: number;
};

export function ReferenceUsageBadge({
  onClick,
  usageCount,
}: ReferenceUsageBadgeProps) {
  if (usageCount <= 1) {
    return null;
  }

  const label = `Used ${usageCount} times in this workspace`;
  const className = cn(
    "inline-flex items-center rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-400",
    onClick && "cursor-pointer transition-colors hover:border-amber-500/50 hover:bg-amber-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
  );

  if (!onClick) {
    return (
      <span className={className} title={label}>
        {`Used ${usageCount}x`}
      </span>
    );
  }

  return (
    <button
      aria-label={`${label}. View reference history.`}
      className={className}
      onClick={onClick}
      title={label}
      type="button"
    >
      {`Used ${usageCount}x`}
    </button>
  );
}
