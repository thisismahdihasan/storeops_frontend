export type PaginationInput = {
  limit?: number | null;
  page?: number | null;
} | null | undefined;

/**
 * Calculates a 1-based serial number for paginated or unpaginated lists.
 * Formula: (page - 1) * limit + index + 1
 * Falls back to `index + 1` if pagination metadata is not provided or unpaginated.
 */
export function calculateSerialNumber(
  index: number,
  pagination?: PaginationInput,
): number {
  const page = pagination?.page;
  const limit = pagination?.limit;

  if (
    typeof page === "number" &&
    page > 0 &&
    typeof limit === "number" &&
    limit > 0
  ) {
    return (page - 1) * limit + index + 1;
  }

  return index + 1;
}
