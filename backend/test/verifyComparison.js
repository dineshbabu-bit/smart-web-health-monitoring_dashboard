import app from '../src/app.js';

async function runCompleteVerification() {
  const PORT = 5056;
  const server = app.listen(PORT);
  server.setTimeout(300000);

  const baseUrl = `http://localhost:${PORT}`;
  console.log(`Verification test server running at ${baseUrl}`);

  try {
    // 1. Test GET /api/health
    console.log('\n========================================');
    console.log('1. Verifying GET /api/health');
    console.log('========================================');
    const healthRes = await fetch(`${baseUrl}/api/health`);
    const healthData = await healthRes.json();
    console.log(`Health Status (${healthRes.status}):`, healthData);

    // 2. Test One Normal Audit (e.g. https://example.com/)
    console.log('\n========================================');
    console.log('2. Verifying Single Audit: https://example.com/');
    console.log('========================================');
    const singleStart = Date.now();
    const singleRes = await fetch(`${baseUrl}/api/audit/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: 'https://example.com/', device: 'desktop' })
    });
    const singleData = await singleRes.json();
    const singleDuration = ((Date.now() - singleStart) / 1000).toFixed(2);
    console.log(`Single Audit Response (${singleRes.status}) in ${singleDuration}s:`);
    console.log(`Success: ${singleData.success}`);
    if (singleData.success) {
      console.log('Scores:', singleData.data.scores);
    } else {
      console.error('Single Audit Failed:', singleData);
    }

    // 3. Test Comparison: https://example.com/ vs https://react.dev/
    console.log('\n========================================');
    console.log('3. Verifying Comparison: https://example.com/ vs https://react.dev/');
    console.log('========================================');
    const compareStart = Date.now();

    // Audit A
    console.log('[Step 3A] Auditing Website A: https://example.com/...');
    const startA = Date.now();
    const resA = await fetch(`${baseUrl}/api/audit/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: 'https://example.com/', device: 'desktop' })
    });
    const dataA = await resA.json();
    console.log(`[Step 3A Completed] Status: ${resA.status} in ${((Date.now() - startA) / 1000).toFixed(2)}s, Success: ${dataA.success}`);
    if (dataA.success) {
      console.log('Site A Scores:', dataA.data.scores);
    }

    // Audit B
    console.log('[Step 3B] Auditing Website B: https://react.dev/...');
    const startB = Date.now();
    const resB = await fetch(`${baseUrl}/api/audit/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: 'https://react.dev/', device: 'desktop' })
    });
    const dataB = await resB.json();
    console.log(`[Step 3B Completed] Status: ${resB.status} in ${((Date.now() - startB) / 1000).toFixed(2)}s, Success: ${dataB.success}`);
    if (dataB.success) {
      console.log('Site B Scores:', dataB.data.scores);
    }

    const totalCompareDuration = ((Date.now() - compareStart) / 1000).toFixed(2);
    console.log(`\n========================================`);
    console.log(`Comparison Completed Successfully in ${totalCompareDuration}s!`);
    console.log(`Site A (https://example.com/): ${dataA.success ? 'PASSED' : 'FAILED'}`);
    console.log(`Site B (https://react.dev/): ${dataB.success ? 'PASSED' : 'FAILED'}`);
    console.log(`========================================`);

  } finally {
    server.close();
    console.log('Verification test server stopped.');
  }
}

runCompleteVerification().catch((err) => {
  console.error('Verification failed with error:', err);
  process.exit(1);
});
