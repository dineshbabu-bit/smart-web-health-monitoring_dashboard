import test from 'node:test';
import assert from 'node:assert/strict';
import { validateAndNormalizeUrl, verifyDomainResolves } from '../src/utils/urlValidator.js';
import { parseLighthouseReport } from '../src/services/reportParser.js';
import {
  AppError,
  ValidationError,
  DnsResolutionError,
  TargetUnreachableError,
  TargetTimeoutError,
  LighthouseTimeoutError,
  LighthouseExecutionError,
  ChromeLaunchError,
  BackendError
} from '../src/utils/customErrors.js';
import { getLighthouseOptions, SUPPORTED_CATEGORIES } from '../src/config/lighthouseConfig.js';

test('URL Validator: normalizes URLs properly', () => {
  assert.equal(validateAndNormalizeUrl('example.com'), 'https://example.com/');
  assert.equal(validateAndNormalizeUrl('www.github.com'), 'https://www.github.com/');
  assert.equal(validateAndNormalizeUrl('https://github.com'), 'https://github.com/');
  assert.equal(validateAndNormalizeUrl('http://example.com/test'), 'http://example.com/test');
  assert.equal(validateAndNormalizeUrl('  https://google.com  '), 'https://google.com/');
  assert.equal(validateAndNormalizeUrl('localhost'), 'http://localhost/');
  assert.equal(validateAndNormalizeUrl('localhost:3000'), 'http://localhost:3000/');
  assert.equal(validateAndNormalizeUrl('example.com:8080'), 'https://example.com:8080/');
  assert.equal(validateAndNormalizeUrl('http://127.0.0.1:8080/path'), 'http://127.0.0.1:8080/path');
});

test('URL Validator: throws on invalid URLs and unsupported protocols', () => {
  assert.throws(() => validateAndNormalizeUrl(''), { name: 'ValidationError' });
  assert.throws(() => validateAndNormalizeUrl('   '), { name: 'ValidationError' });
  assert.throws(() => validateAndNormalizeUrl(null), { name: 'ValidationError' });
  assert.throws(() => validateAndNormalizeUrl(12345), { name: 'ValidationError' });
  assert.throws(() => validateAndNormalizeUrl('ftp://example.com'), { name: 'ValidationError' });
  assert.throws(() => validateAndNormalizeUrl('javascript:alert(1)'), { name: 'ValidationError' });
  assert.throws(() => validateAndNormalizeUrl('file:///etc/passwd'), { name: 'ValidationError' });
  assert.throws(() => validateAndNormalizeUrl('data:text/html,<h1>test</h1>'), { name: 'ValidationError' });
  assert.throws(() => validateAndNormalizeUrl('ws://example.com'), { name: 'ValidationError' });
  assert.throws(() => validateAndNormalizeUrl('invalid_string'), { name: 'ValidationError' });
});

test('DNS Validator: verifyDomainResolves passes for local hosts', async () => {
  assert.equal(await verifyDomainResolves('http://localhost:3000'), true);
  assert.equal(await verifyDomainResolves('http://127.0.0.1:5000'), true);
});

test('DNS Validator: verifyDomainResolves resolves valid public domains', async () => {
  assert.equal(await verifyDomainResolves('https://example.com'), true);
});

test('DNS Validator: verifyDomainResolves throws DnsResolutionError on non-existent domain', async () => {
  await assert.rejects(
    async () => {
      await verifyDomainResolves('https://this-domain-definitely-does-not-exist-123456789.com');
    },
    (err) => {
      assert.equal(err.errorCode, 'DNS_ERROR');
      return true;
    }
  );
});

test('Custom Errors: instantiate with correct statuses, error codes, and retryable flags', () => {
  const err1 = new ValidationError('Bad URL input', { field: 'url' });
  assert.equal(err1.statusCode, 400);
  assert.equal(err1.errorCode, 'INVALID_URL');
  assert.equal(err1.retryable, false);
  assert.equal(err1.isOperational, true);
  assert.deepEqual(err1.details, { field: 'url' });

  const err2 = new DnsResolutionError('DNS failed', false);
  assert.equal(err2.statusCode, 400);
  assert.equal(err2.errorCode, 'DNS_ERROR');
  assert.equal(err2.retryable, false);

  const err2Transient = new DnsResolutionError('DNS timeout', true);
  assert.equal(err2Transient.statusCode, 502);
  assert.equal(err2Transient.errorCode, 'DNS_ERROR');
  assert.equal(err2Transient.retryable, true);

  const err3 = new TargetUnreachableError('Host unreachable');
  assert.equal(err3.statusCode, 502);
  assert.equal(err3.errorCode, 'TARGET_UNREACHABLE');
  assert.equal(err3.retryable, true);

  const err4 = new TargetTimeoutError('Target slow');
  assert.equal(err4.statusCode, 504);
  assert.equal(err4.errorCode, 'TARGET_TIMEOUT');
  assert.equal(err4.retryable, true);

  const err5 = new LighthouseTimeoutError('LH watchdog timeout');
  assert.equal(err5.statusCode, 504);
  assert.equal(err5.errorCode, 'LIGHTHOUSE_TIMEOUT');
  assert.equal(err5.retryable, true);

  const err6 = new LighthouseExecutionError('Navigation failed');
  assert.equal(err6.statusCode, 422);
  assert.equal(err6.errorCode, 'LIGHTHOUSE_ERROR');
  assert.equal(err6.retryable, true);

  const err7 = new ChromeLaunchError('Chrome crash');
  assert.equal(err7.statusCode, 503);
  assert.equal(err7.errorCode, 'CHROME_ERROR');
  assert.equal(err7.retryable, true);

  const err8 = new BackendError('Server fault');
  assert.equal(err8.statusCode, 500);
  assert.equal(err8.errorCode, 'BACKEND_ERROR');
  assert.equal(err8.retryable, true);
});

