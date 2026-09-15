import type {
  AssignmentAvailabilityRole,
  TeamMember,
} from "./team.types";

export type AssignmentAvailabilityState = "AVAILABLE" | "OFF" | "PAUSED";

export function getAssignmentAvailabilityState(
  member: TeamMember,
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
  member: TeamMember,
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

export function formatPausedUntilFull(value: string | null | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    weekday: "short",
  }).format(date);
}

export function toDateTimeLocalString(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}
