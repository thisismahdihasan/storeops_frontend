import {
  CircleCheck,
  ClipboardCheck,
  Palette,
  RotateCcw,
  Tag,
  TriangleAlert,
} from "lucide-react";

import type {
  Notification,
  NotificationType,
} from "./notifications.types";

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  DESIGN_APPROVED: "Design Approved",
  DESIGN_ASSIGNED: "Design Assigned",
  DESIGN_CORRECTION_REQUESTED: "Correction Requested",
  DESIGN_ISSUE_REPORTED: "Design Issue Reported",
  DESIGN_REVIEW_SUBMITTED: "Design Submitted for Review",
  LISTING_ASSIGNED: "Listing Assigned",
};

type NotificationIconProps = {
  type: NotificationType;
};

export function NotificationIcon({ type }: NotificationIconProps) {
  const className = "size-4";

  switch (type) {
    case "DESIGN_ASSIGNED":
      return <Palette aria-hidden="true" className={className} />;
    case "DESIGN_ISSUE_REPORTED":
      return <TriangleAlert aria-hidden="true" className={className} />;
    case "DESIGN_REVIEW_SUBMITTED":
      return <ClipboardCheck aria-hidden="true" className={className} />;
    case "DESIGN_CORRECTION_REQUESTED":
      return <RotateCcw aria-hidden="true" className={className} />;
    case "DESIGN_APPROVED":
      return <CircleCheck aria-hidden="true" className={className} />;
    case "LISTING_ASSIGNED":
      return <Tag aria-hidden="true" className={className} />;
  }
}

export function getNotificationDestination(
  notification: Notification,
  workspaceId: string,
): string | null {
  if (notification.workspaceId !== workspaceId) {
    return null;
  }

  switch (notification.type) {
    case "DESIGN_ASSIGNED":
    case "DESIGN_CORRECTION_REQUESTED":
    case "DESIGN_APPROVED":
      return notification.researchItemId
        ? `/w/${workspaceId}/design/${notification.researchItemId}`
        : null;
    case "LISTING_ASSIGNED":
      return notification.researchItemId
        ? `/w/${workspaceId}/listing/${notification.researchItemId}`
        : null;
    case "DESIGN_ISSUE_REPORTED":
      return `/w/${workspaceId}/issues`;
    case "DESIGN_REVIEW_SUBMITTED":
      return `/w/${workspaceId}/reviews`;
  }
}

export function formatNotificationTimestamp(createdAt: string): string {
  const createdDate = new Date(createdAt);

  if (Number.isNaN(createdDate.getTime())) {
    return "Unknown time";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(createdDate);
}
