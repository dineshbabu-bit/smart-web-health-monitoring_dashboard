import test from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';
import { analyzeCompetitorGap, generateRulesBasedInsights, answerComparisonChat } from '../src/services/geminiService.js';

// Mock audits
const siteA = {
  url: 'https://strong-site.com',
  device: 'desktop',
  healthScore: 92,
  auditData: {
    scores: {
      performance: 95,
      accessibility: 92,
      bestPractices: 90,
      seo: 90
    },
    metrics: {
      largestContentfulPaint: { displayValue: '1.2 s', value: 1200, score: 0.95 },
      firstContentfulPaint: { displayValue: '0.8 s', value: 800, score: 0.98 },
      cumulativeLayoutShift: { displayValue: '0.01', value: 0.01, score: 1 },
      totalBlockingTime: { displayValue: '30 ms', value: 30, score: 0.99 },
      speedIndex: { displayValue: '1.1 s', value: 1100, score: 0.96 },
      interactionToNextPaint: { displayValue: '50 ms', value: 50, score: 0.95 }
    },
    opportunities: [
      { id: 'unused-javascript', title: 'Reduce unused JavaScript', displayValue: 'Potential savings of 120 ms' }
    ]
  }
};

const siteB = {
  url: 'https://weak-site.com',
  device: 'desktop',
  healthScore: 64,
  auditData: {
    scores: {
      performance: 55,
      accessibility: 78,
      bestPractices: 70,
      seo: 65
    },
    metrics: {
      largestContentfulPaint: { displayValue: '4.8 s', value: 4800, score: 0.35 },
      firstContentfulPaint: { displayValue: '2.5 s', value: 2500, score: 0.60 },
      cumulativeLayoutShift: { displayValue: '0.28', value: 0.28, score: 0.45 },
      totalBlockingTime: { displayValue: '750 ms', value: 750, score: 0.20 },
      speedIndex: { displayValue: '4.2 s', value: 4200, score: 0.40 },
      interactionToNextPaint: { displayValue: '320 ms', value: 320, score: 0.45 }
    },
    opportunities: [
      { id: 'render-blocking-resources', title: 'Eliminate render-blocking resources', displayValue: 'Potential savings of 1,200 ms' },
      { id: 'unminified-css', title: 'Minify CSS', displayValue: 'Potential savings of 350 ms' }
    ]
  }
};

test('AI Service: generateRulesBasedInsights accurately identifies stronger and weaker sites', () => {
  const insights = generateRulesBasedInsights({ siteA, siteB, comparison: { winner: 'A' } });

  assert.equal(insights.verdict.isTie, false);
  assert.equal(insights.verdict.strongerUrl, 'https://strong-site.com');
  assert.equal(insights.verdict.weakerUrl, 'https://weak-site.com');
  assert.equal(insights.verdict.scoreDifference, 28);
  assert.equal(insights.verdict.weakestCategory, 'Performance');

  // Verify structure of recommendations (Simple Website Improvement Assistant format)
  assert.ok(Array.isArray(insights.recommendations));
  assert.ok(insights.recommendations.length > 0);
  assert.ok(insights.recommendations.length <= 5);
  const firstRec = insights.recommendations[0];
  assert.ok(firstRec.problem);
  assert.ok(firstRec.evidence);
  assert.ok(firstRec.whyItMatters);
  assert.ok(firstRec.solution);
  assert.ok(Array.isArray(firstRec.implementationSteps));
  assert.ok(firstRec.implementationSteps.length <= 3);
  assert.ok(['Critical', 'High', 'Medium', 'Low'].includes(firstRec.priority));
  assert.ok(['Easy', 'Medium', 'Hard', 'Low', 'High'].includes(firstRec.difficulty));
  assert.ok(firstRec.estimatedTime);
  assert.ok(firstRec.verificationMethod);
  assert.ok(firstRec.expectedBenefit);

  // Verify verdict top 3 problems and simple solutions
  assert.ok(Array.isArray(insights.verdict.topProblems));
  assert.ok(insights.verdict.topProblems.length > 0);
  assert.ok(insights.verdict.topProblems.length <= 3);
  assert.ok(insights.verdict.topProblems[0].problem);
  assert.ok(insights.verdict.topProblems[0].solution);

  // Verify priority matrix
  assert.ok(Array.isArray(insights.priorityMatrix));
  assert.ok(insights.priorityMatrix.length > 0);
  assert.ok(insights.priorityMatrix[0].priority);
  assert.ok(insights.priorityMatrix[0].issue);
  assert.ok(insights.priorityMatrix[0].recommendedFix);

  // Verify competitor learning insights
  assert.ok(Array.isArray(insights.competitorLearningInsights));
  assert.ok(insights.competitorLearningInsights.length > 0);

  // Verify Adaptive Website Improvement Plan
  assert.ok(insights.adaptivePlan);
  assert.ok(Array.isArray(insights.adaptivePlan.tasks));
  assert.ok(insights.adaptivePlan.tasks.length > 0);
  assert.ok(typeof insights.adaptivePlan.totalEstimatedMinutes === 'number');
  assert.ok(insights.adaptivePlan.totalEstimatedMinutes > 0);
  assert.ok(typeof insights.adaptivePlan.totalEstimatedHoursFormatted === 'string');
  assert.ok(typeof insights.adaptivePlan.quickWinsCount === 'number');
  assert.ok(typeof insights.adaptivePlan.criticalCount === 'number');
  assert.ok(Array.isArray(insights.adaptivePlan.stages));
  assert.ok(insights.adaptivePlan.stages.length > 0);

  const sampleTask = insights.adaptivePlan.tasks[0];
  assert.ok(sampleTask.id);
  assert.ok(sampleTask.problem);
  assert.ok(sampleTask.solution);
  assert.ok(['Critical', 'High', 'Medium', 'Low'].includes(sampleTask.priority));
  assert.ok(['Low', 'Medium', 'High'].includes(sampleTask.difficulty));
  assert.ok(typeof sampleTask.estimatedMinutes === 'number');
  assert.ok(['Quick Fix', 'Medium Fix', 'Complex Fix'].includes(sampleTask.effortTier));
  assert.ok(sampleTask.expectedBenefit);
  assert.ok(sampleTask.dependencies);
  assert.ok(sampleTask.verificationMethod);
  assert.ok(typeof sampleTask.isQuickWin === 'boolean');

  // Verify backward compatibility roadmap array
  assert.ok(Array.isArray(insights.roadmap));
  assert.ok(insights.roadmap.length > 0);
  assert.ok(insights.roadmap[0].tasks.length > 0);
});

