import { api } from './api';
import type {
  AiComparisonInsights,
  AiChatAnswer,
  AiStatusResponse,
  BeforeAfterRecord,
  BeforeAfterMetricDelta,
  PlannerTaskState
} from '../types/ai';
import type { ComparisonSiteData, ComparisonResult } from '../types/comparison';
import type { AuditResponseData } from '../types/audit';
import { calculateOverallHealth } from '../utils/healthCalculator';

const ROADMAP_STORAGE_PREFIX = 'smart_health_roadmap_state_';
const PLANNER_STORAGE_PREFIX = 'smart_health_adaptive_planner_';
const WORKLOAD_STORAGE_PREFIX = 'smart_health_planner_workload_';
const BEFORE_AFTER_STORAGE_KEY = 'smart_health_before_after_history';

/**
 * Request AI Competitor Gap Analysis and Improvement Advisor report.
 */
export async function getAiComparisonInsights(
  siteA: ComparisonSiteData,
  siteB: ComparisonSiteData,
  comparison?: Partial<ComparisonResult>
): Promise<AiComparisonInsights> {
  const response = await api.post<{ success: boolean; data: AiComparisonInsights }>('/ai/compare-insights', {
    siteA: {
      url: siteA.url,
      device: siteA.device,
      healthScore: siteA.healthScore,
      auditData: siteA.auditData
    },
    siteB: {
      url: siteB.url,
      device: siteB.device,
      healthScore: siteB.healthScore,
      auditData: siteB.auditData
    },
    comparison: {
      winner: comparison?.winner || (siteA.healthScore > siteB.healthScore ? 'A' : siteB.healthScore > siteA.healthScore ? 'B' : 'tie'),
      winnerReason: comparison?.winnerReason
    }
  });

  return response.data.data;
}

/**
 * Ask a grounded question about the comparison or website optimizations.
 */
export async function askAiComparisonQuestion(
  question: string,
  comparisonData: {
    siteA?: ComparisonSiteData;
    siteB?: ComparisonSiteData;
    insights?: AiComparisonInsights;
  }
): Promise<AiChatAnswer> {
  const response = await api.post<{ success: boolean; data: AiChatAnswer }>('/ai/chat', {
    question,
    comparisonData
  });

  return response.data.data;
}

/**
 * Fetch AI service configuration status.
 */
export async function getAiServiceStatus(): Promise<AiStatusResponse> {
  const response = await api.get<{ success: boolean; data: AiStatusResponse }>('/ai/status');
  return response.data.data;
}

/**
 * Get roadmap task completion states from localStorage for a specific comparison session.
 */
export function getRoadmapTaskStates(roadmapKey: string): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(`${ROADMAP_STORAGE_PREFIX}${roadmapKey}`);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.error('Failed to read roadmap state from localStorage', e);
    return {};
  }
}

/**
 * Update a single roadmap task's completion state.
 */
