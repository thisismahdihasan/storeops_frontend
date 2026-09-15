export type AssignmentAvailabilityState = "AVAILABLE" | "OFF" | "PAUSED";

export type AssignmentAvailabilityRole = "DESIGNER" | "LISTER";

type MemberWithAvailability = {
  designerAssignmentEnabled: boolean;
  designerAssignmentPausedUntil: string | null;
  listerAssignmentEnabled: boolean;
  listerAssignmentPausedUntil: string | null;
};

export function getAssignmentAvailabilityState(
  member: MemberWithAvailability,
  role: AssignmentAvailabilityRole,
  now = Date.now(),
): AssignmentAvailabilityState {
  const enabled =
    role === "DESIGNER"
      ? member.designerAssignmentEnabled
      : member.listerAssignmentEnabled;
  const pausedUntil =
    role === "DESIGNER"
      ? member.designerAssignmentPausedUntil
      : member.listerAssignmentPausedUntil;

  if (!enabled) return "OFF";
  if (pausedUntil && new Date(pausedUntil).getTime() > now) return "PAUSED";
  return "AVAILABLE";
}

export function getAssignmentPausedUntil(
  member: MemberWithAvailability,
  role: AssignmentAvailabilityRole,
) {
  return role === "DESIGNER"
    ? member.designerAssignmentPausedUntil
    : member.listerAssignmentPausedUntil;
}

export function formatPausedUntil(value: string | null | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
  }).format(date);
}
