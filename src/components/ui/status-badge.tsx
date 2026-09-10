import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type StatusBadgeTone = "danger" | "info" | "neutral" | "success" | "warning";

type StatusBadgeProps = {
  label: string;
  tone?: StatusBadgeTone;
};

const toneClasses: Record<StatusBadgeTone, string> = {
  danger: "bg-red-50 text-red-700 hover:bg-red-50",
  info: "bg-blue-50 text-blue-700 hover:bg-blue-50",
  neutral: "bg-slate-100 text-slate-700 hover:bg-slate-100",
  success: "bg-emerald-50 text-emerald-700 hover:bg-emerald-50",
  warning: "bg-amber-50 text-amber-800 hover:bg-amber-50",
};

export function StatusBadge({ label, tone = "neutral" }: StatusBadgeProps) {
  return (
    <Badge className={cn("border-0", toneClasses[tone])} variant="secondary">
      {label}
    </Badge>
  );
}
