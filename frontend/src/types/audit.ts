export type DeviceType = 'desktop' | 'mobile';

export type MetricRating = 'good' | 'needs-improvement' | 'poor' | 'info';

export type HealthRatingTier = 'Excellent' | 'Good' | 'Needs Improvement' | 'Poor';

export interface CategoryScores {
  performance: number | null;
  accessibility: number | null;
  bestPractices: number | null;
  seo: number | null;
}

export interface MetricItem {
  title: string;
  description: string;
  value: number | null;
  numericUnit: string;
  displayValue: string;
  score: number | null;
  rating: MetricRating;
}

export interface MetricsMap {
  firstContentfulPaint: MetricItem;
  largestContentfulPaint: MetricItem;
  totalBlockingTime: MetricItem;
  cumulativeLayoutShift: MetricItem;
  speedIndex: MetricItem;
  interactionToNextPaint: MetricItem;
  timeToInteractive?: MetricItem;
}

export interface OpportunityItem {
  id: string;
  title: string;
  description: string;
  score: number | null;
  displayValue: string;
  savingsMs: number | null;
  savingsBytes: number | null;
}

export interface DiagnosticItem {
  id: string;
  title: string;
  description: string;
  displayValue: string;
  score: number | null;
}

export interface CategoryCriticalIssue {
  id: string;
  title: string;
  description: string;
  score: number | null;
  displayValue: string;
}

export interface CategoryDetail {
  title: string;
  score: number | null;
  stats: {
    total: number;
    passed: number;
    failed: number;
    informational: number;
  };
  criticalIssues: CategoryCriticalIssue[];
}

export interface AuditResponseData {
  url: string;
  finalUrl: string;
  fetchTime: string;
  lighthouseVersion: string;
  device: DeviceType;
  userAgent: string;
  scores: CategoryScores;
  metrics: MetricsMap;
  opportunities: OpportunityItem[];
  diagnostics: DiagnosticItem[];
  categoryDetails: Record<string, CategoryDetail>;
}

export interface AuditApiMeta {
  analysisDurationMs: number;
  device: DeviceType;
  analyzedUrl: string;
}

export interface AuditApiResponse {
  success: boolean;
  data: AuditResponseData;
  meta: AuditApiMeta;
  timestamp: string;
}

export interface OverallHealthScore {
  score: number;
  tier: HealthRatingTier;
  label: string;
  color: string;
  bgGlow: string;
  description: string;
}
