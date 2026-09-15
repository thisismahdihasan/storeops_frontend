import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Info,
  XCircle,
} from "lucide-react";

import { cn } from "@/lib/utils";

const inlineNoticeVariants = cva(
  "flex items-start gap-3 rounded-md border p-4 text-sm",
  {
    variants: {
      variant: {
        danger: "border-destructive/20 bg-destructive/10 text-destructive",
        info: "border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-400",
        neutral: "border-border bg-muted text-muted-foreground",
        success:
          "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
        warning:
          "border-amber-500/50 bg-amber-500/20 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  },
);

const defaultIcons = {
  danger: XCircle,
  info: Info,
  neutral: Bell,
  success: CheckCircle2,
  warning: AlertTriangle,
};

export interface InlineNoticeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof inlineNoticeVariants> {
  icon?: React.ElementType;
  title?: string;
}

export function InlineNotice({
  children,
  className,
  icon: Icon,
  title,
  variant = "neutral",
  ...props
}: InlineNoticeProps) {
  const NoticeIcon = Icon ?? (variant ? defaultIcons[variant] : defaultIcons.neutral);

  return (
    <div
      className={cn(inlineNoticeVariants({ variant }), className)}
      role="region"
      {...props}
    >
      <NoticeIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <div className="flex flex-col gap-1 leading-relaxed">
        {title ? (
          <h5 className="font-medium leading-none tracking-tight text-current">
            {title}
          </h5>
        ) : null}
        <div className="text-current opacity-90">{children}</div>
      </div>
    </div>
  );
}