export function setRoadmapTaskState(roadmapKey: string, taskId: string, completed: boolean): Record<string, boolean> {
  try {
    const current = getRoadmapTaskStates(roadmapKey);
    const updated = { ...current, [taskId]: completed };
    localStorage.setItem(`${ROADMAP_STORAGE_PREFIX}${roadmapKey}`, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Failed to persist roadmap task state', e);
    return {};
  }
}

/**
 * Clear stored completion states for a roadmap session.
 */
export function resetRoadmapTaskStates(roadmapKey: string): void {
  try {
    localStorage.removeItem(`${ROADMAP_STORAGE_PREFIX}${roadmapKey}`);
  } catch (e) {
    console.error('Failed to reset roadmap task state', e);
  }
}

/**
 * Get adaptive planner task states (completion, actual time spent, completion timestamp) from localStorage.
 */
export function getPlannerTaskStates(planKey: string): Record<string, PlannerTaskState> {
  try {
    const raw = localStorage.getItem(`${PLANNER_STORAGE_PREFIX}${planKey}`);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.error('Failed to read planner task state from localStorage', e);
    return {};
  }
}

/**
 * Update an individual adaptive planner task state.
 */
export function setPlannerTaskState(
  planKey: string,
  taskId: string,
  completed: boolean,
  actualMinutes?: number
): Record<string, PlannerTaskState> {
  try {
    const current = getPlannerTaskStates(planKey);
    const existing = current[taskId] || { completed: false };
    const updated: Record<string, PlannerTaskState> = {
      ...current,
      [taskId]: {
        completed,
        completedAt: completed ? (existing.completedAt || new Date().toISOString()) : undefined,
        actualMinutes: actualMinutes !== undefined ? actualMinutes : existing.actualMinutes
      }
    };
    localStorage.setItem(`${PLANNER_STORAGE_PREFIX}${planKey}`, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Failed to persist planner task state', e);
    return {};
  }
}

/**
 * Retrieve saved daily workload setting in minutes per day (default 60 = 1 hour/day).
 */
export function getPlannerWorkload(planKey: string): number {
  try {
    const raw = localStorage.getItem(`${WORKLOAD_STORAGE_PREFIX}${planKey}`);
    if (raw) {
      const parsed = parseInt(raw, 10);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
  } catch (e) {
    console.error('Failed to read planner workload setting', e);
  }
  return 60; // default 1 hour / day
}

/**
 * Save daily workload setting in minutes per day.
 */
export function setPlannerWorkload(planKey: string, minutes: number): void {
  try {
    localStorage.setItem(`${WORKLOAD_STORAGE_PREFIX}${planKey}`, String(Math.max(15, minutes)));
  } catch (e) {
    console.error('Failed to persist planner workload setting', e);
  }
}

/**
 * Reset all planner states (tasks and workload) for a website comparison session.
 */
export function resetPlannerState(planKey: string): void {
  try {
    localStorage.removeItem(`${PLANNER_STORAGE_PREFIX}${planKey}`);
    localStorage.removeItem(`${WORKLOAD_STORAGE_PREFIX}${planKey}`);
  } catch (e) {
    console.error('Failed to reset adaptive planner state', e);
  }
}

/**
 * Format minutes into human-readable hours and minutes string (e.g., "1h 45m" or "35m").
 */
export function formatMinutes(minutes: number): string {
  if (!minutes || minutes <= 0) return '0m';
  const hours = Math.floor(minutes / 60);
  const remaining = Math.round(minutes % 60);
  if (hours > 0 && remaining > 0) return `${hours}h ${remaining}m`;
  if (hours > 0) return `${hours}h`;
  return `${remaining}m`;
}

/**
 * Calculate estimated calendar working days required given remaining effort and daily workload.
 */
export function calculateWorkingDays(remainingMinutes: number, minutesPerDay: number): number {
  if (remainingMinutes <= 0) return 0;
  const effectiveWorkload = Math.max(15, minutesPerDay || 60);
  return Math.ceil(remainingMinutes / effectiveWorkload);
}

/**
 * Retrieve Before-and-After audit history from localStorage.
 */
export function getBeforeAfterHistory(filterUrl?: string): BeforeAfterRecord[] {
  try {
    const raw = localStorage.getItem(BEFORE_AFTER_STORAGE_KEY);
    if (!raw) return [];
    const list: BeforeAfterRecord[] = JSON.parse(raw);
    if (filterUrl) {
      return list.filter((item) => item.url.toLowerCase() === filterUrl.toLowerCase());
    }
    return list;
  } catch (e) {
    console.error('Failed to parse Before/After history', e);
    return [];
  }
}

/**
 * Save a new Before-and-After re-audit record into localStorage.
 */
export function saveBeforeAfterRecord(record: BeforeAfterRecord): void {
  try {
    const current = getBeforeAfterHistory();
    // Keep up to 20 recent records
    const updated = [record, ...current.filter((r) => r.id !== record.id)].slice(0, 20);
    localStorage.setItem(BEFORE_AFTER_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save Before/After record', e);
  }
}

/**
 * Delete a Before-and-After record.
 */
export function deleteBeforeAfterRecord(id: string): void {
  try {
    const current = getBeforeAfterHistory();
    const updated = current.filter((r) => r.id !== id);
    localStorage.setItem(BEFORE_AFTER_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to delete Before/After record', e);
  }
}

/**
 * Compute metric deltas between baseline and re-audit.
 */
export function computeBeforeAfterDeltas(
  beforeAudit: AuditResponseData,
  afterAudit: AuditResponseData
): { healthDelta: number; newHealth: number; deltas: BeforeAfterMetricDelta[] } {
  const oldHealth = calculateOverallHealth(beforeAudit.scores).score;
  const newHealth = calculateOverallHealth(afterAudit.scores).score;
  const healthDelta = newHealth - oldHealth;

  const metricDefs: Array<{
    key: keyof AuditResponseData['metrics'];
    name: string;
    isLowerBetter: boolean;
  }> = [
    { key: 'largestContentfulPaint', name: 'Largest Contentful Paint (LCP)', isLowerBetter: true },
    { key: 'firstContentfulPaint', name: 'First Contentful Paint (FCP)', isLowerBetter: true },
    { key: 'cumulativeLayoutShift', name: 'Cumulative Layout Shift (CLS)', isLowerBetter: true },
    { key: 'totalBlockingTime', name: 'Total Blocking Time (TBT)', isLowerBetter: true },
    { key: 'speedIndex', name: 'Speed Index', isLowerBetter: true },
    { key: 'interactionToNextPaint', name: 'Interaction to Next Paint (INP)', isLowerBetter: true }
  ];

  const deltas: BeforeAfterMetricDelta[] = metricDefs.map((def) => {
    const b = beforeAudit.metrics[def.key];
    const a = afterAudit.metrics[def.key];

    const bVal = typeof b?.value === 'number' ? b.value : 0;
    const aVal = typeof a?.value === 'number' ? a.value : 0;
    const diff = aVal - bVal;

    let improved = false;
    let neutral = false;

    if (Math.abs(diff) < 0.001) {
      neutral = true;
    } else if (def.isLowerBetter) {
      improved = diff < 0; // lower is better
    } else {
      improved = diff > 0;
    }

    return {
      metricName: def.name,
      beforeDisplay: b?.displayValue || 'N/A',
      afterDisplay: a?.displayValue || 'N/A',
      beforeVal: bVal,
      afterVal: aVal,
      diffVal: diff,
      improved,
      neutral
    };
  });

  return { healthDelta, newHealth, deltas };
}