test('Lighthouse Config: builds correct options for device and categories', () => {
  const desktopOpts = getLighthouseOptions({ device: 'desktop' });
  assert.equal(desktopOpts.flags.formFactor, 'desktop');
  assert.deepEqual(desktopOpts.flags.onlyCategories, SUPPORTED_CATEGORIES);

  const mobileOpts = getLighthouseOptions({
    device: 'mobile',
    categories: ['performance', 'seo']
  });
  assert.equal(mobileOpts.flags.formFactor, 'mobile');
  assert.deepEqual(mobileOpts.flags.onlyCategories, ['performance', 'seo']);
});

test('Report Parser: extracts metrics and scores properly', () => {
  const mockLhr = {
    requestedUrl: 'https://example.com',
    finalDisplayedUrl: 'https://example.com/',
    fetchTime: '2026-08-25T16:00:00.000Z',
    lighthouseVersion: '12.0.0',
    userAgent: 'Mozilla/5.0 Chrome',
    categories: {
      performance: {
        title: 'Performance',
        score: 0.95,
        auditRefs: [
          { id: 'first-contentful-paint' },
          { id: 'render-blocking-resources' }
        ]
      },
      accessibility: { title: 'Accessibility', score: 1.0, auditRefs: [] },
      'best-practices': { title: 'Best Practices', score: 0.88, auditRefs: [] },
      seo: { title: 'SEO', score: 0.92, auditRefs: [] }
    },
    audits: {
      'first-contentful-paint': {
        id: 'first-contentful-paint',
        title: 'First Contentful Paint',
        numericValue: 850.123,
        displayValue: '0.9 s',
        score: 0.98
      },
      'largest-contentful-paint': {
        id: 'largest-contentful-paint',
        title: 'Largest Contentful Paint',
        numericValue: 1200.5,
        displayValue: '1.2 s',
        score: 0.96
      },
      'total-blocking-time': {
        id: 'total-blocking-time',
        title: 'Total Blocking Time',
        numericValue: 25.0,
        displayValue: '25 ms',
        score: 1.0
      },
      'cumulative-layout-shift': {
        id: 'cumulative-layout-shift',
        title: 'Cumulative Layout Shift',
        numericValue: 0.012,
        displayValue: '0.01',
        score: 0.99
      },
      'speed-index': {
        id: 'speed-index',
        title: 'Speed Index',
        numericValue: 1100.0,
        displayValue: '1.1 s',
        score: 0.97
      },
      'render-blocking-resources': {
        id: 'render-blocking-resources',
        title: 'Eliminate render-blocking resources',
        score: 0.4,
        displayValue: 'Potential savings of 450 ms',
        details: {
          overallSavingsMs: 450,
          overallSavingsBytes: 25000
        }
      }
    }
  };

  const parsed = parseLighthouseReport(mockLhr, 'desktop');

  assert.equal(parsed.scores.performance, 95);
  assert.equal(parsed.scores.accessibility, 100);
  assert.equal(parsed.scores.bestPractices, 88);
  assert.equal(parsed.scores.seo, 92);
  assert.equal(parsed.metrics.firstContentfulPaint.value, 850.12);
  assert.equal(parsed.metrics.firstContentfulPaint.rating, 'good');
  assert.equal(parsed.metrics.largestContentfulPaint.value, 1200.5);
  assert.equal(parsed.metrics.totalBlockingTime.value, 25);
  assert.equal(parsed.metrics.cumulativeLayoutShift.value, 0.01);
  assert.equal(parsed.metrics.speedIndex.value, 1100);
  assert.equal(parsed.opportunities.length, 1);
  assert.equal(parsed.opportunities[0].id, 'render-blocking-resources');
  assert.equal(parsed.opportunities[0].savingsMs, 450);
});

