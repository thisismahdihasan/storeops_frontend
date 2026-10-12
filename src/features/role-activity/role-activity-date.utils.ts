export type ActivityRange = "all" | "today" | "7d" | "30d" | "custom";

export type ActivityDateRangeIntent = {
  from?: string;
  range: ActivityRange;
  to?: string;
};

export type ResolvedActivityDateRange = {
  dateFrom?: string;
  dateTo?: string;
  isValid: boolean;
};

function parseLocalDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  const day = Number(match[3]);
  const date = new Date(year, monthIndex, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== monthIndex ||
    date.getDate() !== day
  ) return null;
  return date;
}

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
}

function endOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

export function resolveActivityDateRange(
  { range, from, to }: ActivityDateRangeIntent,
  now = new Date(),
): ResolvedActivityDateRange {
  if (range === "all") return { isValid: true };

  if (range === "custom") {
    if (!from || !to) return { isValid: false };
    const fromDate = parseLocalDate(from);
    const toDate = parseLocalDate(to);
    if (!fromDate || !toDate || fromDate > toDate) return { isValid: false };
    return {
      dateFrom: startOfLocalDay(fromDate).toISOString(),
      dateTo: endOfLocalDay(toDate).toISOString(),
      isValid: true,
    };
  }

  const end = endOfLocalDay(now);
  const start = startOfLocalDay(now);
  if (range === "7d") start.setDate(start.getDate() - 6);
  if (range === "30d") start.setDate(start.getDate() - 29);
  return { dateFrom: start.toISOString(), dateTo: end.toISOString(), isValid: true };
}

export function formatActivityRangeLabel(intent: ActivityDateRangeIntent): string {
  if (intent.range === "today") return "Today";
  if (intent.range === "7d") return "Last 7 days";
  if (intent.range === "30d") return "Last 30 days";
  if (intent.range === "custom") return intent.from && intent.to ? `${intent.from} – ${intent.to}` : "Custom range";
  return "All time";
}
