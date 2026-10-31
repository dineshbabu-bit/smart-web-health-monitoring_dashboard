/**
 * Translates a 0-1 Lighthouse score into a user-friendly rating.
 * @param {number|null|undefined} score
 * @returns {'good' | 'needs-improvement' | 'poor' | 'info'}
 */
function getRating(score) {
  if (typeof score !== 'number') return 'info';
  if (score >= 0.9) return 'good';
  if (score >= 0.5) return 'needs-improvement';
  return 'poor';
}

/**
 * Formats score from 0-1 range to 0-100 percentage.
 * @param {number|null|undefined} score
 * @returns {number|null}
 */
function formatScore(score) {
  return typeof score === 'number' ? Math.round(score * 100) : null;
}

// Pre-defined static key sets for O(K) single-pass iteration
const OPPORTUNITY_AUDIT_KEYS = Object.freeze([
  'render-blocking-resources',
  'unused-css-rules',
  'unused-javascript',
  'modern-image-formats',
  'uses-optimized-images',
  'uses-text-compression',
  'uses-responsive-images',
  'efficient-animated-content',
  'unminified-css',
  'unminified-javascript',
  'server-response-time',
  'redirects',
  'offscreen-images'
]);

const DIAGNOSTIC_AUDIT_KEYS = Object.freeze([
  'critical-request-chains',
  'mainthread-work-breakdown',
  'bootup-time',
  'dom-size',
  'font-display',
  'third-party-summary',
  'lcp-lazy-loaded',
  'uses-long-cache-ttl',
  'total-byte-weight',
  'network-requests'
]);

/**
 * Extracts and structures a single audit metric.
 * @param {Object} audit
 * @returns {Object}
 */
function extractMetric(audit) {
  if (!audit) {
    return {
      title: 'N/A',
      description: '',
      value: null,
      numericUnit: 'ms',
      displayValue: 'N/A',
      score: null,
      rating: 'info'
    };
  }

  return {
    title: audit.title || '',
    description: audit.description || '',
    value: typeof audit.numericValue === 'number' ? Number(audit.numericValue.toFixed(2)) : null,
    numericUnit: audit.numericUnit || 'unitless',
    displayValue: audit.displayValue || 'N/A',
    score: formatScore(audit.score),
    rating: getRating(audit.score)
  };
}

/**
 * Parses full Lighthouse LHR (Lighthouse Result) into structured clean JSON.
 * @param {Object} lhr - Raw Lighthouse Result object
 * @param {string} requestedDevice - Emulated device
 * @returns {Object} Structured health report
 */
export function parseLighthouseReport(lhr, requestedDevice = 'desktop') {
  if (!lhr) {
    throw new Error('No Lighthouse result provided for parsing.');
  }

  const audits = lhr.audits || {};
  const categories = lhr.categories || {};

  // 1. Overall Category Scores (0-100)
  const categoryScores = {
    performance: formatScore(categories.performance?.score),
    accessibility: formatScore(categories.accessibility?.score),
    bestPractices: formatScore(categories['best-practices']?.score),
    seo: formatScore(categories.seo?.score)
  };

  // 2. Extract Core Web Vitals & Key Metrics
  // LCP, FCP, CLS, INP (or experimental/fallback), TBT, Speed Index
  const metrics = {
    firstContentfulPaint: extractMetric(audits['first-contentful-paint']),
    largestContentfulPaint: extractMetric(audits['largest-contentful-paint']),
    totalBlockingTime: extractMetric(audits['total-blocking-time']),
    cumulativeLayoutShift: extractMetric(audits['cumulative-layout-shift']),
    speedIndex: extractMetric(audits['speed-index']),
    interactionToNextPaint: extractMetric(
      audits['interaction-to-next-paint'] ||
      audits['experimental-interaction-to-next-paint'] ||
      audits['max-potential-fid'] ||
      audits['interactive']
    ),
    timeToInteractive: extractMetric(audits['interactive'])
  };

  // 3. Performance Improvement Opportunities in single pass O(K)
  const opportunities = [];
  for (let i = 0; i < OPPORTUNITY_AUDIT_KEYS.length; i++) {
    const audit = audits[OPPORTUNITY_AUDIT_KEYS[i]];
    if (audit && typeof audit.score === 'number' && audit.score < 0.9 && audit.details) {
      opportunities.push({
        id: audit.id,
        title: audit.title,
        description: audit.description,
        score: formatScore(audit.score),
        displayValue: audit.displayValue || '',
        savingsMs: audit.details?.overallSavingsMs ?? null,
        savingsBytes: audit.details?.overallSavingsBytes ?? null
      });
    }
  }
  opportunities.sort((a, b) => (b.savingsMs || 0) - (a.savingsMs || 0));

  // 4. Performance & Structural Diagnostics in single pass O(K)
  const diagnostics = [];
  for (let i = 0; i < DIAGNOSTIC_AUDIT_KEYS.length; i++) {
    const audit = audits[DIAGNOSTIC_AUDIT_KEYS[i]];
    if (audit && audit.scoreDisplayMode !== 'notApplicable' && (audit.score === null || (typeof audit.score === 'number' && audit.score < 1))) {
      diagnostics.push({
        id: audit.id,
        title: audit.title,
        description: audit.description,
        displayValue: audit.displayValue || '',
        score: formatScore(audit.score)
      });
    }
  }

  // 5. Category Breakdown with Passed / Failed Audits count
  const categoryDetails = {};
  for (const [catKey, catObj] of Object.entries(categories)) {
    if (!catObj) continue;
    const auditRefs = catObj.auditRefs || [];
    let passedCount = 0;
    let failedCount = 0;
    let notApplicableCount = 0;

    const failedAudits = [];

    for (const ref of auditRefs) {
      const audit = audits[ref.id];
      if (!audit) continue;

      if (
        audit.scoreDisplayMode === 'notApplicable' ||
        audit.scoreDisplayMode === 'informative' ||
        audit.scoreDisplayMode === 'manual'
      ) {
        notApplicableCount++;
      } else if (typeof audit.score === 'number' && audit.score >= 0.9) {
        passedCount++;
      } else if (audit.score === null && audit.scoreDisplayMode !== 'error') {
        notApplicableCount++;
      } else {
        failedCount++;
        failedAudits.push({
          id: audit.id,
          title: audit.title,
          description: audit.description,
          score: formatScore(audit.score),
          displayValue: audit.displayValue || ''
        });
      }
    }

    categoryDetails[catKey] = {
      title: catObj.title,
      score: formatScore(catObj.score),
      stats: {
        total: auditRefs.length,
        passed: passedCount,
        failed: failedCount,
        informational: notApplicableCount
      },
      criticalIssues: failedAudits.slice(0, 10) // top 10 issues
    };
  }

  return {
    url: lhr.requestedUrl,
    finalUrl: lhr.finalDisplayedUrl || lhr.mainDocumentUrl || lhr.requestedUrl,
    fetchTime: lhr.fetchTime,
    lighthouseVersion: lhr.lighthouseVersion,
    device: requestedDevice,
    userAgent: lhr.userAgent,
    scores: categoryScores,
    metrics,
    opportunities,
    diagnostics,
    categoryDetails
  };
}

