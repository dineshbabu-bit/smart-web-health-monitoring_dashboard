import type { AuditResponseData, AuditApiMeta } from '../types/audit';
import type { ScanHistoryRecord, MetricDelta, WebsiteDeltaComparison } from '../types/history';
import { calculateOverallHealth } from '../utils/healthCalculator';

const STORAGE_KEY = 'smart-web-health-scan-history-v1';
const MAX_HISTORY_ITEMS = 50;

/**
 * Extracts clean domain hostname from a URL.
 */
export function extractHostname(rawUrl?: string | null): string {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return 'website';
  }
  try {
    const trimmed = rawUrl.trim();
    const parsed = new URL(trimmed.startsWith('http://') || trimmed.startsWith('https://') ? trimmed : `https://${trimmed}`);
    return parsed.hostname.replace(/^www\./, '') || 'website';
  } catch {
    return (rawUrl || '').replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0] || 'website';
  }
}

// In-memory cache to reduce redundant O(N) localStorage reads and JSON deserializations to O(1)
let cachedScans: ScanHistoryRecord[] | null = null;

/**
 * Safely retrieves all scan history records.
 * Uses in-memory cache for O(1) access, synchronized with localStorage on mutations.
 */
export function getAllScans(): ScanHistoryRecord[] {
  if (cachedScans !== null) {
    return cachedScans;
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      cachedScans = [];
      return cachedScans;
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      cachedScans = [];
      return cachedScans;
    }

    // Validate structure of records and ensure hostname is always present
    cachedScans = parsed
      .filter((item): item is ScanHistoryRecord => {
        return (
          item &&
          typeof item.id === 'string' &&
          typeof item.url === 'string' &&
          typeof item.healthScore === 'number' &&
          typeof item.timestamp === 'string'
        );
      })
      .map((item) => ({
        ...item,
        hostname: item.hostname || extractHostname(item.finalUrl || item.url),
        scores: item.scores || { performance: null, accessibility: null, bestPractices: null, seo: null },
        metrics: item.metrics || {},
      }));

    return cachedScans;
  } catch (err) {
    console.error('Failed to load scan history from localStorage:', err);
    cachedScans = [];
    return cachedScans;
  }
}

/**
 * Saves a new audit result to scan history.
 */
