import { Clock } from "lucide-react";

import { InlineNotice } from "@/components/ui/inline-notice";

import {
  type AssignmentAvailabilityRole,
  formatPausedUntil,
  getAssignmentAvailabilityState,
  getAssignmentPausedUntil,
} from "./workspace-assignment-availability";
import type { WorkspaceMembershipSummary } from "./workspace.types";

type WorkerAssignmentStatusBannerProps = {
  membership: WorkspaceMembershipSummary;
  role: AssignmentAvailabilityRole;
};

export function WorkerAssignmentStatusBanner({
  membership,
  role,
}: WorkerAssignmentStatusBannerProps) {
  const state = getAssignmentAvailabilityState(membership, role);

  if (state === "AVAILABLE") {
    return null;
  }

  if (state === "PAUSED") {
    const pausedUntil = getAssignmentPausedUntil(membership, role);
    const formattedDate = formatPausedUntil(pausedUntil);

    return (
      <InlineNotice
        icon={Clock}
        title="Assignments Paused"
        variant="warning"
      >
        <p>
          New automatic assignments are paused until {formattedDate}. Existing assigned work is unaffected.
        </p>
      </InlineNotice>
    );
  }

  // OFF state
  return (
    <InlineNotice
      title="Assignments Turned Off"
      variant="warning"
    >
      <p>
        New automatic assignments are turned off by an administrator. Existing assigned work is unaffected.
      </p>
    </InlineNotice>
  );
}
