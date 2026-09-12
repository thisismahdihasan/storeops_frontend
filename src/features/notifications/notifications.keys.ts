export const notificationKeys = {
  all: (workspaceId: string) => ["notifications", workspaceId] as const,
  list: (workspaceId: string, page: number, limit: number) =>
    ["notifications", workspaceId, "list", { limit, page }] as const,
};
