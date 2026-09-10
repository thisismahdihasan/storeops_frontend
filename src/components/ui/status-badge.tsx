import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type StatusBadgeTone = "danger" | "info" | "neutral" | "success" | "warning";

type StatusBadgeProps = {
  label: string;
  tone?: StatusBadgeTone;
};

const toneClasses: Record<StatusBadgeTone, string> = {
  danger: "bg-red-500/10 text-red-700 dark:text-red-400 hover:bg-red-500/15",
  info: "bg-blue-500/10 text-blue-700 dark:text-blue-400 hover:bg-blue-500/15",
  neutral: "bg-muted text-muted-foreground hover:bg-muted/80",
  success: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/15",
  warning: "bg-amber-500/10 text-amber-800 dark:text-amber-400 hover:bg-amber-500/15",
};

export function StatusBadge({ label, tone = "neutral" }: StatusBadgeProps) {
  return (
    <Badge className={cn("border-0", toneClasses[tone])} variant="secondary">
      {label}
    </Badge>
  );
}