test('Report Parser: handles empty or missing audit sections gracefully', () => {
  const minimalLhr = {
    requestedUrl: 'https://minimal.com',
    fetchTime: '2026-08-25T16:00:00.000Z',
    categories: {},
    audits: {}
  };

  const parsed = parseLighthouseReport(minimalLhr, 'desktop');
  assert.equal(parsed.url, 'https://minimal.com');
  assert.equal(parsed.scores.performance, null);
  assert.equal(parsed.metrics.firstContentfulPaint.value, null);
  assert.equal(parsed.metrics.firstContentfulPaint.rating, 'info');
  assert.deepEqual(parsed.opportunities, []);
  assert.deepEqual(parsed.diagnostics, []);
});

test('URL Acceptance: accepts arbitrary public domains without allowlist', () => {
  const sampleDomains = [
    'https://example.com',
    'https://react.dev',
    'https://github.com',
    'https://google.com',
    'https://microsoft.com',
    'https://amazon.in',
    'https://www.bannari.com',
    'https://subdomain.university.edu/health-check',
    'http://my-custom-public-website.org:8080/page'
  ];

  for (const domain of sampleDomains) {
    const normalized = validateAndNormalizeUrl(domain);
    assert.ok(normalized.startsWith('http://') || normalized.startsWith('https://'));
    assert.ok(new URL(normalized).hostname.length >= 3);
  }
});

test('Backend Resilience: simulated failed audit preserves Express health check', async () => {
  // Import app directly to verify route execution and error middleware resilience
  const app = (await import('../src/app.js')).default;
  const PORT = 5098;
  const server = app.listen(PORT);

  try {
    const baseUrl = `http://localhost:${PORT}`;

    // 1. Send an intentionally invalid audit request
    const errRes = await fetch(`${baseUrl}/api/audit/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: 'javascript:alert(1)' })
    });
    assert.equal(errRes.status, 400);
    const errData = await errRes.json();
    assert.equal(errData.success, false);
    assert.equal(errData.error.code, 'INVALID_URL');

    // 2. Immediately verify GET /api/health is 200 OK and online
    const healthRes = await fetch(`${baseUrl}/api/health`);
    assert.equal(healthRes.status, 200);
    const healthData = await healthRes.json();
    assert.equal(healthData.status, 'online');

    // 3. Verify duplicate /api/api/health alias is also supported without 404
    const aliasRes = await fetch(`${baseUrl}/api/api/health`);
    assert.equal(aliasRes.status, 200);
    const aliasData = await aliasRes.json();
    assert.equal(aliasData.status, 'online');
  } finally {
    server.close();
  }
});

test('Security & SSRF: blocks cloud instance metadata endpoints', () => {
  const metadataUrls = [
    'http://169.254.169.254/latest/meta-data/',
    'http://metadata.google.internal/computeMetadata/v1/',
    'https://169.254.169.254',
    'http://[fd00:ec2::254]'
  ];

  for (const url of metadataUrls) {
    assert.throws(
      () => validateAndNormalizeUrl(url),
      (err) => {
        assert.equal(err.name, 'ValidationError');
        assert.equal(err.errorCode, 'INVALID_URL');
        return true;
      }
    );
  }
});

test('Project Health Score Formula: correctly computes weighted health and handles missing categories', () => {
  // Test implementation of project health formula:
  // Health Score = (Performance × 0.35) + (Accessibility × 0.25) + (Best Practices × 0.20) + (SEO × 0.20)
  function computeHealth(scores) {
    const s = scores || {};
    let weightedSum = 0;
    let totalWeight = 0;
    if (typeof s.performance === 'number') { weightedSum += s.performance * 0.35; totalWeight += 0.35; }
    if (typeof s.accessibility === 'number') { weightedSum += s.accessibility * 0.25; totalWeight += 0.25; }
    if (typeof s.bestPractices === 'number') { weightedSum += s.bestPractices * 0.20; totalWeight += 0.20; }
    if (typeof s.seo === 'number') { weightedSum += s.seo * 0.20; totalWeight += 0.20; }
    return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
  }

  // 1. All categories present: 100 * 0.35 + 80 * 0.25 + 90 * 0.20 + 70 * 0.20 = 35 + 20 + 18 + 14 = 87
  const score1 = computeHealth({ performance: 100, accessibility: 80, bestPractices: 90, seo: 70 });
  assert.equal(score1, 87);

  // 2. Missing categories are not treated as 100; normalized by available weights
  // Performance only (100) -> 100
  const score2 = computeHealth({ performance: 100, accessibility: null, bestPractices: null, seo: null });
  assert.equal(score2, 100);

  // Performance (50) and Accessibility (50) -> 50
  const score3 = computeHealth({ performance: 50, accessibility: 50, bestPractices: null, seo: null });
  assert.equal(score3, 50);

  // All empty -> 0
  const score4 = computeHealth({});
  assert.equal(score4, 0);
});
