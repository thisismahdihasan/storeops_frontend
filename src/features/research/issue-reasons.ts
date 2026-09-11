import type { IssueReason } from "./research.types";

export const ISSUE_REASON_OPTIONS: Array<{
  label: string;
  value: IssueReason;
}> = [
  { label: "Reference unclear", value: "REFERENCE_UNCLEAR" },
  { label: "Copyright concern", value: "COPYRIGHT_CONCERN" },
  { label: "Too complex", value: "TOO_COMPLEX" },
  { label: "Image quality", value: "IMAGE_QUALITY" },
  { label: "Other", value: "OTHER" },
];

export function getIssueReasonLabel(reason: IssueReason): string {
  return (
    ISSUE_REASON_OPTIONS.find((option) => option.value === reason)?.label ??
    reason
  );
}
