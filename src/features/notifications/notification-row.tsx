"use client";

import { Check, ChevronRight, Clock, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "cn";

import {
  formatNotificationTimestamp,
  getNotificationDestination,
  NotificationIcon,
  NOTIFICATION_TYPE_LABELS,
} from "./notification-presentation";
import type { Notification } from "./notifications.types";

type NotificationRowProps = {
  actionsDisabled: boolean;
  isPending: boolean;
  notification: Notification;
  onMarkRead: (notification: Notification) => void;
  onOpen: (notification: Notification, destination: string) => void;
  workspaceId: string;
};

export function NotificationRow({
  actionsDisabled,
  isPending,
  notification,
  onMarkRead,
  onOpen,
  workspaceId,
}: NotificationRowProps) {
  const destination = getNotificationDestination(notification, workspaceId);
  const timestamp = formatNotificationTimestamp(notification.createdAt);

  const content = (
    <>
      <div
        className={cn(
          "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full",
          notification.isRead
            ? "bg-muted text-muted-foreground"
            : "bg-primary/10 text-primary",
        )}
      >
        <NotificationIcon type={notification.type} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-start gap-2">
          {!notification.isRead && (
            <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary">
              <span className="sr-only">Unread</span>
            </span>
          )}
          <h2
            className={cn(
              "min-w-0 text-sm leading-5",
              notification.isRead
                ? "font-medium text-foreground/80"
                : "font-semibold text-foreground",
            )}
          >
            {notification.title}
          </h2>
        </div>

        <p
          className={cn(
            "mt-0.5 line-clamp-2 text-sm leading-5",
            notification.isRead
              ? "text-muted-foreground/80"
              : "text-muted-foreground",
          )}
        >
          {notification.message}
        </p>

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span>{NOTIFICATION_TYPE_LABELS[notification.type]}</span>
          <time
            className="inline-flex items-center gap-1"
            dateTime={notification.createdAt}
            title={timestamp}
          >
            <Clock aria-hidden="true" className="size-3" />
            {timestamp}
          </time>
        </div>
      </div>
    </>
  );

  if (destination) {
    return (
      <button
        aria-busy={isPending}
        aria-label={`${notification.isRead ? "Open" : "Open and mark as read"}: ${notification.title}`}
        className={cn(
          "flex w-full items-start gap-3 px-3 py-3 text-left transition-colors sm:px-4",
          notification.isRead
            ? "bg-card hover:bg-muted/40"
            : "bg-primary/5 hover:bg-primary/10",
          actionsDisabled && !notification.isRead && "cursor-wait",
        )}
        disabled={actionsDisabled && !notification.isRead}
        onClick={() => onOpen(notification, destination)}
        type="button"
      >
        {content}
        <span className="mt-2 flex size-6 shrink-0 items-center justify-center text-muted-foreground">
          {isPending ? (
            <Loader2 aria-hidden="true" className="size-4 animate-spin" />
          ) : (
            <ChevronRight aria-hidden="true" className="size-4" />
          )}
        </span>
      </button>
    );
  }

  return (
    <article
      className={cn(
        "px-3 py-3 sm:px-4",
        notification.isRead ? "bg-card" : "bg-primary/5",
      )}
    >
      <div className="flex items-start gap-3">{content}</div>
      {!notification.isRead && (
        <div className="mt-3 pl-12">
          <Button
            aria-label={`Mark as read: ${notification.title}`}
            disabled={actionsDisabled}
            onClick={() => onMarkRead(notification)}
            size="sm"
            type="button"
            variant="outline"
          >
            {isPending ? (
              <Loader2 aria-hidden="true" className="size-3.5 animate-spin" />
            ) : (
              <Check aria-hidden="true" className="size-3.5" />
            )}
            Mark as read
          </Button>
        </div>
      )}
    </article>
  );
}