export function saveScan(
  auditData: AuditResponseData,
  meta?: AuditApiMeta
): ScanHistoryRecord {
  const existing = getAllScans();
  const overallHealth = calculateOverallHealth(auditData.scores);
  const hostname = extractHostname(auditData.finalUrl || auditData.url);

  const newRecord: ScanHistoryRecord = {
    id: `scan_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    url: auditData.url,
    finalUrl: auditData.finalUrl || auditData.url,
    hostname,
    timestamp: new Date().toISOString(),
    device: auditData.device || 'desktop',
    healthScore: overallHealth.score,
    healthTier: overallHealth.tier,
    scores: auditData.scores,
    metrics: auditData.metrics,
    durationMs: meta?.analysisDurationMs,
    auditData,
  };

  // Prepend to list and keep within max capacity
  const updated = [newRecord, ...existing].slice(0, MAX_HISTORY_ITEMS);
  cachedScans = updated;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to persist scan to localStorage (quota or disabled):', err);
  }

  return newRecord;
}

/**
 * Retrieves a single scan record by ID in O(N).
 */
export function getScanById(id: string): ScanHistoryRecord | null {
  const scans = getAllScans();
  for (let i = 0; i < scans.length; i++) {
    if (scans[i].id === id) return scans[i];
  }
  return null;
}

/**
 * Deletes a single scan record by ID.
 */
export function deleteScan(id: string): void {
  const existing = getAllScans();
  const updated = existing.filter((s) => s.id !== id);
  cachedScans = updated;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to delete scan from localStorage:', err);
  }
}

/**
 * Clears all scan history.
 */
export function clearAllHistory(): void {
  cachedScans = [];
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error('Failed to clear scan history:', err);
  }
}

/**
 * Retrieves all scans for a specific hostname, sorted oldest to newest (for trend charts).
 * Optimized to avoid repeated Date object instantiations in sort comparator.
 */
export function getHistoryByHostname(hostname: string): ScanHistoryRecord[] {
  const scans = getAllScans();
  const targetHost = (hostname || '').toLowerCase().trim();
  const matched: ScanHistoryRecord[] = [];

  for (let i = 0; i < scans.length; i++) {
    const s = scans[i];
    if ((s.hostname || '').toLowerCase() === targetHost) {
      matched.push(s);
    }
  }

  return matched.sort((a, b) => (Date.parse(a.timestamp) || 0) - (Date.parse(b.timestamp) || 0));
}

/**
 * Retrieves unique websites list with aggregate counts in single-pass O(N).
 * Avoids repeated Date allocations by tracking numeric timestamps.
 */
export function getUniqueWebsites(records?: ScanHistoryRecord[]): {
  hostname: string;
  count: number;
  latestScan: ScanHistoryRecord;
}[] {
  const scans = records || getAllScans();
  const map = new Map<string, { count: number; latestScan: ScanHistoryRecord; latestTime: number }>();

  for (let i = 0; i < scans.length; i++) {
    const scan = scans[i];
    const host = scan.hostname || 'website';
    const time = Date.parse(scan.timestamp) || 0;
    const existing = map.get(host);
    if (!existing) {
      map.set(host, { count: 1, latestScan: scan, latestTime: time });
    } else {
      existing.count += 1;
      if (time > existing.latestTime) {
        existing.latestScan = scan;
        existing.latestTime = time;
      }
    }
  }

  const result: { hostname: string; count: number; latestScan: ScanHistoryRecord }[] = [];
  for (const [hostname, data] of map.entries()) {
    result.push({
      hostname,
      count: data.count,
      latestScan: data.latestScan,
    });
  }
  return result;
}

/**
 * Calculates metric deltas between current and previous scan.
 * Note:
 * - Scores (Health, Performance, SEO, etc.): Higher value is better (positive delta = improvement).
 * - Latencies & Layout Shifts (LCP, INP, CLS): Lower value is better (negative delta = improvement).
 */
export function calculateDeltas(
  current: ScanHistoryRecord,
  previous?: ScanHistoryRecord | null
): WebsiteDeltaComparison | null {
  if (!current || !previous) return null;

  const createScoreDelta = (currVal: number | null | undefined, prevVal: number | null | undefined): MetricDelta => {
    if (typeof currVal !== 'number' || typeof prevVal !== 'number') {
      return { current: currVal ?? null, previous: prevVal ?? null, delta: null, isImprovement: false, isNeutral: true, formattedDelta: 'N/A', explanation: 'No comparison baseline' };
    }
    const diff = currVal - prevVal;
    const isImprovement = diff > 0;
    const isNeutral = diff === 0;
    const sign = diff > 0 ? '+' : '';
    return {
      current: currVal,
      previous: prevVal,
      delta: diff,
      isImprovement,
      isNeutral,
      formattedDelta: isNeutral ? '0' : `${sign}${diff}`,
      explanation: isNeutral ? 'Unchanged' : isImprovement ? `Improved by +${diff} points` : `Decreased by ${diff} points`,
    };
  };

  const createTimingDelta = (
    currVal: number | null | undefined,
    prevVal: number | null | undefined,
    unit: string = 'ms'
  ): MetricDelta => {
    if (typeof currVal !== 'number' || typeof prevVal !== 'number') {
      return { current: currVal ?? null, previous: prevVal ?? null, delta: null, isImprovement: false, isNeutral: true, formattedDelta: 'N/A', explanation: 'No comparison baseline' };
    }
    const diff = Number((currVal - prevVal).toFixed(2));
    // For timings/shifts, lower is BETTER
    const isImprovement = diff < 0;
    const isNeutral = diff === 0;
    const sign = diff > 0 ? '+' : '';
    const absDiff = Math.abs(diff);

    let displayDiff = `${sign}${diff} ${unit}`;
    if (unit === 's' || (unit === 'ms' && absDiff >= 1000)) {
      displayDiff = `${sign}${(diff / (unit === 'ms' ? 1000 : 1)).toFixed(2)}s`;
    }

    return {
      current: currVal,
      previous: prevVal,
      delta: diff,
      isImprovement,
      isNeutral,
      formattedDelta: isNeutral ? '0' : displayDiff,
      explanation: isNeutral
        ? 'Unchanged'
        : isImprovement
        ? `Faster by ${Math.abs(diff)}${unit} (Reduction = Improvement)`
        : `Slower by +${diff}${unit}`,
    };
  };

  const curScores = current.scores || ({} as any);
  const prevScores = previous.scores || ({} as any);
  const curMetrics = current.metrics || ({} as any);
  const prevMetrics = previous.metrics || ({} as any);

  return {
    healthScore: createScoreDelta(current.healthScore, previous.healthScore),
    performance: createScoreDelta(curScores.performance, prevScores.performance),
    accessibility: createScoreDelta(curScores.accessibility, prevScores.accessibility),
    bestPractices: createScoreDelta(curScores.bestPractices, prevScores.bestPractices),
    seo: createScoreDelta(curScores.seo, prevScores.seo),
    lcp: createTimingDelta(curMetrics.largestContentfulPaint?.value, prevMetrics.largestContentfulPaint?.value, 'ms'),
    inp: createTimingDelta(curMetrics.interactionToNextPaint?.value, prevMetrics.interactionToNextPaint?.value, 'ms'),
    cls: createTimingDelta(curMetrics.cumulativeLayoutShift?.value, prevMetrics.cumulativeLayoutShift?.value, ''),
  };
}
