import type { AuditResponseData, CategoryScores, MetricsMap, DeviceType, HealthRatingTier } from './audit';

export interface ScanHistoryRecord {
  id: string;
  url: string;
  finalUrl: string;
  hostname: string;
  timestamp: string;
  device: DeviceType;
  healthScore: number;
  healthTier: HealthRatingTier;
  scores: CategoryScores;
  metrics: MetricsMap;
  durationMs?: number;
  auditData: AuditResponseData;
}

export type HistorySortOption = 'newest' | 'oldest' | 'health_desc' | 'health_asc';

export interface HistoryFilterOptions {
  searchQuery: string;
  device: 'all' | 'desktop' | 'mobile';
  sortBy: HistorySortOption;
  selectedHostname?: string;
}

export interface MetricDelta {
  current: number | null;
  previous: number | null;
  delta: number | null;
  isImprovement: boolean;
  isNeutral: boolean;
  formattedDelta: string;
  explanation: string;
}

export interface WebsiteDeltaComparison {
  healthScore: MetricDelta;
  performance: MetricDelta;
  accessibility: MetricDelta;
  bestPractices: MetricDelta;
  seo: MetricDelta;
  lcp: MetricDelta;
  inp: MetricDelta;
  cls: MetricDelta;
}
