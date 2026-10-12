import type { ComponentProps } from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

type NativeSelectProps = ComponentProps<"select"> & {
  wrapperClassName?: string;
};

export function NativeSelect({
  children,
  className,
  wrapperClassName,
  ...props
}: NativeSelectProps) {
  return (
    <div className={cn("relative inline-block", wrapperClassName)}>
      <select {...props} className={cn("appearance-none", className)}>
        {children}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
      />
    </div>
  );
}
