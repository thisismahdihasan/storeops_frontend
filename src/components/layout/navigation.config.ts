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

export type NavigationMode = "management" | "work";

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

type NavigationGroupTitle =
  | "OVERVIEW"
  | "OPERATIONS"
  | "RESEARCH"
  | "DESIGN"
  | "LISTING"
  | "MANAGEMENT"
  | "WORKSPACE";

type NavigationDefinition = {
  badgeKey?: "unreadNotifications";
  group: NavigationGroupTitle;
  icon: React.ComponentType<{ className?: string }>;
  id: string;
  mode: NavigationMode;
  roles: WorkspaceRole[];
  segment: string;
  title: string;
};

const NAVIGATION_DEFINITIONS: NavigationDefinition[] = [
  {
    group: "OVERVIEW",
    icon: LayoutDashboard,
    id: "dashboard",
    mode: "management",
    roles: ["ADMIN"],
    segment: "dashboard",
    title: "Dashboard",
  },
  {
    group: "OPERATIONS",
    icon: Search,
    id: "research-management",
    mode: "management",
    roles: ["ADMIN"],
    segment: "research",
    title: "Research",
  },
  {
    group: "OPERATIONS",
    icon: CheckSquare,
    id: "reviews",
    mode: "management",
    roles: ["ADMIN"],
    segment: "reviews",
    title: "Design Reviews",
  },
  {
    group: "OPERATIONS",
    icon: AlertCircle,
    id: "issues",
    mode: "management",
    roles: ["ADMIN"],
    segment: "issues",
    title: "Issues",
  },
  {
    group: "MANAGEMENT",
    icon: Users,
    id: "team",
    mode: "management",
    roles: ["ADMIN"],
    segment: "team",
    title: "Team",
  },
  {
    badgeKey: "unreadNotifications",
    group: "MANAGEMENT",
    icon: Bell,
    id: "notifications-management",
    mode: "management",
    roles: ["ADMIN"],
    segment: "notifications",
    title: "Notifications",
  },
  {
    group: "RESEARCH",
    icon: Search,
    id: "my-research",
    mode: "work",
    roles: ["RESEARCHER"],
    segment: "research",
    title: "My Research",
  },
  {
    group: "DESIGN",
    icon: Palette,
    id: "my-work",
    mode: "work",
    roles: ["DESIGNER"],
    segment: "my-work",
    title: "My Work",
  },
  {
    group: "DESIGN",
    icon: RotateCcw,
    id: "corrections",
    mode: "work",
    roles: ["DESIGNER"],
    segment: "corrections",
    title: "Corrections",
  },
  {
    group: "LISTING",
    icon: Tag,
    id: "listing",
    mode: "work",
    roles: ["LISTER"],
    segment: "listing",
    title: "Listing",
  },
  {
    badgeKey: "unreadNotifications",
    group: "WORKSPACE",
    icon: Bell,
    id: "notifications-work",
    mode: "work",
    roles: ["RESEARCHER", "DESIGNER", "LISTER"],
    segment: "notifications",
    title: "Notifications",
  },
];

const GROUP_ORDER: Record<NavigationMode, NavigationGroupTitle[]> = {
  management: ["OVERVIEW", "OPERATIONS", "MANAGEMENT"],
  work: ["RESEARCH", "DESIGN", "LISTING", "WORKSPACE"],
};

const WORKER_ROLES: WorkspaceRole[] = [
  "RESEARCHER",
  "DESIGNER",
  "LISTER",
];

const ROUTE_ACCESS_ROLES: Record<string, WorkspaceRole[]> = {
  corrections: ["DESIGNER"],
  dashboard: ["ADMIN"],
  issues: ["ADMIN"],
  "my-work": ["DESIGNER"],
  notifications: ["ADMIN", "RESEARCHER", "DESIGNER", "LISTER"],
  listing: ["LISTER"],
  research: ["ADMIN", "RESEARCHER"],
  reviews: ["ADMIN"],
  team: ["ADMIN"],
};

export function hasWorkerRole(roles: WorkspaceRole[]): boolean {
  return WORKER_ROLES.some((role) => roles.includes(role));
}

export function shouldShowNavigationModeSwitch(roles: WorkspaceRole[]): boolean {
  return roles.includes("ADMIN") && hasWorkerRole(roles);
}

export function resolveDefaultNavigationMode(
  roles: WorkspaceRole[],
): NavigationMode {
  return roles.includes("ADMIN") ? "management" : "work";
}

export function resolveNavigationModeForRouteSegments(
  roles: WorkspaceRole[],
  routeSegments: readonly string[],
): NavigationMode | null {
  if (!shouldShowNavigationModeSwitch(roles)) {
    return resolveDefaultNavigationMode(roles);
  }

  const [segment, nestedSegment] = routeSegments;

  if (
    segment === "dashboard" ||
    segment === "issues" ||
    segment === "team" ||
    (segment === "reviews" && !nestedSegment)
  ) {
    return "management";
  }

  if (
    segment === "design" ||
    segment === "my-work" ||
    segment === "corrections" ||
    segment === "listing" ||
    segment === "my-listings" ||
    segment === "my-research"
  ) {
    return "work";
  }

  // Research, review detail, and notifications can be legitimately reached
  // from either context, so preserve the member's selected mode.
  return null;
}

export function resolveNavigationForRoles(
  roles: WorkspaceRole[],
  workspaceId: string,
  mode: NavigationMode,
): NavigationGroup[] {
  const allowedDefinitions = NAVIGATION_DEFINITIONS.filter(
    (definition) =>
      definition.mode === mode &&
      definition.roles.some((role) => roles.includes(role)),
  );

  return GROUP_ORDER[mode].flatMap((groupName) => {
    const items = allowedDefinitions
      .filter((definition) => definition.group === groupName)
      .map((definition) => ({
        badgeKey: definition.badgeKey,
        href: `/w/${workspaceId}/${definition.segment}`,
        icon: definition.icon,
        id: definition.id,
        title: definition.title,
      }));

    return items.length > 0 ? [{ items, title: groupName }] : [];
  });
}

export function resolveDefaultRouteForNavigationMode(
  roles: WorkspaceRole[],
  workspaceId: string,
  mode: NavigationMode,
): string {
  if (mode === "management" && roles.includes("ADMIN")) {
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

export function resolveDefaultRouteForRoles(
  roles: WorkspaceRole[],
  workspaceId: string,
): string {
  return resolveDefaultRouteForNavigationMode(
    roles,
    workspaceId,
    resolveDefaultNavigationMode(roles),
  );
}

export function isRouteAllowedForRoles(
  routeSegments: readonly string[],
  roles: WorkspaceRole[],
): boolean {
  const [segment, nestedSegment] = routeSegments;

  if (segment === "reviews" && nestedSegment) {
    return roles.includes("ADMIN") || roles.includes("DESIGNER");
  }

  const allowedRoles = ROUTE_ACCESS_ROLES[segment];
  return !allowedRoles || allowedRoles.some((role) => roles.includes(role));
}
