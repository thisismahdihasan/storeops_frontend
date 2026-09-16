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
        title="Your Assignments Are Paused"
        variant="warning"
      >
        <p>
          An administrator has paused automatic assignments for your account until {formattedDate}. Any existing assigned work is unaffected.
        </p>
      </InlineNotice>
    );
  }

  // OFF state
  return (
    <InlineNotice
      title="Your Assignments Are Turned Off"
      variant="warning"
    >
      <p>
        An administrator has turned off automatic assignments for your account. Any existing assigned work is unaffected.
      </p>
    </InlineNotice>
  );
}
