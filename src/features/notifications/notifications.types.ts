export type NotificationType =
  | "DESIGN_ASSIGNED"
  | "DESIGN_ISSUE_REPORTED"
  | "DESIGN_REVIEW_SUBMITTED"
  | "DESIGN_CORRECTION_REQUESTED"
  | "DESIGN_APPROVED"
  | "LISTING_ASSIGNED";

export type Notification = {
  createdAt: string;
  id: string;
  isRead: boolean;
  message: string;
  researchItemId: string | null;
  title: string;
  type: NotificationType;
  workspaceId: string | null;
};

export type NotificationsPagination = {
  limit: number;
  page: number;
  total: number;
  totalPages: number;
};

export type NotificationsData = {
  items: Notification[];
  pagination: NotificationsPagination;
  unreadCount: number;
};

export type NotificationsResponse = {
  data: NotificationsData;
  message: string;
  success: true;
};
