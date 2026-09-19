export type FinalAssetStorageMetric = {
  count: number;
  bytes: string;
};

export type FinalAssetStorageMetricsData = {
  active: FinalAssetStorageMetric;
  reclaimable: FinalAssetStorageMetric;
  cleaned: FinalAssetStorageMetric;
};

export type FinalAssetStorageMetricsResponse = {
  data: FinalAssetStorageMetricsData;
  message: string;
  success: true;
};

export type StorageCleanupFilter = "ELIGIBLE" | "CLEANED" | "ALL";

export type StorageCleanupCandidate = {
  finalAssetId: string;
  researchItemId: string;
  etsyListingId: string;
  title: string | null;
  fileName: string;
  fileSize: string;
  uploadedAt: string;
  listedAt: string;
  storageDeletedAt: string | null;
};

export type StorageCleanupPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type StorageCleanupCandidateListResult = {
  items: StorageCleanupCandidate[];
  pagination: StorageCleanupPagination;
};

export type StorageCleanupCandidatesResponse = {
  data: StorageCleanupCandidateListResult;
  message: string;
  success: true;
};

export type GetStorageCandidatesParams = {
  page?: number;
  limit?: number;
  search?: string;
  filter?: StorageCleanupFilter;
};

export type FinalAssetCleanupResult = {
  finalAssetId: string;
  status: "CLEANED" | "ALREADY_CLEANED";
  reclaimedBytes: string;
  storageDeletedAt: string;
};

export type FinalAssetCleanupResponse = {
  data: FinalAssetCleanupResult;
  message: string;
  success: true;
};

export type BulkFinalAssetCleanupFailure = {
  finalAssetId: string;
  reason: string;
};

export type BulkFinalAssetCleanupResult = {
  requestedCount: number;
  cleanedCount: number;
  alreadyCleanedCount: number;
  failedCount: number;
  ineligibleCount: number;
  reclaimedBytes: string;
  failed: BulkFinalAssetCleanupFailure[];
};

export type BulkFinalAssetCleanupResponse = {
  data: BulkFinalAssetCleanupResult;
  message: string;
  success: true;
};
