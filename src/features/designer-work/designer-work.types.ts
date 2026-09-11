import type { z } from "zod";

import type {
  designerQueueResponseSchema,
  designerWorkFiltersSchema,
  reportIssueFormSchema,
} from "./designer-work.schemas";

export type DesignerWorkFilters = z.infer<typeof designerWorkFiltersSchema>;
export type DesignerQueueResponse = z.infer<typeof designerQueueResponseSchema>;
export type DesignerWorkItem = DesignerQueueResponse["data"]["items"][number];
export type DesignerWorkStatus = DesignerWorkItem["researchItem"]["status"];
export type ReportIssueFormValues = z.infer<typeof reportIssueFormSchema>;

export type StatusTone =
  | "danger"
  | "info"
  | "neutral"
  | "success"
  | "warning";

export const DESIGNER_WORK_TABS: Array<{
  label: string;
  status?: DesignerWorkStatus;
}> = [
  { label: "All" },
  { label: "Assigned", status: "ASSIGNED" },
  { label: "In Progress", status: "DESIGN_IN_PROGRESS" },
  { label: "Waiting Review", status: "DESIGN_REVIEW" },
  { label: "Correction Needed", status: "CORRECTION_NEEDED" },
  { label: "Issue Reported", status: "ISSUE_REPORTED" },
  { label: "Design Approved", status: "DESIGN_APPROVED" },
];

const STATUS_METADATA: Record<
  DesignerWorkStatus,
  { label: string; tone: StatusTone }
> = {
  ASSIGNED: { label: "Assigned", tone: "neutral" },
  CORRECTION_NEEDED: { label: "Correction Needed", tone: "warning" },
  DESIGN_APPROVED: { label: "Design Approved", tone: "success" },
  DESIGN_IN_PROGRESS: { label: "In Progress", tone: "info" },
  DESIGN_REVIEW: { label: "Waiting Review", tone: "info" },
  ISSUE_REPORTED: { label: "Issue Reported", tone: "danger" },
};

export function getDesignerWorkStatusMeta(status: DesignerWorkStatus) {
  return STATUS_METADATA[status];
}

export function formatWorkDate(value: string | null): string {
  if (!value) return "Not started";

  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}
