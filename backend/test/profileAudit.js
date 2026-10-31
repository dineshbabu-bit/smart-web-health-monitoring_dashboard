import { validateAndNormalizeUrl, verifyDomainResolves } from '../src/utils/urlValidator.js';
import { runLighthouseAudit } from '../src/services/lighthouseService.js';

async function profileUrl(url, device = 'desktop') {
  console.log(`\n======================================================`);
  console.log(`PROFILING AUDIT FOR: ${url} (${device})`);
  console.log(`======================================================`);

  const t0 = performance.now();

  // 1. URL validation
  const tUrlStart = performance.now();
  const normalizedUrl = validateAndNormalizeUrl(url);
  const tUrlEnd = performance.now();
  const urlMs = (tUrlEnd - tUrlStart).toFixed(2);

  // 2. DNS check
  const tDnsStart = performance.now();
  await verifyDomainResolves(normalizedUrl);
  const tDnsEnd = performance.now();
  const dnsMs = (tDnsEnd - tDnsStart).toFixed(2);

  console.log(`[Timing] URL validation : ${urlMs} ms`);
  console.log(`[Timing] DNS resolution : ${dnsMs} ms`);

  // 3. Lighthouse & Chrome execution
  const result = await runLighthouseAudit(normalizedUrl, { device });
  const tTotal = (performance.now() - t0).toFixed(2);

  console.log(`[Timing] TOTAL TIME     : ${tTotal} ms (${(tTotal / 1000).toFixed(2)}s)`);
  console.log(`[Scores] Performance: ${result.scores.performance}, A11y: ${result.scores.accessibility}, BP: ${result.scores.bestPractices}, SEO: ${result.scores.seo}`);
  console.log(`[Metrics] LCP: ${result.metrics.largestContentfulPaint?.displayValue}, FCP: ${result.metrics.firstContentfulPaint?.displayValue}`);
  
  return {
    url,
    totalMs: tTotal,
    scores: result.scores
  };
}

async function runProfiles() {
  const urls = [
    'https://example.com',
    'https://react.dev',
    'https://github.com'
  ];

  const results = [];
  for (const u of urls) {
    try {
      const res = await profileUrl(u, 'desktop');
      results.push(res);
    } catch (e) {
      console.error(`Profile failed for ${u}:`, e);
    }
  }

  console.log(`\n======================================================`);
  console.log(`BASELINE SUMMARY:`);
  console.log(`======================================================`);
  results.forEach((r) => {
    console.log(`${r.url}: ${(r.totalMs / 1000).toFixed(2)}s`);
  });
}

runProfiles().catch(console.error);
