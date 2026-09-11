import type { DesignWorkspaceStatus } from "@/features/design-workspace/design-workspace.types";
import type { ResearchStatus } from "@/features/research/research.types";

/**
 * Exact replica of backend ALLOWED_ANNOTATION_REPLY_STATUSES from
 * storeops_backend/src/modules/review/review.service.ts
 */
export const ALLOWED_ANNOTATION_REPLY_STATUSES = [
  "DESIGN_REVIEW",
  "CORRECTION_NEEDED",
  "DESIGN_IN_PROGRESS",
] as const;

export type AllowedAnnotationReplyStatus =
  (typeof ALLOWED_ANNOTATION_REPLY_STATUSES)[number];

export function isAnnotationReplyAllowedStatus(
  status: string | ResearchStatus | DesignWorkspaceStatus,
): status is AllowedAnnotationReplyStatus {
  return (ALLOWED_ANNOTATION_REPLY_STATUSES as readonly string[]).includes(status);
}

export function canUserReplyToAnnotation({
  hasAdminRole = false,
  hasDesignerRole = false,
  isAssignedDesigner = false,
  itemStatus,
  isLatestReviewRound,
}: {
  hasAdminRole?: boolean;
  hasDesignerRole?: boolean;
  isAssignedDesigner?: boolean;
  itemStatus: string | ResearchStatus | DesignWorkspaceStatus;
  isLatestReviewRound: boolean;
}): boolean {
  if (!isLatestReviewRound) return false;
  if (!isAnnotationReplyAllowedStatus(itemStatus)) return false;

  if (hasAdminRole) return true;
  if (hasDesignerRole && isAssignedDesigner) return true;

  return false;
}
