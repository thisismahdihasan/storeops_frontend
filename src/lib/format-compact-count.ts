const compactFormatter = new Intl.NumberFormat("en", {
  notation: "compact",
  compactDisplay: "short",
  maximumFractionDigits: 1,
});

export function formatCompactCount(count: number): string {
  if (!Number.isFinite(count) || count < 0) return "0";
  return compactFormatter.format(count);
}
