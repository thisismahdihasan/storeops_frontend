import { Badge } from "@/components/ui/badge";
import type { WorkspaceRole } from "@/features/workspace/workspace.types";

const ROLE_LABELS: Record<WorkspaceRole, string> = {
  ADMIN: "Admin",
  DESIGNER: "Designer",
  LISTER: "Lister",
  RESEARCHER: "Researcher",
};

export function summarizeWorkspaceRoles(roles: WorkspaceRole[]): string {
  const visibleRoles = roles.slice(0, 2).map((role) => ROLE_LABELS[role]);
  const hiddenCount = roles.length - visibleRoles.length;

  return hiddenCount > 0
    ? `${visibleRoles.join(" · ")} +${hiddenCount}`
    : visibleRoles.join(" · ");
}

export function WorkspaceRoleSummary({ roles }: { roles: WorkspaceRole[] }) {
  const visibleRoles = roles.slice(0, 2);
  const hiddenCount = roles.length - visibleRoles.length;

  return (
    <div
      aria-label={`Active roles: ${roles.map((role) => ROLE_LABELS[role]).join(", ")}`}
      className="flex min-w-0 flex-wrap items-center justify-end gap-1"
    >
      {visibleRoles.map((role) => (
        <Badge className="px-1.5 py-0 text-[10px]" key={role} variant="secondary">
          {ROLE_LABELS[role]}
        </Badge>
      ))}
      {hiddenCount > 0 ? (
        <Badge className="px-1.5 py-0 text-[10px]" variant="outline">
          +{hiddenCount}
          <span className="sr-only"> additional roles</span>
        </Badge>
      ) : null}
    </div>
  );
}
