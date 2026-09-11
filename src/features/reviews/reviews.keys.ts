export const reviewsKeys = {
  all: ["reviews"] as const,
  detail: (workspaceId: string, reviewId: string) =>
    ["reviews", workspaceId, "detail", reviewId] as const,
  details: (workspaceId: string) =>
    ["reviews", workspaceId, "detail"] as const,
  queue: (workspaceId: string, page: number, limit: number) =>
    ["reviews", workspaceId, "queue", { limit, page }] as const,
  queues: (workspaceId: string) =>
    ["reviews", workspaceId, "queue"] as const,
  workspace: (workspaceId: string) =>
    ["reviews", workspaceId] as const,
};
