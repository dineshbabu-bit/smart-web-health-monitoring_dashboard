import app from '../src/app.js';

async function runIntegrationTests() {
  const PORT = 5055;
  const server = app.listen(PORT);
  server.setTimeout(300000);

  console.log(`Test server listening on port ${PORT}`);

  try {
    const baseUrl = `http://localhost:${PORT}`;

    // 1. Test Health Endpoint
    console.log('\n--- 1. Testing GET /api/health ---');
    const healthRes = await fetch(`${baseUrl}/api/health`);
    const healthData = await healthRes.json();
    console.log(`Status: ${healthRes.status}`, healthData);
    if (healthRes.status !== 200 || healthData.status !== 'online') {
      throw new Error('Health check test failed');
    }

    // 2. Test Invalid URL Format
    console.log('\n--- 2. Testing Invalid URL Format ---');
    const invalidUrlRes = await fetch(`${baseUrl}/api/audit/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: 'javascript:alert(1)' })
    });
    const invalidUrlData = await invalidUrlRes.json();
    console.log(`Status: ${invalidUrlRes.status}`, invalidUrlData);
    if (invalidUrlRes.status !== 400 || invalidUrlData.error?.code !== 'INVALID_URL') {
      throw new Error('Invalid URL format test failed');
    }

    // 3. Test Non-existent domain (DNS resolution failure)
    console.log('\n--- 3. Testing Non-existent Domain (DNS preflight error) ---');
    const dnsErrRes = await fetch(`${baseUrl}/api/audit/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: 'https://thisdomainwillneverexistxyz123987456.org' })
    });
    const dnsErrData = await dnsErrRes.json();
    console.log(`Status: ${dnsErrRes.status}`, dnsErrData);
    if (dnsErrData.error?.code !== 'DNS_ERROR') {
      throw new Error('DNS resolution test failed');
    }

    // 4. Test URL without protocol normalization
    console.log('\n--- 4. Testing URL without protocol: example.com ---');
    const noProtoRes = await fetch(`${baseUrl}/api/audit/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: 'example.com', device: 'desktop' })
    });
    const noProtoData = await noProtoRes.json();
    console.log(`Status: ${noProtoRes.status}, Success: ${noProtoData.success}`);
    if (!noProtoData.success || !noProtoData.data) {
      throw new Error(`URL without protocol audit failed: ${JSON.stringify(noProtoData)}`);
    }
    console.log(`Audited: ${noProtoData.data.finalUrl || noProtoData.data.url} | Health: ${noProtoData.data.scores.performance}/100 Perf`);

    // 5. Test Live Audit on https://example.com
    console.log('\n--- 5. Testing Live Audit on https://example.com ---');
    const auditRes = await fetch(`${baseUrl}/api/audit/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: 'https://example.com', device: 'desktop' })
    });
    const auditData = await auditRes.json();
    console.log(`Status: ${auditRes.status}`);
    console.log('Success:', auditData.success);
    if (auditData.success) {
      console.log('Scores:', auditData.data.scores);
      console.log('FCP:', auditData.data.metrics.firstContentfulPaint?.displayValue);
      console.log('LCP:', auditData.data.metrics.largestContentfulPaint?.displayValue);
      console.log('CLS:', auditData.data.metrics.cumulativeLayoutShift?.displayValue);
      console.log('Duration:', auditData.meta.analysisDurationMs, 'ms');
    } else {
      throw new Error(`Audit failed on https://example.com: ${JSON.stringify(auditData)}`);
    }

    // 6. Test Live Mobile Audit on https://example.com
    console.log('\n--- 6. Testing Live Mobile Audit on https://example.com ---');
    const mobileAuditRes = await fetch(`${baseUrl}/api/audit/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: 'https://example.com', device: 'mobile' })
    });
    const mobileAuditData = await mobileAuditRes.json();
    console.log(`Status: ${mobileAuditRes.status}, Success: ${mobileAuditData.success}`);
    if (!mobileAuditData.success || mobileAuditData.meta?.device !== 'mobile') {
      throw new Error(`Mobile audit failed: ${JSON.stringify(mobileAuditData)}`);
    }
    console.log('Mobile Scores:', mobileAuditData.data.scores);

    // 7. Test SSRF Protection on Cloud Metadata Endpoint
    console.log('\n--- 7. Testing SSRF Protection on 169.254.169.254 ---');
    const ssrfRes = await fetch(`${baseUrl}/api/audit/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: 'http://169.254.169.254/latest/meta-data/' })
    });
    const ssrfData = await ssrfRes.json();
    console.log(`Status: ${ssrfRes.status}, Error Code: ${ssrfData.error?.code}`);
    if (ssrfRes.status !== 400 || ssrfData.error?.code !== 'INVALID_URL') {
      throw new Error(`SSRF protection failed: ${JSON.stringify(ssrfData)}`);
    }

    console.log('\nAll integration tests PASSED successfully!');
  } finally {
    server.close();
    console.log('\nTest server stopped.');
  }
}

runIntegrationTests().catch((err) => {
  console.error('Integration tests failed:', err);
  process.exit(1);
});
