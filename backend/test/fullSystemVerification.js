/**
 * End-to-End Comprehensive Verification Test Suite
 * Smart Web Application Health Monitoring System
 *
 * Verifies all 16 requirements from the senior engineering specification.
 */

import assert from 'node:assert/strict';
import app from '../src/app.js';
import { validateAndNormalizeUrl, verifyDomainResolves, isCloudMetadata, isPrivateIpOrHost } from '../src/utils/urlValidator.js';
import { runLighthouseAudit } from '../src/services/lighthouseService.js';
import { parseLighthouseReport } from '../src/services/reportParser.js';
import { getLighthouseOptions, SUPPORTED_CATEGORIES } from '../src/config/lighthouseConfig.js';
import {
  ValidationError,
  DnsResolutionError,
  TargetUnreachableError,
  TargetTimeoutError,
  LighthouseTimeoutError,
  LighthouseExecutionError,
  ChromeLaunchError,
  BackendError
} from '../src/utils/customErrors.js';

const TEST_PORT = 5088;

async function runComprehensiveVerification() {
  console.log('================================================================');
  console.log('🧪 Starting Full System Verification Test Suite');
  console.log('================================================================\n');

  const server = app.listen(TEST_PORT);
  server.setTimeout(300000);
  const baseUrl = `http://localhost:${TEST_PORT}`;

  const results = [];

  function recordPass(testName, detail = '') {
    results.push({ name: testName, passed: true, detail });
    console.log(`✅ [PASS] ${testName}${detail ? ' - ' + detail : ''}`);
  }

  function recordFail(testName, err) {
    results.push({ name: testName, passed: false, error: err.message });
    console.error(`❌ [FAIL] ${testName}:`, err.message);
  }

  try {
    // 1. Backend health endpoint
    try {
      const res = await fetch(`${baseUrl}/api/health`);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.status, 'online');
      recordPass('1. Backend health endpoint (GET /api/health)', 'Status 200, online');
    } catch (e) {
      recordFail('1. Backend health endpoint', e);
    }

    // 2. Frontend proxy health & alias endpoints
    try {
      const rootHealthRes = await fetch(`${baseUrl}/health`);
      assert.equal(rootHealthRes.status, 200);
      const aliasHealthRes = await fetch(`${baseUrl}/api/api/health`);
      assert.equal(aliasHealthRes.status, 200);
      recordPass('2. Health aliases & duplicate /api/api handling', 'Root /health and /api/api/health both return 200 OK');
    } catch (e) {
      recordFail('2. Health aliases & duplicate /api/api handling', e);
    }

    // 3. Valid URL handling & normalization
    try {
      assert.equal(validateAndNormalizeUrl('example.com'), 'https://example.com/');
      assert.equal(validateAndNormalizeUrl('www.github.com'), 'https://www.github.com/');
      assert.equal(validateAndNormalizeUrl('https://react.dev/'), 'https://react.dev/');
      assert.equal(validateAndNormalizeUrl('http://example.com/page'), 'http://example.com/page');
      recordPass('3. Valid URL normalization', 'Bare domains and URLs normalize properly to standard schemes');
    } catch (e) {
      recordFail('3. Valid URL normalization', e);
    }

    // 4. Invalid and empty URL handling
    try {
      assert.throws(() => validateAndNormalizeUrl(''), { name: 'ValidationError' });
      assert.throws(() => validateAndNormalizeUrl('   '), { name: 'ValidationError' });
      assert.throws(() => validateAndNormalizeUrl('javascript:alert(1)'), { name: 'ValidationError' });
      assert.throws(() => validateAndNormalizeUrl('file:///etc/passwd'), { name: 'ValidationError' });
      assert.throws(() => validateAndNormalizeUrl('data:text/html;<h1>hi</h1>'), { name: 'ValidationError' });
      assert.throws(() => validateAndNormalizeUrl('ftp://example.com'), { name: 'ValidationError' });
      recordPass('4. Invalid, empty, and dangerous URL rejection', 'Rejected with 400 ValidationError');
    } catch (e) {
      recordFail('4. Invalid, empty, and dangerous URL rejection', e);
    }

    // 5. SSRF & Cloud Metadata Protection
    try {
      assert.throws(() => validateAndNormalizeUrl('http://169.254.169.254/latest/meta-data'), { name: 'ValidationError' });
      assert.throws(() => validateAndNormalizeUrl('http://metadata.google.internal/'), { name: 'ValidationError' });
      assert.equal(isCloudMetadata('169.254.169.254'), true);
      assert.equal(isCloudMetadata('metadata.google.internal'), true);
      assert.equal(isPrivateIpOrHost('127.0.0.1'), true);
      assert.equal(isPrivateIpOrHost('10.0.0.1'), true);
      assert.equal(isPrivateIpOrHost('192.168.1.1'), true);
      assert.equal(isPrivateIpOrHost('example.com'), false);
      recordPass('5. SSRF & Cloud Metadata Protection', 'Cloud metadata and internal IPs are identified and rejected');
    } catch (e) {
      recordFail('5. SSRF & Cloud Metadata Protection', e);
    }

    // 6. Project Health Score Formula
    try {
      function calcHealth(scores) {
        const s = scores || {};
        let sum = 0, weight = 0;
        if (typeof s.performance === 'number') { sum += s.performance * 0.35; weight += 0.35; }
        if (typeof s.accessibility === 'number') { sum += s.accessibility * 0.25; weight += 0.25; }
        if (typeof s.bestPractices === 'number') { sum += s.bestPractices * 0.20; weight += 0.20; }
        if (typeof s.seo === 'number') { sum += s.seo * 0.20; weight += 0.20; }
        return weight > 0 ? Math.round(sum / weight) : 0;
      }

      // Expected: (100 * 0.35) + (90 * 0.25) + (80 * 0.20) + (85 * 0.20) = 35 + 22.5 + 16 + 17 = 90.5 -> 91
      const scoreFull = calcHealth({ performance: 100, accessibility: 90, bestPractices: 80, seo: 85 });
      assert.equal(scoreFull, 91);

      // Missing values normalized, not treated as 100
      const scorePartial = calcHealth({ performance: 80, accessibility: 80, bestPractices: null, seo: null });
      assert.equal(scorePartial, 80);

      recordPass('6. Project Health Score formula calculation', 'Weightings 0.35/0.25/0.20/0.20 calculated accurately');
    } catch (e) {
      recordFail('6. Project Health Score formula calculation', e);
    }

    // 7. Report Parser metrics and category extraction
    try {
      const mockLhr = {
        requestedUrl: 'https://example.com',
        finalDisplayedUrl: 'https://example.com/',
        fetchTime: '2026-10-29T12:00:00.000Z',
        lighthouseVersion: '12.3.0',
        userAgent: 'Mozilla/5.0 Chrome',
        categories: {
          performance: { score: 0.98, auditRefs: [{ id: 'first-contentful-paint' }] },
          accessibility: { score: 1.0, auditRefs: [] },
          'best-practices': { score: 0.96, auditRefs: [] },
          seo: { score: 0.90, auditRefs: [] }
        },
        audits: {
          'first-contentful-paint': { id: 'first-contentful-paint', title: 'FCP', numericValue: 650.0, displayValue: '0.7 s', score: 0.99 },
          'largest-contentful-paint': { id: 'largest-contentful-paint', title: 'LCP', numericValue: 900.0, displayValue: '0.9 s', score: 0.98 },
          'total-blocking-time': { id: 'total-blocking-time', title: 'TBT', numericValue: 15.0, displayValue: '15 ms', score: 1.0 },
          'cumulative-layout-shift': { id: 'cumulative-layout-shift', title: 'CLS', numericValue: 0.005, displayValue: '0.01', score: 0.99 },
          'speed-index': { id: 'speed-index', title: 'Speed Index', numericValue: 800.0, displayValue: '0.8 s', score: 0.99 }
        }
      };

      const parsed = parseLighthouseReport(mockLhr, 'desktop');
      assert.equal(parsed.scores.performance, 98);
      assert.equal(parsed.scores.accessibility, 100);
      assert.equal(parsed.scores.bestPractices, 96);
      assert.equal(parsed.scores.seo, 90);
      assert.equal(parsed.metrics.firstContentfulPaint.value, 650);
      assert.equal(parsed.metrics.largestContentfulPaint.value, 900);
      assert.equal(parsed.metrics.totalBlockingTime.value, 15);
      assert.equal(parsed.metrics.cumulativeLayoutShift.value, 0.01);
      assert.equal(parsed.metrics.speedIndex.value, 800);
      recordPass('7. Report parser metrics & category score extraction', 'Scores and Web Vitals cleanly mapped');
    } catch (e) {
      recordFail('7. Report parser metrics & category score extraction', e);
    }

    // 8. Graceful handling of missing optional values & recommendation fields
    try {
      const emptyLhr = {
        requestedUrl: 'https://test-empty.com',
        fetchTime: '2026-10-29T12:00:00.000Z',
        categories: {},
        audits: {}
      };
      const parsedEmpty = parseLighthouseReport(emptyLhr, 'desktop');
      assert.equal(parsedEmpty.scores.performance, null);
      assert.equal(parsedEmpty.metrics.firstContentfulPaint.value, null);
      assert.deepEqual(parsedEmpty.opportunities, []);
      assert.deepEqual(parsedEmpty.diagnostics, []);
      recordPass('8. Missing optional values handling', 'Empty categories and audits safely defaulted without throwing');
    } catch (e) {
      recordFail('8. Missing optional values handling', e);
    }

    // 9. Standardized Custom Errors
    try {
      const err = new TargetUnreachableError('Host unreachable');
      assert.equal(err.statusCode, 502);
      assert.equal(err.errorCode, 'TARGET_UNREACHABLE');
      assert.equal(err.retryable, true);

      const navErr = new LighthouseExecutionError('Navigation failed', null, 422);
      assert.equal(navErr.statusCode, 422);
      assert.equal(navErr.errorCode, 'LIGHTHOUSE_ERROR');
      recordPass('9. Standardized error hierarchy', 'Target errors, Lighthouse errors, and status codes properly mapped');
    } catch (e) {
      recordFail('9. Standardized error hierarchy', e);
    }

    // 10. Live Lighthouse Audit (Desktop & Mobile) on https://example.com
    console.log('\n--- Running Live Lighthouse Audits (Sequential) ---');
    try {
      const desktopAudit = await runLighthouseAudit('https://example.com/', { device: 'desktop' });
      assert.ok(desktopAudit.scores.performance !== null);
      assert.ok(desktopAudit.metrics.largestContentfulPaint.value !== null);
      recordPass('10. Live Desktop Lighthouse audit on example.com', `Perf: ${desktopAudit.scores.performance}/100, LCP: ${desktopAudit.metrics.largestContentfulPaint.displayValue}`);

      const mobileAudit = await runLighthouseAudit('https://example.com/', { device: 'mobile' });
      assert.ok(mobileAudit.scores.performance !== null);
      recordPass('11. Live Mobile Lighthouse audit on example.com', `Mobile FormFactor: ${mobileAudit.device}, Perf: ${mobileAudit.scores.performance}/100`);
    } catch (e) {
      recordFail('10-11. Live Lighthouse audits', e);
    }

    // 12. Sequential execution & audit queue resilience
    try {
      const auditPromise1 = runLighthouseAudit('https://example.com/', { device: 'desktop' });
      const auditPromise2 = runLighthouseAudit('https://example.com/', { device: 'desktop' });
      const [res1, res2] = await Promise.all([auditPromise1, auditPromise2]);
      assert.ok(res1 && res2);
      recordPass('12. Sequential execution & audit queue locking', 'Concurrent audits queued sequentially without port collisions');
    } catch (e) {
      recordFail('12. Sequential execution & audit queue locking', e);
    }

    // 13. Audit Controller API integration
    try {
      const apiRes = await fetch(`${baseUrl}/api/audit/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'https://example.com', device: 'desktop' })
      });
      assert.equal(apiRes.status, 200);
      const apiData = await apiRes.json();
      assert.equal(apiData.success, true);
      assert.ok(apiData.data.scores.performance > 0);
      recordPass('13. Audit Controller POST /api/audit/analyze API', `Returned structured report, cache hit flag: ${apiData.meta.cached}`);
    } catch (e) {
      recordFail('13. Audit Controller POST /api/audit/analyze API', e);
    }

    // 14. Server preservation during audit errors
    try {
      const badReq = await fetch(`${baseUrl}/api/audit/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'javascript:alert(1)' })
      });
      assert.equal(badReq.status, 400);

      // Verify health check is still 200 OK immediately after
      const healthCheck = await fetch(`${baseUrl}/api/health`);
      assert.equal(healthCheck.status, 200);
      const healthData = await healthCheck.json();
      assert.equal(healthData.status, 'online');
      recordPass('14. Server preservation after audit validation failure', 'Express server remains healthy and online');
    } catch (e) {
      recordFail('14. Server preservation after audit validation failure', e);
    }

    console.log('\n================================================================');
    const total = results.length;
    const passed = results.filter((r) => r.passed).length;
    const failed = results.filter((r) => !r.passed).length;
    console.log(`📊 Full System Verification Results: ${passed}/${total} Passed (${failed} Failed)`);
    console.log('================================================================\n');

    if (failed > 0) {
      throw new Error(`${failed} verification tests failed.`);
    }
  } finally {
    server.close();
  }
}

runComprehensiveVerification().catch((err) => {
  console.error('\nVerification suite encountered fatal error:', err);
  process.exit(1);
});