test('AI Service: handles ties correctly without declaring arbitrary winner', () => {
  const tieSiteB = {
    ...siteB,
    healthScore: 92
  };

  const insights = generateRulesBasedInsights({ siteA, siteB: tieSiteB, comparison: { winner: 'tie' } });

  assert.equal(insights.verdict.isTie, true);
  assert.equal(insights.verdict.scoreDifference, 0);
  assert.match(insights.verdict.summary, /balanced/i);
});

test('AI Service: answerComparisonChat answers the 5 required website improvement questions simply and directly', async () => {
  const comparisonData = {
    siteA,
    siteB,
    insights: generateRulesBasedInsights({ siteA, siteB, comparison: { winner: 'A' } })
  };

  // 1. "How can I improve LCP?"
  const q1 = await answerComparisonChat({
    question: 'How can I improve LCP?',
    comparisonData
  });
  assert.ok(q1.answer);
  assert.match(q1.answer, /preload/i);
  assert.match(q1.answer, /banner|image/i);

  // 2. "Why is my website loading slowly?"
  const q2 = await answerComparisonChat({
    question: 'Why is my website loading slowly?',
    comparisonData
  });
  assert.ok(q2.answer);
  assert.match(q2.answer, /render-blocking|LCP|thread/i);

  // 3. "How can I improve SEO?"
  const q3 = await answerComparisonChat({
    question: 'How can I improve SEO?',
    comparisonData
  });
  assert.ok(q3.answer);
  assert.match(q3.answer, /meta description/i);
  assert.match(q3.answer, /canonical/i);

  // 4. "What are the three biggest problems with Website B?"
  const q4 = await answerComparisonChat({
    question: 'What are the three biggest problems with Website B?',
    comparisonData
  });
  assert.ok(q4.answer);
  assert.match(q4.answer, /1\./);
  assert.match(q4.answer, /2\./);
  assert.match(q4.answer, /3\./);

  // 5. "Give me a simple solution for accessibility problems."
  const q5 = await answerComparisonChat({
    question: 'Give me a simple solution for accessibility problems.',
    comparisonData
  });
  assert.ok(q5.answer);
  assert.match(q5.answer, /contrast|alt|focus/i);
});

test('AI Controller: GET /api/ai/status returns valid JSON and capability flags', async () => {
  // Use node fetch against the express app with supertest or node's server
  const server = app.listen(0);
  const port = server.address().port;

  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/ai/status`);
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.success, true);
    assert.equal(json.data.status, 'online');
    assert.ok(Array.isArray(json.data.capabilities));
  } finally {
    server.close();
  }
});

test('AI Controller: POST /api/ai/compare-insights validates payload', async () => {
  const server = app.listen(0);
  const port = server.address().port;

  try {
    // Missing body
    const res1 = await fetch(`http://127.0.0.1:${port}/api/ai/compare-insights`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    assert.equal(res1.status, 400);

    // Valid payload
    const res2 = await fetch(`http://127.0.0.1:${port}/api/ai/compare-insights`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ siteA, siteB, comparison: { winner: 'A' } })
    });
    assert.equal(res2.status, 200);
    const json = await res2.json();
    assert.equal(json.success, true);
    assert.ok(json.data.verdict);
    assert.ok(json.data.recommendations.length > 0);
    assert.ok(json.data.adaptivePlan);
    assert.ok(json.data.adaptivePlan.tasks.length > 0);
    assert.ok(typeof json.data.adaptivePlan.totalEstimatedMinutes === 'number');
    assert.ok(Array.isArray(json.data.roadmap));
    assert.ok(json.data.roadmap.length > 0);
  } finally {
    server.close();
  }
});

test('AI Controller: POST /api/ai/chat handles conversational query', async () => {
  const server = app.listen(0);
  const port = server.address().port;

  try {
    // Empty question
    const res1 = await fetch(`http://127.0.0.1:${port}/api/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: '' })
    });
    assert.equal(res1.status, 400);

    // Valid question
    const res2 = await fetch(`http://127.0.0.1:${port}/api/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: 'How can we improve LCP?',
        comparisonData: { siteA, siteB }
      })
    });
    assert.equal(res2.status, 200);
    const json = await res2.json();
    assert.equal(json.success, true);
    assert.ok(json.data.answer.length > 20);
  } finally {
    server.close();
  }
});
