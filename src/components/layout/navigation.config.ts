import type React from "react";
import {
  AlertCircle,
  Bell,
  CheckSquare,
  LayoutDashboard,
  Palette,
  RotateCcw,
  Search,
  Tag,
  Users,
} from "lucide-react";

import type { WorkspaceRole } from "@/features/workspace/workspace.types";

export type NavigationItem = {
  badgeKey?: "unreadNotifications";
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  id: string;
  title: string;
};

export type NavigationGroup = {
  items: NavigationItem[];
  title: string;
};

type NavigationDefinition = {
  badgeKey?: "unreadNotifications";
  group: "OVERVIEW" | "OPERATIONS" | "DESIGNER WORKFLOW" | "LISTING" | "MANAGEMENT";
  icon: React.ComponentType<{ className?: string }>;
  id: string;
  roles: WorkspaceRole[];
  segment: string;
  title: string;
};

const NAVIGATION_DEFINITIONS: NavigationDefinition[] = [
  {
    group: "OVERVIEW",
    icon: LayoutDashboard,
    id: "dashboard",
    roles: ["ADMIN"],
    segment: "dashboard",
    title: "Dashboard",
  },
  {
    group: "OPERATIONS",
    icon: Search,
    id: "research",
    roles: ["ADMIN", "RESEARCHER"],
    segment: "research",
    title: "Research",
  },
  {
    group: "DESIGNER WORKFLOW",
    icon: CheckSquare,
    id: "reviews",
    roles: ["ADMIN"],
    segment: "reviews",
    title: "Design Reviews",
  },
  {
    group: "DESIGNER WORKFLOW",
    icon: Palette,
    id: "my-work",
    roles: ["DESIGNER"],
    segment: "my-work",
    title: "My Work",
  },
  {
    group: "DESIGNER WORKFLOW",
    icon: RotateCcw,
    id: "corrections",
    roles: ["DESIGNER"],
    segment: "corrections",
    title: "Corrections",
  },
  {
    group: "DESIGNER WORKFLOW",
    icon: AlertCircle,
    id: "issues",
    roles: ["ADMIN"],
    segment: "issues",
    title: "Issues",
  },
  {
    group: "LISTING",
    icon: Tag,
    id: "listing",
    roles: ["LISTER"],
    segment: "listing",
    title: "Listing",
  },
  {
    group: "MANAGEMENT",
    icon: Users,
    id: "team",
    roles: ["ADMIN"],
    segment: "team",
    title: "Team",
  },
  {
    badgeKey: "unreadNotifications",
    group: "MANAGEMENT",
    icon: Bell,
    id: "notifications",
    roles: ["ADMIN", "RESEARCHER", "DESIGNER", "LISTER"],
    segment: "notifications",
    title: "Notifications",
  },
];

const GROUP_ORDER: Array<NavigationDefinition["group"]> = [
  "OVERVIEW",
  "OPERATIONS",
  "DESIGNER WORKFLOW",
  "LISTING",
  "MANAGEMENT",
];

export function resolveNavigationForRoles(
  roles: WorkspaceRole[],
  workspaceId: string,
): NavigationGroup[] {
  // Deduplicate and filter definitions matching any of user's active workspace roles
  const allowedDefinitions = NAVIGATION_DEFINITIONS.filter((def) =>
    def.roles.some((role) => roles.includes(role)),
  );

  const groups: NavigationGroup[] = [];

  for (const groupName of GROUP_ORDER) {
    const itemsInGroup = allowedDefinitions.filter((def) => def.group === groupName);

    if (itemsInGroup.length > 0) {
      groups.push({
        items: itemsInGroup.map((def) => ({
          badgeKey: def.badgeKey,
          href: `/w/${workspaceId}/${def.segment}`,
          icon: def.icon,
          id: def.id,
          title: def.title,
        })),
        title: groupName,
      });
    }
  }

  return groups;
}

export function resolveDefaultRouteForRoles(
  roles: WorkspaceRole[],
  workspaceId: string,
): string {
  if (roles.includes("ADMIN")) {
    return `/w/${workspaceId}/dashboard`;
  }
  if (roles.includes("RESEARCHER")) {
    return `/w/${workspaceId}/research`;
  }
  if (roles.includes("DESIGNER")) {
    return `/w/${workspaceId}/my-work`;
  }
  if (roles.includes("LISTER")) {
    return `/w/${workspaceId}/listing`;
  }
  return `/w/${workspaceId}/notifications`;
}

export function isRouteAllowedForRoles(
  routeSegments: readonly string[],
  roles: WorkspaceRole[],
): boolean {
  const [segment, nestedSegment] = routeSegments;

  if (segment === "reviews" && nestedSegment) {
    return roles.includes("ADMIN") || roles.includes("DESIGNER");
  }

  const definition = NAVIGATION_DEFINITIONS.find((item) => item.segment === segment);
  if (!definition) {
    return true;
  }
  return definition.roles.some((role) => roles.includes(role));
}
