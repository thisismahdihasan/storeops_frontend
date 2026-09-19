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
