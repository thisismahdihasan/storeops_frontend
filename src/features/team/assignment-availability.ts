export {
  type AssignmentAvailabilityState,
  formatPausedUntil,
  getAssignmentAvailabilityState,
  getAssignmentPausedUntil,
} from "@/features/workspace/workspace-assignment-availability";

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
