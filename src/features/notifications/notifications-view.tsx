"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  CheckCheck,
  Inbox,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api";

import { NotificationRow } from "./notification-row";
import { NOTIFICATIONS_PAGE_LIMIT } from "./notifications.constants";
import type { Notification } from "./notifications.types";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from "./use-notifications";

type NotificationsViewProps = {
  workspaceId: string;
};

function parsePage(value: string | null): number {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

function getActionErrorMessage(error: unknown): string {
  return error instanceof ApiError
    ? error.message
    : "The notification could not be updated. Please try again.";
}

export function NotificationsView({ workspaceId }: NotificationsViewProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const page = parsePage(searchParams.get("page"));

  const notificationsQuery = useNotifications(
    workspaceId,
    page,
    NOTIFICATIONS_PAGE_LIMIT,
  );
  const markReadMutation = useMarkNotificationRead(workspaceId);
  const markAllMutation = useMarkAllNotificationsRead(workspaceId);

  const data = notificationsQuery.data?.data;
  const unreadCount = data?.unreadCount ?? 0;
  const actionsDisabled =
    markReadMutation.isPending || markAllMutation.isPending;

  const updatePage = (nextPage: number) => {
    const nextParams = new URLSearchParams(searchParams.toString());

    if (nextPage <= 1) {
      nextParams.delete("page");
    } else {
      nextParams.set("page", nextPage.toString());
    }

    const query = nextParams.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  };

  const markUnread = async (
    notification: Notification,
    destination?: string,
  ) => {
    if (notification.isRead) {
      if (destination) router.push(destination);
      return;
    }

    if (actionsDisabled) return;

    try {
      await markReadMutation.mutateAsync(notification.id);
      if (destination) {
        router.push(destination);
      } else {
        toast.success("Notification marked as read.");
      }
    } catch (error) {
      toast.error(getActionErrorMessage(error));
    }
  };

  const handleMarkAllRead = async () => {
    if (actionsDisabled || unreadCount === 0) return;

    try {
      const response = await markAllMutation.mutateAsync();
      toast.success(
        response.data.updatedCount === 0
          ? "Notifications are already up to date."
          : `${response.data.updatedCount} notification${response.data.updatedCount === 1 ? "" : "s"} marked as read.`,
      );
    } catch (error) {
      toast.error(getActionErrorMessage(error));
    }
  };

  return (
    <main className="mx-auto w-full max-w-screen-2xl space-y-5 p-4 sm:p-6 lg:p-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Notifications
            </h1>
            {unreadCount > 0 && (
              <Badge variant="default">
                {unreadCount} unread
              </Badge>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Your workspace notification inbox.
          </p>
        </div>

        {unreadCount > 0 && (
          <Button
            className="self-start"
            disabled={actionsDisabled}
            onClick={() => void handleMarkAllRead()}
            type="button"
            variant="outline"
          >
            {markAllMutation.isPending ? (
              <Loader2 aria-hidden="true" className="size-4 animate-spin" />
            ) : (
              <CheckCheck aria-hidden="true" className="size-4" />
            )}
            {markAllMutation.isPending ? "Marking all..." : "Mark all as read"}
          </Button>
        )}
      </header>

      {notificationsQuery.isLoading ? (
        <NotificationCenterSkeleton />
      ) : notificationsQuery.isError ? (
        <NotificationErrorState
          onRetry={() => void notificationsQuery.refetch()}
        />
      ) : !data || data.pagination.total === 0 ? (
        <NotificationEmptyState />
      ) : (
        <section
          aria-label="Notifications"
          className="overflow-hidden rounded-xl border border-border bg-card shadow-xs"
        >
          {data.items.length === 0 ? (
            <div className="flex min-h-48 flex-col items-center justify-center p-6 text-center">
              <Inbox aria-hidden="true" className="size-8 text-muted-foreground" />
              <p className="mt-3 font-medium text-foreground">
                No notifications on this page
              </p>
              <Button
                className="mt-4"
                onClick={() => updatePage(Math.max(1, page - 1))}
                size="sm"
                type="button"
                variant="outline"
              >
                Previous page
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {data.items.map((notification) => (
                <NotificationRow
                  actionsDisabled={actionsDisabled}
                  isPending={
                    markReadMutation.isPending &&
                    markReadMutation.variables === notification.id
                  }
                  key={notification.id}
                  notification={notification}
                  onMarkRead={(item) => void markUnread(item)}
                  onOpen={(item, destination) =>
                    void markUnread(item, destination)
                  }
                  workspaceId={workspaceId}
                />
              ))}
            </div>
          )}

          <div className="flex flex-col gap-3 border-t border-border bg-muted/20 px-3 py-3 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-4">
            <p className="text-xs text-muted-foreground">
              {data.pagination.total} notification
              {data.pagination.total === 1 ? "" : "s"} · Page {data.pagination.page}
              {data.pagination.totalPages > 0
                ? ` of ${data.pagination.totalPages}`
                : ""}
            </p>
            <div className="flex gap-2">
              <Button
                disabled={data.pagination.page <= 1 || notificationsQuery.isFetching}
                onClick={() => updatePage(data.pagination.page - 1)}
                size="sm"
                type="button"
                variant="outline"
              >
                Previous
              </Button>
              <Button
                disabled={
                  data.pagination.page >= data.pagination.totalPages ||
                  notificationsQuery.isFetching
                }
                onClick={() => updatePage(data.pagination.page + 1)}
                size="sm"
                type="button"
                variant="outline"
              >
                Next
              </Button>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}

export function NotificationCenterSkeleton() {
  return (
    <div
      aria-label="Loading notifications"
      className="overflow-hidden rounded-xl border border-border bg-card"
      role="status"
    >
      {["one", "two", "three", "four"].map((key) => (
        <div
          className="flex items-start gap-3 border-b border-border p-4 last:border-b-0"
          key={key}
        >
          <div className="size-9 shrink-0 animate-pulse rounded-full bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-2/5 animate-pulse rounded bg-muted" />
            <div className="h-3 w-4/5 animate-pulse rounded bg-muted" />
            <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
          </div>
        </div>
      ))}
      <span className="sr-only">Loading notifications...</span>
    </div>
  );
}

function NotificationErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <section
      className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center"
      role="alert"
    >
      <AlertCircle aria-hidden="true" className="size-8 text-destructive" />
      <h2 className="mt-3 font-semibold text-foreground">
        Unable to load notifications
      </h2>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        Check your connection and try again.
      </p>
      <Button
        className="mt-4"
        onClick={onRetry}
        size="sm"
        type="button"
        variant="outline"
      >
        <RefreshCw aria-hidden="true" className="size-4" />
        Retry
      </Button>
    </section>
  );
}

function NotificationEmptyState() {
  return (
    <section className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card p-6 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <CheckCheck aria-hidden="true" className="size-6" />
      </div>
      <h2 className="mt-4 font-semibold text-foreground">All caught up</h2>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        New assignments and workflow updates will appear here.
      </p>
    </section>
  );
}
