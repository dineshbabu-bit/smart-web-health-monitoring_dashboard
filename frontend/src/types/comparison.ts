import type { AuditResponseData, AuditApiMeta, DeviceType } from './audit';

export type WinnerSide = 'A' | 'B' | 'tie';

export interface ComparisonSiteData {
  url: string;
  device: DeviceType;
  auditData: AuditResponseData;
  meta?: AuditApiMeta;
  healthScore: number;
}

export interface ComparisonMetricRow {
  name: string;
  category: 'health' | 'pillar' | 'vitals' | 'timings';
  displayA: string;
  displayB: string;
  rawA: number | null;
  rawB: number | null;
  winner: WinnerSide;
  diffText: string;
  isBetterLower?: boolean;
}

export interface ComparisonInsight {
  id: string;
  category: string;
  text: string;
  winner: WinnerSide;
  impact: 'high' | 'medium' | 'neutral';
}

export interface ComparisonResult {
  siteA: ComparisonSiteData;
  siteB: ComparisonSiteData;
  winner: WinnerSide;
  winnerReason: string;
  metrics: ComparisonMetricRow[];
  insights: ComparisonInsight[];
  summaryScores: {
    siteAWins: number;
    siteBWins: number;
    ties: number;
  };
}
