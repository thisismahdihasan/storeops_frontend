import type { ResearchItemListItem } from "@/features/research/research.types";

export type ActiveIssue = ResearchItemListItem & {
  latestIssueReport: NonNullable<ResearchItemListItem["latestIssueReport"]>;
};
