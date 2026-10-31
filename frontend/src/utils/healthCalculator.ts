import type { CategoryScores, HealthRatingTier, OverallHealthScore, MetricRating } from '../types/audit';

/**
 * Calculates a composite Overall Website Health Score (0-100)
 * Weighted: Performance (35%), Accessibility (25%), Best Practices (20%), SEO (20%)
 * Uses available scores gracefully if any category is null/undefined.
 */
export function calculateOverallHealth(scores?: CategoryScores | null): OverallHealthScore {
  const safeScores = scores || ({} as CategoryScores);

  let totalWeight = 0;
  let weightedSum = 0;

  if (typeof safeScores.performance === 'number' && !isNaN(safeScores.performance)) {
    weightedSum += safeScores.performance * 0.35;
    totalWeight += 0.35;
  }
  if (typeof safeScores.accessibility === 'number' && !isNaN(safeScores.accessibility)) {
    weightedSum += safeScores.accessibility * 0.25;
    totalWeight += 0.25;
  }
  if (typeof safeScores.bestPractices === 'number' && !isNaN(safeScores.bestPractices)) {
    weightedSum += safeScores.bestPractices * 0.20;
    totalWeight += 0.20;
  }
  if (typeof safeScores.seo === 'number' && !isNaN(safeScores.seo)) {
    weightedSum += safeScores.seo * 0.20;
    totalWeight += 0.20;
  }

  const finalScore = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;

  let tier: HealthRatingTier;
  let color = '#ef4444'; // red
  let bgGlow = 'rgba(239, 68, 68, 0.15)';
  let label = 'Poor';
  let description = 'Significant optimization is required across core web vitals, accessibility, and best practices.';

  if (finalScore >= 90) {
    tier = 'Excellent';
    color = '#10b981'; // emerald
    bgGlow = 'rgba(16, 185, 129, 0.15)';
    label = 'Excellent';
    description = 'Your website is performing exceptionally well with outstanding speed, accessibility, and SEO!';
  } else if (finalScore >= 75) {
    tier = 'Good';
    color = '#3b82f6'; // blue
    bgGlow = 'rgba(59, 130, 246, 0.15)';
    label = 'Good';
    description = 'Good overall health with solid foundations, but minor optimizations can elevate it further.';
  } else if (finalScore >= 50) {
    tier = 'Needs Improvement';
    color = '#f59e0b'; // amber
    bgGlow = 'rgba(245, 158, 11, 0.15)';
    label = 'Needs Improvement';
    description = 'Noticeable performance or accessibility bottlenecks are impacting the user experience.';
  } else {
    tier = 'Poor';
  }

  return {
    score: finalScore,
    tier,
    label,
    color,
    bgGlow,
    description,
  };
}

/**
 * Returns color classes and badges for a 0-100 score
 */
export function getScoreColor(score: number | null | undefined): {
  text: string;
  bg: string;
  border: string;
  glow: string;
  hex: string;
  rating: string;
} {
  if (typeof score !== 'number' || isNaN(score)) {
    return {
      text: 'text-zinc-400',
      bg: 'bg-zinc-800/40',
      border: 'border-zinc-700/50',
      glow: 'rgba(113, 113, 122, 0.15)',
      hex: '#71717a',
      rating: 'N/A'
    };
  }

  if (score >= 90) {
    return {
      text: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/30',
      glow: 'rgba(16, 185, 129, 0.25)',
      hex: '#10b981',
      rating: 'Good'
    };
  }
  if (score >= 50) {
    return {
      text: 'text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/30',
      glow: 'rgba(245, 158, 11, 0.25)',
      hex: '#f59e0b',
      rating: 'Needs Improvement'
    };
  }
  return {
    text: 'text-rose-400',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/30',
    glow: 'rgba(239, 68, 68, 0.25)',
    hex: '#ef4444',
    rating: 'Poor'
  };
}

/**
 * Returns rating badge styling for metrics (good, needs-improvement, poor)
 */
export function getMetricRatingBadge(rating: MetricRating): {
  label: string;
  badgeClass: string;
  iconColor: string;
} {
  switch (rating) {
    case 'good':
      return {
        label: 'Good',
        badgeClass: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
        iconColor: '#10b981',
      };
    case 'needs-improvement':
      return {
        label: 'Needs Improvement',
        badgeClass: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
        iconColor: '#f59e0b',
      };
    case 'poor':
      return {
        label: 'Poor',
        badgeClass: 'bg-rose-500/15 text-rose-400 border border-rose-500/30',
        iconColor: '#ef4444',
      };
    default:
      return {
        label: 'Info',
        badgeClass: 'bg-zinc-800 text-zinc-400 border border-zinc-700',
        iconColor: '#71717a',
      };
  }
}

/**
 * Format bytes to human readable format (KB, MB)
 */
export function formatBytes(bytes: number | null | undefined): string {
  if (!bytes || bytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

/**
 * Format milliseconds to human readable format (ms or s)
 */
export function formatMs(ms: number | null | undefined): string {
  if (typeof ms !== 'number') return 'N/A';
  if (ms >= 1000) {
    return `${(ms / 1000).toFixed(2)} s`;
  }
  return `${Math.round(ms)} ms`;
}
