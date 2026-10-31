import type { ComparisonSiteData, ComparisonResult, ComparisonMetricRow, ComparisonInsight, WinnerSide } from '../types/comparison';
import { extractHostname } from './scanHistoryService';

/**
 * Evaluates head-to-head metrics and computes winner and automated insights.
 */
export function buildComparisonResult(
  siteA: ComparisonSiteData,
  siteB: ComparisonSiteData
): ComparisonResult {
  const hostA = extractHostname(siteA.url);
  const hostB = extractHostname(siteB.url);

  let siteAWins = 0;
  let siteBWins = 0;
  let ties = 0;

  // Helper to compare numerical metrics
  const compareMetric = (
    name: string,
    category: 'health' | 'pillar' | 'vitals' | 'timings',
    valA: number | null | undefined,
    valB: number | null | undefined,
    displayA: string,
    displayB: string,
    isBetterLower = false,
    unit = ''
  ): ComparisonMetricRow => {
    const rawA = typeof valA === 'number' ? valA : null;
    const rawB = typeof valB === 'number' ? valB : null;

    let winner: WinnerSide = 'tie';
    let diffText = '0';

    if (rawA !== null && rawB !== null) {
      const diff = Number((rawA - rawB).toFixed(2));
      if (Math.abs(diff) < 0.001) {
        winner = 'tie';
        diffText = 'Tied';
        ties += 1;
      } else if (isBetterLower) {
        // Lower is better (e.g. LCP, INP, CLS)
        if (rawA < rawB) {
          winner = 'A';
          diffText = `A faster by ${Math.abs(diff)}${unit}`;
          siteAWins += 1;
        } else {
          winner = 'B';
          diffText = `B faster by ${Math.abs(diff)}${unit}`;
          siteBWins += 1;
        }
      } else {
        // Higher is better (e.g. Scores)
        if (rawA > rawB) {
          winner = 'A';
          diffText = `A +${diff}${unit}`;
          siteAWins += 1;
        } else {
          winner = 'B';
          diffText = `B +${Math.abs(diff)}${unit}`;
          siteBWins += 1;
        }
      }
    } else {
      ties += 1;
    }

    return {
      name,
      category,
      displayA,
      displayB,
      rawA,
      rawB,
      winner,
      diffText,
      isBetterLower,
    };
  };

  const metricsA = siteA.auditData.metrics || {};
  const metricsB = siteB.auditData.metrics || {};
  const scoresA = siteA.auditData.scores || { performance: null, accessibility: null, bestPractices: null, seo: null };
  const scoresB = siteB.auditData.scores || { performance: null, accessibility: null, bestPractices: null, seo: null };

  const metricRows: ComparisonMetricRow[] = [
    // Overall Health
    compareMetric(
      'Overall Website Health',
      'health',
      siteA.healthScore,
      siteB.healthScore,
      `${siteA.healthScore}/100`,
      `${siteB.healthScore}/100`,
      false,
      ' pts'
    ),
    // 4 Pillars
    compareMetric(
      'Performance Score',
      'pillar',
      scoresA.performance,
      scoresB.performance,
      `${scoresA.performance ?? 'N/A'}/100`,
      `${scoresB.performance ?? 'N/A'}/100`,
      false,
      ' pts'
    ),
    compareMetric(
      'Accessibility Score',
      'pillar',
      scoresA.accessibility,
      scoresB.accessibility,
      `${scoresA.accessibility ?? 'N/A'}/100`,
      `${scoresB.accessibility ?? 'N/A'}/100`,
      false,
      ' pts'
    ),
    compareMetric(
      'Best Practices Score',
      'pillar',
      scoresA.bestPractices,
      scoresB.bestPractices,
      `${scoresA.bestPractices ?? 'N/A'}/100`,
      `${scoresB.bestPractices ?? 'N/A'}/100`,
      false,
      ' pts'
    ),
    compareMetric(
      'SEO Score',
      'pillar',
      scoresA.seo,
      scoresB.seo,
      `${scoresA.seo ?? 'N/A'}/100`,
      `${scoresB.seo ?? 'N/A'}/100`,
      false,
      ' pts'
    ),
    // Core Web Vitals (lower is better)
    compareMetric(
      'Largest Contentful Paint (LCP)',
      'vitals',
      metricsA.largestContentfulPaint?.value,
      metricsB.largestContentfulPaint?.value,
      metricsA.largestContentfulPaint?.displayValue || 'N/A',
      metricsB.largestContentfulPaint?.displayValue || 'N/A',
      true,
      'ms'
    ),
    compareMetric(
      'Interaction to Next Paint (INP)',
      'vitals',
      metricsA.interactionToNextPaint?.value,
      metricsB.interactionToNextPaint?.value,
      metricsA.interactionToNextPaint?.displayValue || 'N/A',
      metricsB.interactionToNextPaint?.displayValue || 'N/A',
      true,
      'ms'
    ),
    compareMetric(
      'Cumulative Layout Shift (CLS)',
      'vitals',
      metricsA.cumulativeLayoutShift?.value,
      metricsB.cumulativeLayoutShift?.value,
      metricsA.cumulativeLayoutShift?.displayValue || '0',
      metricsB.cumulativeLayoutShift?.displayValue || '0',
      true,
      ''
    ),
    // Additional Metrics
    compareMetric(
      'First Contentful Paint (FCP)',
      'timings',
      metricsA.firstContentfulPaint?.value,
      metricsB.firstContentfulPaint?.value,
      metricsA.firstContentfulPaint?.displayValue || 'N/A',
      metricsB.firstContentfulPaint?.displayValue || 'N/A',
      true,
      'ms'
    ),
    compareMetric(
      'Total Blocking Time (TBT)',
      'timings',
      metricsA.totalBlockingTime?.value,
      metricsB.totalBlockingTime?.value,
      metricsA.totalBlockingTime?.displayValue || 'N/A',
      metricsB.totalBlockingTime?.displayValue || 'N/A',
      true,
      'ms'
    ),
    compareMetric(
      'Speed Index (SI)',
      'timings',
      metricsA.speedIndex?.value,
      metricsB.speedIndex?.value,
      metricsA.speedIndex?.displayValue || 'N/A',
      metricsB.speedIndex?.displayValue || 'N/A',
      true,
      'ms'
    ),
  ];

  // Overall Winner Calculation (Weighted health score + head-to-head metric wins)
  let overallWinner: WinnerSide = 'tie';
  let winnerReason = '';

  const healthDiff = siteA.healthScore - siteB.healthScore;
  if (Math.abs(healthDiff) >= 3) {
    if (healthDiff > 0) {
      overallWinner = 'A';
      winnerReason = `${hostA} leads with an Overall Health Score of ${siteA.healthScore}/100 (+${healthDiff} points over ${hostB}) and won ${siteAWins} of ${metricRows.length} benchmark categories.`;
    } else {
      overallWinner = 'B';
      winnerReason = `${hostB} leads with an Overall Health Score of ${siteB.healthScore}/100 (+${Math.abs(healthDiff)} points over ${hostA}) and won ${siteBWins} of ${metricRows.length} benchmark categories.`;
    }
  } else {
    if (siteAWins > siteBWins) {
      overallWinner = 'A';
      winnerReason = `${hostA} won the majority of benchmark metrics (${siteAWins} wins vs. ${siteBWins} wins for ${hostB}) with closely matched overall health scores.`;
    } else if (siteBWins > siteAWins) {
      overallWinner = 'B';
      winnerReason = `${hostB} won the majority of benchmark metrics (${siteBWins} wins vs. ${siteAWins} wins for ${hostA}) with closely matched overall health scores.`;
    } else {
      overallWinner = 'tie';
      winnerReason = `Both websites perform at a near-identical level with comparable health scores (${siteA.healthScore} vs. ${siteB.healthScore}) and balanced metric advantages.`;
    }
  }

  // Generate automated natural language insights
  const insights: ComparisonInsight[] = [];

  // 1. Health insight
  if (siteA.healthScore !== siteB.healthScore) {
    const leader = siteA.healthScore > siteB.healthScore ? hostA : hostB;
    const lWinner: WinnerSide = siteA.healthScore > siteB.healthScore ? 'A' : 'B';
    insights.push({
      id: 'ins_health',
      category: 'Overall Health',
      text: `${leader} achieves higher overall website health (${Math.max(siteA.healthScore, siteB.healthScore)} vs ${Math.min(siteA.healthScore, siteB.healthScore)}/100).`,
      winner: lWinner,
      impact: 'high',
    });
  }

  // 2. Performance insight
  const perfA = scoresA.performance ?? 0;
  const perfB = scoresB.performance ?? 0;
  if (Math.abs(perfA - perfB) >= 5) {
    const leader = perfA > perfB ? hostA : hostB;
    const pWinner: WinnerSide = perfA > perfB ? 'A' : 'B';
    insights.push({
      id: 'ins_perf',
      category: 'Performance',
      text: `${leader} demonstrates superior runtime performance and loading speed (+${Math.abs(perfA - perfB)} points advantage).`,
      winner: pWinner,
      impact: 'high',
    });
  }

  // 3. LCP / Speed insight
  const lcpA = metricsA.largestContentfulPaint?.value;
  const lcpB = metricsB.largestContentfulPaint?.value;
  if (typeof lcpA === 'number' && typeof lcpB === 'number' && Math.abs(lcpA - lcpB) > 200) {
    const leader = lcpA < lcpB ? hostA : hostB;
    const lWinner: WinnerSide = lcpA < lcpB ? 'A' : 'B';
    const diffSec = (Math.abs(lcpA - lcpB) / 1000).toFixed(2);
    insights.push({
      id: 'ins_lcp',
      category: 'Core Web Vitals',
      text: `${leader} renders its largest contentful paint (LCP) ${diffSec}s faster, providing a snappier first impression.`,
      winner: lWinner,
      impact: 'high',
    });
  }

  // 4. Accessibility insight
  const a11yA = scoresA.accessibility ?? 0;
  const a11yB = scoresB.accessibility ?? 0;
  if (Math.abs(a11yA - a11yB) >= 4) {
    const leader = a11yA > a11yB ? hostA : hostB;
    const aWinner: WinnerSide = a11yA > a11yB ? 'A' : 'B';
    insights.push({
      id: 'ins_a11y',
      category: 'Accessibility',
      text: `${leader} has better accessibility compliance, screen reader support, and color contrast structure.`,
      winner: aWinner,
      impact: 'medium',
    });
  }

  // 5. Visual Stability (CLS)
  const clsA = metricsA.cumulativeLayoutShift?.value;
  const clsB = metricsB.cumulativeLayoutShift?.value;
  if (typeof clsA === 'number' && typeof clsB === 'number') {
    if (clsA < 0.05 && clsB < 0.05) {
      insights.push({
        id: 'ins_cls_both',
        category: 'Visual Stability',
        text: `Both websites offer excellent visual stability with minimal layout shifting during page load.`,
        winner: 'tie',
        impact: 'neutral',
      });
    } else if (clsA !== clsB) {
      const leader = clsA < clsB ? hostA : hostB;
      const cWinner: WinnerSide = clsA < clsB ? 'A' : 'B';
      insights.push({
        id: 'ins_cls',
        category: 'Visual Stability',
        text: `${leader} maintains superior visual layout stability with fewer abrupt DOM shifts.`,
        winner: cWinner,
        impact: 'medium',
      });
    }
  }

  // 6. SEO insight
  const seoA = scoresA.seo ?? 0;
  const seoB = scoresB.seo ?? 0;
  if (Math.abs(seoA - seoB) <= 3) {
    insights.push({
      id: 'ins_seo_tie',
      category: 'SEO',
      text: `Both websites possess comparable SEO optimization and search crawlability ratings (${seoA} vs ${seoB}).`,
      winner: 'tie',
      impact: 'neutral',
    });
  } else {
    const leader = seoA > seoB ? hostA : hostB;
    const sWinner: WinnerSide = seoA > seoB ? 'A' : 'B';
    insights.push({
      id: 'ins_seo',
      category: 'SEO',
      text: `${leader} has stronger search engine optimization and meta tag discoverability (+${Math.abs(seoA - seoB)} points).`,
      winner: sWinner,
      impact: 'medium',
    });
  }

  return {
    siteA,
    siteB,
    winner: overallWinner,
    winnerReason,
    metrics: metricRows,
    insights,
    summaryScores: {
      siteAWins,
      siteBWins,
      ties,
    },
  };
}
