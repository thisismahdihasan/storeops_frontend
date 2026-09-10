import { Clock, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { WorkspaceRole } from "@/features/workspace/workspace.types";

export type FeaturePlaceholderProps = {
  description?: string;
  moduleName: string;
  roles?: WorkspaceRole[];
  title: string;
};

export function FeaturePlaceholder({
  description,
  moduleName,
  roles = [],
  title,
}: FeaturePlaceholderProps) {
  return (
    <div className="flex flex-col gap-6 p-6 sm:p-8">
      <div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs uppercase tracking-wide">
            Module Preview
          </Badge>
          <span className="text-xs text-muted-foreground">StoreOps Core</span>
        </div>
        <h1 className="mt-2 font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {title}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground sm:text-base">
          {description ??
            `The ${moduleName} feature is part of the StoreOps operational pipeline and will be available in a later phase.`}
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 shadow-xs">
        <div className="flex items-start gap-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Clock className="size-5" />
          </div>
          <div className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">
              Development Roadmap Milestone
            </h2>
            <p className="text-sm text-muted-foreground">
              This route is actively mounted and routed through the authenticated StoreOps application shell.
              Your role-specific navigation and workspace routing are functioning correctly.
            </p>

            {roles.length > 0 && (
              <div className="mt-4 flex flex-wrap items-center gap-2 pt-2 border-t border-border">
                <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                  <ShieldCheck className="size-3.5 text-primary" />
                  Active Membership Roles:
                </span>
                {roles.map((role) => (
                  <Badge key={role} variant="secondary" className="text-xs font-mono">
                    {role}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
