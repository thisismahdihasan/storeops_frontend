import { resolveDefaultRouteForRoles } from "@/components/layout/navigation.config";
import type { WorkspaceWithMembership } from "@/features/workspace/workspace.types";

/**
 * Validates that a redirect path is internal to prevent open-redirect vulnerabilities.
 */
export function sanitizeInternalRedirectUrl(
  url: string | null | undefined,
): string | null {
  if (!url) {
    return null;
  }

  // Must begin with a single slash, not protocol-relative '//' or Windows path '\\'
  if (url.startsWith("/") && !url.startsWith("//") && !url.startsWith("/\\")) {
    return url;
  }

  return null;
}

/**
 * Determines the safe post-authentication destination based on return URL and discovered workspaces.
 */
export function resolvePostAuthDestination(
  workspaces: WorkspaceWithMembership[],
  redirectParam?: string | null,
): string {
  const safeRedirect = sanitizeInternalRedirectUrl(redirectParam);
  if (safeRedirect) {
    return safeRedirect;
  }

  if (workspaces.length > 0) {
    const firstWorkspace = workspaces[0];
    return resolveDefaultRouteForRoles(
      firstWorkspace.membership.roles,
      firstWorkspace.id,
    );
  }

  return "/";
}
