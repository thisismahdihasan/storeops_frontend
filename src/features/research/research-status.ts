import type { ResearchStatus } from "./research.types";

export function getStatusTone(
  status: ResearchStatus,
): "danger" | "info" | "neutral" | "success" | "warning" {
  switch (status) {
    case "CORRECTION_NEEDED":
      return "warning";
    case "ISSUE_REPORTED":
      return "danger";
    case "DESIGN_APPROVED":
    case "LISTED":
      return "success";
    case "DESIGN_IN_PROGRESS":
    case "DESIGN_REVIEW":
    case "READY_FOR_LISTING":
    case "LISTING_IN_PROGRESS":
      return "info";
    default:
      return "neutral";
  }
}

export function formatStatusLabel(status: ResearchStatus): string {
  return status
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
}
