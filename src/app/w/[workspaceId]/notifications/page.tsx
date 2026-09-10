"use client";

import { Bell, CheckCircle2, Clock } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { useNotifications } from "@/features/notifications/use-notifications";

export default function NotificationsPage() {
  const notificationsQuery = useNotifications();

  const items = notificationsQuery.data?.data.items ?? [];
  const unreadCount = notificationsQuery.data?.data.unreadCount ?? 0;

  return (
    <div className="flex flex-col gap-6 p-6 sm:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs uppercase tracking-wide">
              Operations Feed
            </Badge>
            {unreadCount > 0 && (
              <Badge variant="default" className="text-xs">
                {unreadCount} Unread
              </Badge>
            )}
          </div>
          <h1 className="mt-2 font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Notifications
          </h1>
          <p className="mt-1 text-sm text-muted-foreground sm:text-base">
            System updates, task assignments, and review notifications.
          </p>
        </div>
      </div>

      {notificationsQuery.isLoading ? (
        <div className="flex h-48 items-center justify-center rounded-xl border border-border bg-card">
          <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
            <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span>Loading notifications...</span>
          </div>
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card p-12 text-center shadow-xs">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground mb-4">
            <CheckCircle2 className="size-6" />
          </div>
          <h2 className="text-base font-semibold text-foreground">
            All Caught Up
          </h2>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            You have no notifications in your queue at this moment. Newly assigned tasks and reviews will appear here.
          </p>
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-border rounded-xl border border-border bg-card shadow-xs">
          {items.map((item) => (
            <div
              key={item.id}
              className={`flex items-start gap-4 p-4 transition-colors ${
                item.isRead ? "bg-card" : "bg-primary/5"
              }`}
            >
              <div className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Bell className="size-4" />
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-foreground truncate">
                    {item.title}
                  </h3>
                  <span className="flex items-center gap-1 text-[11px] text-muted-foreground shrink-0">
                    <Clock className="size-3" />
                    {new Date(item.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {item.message}
                </p>
                <div className="pt-1">
                  <Badge variant="secondary" className="text-[10px] font-mono">
                    {item.type}
                  </Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
