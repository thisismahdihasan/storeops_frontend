const WORKSPACE_RETURN_SEGMENTS = new Set([
  "corrections",
  "design",
  "designs",
  "listing",
  "my-work",
  "research",
  "reviews",
]);

export function currentRelativeUrl(
  pathname: string,
  searchParams: Pick<URLSearchParams, "toString">,
): string {
  const query = searchParams.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function withReturnTo(destination: string, returnTo: string): string {
  const separator = destination.includes("?") ? "&" : "?";
  return `${destination}${separator}returnTo=${encodeURIComponent(returnTo)}`;
}

export function getValidWorkspaceReturnTo(
  value: string | null,
  workspaceId: string,
): string | null {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return null;
  }

  try {
    const url = new URL(value, "https://storeops.internal");
    const workspacePath = `/w/${workspaceId}`;
    const segment = url.pathname.slice(workspacePath.length + 1).split("/")[0];

    if (
      url.origin !== "https://storeops.internal" ||
      !url.pathname.startsWith(`${workspacePath}/`) ||
      !WORKSPACE_RETURN_SEGMENTS.has(segment)
    ) {
      return null;
    }

    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}
