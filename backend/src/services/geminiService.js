import { GoogleGenAI } from '@google/genai';
import { config } from '../config/index.js';

/**
 * In-memory LRU/TTL cache for AI comparison insights to prevent redundant expensive API calls.
 * TTL: 15 minutes.
 */
const aiInsightsCache = new Map();
const CACHE_TTL_MS = 15 * 60 * 1000;

/**
 * Generates deterministic, expert-grade rules-based insights from real Lighthouse audit data.
 * Used when Gemini API key is not configured or when API quotas/limits are reached.
 */
export function generateRulesBasedInsights({ siteA, siteB, comparison }) {
  const healthA = siteA.healthScore ?? 0;
  const healthB = siteB.healthScore ?? 0;
  const diff = Math.abs(healthA - healthB);

  let winnerSide = comparison?.winner || (healthA > healthB ? 'A' : healthB > healthA ? 'B' : 'tie');
  if (healthA === healthB) winnerSide = 'tie';

  const strongerSite = winnerSide === 'B' ? siteB : siteA;
  const weakerSite = winnerSide === 'B' ? siteA : siteB;
  const isTie = winnerSide === 'tie';

  const strongScores = strongerSite.auditData?.scores || {};
  const weakScores = weakerSite.auditData?.scores || {};
  const strongMetrics = strongerSite.auditData?.metrics || {};
  const weakMetrics = weakerSite.auditData?.metrics || {};
  const weakOpps = weakerSite.auditData?.opportunities || [];
  const strongOpps = strongerSite.auditData?.opportunities || [];

  // Identify weakest performance category of the weaker website
  const categoryKeys = [
    { key: 'performance', label: 'Performance', score: weakScores.performance ?? 100, weight: 0.35 },
    { key: 'accessibility', label: 'Accessibility', score: weakScores.accessibility ?? 100, weight: 0.25 },
    { key: 'bestPractices', label: 'Best Practices', score: weakScores.bestPractices ?? 100, weight: 0.20 },
    { key: 'seo', label: 'SEO', score: weakScores.seo ?? 100, weight: 0.20 },
  ];
  categoryKeys.sort((a, b) => a.score - b.score);
  const weakestCategory = categoryKeys[0] || { key: 'performance', label: 'Performance', score: 0 };

  // Calculate category score gaps
  const keyGaps = [
    {
      category: 'Overall Web Health',
      difference: diff,
      strongerScore: strongerSite.healthScore,
      weakerScore: weakerSite.healthScore,
      impact: diff >= 20 ? 'High' : diff >= 10 ? 'Medium' : 'Low',
      explanation: isTie
        ? 'Both websites achieved an identical Overall Health Score, displaying equivalent technical stability.'
        : `${strongerSite.url} leads by ${diff} points overall, delivering a superior user experience.`
    },
    {
      category: 'Performance',
      difference: Math.abs((strongScores.performance ?? 0) - (weakScores.performance ?? 0)),
      strongerScore: strongScores.performance ?? 0,
      weakerScore: weakScores.performance ?? 0,
      impact: Math.abs((strongScores.performance ?? 0) - (weakScores.performance ?? 0)) >= 15 ? 'High' : 'Medium',
      explanation: `Loading speed and runtime responsiveness differential: ${strongerSite.url} (${strongScores.performance ?? 'N/A'}) vs ${weakerSite.url} (${weakScores.performance ?? 'N/A'}).`
    },
    {
      category: 'Accessibility',
      difference: Math.abs((strongScores.accessibility ?? 0) - (weakScores.accessibility ?? 0)),
      strongerScore: strongScores.accessibility ?? 0,
      weakerScore: weakScores.accessibility ?? 0,
      impact: Math.abs((strongScores.accessibility ?? 0) - (weakScores.accessibility ?? 0)) >= 15 ? 'High' : 'Medium',
      explanation: `WCAG compliance and assistive technology compatibility gap.`
    },
    {
      category: 'Best Practices',
      difference: Math.abs((strongScores.bestPractices ?? 0) - (weakScores.bestPractices ?? 0)),
      strongerScore: strongScores.bestPractices ?? 0,
      weakerScore: weakScores.bestPractices ?? 0,
      impact: 'Medium',
      explanation: `Modern web standards, console error hygiene, and HTTPS security configurations.`
    },
    {
      category: 'SEO',
      difference: Math.abs((strongScores.seo ?? 0) - (weakScores.seo ?? 0)),
      strongerScore: strongScores.seo ?? 0,
      weakerScore: weakScores.seo ?? 0,
      impact: 'Medium',
      explanation: `Search engine crawlability, structured metadata, and mobile readiness.`
    }
  ];

  // Build targeted recommendations from real audit metrics (Max 3-5 high-impact practical solutions)
  const candidateRecs = [];

  // Check LCP (Largest Contentful Paint)
  const weakLcp = weakMetrics.largestContentfulPaint?.value;
  const strongLcp = strongMetrics.largestContentfulPaint?.value;
  if (weakLcp !== null && weakLcp !== undefined && (weakLcp > 2500 || (strongLcp && weakLcp > strongLcp + 500))) {
    candidateRecs.push({
      id: 'rec-lcp',
      problem: `Slow main banner loading (LCP: ${(weakLcp / 1000).toFixed(2)}s, target is under 2.5s)`,
      evidence: `The largest content element took ${(weakLcp / 1000).toFixed(2)}s to appear on screen.`,
      whyItMatters: 'Visitors wait too long before seeing your main content and may leave.',
      solution: 'Preload the main banner image and load it with high priority.',
      implementationSteps: [
        'Add a preload link in your HTML <head> for the main hero image.',
        'Add fetchpriority="high" and loading="eager" directly to the hero <img> tag.',
        'Compress the image file using WebP format.'
      ],
      priority: weakLcp > 4000 ? 'Critical' : 'High',
      difficulty: 'Easy',
      estimatedTime: '15–30 minutes',
      verificationMethod: 'Run a fresh Lighthouse audit and verify LCP drops under 2.5 seconds.',
      codeExample: `<!-- Place inside your <head> tag -->\n<link rel="preload" as="image" href="/hero.webp" fetchpriority="high" />\n\n<!-- Place in your page template -->\n<img src="/hero.webp" alt="Main banner" fetchpriority="high" loading="eager" width="1200" height="600" />`,
      codeExplanation: 'The preload tag tells the browser to download the banner image immediately before parsing the rest of the page.',
      expectedBenefit: 'Reduces visual waiting time by 0.5 to 1.5 seconds.'
    });
  }

  // Check Render-blocking resources
  const renderBlockingOpp = weakOpps.find((o) => o.id?.includes('render-blocking'));
  if (renderBlockingOpp || (weakMetrics.firstContentfulPaint?.value && weakMetrics.firstContentfulPaint.value > 1800)) {
    candidateRecs.push({
      id: 'rec-render-blocking',
      problem: 'Render-blocking files are delaying initial page display',
      evidence: renderBlockingOpp?.displayValue || `First Contentful Paint took ${(weakMetrics.firstContentfulPaint?.value / 1000).toFixed(2)}s.`,
      whyItMatters: 'The browser cannot show anything on the screen until these CSS and script files finish downloading.',
      solution: 'Add defer to script tags and load non-critical CSS files asynchronously.',
      implementationSteps: [
        'Add the defer attribute to all external <script> tags.',
        'Inline critical above-the-fold CSS styles inside a <style> tag in <head>.',
        'Load remaining stylesheet links with media="print" onload="this.media=\'all\'".'
      ],
      priority: 'Critical',
      difficulty: 'Easy',
      estimatedTime: '20–30 minutes',
      verificationMethod: 'Check Lighthouse Performance diagnostics and confirm zero render-blocking files.',
      codeExample: `<!-- Defer scripts so HTML loads without pausing -->\n<script src="/app.js" defer></script>\n\n<!-- Non-blocking stylesheet loading -->\n<link rel="preload" href="/styles.css" as="style" onload="this.rel='stylesheet'" />`,
      codeExplanation: 'The defer attribute allows the browser to build the page layout while JavaScript downloads in the background.',
      expectedBenefit: 'Displays the first page text and images hundreds of milliseconds faster.'
    });
  }

  // Check Total Blocking Time (TBT) / Main Thread
  const weakTbt = weakMetrics.totalBlockingTime?.value;
  const strongTbt = strongMetrics.totalBlockingTime?.value;
  if (weakTbt !== null && weakTbt !== undefined && (weakTbt > 200 || (strongTbt && weakTbt > strongTbt + 100))) {
    candidateRecs.push({
      id: 'rec-tbt',
      problem: `Heavy JavaScript is freezing user clicks (TBT: ${Math.round(weakTbt)}ms)`,
      evidence: `The main browser thread was blocked for ${Math.round(weakTbt)}ms during page load (target ≤ 200ms).`,
      whyItMatters: 'When the browser is busy running heavy scripts, user clicks and taps do not respond.',
      solution: 'Split large JavaScript bundles into smaller chunks and delay non-essential scripts.',
      implementationSteps: [
        'Use dynamic import() so code only loads when a specific page or dialog opens.',
        'Delay third-party analytics and chat widgets until after user interaction.',
        'Remove unused npm packages from your production bundle.'
      ],
      priority: weakTbt > 600 ? 'Critical' : 'High',
      difficulty: 'Medium',
      estimatedTime: '1–2 hours',
      verificationMethod: 'Verify Total Blocking Time drops below 200ms in Lighthouse.',
      codeExample: `// Load heavy component only when user clicks\nbutton.addEventListener('click', async () => {\n  const { openModal } = await import('./modal.js');\n  openModal();\n});`,
      codeExplanation: 'Dynamic import() downloads the code on demand rather than loading everything upfront on page load.',
      expectedBenefit: 'Makes clicks, taps, and menu toggles respond immediately without delay.'
    });
  }

  // Check Cumulative Layout Shift (CLS)
  const weakCls = weakMetrics.cumulativeLayoutShift?.value;
  const strongCls = strongMetrics.cumulativeLayoutShift?.value;
  if (weakCls !== null && weakCls !== undefined && (weakCls > 0.05 || (strongCls !== undefined && weakCls > strongCls + 0.05))) {
    candidateRecs.push({
      id: 'rec-cls',
      problem: `Page content jumps around while loading (CLS: ${weakCls})`,
      evidence: `Layout shift measured ${weakCls} (Google recommended threshold is 0.1 or lower).`,
      whyItMatters: 'Moving content frustrates users and leads to accidental clicks on the wrong buttons.',
      solution: 'Set explicit width and height dimensions on all images and containers.',
      implementationSteps: [
        'Add width and height attributes to every <img> and <iframe> tag.',
        'Use CSS aspect-ratio on image containers so space is reserved before loading.',
        'Avoid inserting new banners or notifications above existing content.'
      ],
      priority: weakCls > 0.2 ? 'Critical' : 'High',
      difficulty: 'Easy',
      estimatedTime: '15–30 minutes',
      verificationMethod: 'Run Lighthouse and verify CLS score is 0.05 or lower.',
      codeExample: `<!-- Set explicit dimensions so browser reserves space -->\n<img src="/logo.webp" width="200" height="60" alt="Company Logo" />\n\n/* In CSS */\n.banner-box {\n  aspect-ratio: 16 / 9;\n  width: 100%;\n}`,
      codeExplanation: 'Explicit dimensions tell the browser how much space to reserve before the image file finishes downloading.',
      expectedBenefit: 'Stops page shifting completely, providing a smooth and stable browsing experience.'
    });
  }

  // Check Accessibility
  const weakA11y = weakScores.accessibility ?? 100;
  const strongA11y = strongScores.accessibility ?? 100;
  if (weakA11y < 90 || weakA11y < strongA11y - 10) {
    candidateRecs.push({
      id: 'rec-a11y',
      problem: `Low color contrast and missing accessibility labels (Score: ${weakA11y}/100)`,
      evidence: `Accessibility scored ${weakA11y}/100. Text contrast or interactive label violations were detected.`,
      whyItMatters: 'Hard-to-read text strains user eyes and prevents people with visual impairments from using your site.',
      solution: 'Darken light text colors and add visible focus outlines to all buttons and links.',
      implementationSteps: [
        'Check text colors against backgrounds and ensure contrast is at least 4.5:1.',
        'Add descriptive alt text to all informative <img> tags.',
        'Ensure buttons and links show a clear outline when pressing the Tab key.'
      ],
      priority: weakA11y < 70 ? 'Critical' : 'High',
      difficulty: 'Easy',
      estimatedTime: '20–30 minutes',
      verificationMethod: 'Run Lighthouse Accessibility audit and confirm score is 90 or higher.',
      codeExample: `/* Ensure keyboard focus outline is visible */\n:focus-visible {\n  outline: 2px solid #2563eb;\n  outline-offset: 2px;\n}\n\n<!-- Add descriptive alt text -->\n<img src="/chart.png" alt="Sales growth chart for Q3" />`,
      codeExplanation: 'The :focus-visible rule shows a visible border only when a user navigates using a keyboard or screen reader.',
      expectedBenefit: 'Increases readability for all users and achieves WCAG AA accessibility compliance.'
    });
  }

  // Check SEO & Metadata
  const weakSeo = weakScores.seo ?? 100;
  const strongSeo = strongScores.seo ?? 100;
  if (weakSeo < 90 || weakSeo < strongSeo - 10) {
    candidateRecs.push({
      id: 'rec-seo',
      problem: `Missing SEO meta description or canonical link (Score: ${weakSeo}/100)`,
      evidence: `SEO scored ${weakSeo}/100 with missing search engine tags.`,
      whyItMatters: 'Search engines need meta tags to display accurate titles and snippets in search results.',
      solution: 'Add a 120–160 character meta description and a canonical URL link in your <head>.',
      implementationSteps: [
        'Add <meta name="description" content="..."> with a clear summary of your page.',
        'Add <link rel="canonical" href="..."> pointing to your primary URL.',
        'Ensure your page has one clear <h1> heading matching the page topic.'
      ],
      priority: 'Medium',
      difficulty: 'Easy',
      estimatedTime: '15–20 minutes',
      verificationMethod: 'Run Lighthouse SEO audit and confirm score reaches 90–100.',
      codeExample: `<!-- Place inside your <head> tag -->\n<title>Smart Web Health Monitoring | Dashboard</title>\n<meta name="description" content="Monitor website performance, Core Web Vitals, and health scores in real-time." />\n<link rel="canonical" href="https://example.com/" />`,
      codeExplanation: 'Meta descriptions provide the summary text that Google and Bing display directly beneath your link in search results.',
      expectedBenefit: 'Improves search appearance and click-through rates from search engine result pages.'
    });
  }

  // Default maintenance item if website already has high scores
  if (candidateRecs.length === 0) {
    candidateRecs.push({
      id: 'rec-maintain',
      problem: 'Static asset caching can be extended for faster repeat visits',
      evidence: `Website is already performing well at ${weakScores.performance ?? 95}/100.`,
      whyItMatters: 'Returning users get instantaneous page loads when assets are cached in their browser.',
      solution: 'Add long Cache-Control headers to images, CSS, and JS files.',
      implementationSteps: [
        'Set Cache-Control: public, max-age=31536000, immutable for hashed files in your web server.',
        'Enable gzip or brotli compression on your hosting server.'
      ],
      priority: 'Low',
      difficulty: 'Easy',
      estimatedTime: '15 minutes',
      verificationMethod: 'Check response headers in browser Network tab for Cache-Control.',
      codeExample: `# Nginx header configuration\nlocation ~* \\.(js|css|webp|woff2)$ {\n    add_header Cache-Control "public, max-age=31536000, immutable";\n}`,
      codeExplanation: 'Tells the browser to store files locally for 1 year so it does not redownload them on subsequent visits.',
      expectedBenefit: 'Provides near-instant loading for returning visitors.'
    });
  }

  // Keep strictly 3 to 5 targeted recommendations
  const recommendations = candidateRecs.slice(0, 5);

  // Extract top 3 problems and simple solutions for competitor summary
  const topProblems = recommendations.slice(0, 3).map((r) => ({
    problem: r.problem,
    solution: r.solution
  }));

  // Build Priority Matrix
  const priorityMatrix = recommendations.map((r) => ({
    priority: r.priority,
    issue: r.problem,
    recommendedFix: r.solution,
    difficulty: r.difficulty,
    expectedBenefit: r.expectedBenefit,
    detailedInstructions: r.implementationSteps,
    codeExample: r.codeExample
  }));

  // Build Competitor Learning Insights (Section 4)
  const competitorLearningInsights = [
    {
      area: 'Loading Performance & LCP',
      metricComparison: `LCP: ${strongMetrics.largestContentfulPaint?.displayValue || 'N/A'} (Winner) vs ${weakMetrics.largestContentfulPaint?.displayValue || 'N/A'} (Weaker)`,
      whatBetterSiteDoes: isTie
        ? 'Both websites manage their largest visual paints effectively.'
        : `${strongerSite.url} delivers its above-the-fold content ${strongLcp && weakLcp && strongLcp < weakLcp ? Math.round(weakLcp - strongLcp) + 'ms faster' : 'more efficiently'} through tighter resource priority.`,
      actionableTakeaway: 'Adopt the winner’s resource loading strategy: preload key visual assets and eliminate synchronous blocking requests.'
    },
    {
      area: 'Main Thread & Interaction Smoothness',
      metricComparison: `TBT: ${strongMetrics.totalBlockingTime?.displayValue || '0ms'} vs ${weakMetrics.totalBlockingTime?.displayValue || '0ms'}`,
      whatBetterSiteDoes: isTie
        ? 'Both sites maintain comparable main-thread execution loads.'
        : `${strongerSite.url} has ${strongTbt && weakTbt && strongTbt < weakTbt ? Math.round(weakTbt - strongTbt) + 'ms less' : 'lower'} main-thread blockage, ensuring clicks register promptly.`,
      actionableTakeaway: 'Offload third-party tracking tags and break large script execution blocks into smaller tasks.'
    },
    {
      area: 'Visual Layout Stability (CLS)',
      metricComparison: `CLS: ${strongMetrics.cumulativeLayoutShift?.displayValue || '0'} vs ${weakMetrics.cumulativeLayoutShift?.displayValue || '0'}`,
      whatBetterSiteDoes: `${strongerSite.url} preserves geometric layout stability by reserving space for media and dynamic content.`,
      actionableTakeaway: 'Enforce explicit width and height attributes on all visual media to prevent cumulative shifts.'
    },
    {
      area: 'Accessibility Standards',
      metricComparison: `Score: ${strongScores.accessibility ?? 'N/A'}/100 vs ${weakScores.accessibility ?? 'N/A'}/100`,
      whatBetterSiteDoes: `${strongerSite.url} provides cleaner color contrasts and assistive semantics.`,
      actionableTakeaway: 'Standardize focus states and ensure WCAG AA contrast across all buttons, navigation, and badges.'
    },
    {
      area: 'SEO & Meta Discoverability',
      metricComparison: `Score: ${strongScores.seo ?? 'N/A'}/100 vs ${weakScores.seo ?? 'N/A'}/100`,
      whatBetterSiteDoes: `${strongerSite.url} maintains structured metadata and crawlable link architecture.`,
      actionableTakeaway: 'Ensure canonical tags, descriptive titles, and social graph cards are rendered in static HTML.'
    }
  ];

  // Build Adaptive Website Improvement Plan (Dynamic, Evidence-Based)
  const adaptivePlan = generateAdaptiveImprovementPlan({
    weakerSite,
    strongerSite,
    weakScores,
    weakMetrics,
    weakOpps,
    diff
  });

  // Backward-compatible roadmap structure mapped from adaptive stages
  const roadmap = adaptivePlan.stages.map((stg) => ({
    day: stg.stageNumber,
    title: stg.title,
    focusArea: stg.focusArea,
    tasks: stg.tasks.map((t) => ({
      id: t.id,
      task: t.problem,
      detail: t.solution,
      completed: false
    }))
  }));

  return {
    verdict: {
      winner: winnerSide,
      isTie,
      strongerUrl: strongerSite.url,
      weakerUrl: weakerSite.url,
      strongerHealthScore: strongerSite.healthScore,
      weakerHealthScore: weakerSite.healthScore,
      scoreDifference: diff,
      weakestCategory: weakestCategory.label,
      weakestCategoryScore: weakestCategory.score,
      summary: isTie
        ? `Both websites achieved identical Overall Health Scores (${healthA}/100) representing a balanced performance tie. Review category and timing differences for nuanced optimizations.`
        : `${strongerSite.url} outperforms ${weakerSite.url} by ${diff} points (${strongerSite.healthScore}/100 vs ${weakerSite.healthScore}/100). The most significant improvement opportunity lies in ${weakestCategory.label}.`,
      topProblems
    },
    gapAnalysis: {
      summary: isTie
        ? `Head-to-head tie: Neither site holds a decisive advantage overall, but metric differences exist across individual Core Web Vitals.`
        : `${strongerSite.url} exhibits stronger overall optimization. ${weakerSite.url} trails in ${weakestCategory.label} (${weakestCategory.score}/100) and critical render timings.`,
      keyGaps
    },
    recommendations,
    priorityMatrix,
    competitorLearningInsights,
    adaptivePlan,
    roadmap,
    meta: {
      provider: 'rules-engine',
      isFallback: true,
      fallbackReason: config.geminiApiKey
        ? 'Generated via deterministic expert rules engine.'
        : 'Gemini API key is not configured in backend/.env; using deterministic expert rules engine.',
      generatedAt: new Date().toISOString()
    }
  };
}

/**
 * Dynamically generates an evidence-based improvement plan from actual Lighthouse findings.
 * Removes the fixed 7-day approach and estimates realistic developer effort.
 */
export function generateAdaptiveImprovementPlan({
  weakerSite,
  strongerSite,
  weakScores,
  weakMetrics,
  weakOpps,
  diff
}) {
  const tasks = [];
  let order = 1;

  // 1. Performance - LCP
  const lcpValue = weakMetrics?.largestContentfulPaint?.value ?? 0;
  const lcpDisplay = weakMetrics?.largestContentfulPaint?.displayValue || 'N/A';
  if (lcpValue > 2500 || (weakScores?.performance ?? 100) < 80) {
    tasks.push({
      id: 'task-lcp',
      problem: `Largest Contentful Paint is slow at ${lcpDisplay} (exceeds recommended 2.5s Core Web Vital threshold).`,
      solution: 'Preload the primary hero asset using <link rel="preload" as="image" fetchpriority="high"> and inline critical path CSS.',
      category: 'Performance',
      priority: lcpValue > 4000 ? 'Critical' : 'High',
      difficulty: 'Medium',
      estimatedMinutes: 45,
      effortTier: 'Quick Fix',
      expectedBenefit: 'Significantly reduces visual loading latency; projected 600ms–1400ms LCP reduction.',
      dependencies: 'Document <head> access and asset CDN URL',
      verificationMethod: 'Re-audit with Lighthouse to verify LCP under 2.5s',
      isQuickWin: false,
      order: order++,
      phase: 'Phase 1: Render-Critical Bottlenecks'
    });
  }

  // 2. Performance - Render-Blocking Resources
  const hasRenderBlocking = (weakOpps || []).some((o) => o.id?.includes('render-blocking')) || (weakMetrics?.firstContentfulPaint?.value ?? 0) > 1800;
  if (hasRenderBlocking) {
    tasks.push({
      id: 'task-render-blocking',
      problem: 'Render-blocking stylesheets and synchronous scripts delay First Contentful Paint.',
      solution: 'Apply async or defer attributes to non-essential JavaScript and load secondary CSS asynchronously.',
      category: 'Performance',
      priority: 'Critical',
      difficulty: 'Low',
      estimatedMinutes: 30,
      effortTier: 'Quick Fix',
      expectedBenefit: 'Allows HTML parser to render first pixels without waiting for external script roundtrips.',
      dependencies: 'None - build/script tag configuration',
      verificationMethod: 'Verify zero render-blocking resources in Lighthouse Performance diagnostics',
      isQuickWin: true,
      order: order++,
      phase: 'Phase 1: Render-Critical Bottlenecks'
    });
  }

  // 3. Performance - Image Format & Compression
  const hasImageOpps = (weakOpps || []).some((o) =>
    o.id?.includes('image') || o.id?.includes('modern') || o.id?.includes('responsive')
  ) || (weakScores?.performance ?? 100) < 85;
  if (hasImageOpps) {
    tasks.push({
      id: 'task-image-opt',
      problem: 'Unoptimized or legacy image formats (JPEG/PNG) consume unnecessary mobile bandwidth.',
      solution: 'Convert raster images to modern WebP or AVIF formats and implement native loading="lazy" for offscreen images.',
      category: 'Performance',
      priority: 'High',
      difficulty: 'Low',
      estimatedMinutes: 35,
      effortTier: 'Quick Fix',
      expectedBenefit: 'Reduces image transfer payload by 40%–70% and accelerates page load on mobile connections.',
      dependencies: 'None - asset build pipeline or image CDN',
      verificationMethod: 'Inspect Network tab transfer size and verify modern MIME types',
      isQuickWin: true,
      order: order++,
      phase: 'Phase 2: Asset Optimization & Layout Stability'
    });
  }

  // 4. Performance - CLS (Layout Shift)
  const clsValue = weakMetrics?.cumulativeLayoutShift?.value ?? 0;
  const clsDisplay = weakMetrics?.cumulativeLayoutShift?.displayValue || '0';
  if (clsValue > 0.05) {
    tasks.push({
      id: 'task-cls',
      problem: `Cumulative Layout Shift is ${clsDisplay} (exceeds 0.05 threshold), triggering jarring visual displacement.`,
      solution: 'Specify explicit width and height attributes or CSS aspect-ratio on all images, video frames, and dynamic ad containers.',
      category: 'Performance',
      priority: clsValue > 0.2 ? 'Critical' : 'High',
      difficulty: 'Low',
      estimatedMinutes: 25,
      effortTier: 'Quick Fix',
      expectedBenefit: 'Reserves screen real estate prior to image downloads, eliminating content jumps.',
      dependencies: 'None - template markup update',
      verificationMethod: 'Verify CLS under 0.05 in Lighthouse Web Vitals report',
      isQuickWin: true,
      order: order++,
      phase: 'Phase 2: Asset Optimization & Layout Stability'
    });
  }

  // 5. Performance - TBT / JavaScript Main Thread
  const tbtValue = weakMetrics?.totalBlockingTime?.value ?? 0;
  const tbtDisplay = weakMetrics?.totalBlockingTime?.displayValue || '0 ms';
  if (tbtValue > 200 || (weakOpps || []).some((o) => o.id?.includes('unused-javascript') || o.id?.includes('long-tasks'))) {
    tasks.push({
      id: 'task-tbt-split',
      problem: `Total Blocking Time is ${tbtDisplay}, monopolizing browser main thread and stalling click responsiveness.`,
      solution: 'Implement route-based dynamic code-splitting via dynamic import() and defer third-party telemetry scripts.',
      category: 'Performance',
      priority: tbtValue > 600 ? 'Critical' : 'High',
      difficulty: 'High',
      estimatedMinutes: 150,
      effortTier: 'Medium Fix',
      expectedBenefit: 'Reduces main-thread congestion; projected TBT drop below 200ms.',
      dependencies: 'Application bundler and framework router configuration',
      verificationMethod: 'Profile main-thread tasks in Chrome DevTools Performance panel',
      isQuickWin: false,
      order: order++,
      phase: 'Phase 2: Asset Optimization & Layout Stability'
    });
  }

  // 6. Accessibility - Contrast & Focus
  const a11yScore = weakScores?.accessibility ?? 100;
  if (a11yScore < 90) {
    tasks.push({
      id: 'task-a11y-contrast',
      problem: `Accessibility score is ${a11yScore}/100 with sub-optimal color contrast and keyboard navigation gaps.`,
      solution: 'Update text and background color tokens to meet the WCAG AA minimum 4.5:1 ratio and verify visible :focus-visible outlines.',
      category: 'Accessibility',
      priority: 'High',
      difficulty: 'Low',
      estimatedMinutes: 40,
      effortTier: 'Quick Fix',
      expectedBenefit: 'Ensures legal compliance with WCAG standards and improves legibility in diverse lighting conditions.',
      dependencies: 'CSS theme / design tokens',
      verificationMethod: 'Audit with DevTools Accessibility tree and verify zero contrast flags in Lighthouse',
      isQuickWin: true,
      order: order++,
      phase: 'Phase 3: Experience & Quality Remediation'
    });
  }

  if (a11yScore < 75) {
    tasks.push({
      id: 'task-a11y-semantics',
      problem: 'Missing accessible names on interactive elements and alt descriptions on informative images.',
      solution: 'Add informative alt attributes to <img> elements and aria-label attributes to icon-only buttons.',
      category: 'Accessibility',
      priority: 'Medium',
      difficulty: 'Low',
      estimatedMinutes: 30,
      effortTier: 'Quick Fix',
      expectedBenefit: 'Provides full screen-reader accessibility for visually impaired users.',
      dependencies: 'Component template markup',
      verificationMethod: 'Verify zero missing-alt-text or unlabelled button audit flags in Lighthouse',
      isQuickWin: true,
      order: order++,
      phase: 'Phase 3: Experience & Quality Remediation'
    });
  }

  // 7. Best Practices - Security & Console Errors
  const bpScore = weakScores?.bestPractices ?? 100;
  if (bpScore < 90) {
    tasks.push({
      id: 'task-bp-headers',
      problem: `Best Practices score is ${bpScore}/100 with missing standard HTTP security headers or browser warnings.`,
      solution: 'Configure CSP, HSTS, X-Content-Type-Options: nosniff headers and resolve unhandled browser console warnings.',
      category: 'Best Practices',
      priority: 'Medium',
      difficulty: 'Medium',
      estimatedMinutes: 60,
      effortTier: 'Medium Fix',
      expectedBenefit: 'Fortifies application defense against XSS/clickjacking and ensures modern browser standard compliance.',
      dependencies: 'Web server or reverse proxy configuration access',
      verificationMethod: 'Confirm Best Practices score reaches >= 90 with zero console error warnings in Lighthouse',
      isQuickWin: false,
      order: order++,
      phase: 'Phase 3: Experience & Quality Remediation'
    });
  }

  // 8. SEO - Meta Tags & Crawlability
  const seoScore = weakScores?.seo ?? 100;
  if (seoScore < 90) {
    tasks.push({
      id: 'task-seo-meta',
      problem: `SEO score is ${seoScore}/100 due to missing or inadequate meta descriptions and canonical links.`,
      solution: 'Provide a descriptive 120–160 character meta description tag and a self-referential <link rel="canonical"> tag.',
      category: 'SEO',
      priority: 'Medium',
      difficulty: 'Low',
      estimatedMinutes: 20,
      effortTier: 'Quick Fix',
      expectedBenefit: 'Avoids duplicate content indexing penalties and improves search engine click-through rates.',
      dependencies: 'HTML head or SSR meta manager',
      verificationMethod: 'Validate meta tags and canonical presence with Lighthouse SEO audit',
      isQuickWin: true,
      order: order++,
      phase: 'Phase 3: Experience & Quality Remediation'
    });
  }

  // 9. Always add Verification Task as final milestone
  tasks.push({
    id: 'task-re-audit-verification',
    problem: 'Optimization changes require empirical verification against baseline audit benchmarks.',
    solution: 'Execute a fresh Google Lighthouse re-audit in the Before-and-After Tracker to record verified metric gains.',
    category: 'Verification',
    priority: 'High',
    difficulty: 'Low',
    estimatedMinutes: 15,
    effortTier: 'Quick Fix',
    expectedBenefit: 'Scientifically measures health score improvements and validates resolution of identified issues.',
    dependencies: 'Deployment to accessible staging or production environment',
    verificationMethod: 'View Before-and-After Tracker delta comparison cards and charts',
    isQuickWin: true,
    order: order++,
    phase: 'Phase 4: Live Verification & QA'
  });

  // Calculate totals and statistics
  const totalEstimatedMinutes = tasks.reduce((sum, t) => sum + t.estimatedMinutes, 0);
  const quickWins = tasks.filter((t) => t.isQuickWin);
  const criticalTasks = tasks.filter((t) => t.priority === 'Critical');
  const mediumComplexTasks = tasks.filter((t) => t.difficulty === 'Medium' || t.difficulty === 'High');

  const hours = Math.floor(totalEstimatedMinutes / 60);
  const mins = totalEstimatedMinutes % 60;
  const totalEstimatedHoursFormatted = hours > 0
    ? `${hours}h ${mins > 0 ? `${mins}m` : ''}`.trim()
    : `${mins}m`;

  // Group into stages
  const stageMap = new Map();
  tasks.forEach((t) => {
    if (!stageMap.has(t.phase)) {
      stageMap.set(t.phase, []);
    }
    stageMap.get(t.phase).push(t);
  });

  let stageNum = 1;
  const stages = Array.from(stageMap.entries()).map(([phaseTitle, stageTasks]) => {
    const stageMins = stageTasks.reduce((acc, task) => acc + task.estimatedMinutes, 0);
    return {
      stageNumber: stageNum++,
      title: phaseTitle,
      focusArea: stageTasks[0]?.category || 'General',
      estimatedMinutes: stageMins,
      tasks: stageTasks
    };
  });

  return {
    totalEstimatedMinutes,
    totalEstimatedHoursFormatted,
    totalTasks: tasks.length,
    quickWinsCount: quickWins.length,
    criticalCount: criticalTasks.length,
    mediumComplexCount: mediumComplexTasks.length,
    summary: `Adaptive improvement plan generated based on ${tasks.length} detected audit findings with a total estimated effort of ${totalEstimatedHoursFormatted}.`,
    tasks,
    stages
  };
}

/**
 * Analyzes competitor gaps using Google Gemini API with seamless deterministic fallback.
 * @param {Object} params
 * @param {Object} params.siteA
 * @param {Object} params.siteB
 * @param {Object} params.comparison
 * @returns {Promise<Object>} Structured AI comparison insights
 */
export async function analyzeCompetitorGap({ siteA, siteB, comparison }) {
  const cacheKey = `${siteA.url}__${siteA.device}__${siteB.url}__${siteB.device}__${siteA.healthScore}__${siteB.healthScore}`;
  const cached = aiInsightsCache.get(cacheKey);

  if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
    return {
      ...cached.data,
      meta: {
        ...cached.data.meta,
        cached: true
      }
    };
  }

  // If no Gemini API key configured, use deterministic expert rules engine immediately
  if (!config.geminiApiKey || config.geminiApiKey.trim() === '' || config.geminiApiKey === 'YOUR_GEMINI_API_KEY') {
    const rulesResult = generateRulesBasedInsights({ siteA, siteB, comparison });
    aiInsightsCache.set(cacheKey, { data: rulesResult, cachedAt: Date.now() });
    return rulesResult;
  }

  try {
    const ai = new GoogleGenAI({ apiKey: config.geminiApiKey });

    const prompt = `
You are a simple, practical Website Improvement Assistant.
Your motto: Less explanation. More useful solutions. Simple English. Direct answers.

Analyze this real Google Lighthouse audit comparison between two websites.

WEBSITE A:
- URL: ${siteA.url} (${siteA.device})
- Health Score: ${siteA.healthScore}/100
- Performance: ${siteA.auditData?.scores?.performance ?? 'N/A'}/100
- Accessibility: ${siteA.auditData?.scores?.accessibility ?? 'N/A'}/100
- Best Practices: ${siteA.auditData?.scores?.bestPractices ?? 'N/A'}/100
- SEO: ${siteA.auditData?.scores?.seo ?? 'N/A'}/100
- LCP: ${siteA.auditData?.metrics?.largestContentfulPaint?.displayValue || 'N/A'} (${siteA.auditData?.metrics?.largestContentfulPaint?.value || 0}ms)
- FCP: ${siteA.auditData?.metrics?.firstContentfulPaint?.displayValue || 'N/A'}
- CLS: ${siteA.auditData?.metrics?.cumulativeLayoutShift?.displayValue || '0'}
- TBT: ${siteA.auditData?.metrics?.totalBlockingTime?.displayValue || 'N/A'}
- Speed Index: ${siteA.auditData?.metrics?.speedIndex?.displayValue || 'N/A'}
- INP: ${siteA.auditData?.metrics?.interactionToNextPaint?.displayValue || 'N/A'}
- Opportunities: ${JSON.stringify((siteA.auditData?.opportunities || []).slice(0, 4).map(o => ({ id: o.id, title: o.title, savings: o.displayValue })))}

WEBSITE B:
- URL: ${siteB.url} (${siteB.device})
- Health Score: ${siteB.healthScore}/100
- Performance: ${siteB.auditData?.scores?.performance ?? 'N/A'}/100
- Accessibility: ${siteB.auditData?.scores?.accessibility ?? 'N/A'}/100
- Best Practices: ${siteB.auditData?.scores?.bestPractices ?? 'N/A'}/100
- SEO: ${siteB.auditData?.scores?.seo ?? 'N/A'}/100
- LCP: ${siteB.auditData?.metrics?.largestContentfulPaint?.displayValue || 'N/A'} (${siteB.auditData?.metrics?.largestContentfulPaint?.value || 0}ms)
- FCP: ${siteB.auditData?.metrics?.firstContentfulPaint?.displayValue || 'N/A'}
- CLS: ${siteB.auditData?.metrics?.cumulativeLayoutShift?.displayValue || '0'}
- TBT: ${siteB.auditData?.metrics?.totalBlockingTime?.displayValue || 'N/A'}
- Speed Index: ${siteB.auditData?.metrics?.speedIndex?.displayValue || 'N/A'}
- INP: ${siteB.auditData?.metrics?.interactionToNextPaint?.displayValue || 'N/A'}
- Opportunities: ${JSON.stringify((siteB.auditData?.opportunities || []).slice(0, 4).map(o => ({ id: o.id, title: o.title, savings: o.displayValue })))}

REQUIREMENTS:
1. Identify the stronger and weaker website accurately based on their Overall Health Scores (${siteA.healthScore} vs ${siteB.healthScore}). If scores are identical, declare a tie.
2. In verdict:
   - State clearly which website is stronger.
   - State clearly which website needs improvement.
   - State the score difference.
   - Include topProblems: an array of the top 3 biggest problems of the weaker website with 1 simple solution each.
3. Provide strictly 3 to 5 targeted recommendations for the weaker website based strictly on detected audit issues.
   - Use simple, plain English without unnecessary technical jargon.
   - For each recommendation provide:
     * problem: What is wrong in simple words?
     * evidence: The measured Lighthouse metric.
     * whyItMatters: Exactly ONE simple sentence explaining the impact.
     * solution: Exactly what the developer should do.
     * implementationSteps: 1 to 3 simple action steps (array of strings).
     * priority: 'Critical' | 'High' | 'Medium' | 'Low'
     * difficulty: 'Easy' | 'Medium' | 'Hard'
     * estimatedTime: A realistic effort range (e.g. '15–30 minutes', '1–2 hours').
     * verificationMethod: How to check whether the issue is fixed.
     * codeExample: Short, relevant snippet if helpful (or empty string).
     * codeExplanation: 1 simple sentence explaining where to use it and what it does.
     * expectedBenefit: 1 sentence on the practical benefit (never guarantee exact future scores).
4. Do NOT give generic suggestions like "Optimize your website". Provide clear, actionable instructions.
5. Create a dynamic Adaptive Website Improvement Plan (adaptivePlan) based strictly on detected issues. Prioritize quick, effective solutions.
6. Never invent problems not present in the audit data. Never promise exact future scores.

Respond with ONLY valid JSON adhering strictly to this schema:
{
  "verdict": {
    "winner": "A" | "B" | "tie",
    "isTie": boolean,
    "strongerUrl": string,
    "weakerUrl": string,
    "strongerHealthScore": number,
    "weakerHealthScore": number,
    "scoreDifference": number,
    "weakestCategory": string,
    "weakestCategoryScore": number,
    "summary": string,
    "topProblems": [
      {
        "problem": string,
        "solution": string
      }
    ]
  },
  "gapAnalysis": {
    "summary": string,
    "keyGaps": [
      {
        "category": string,
        "difference": number,
        "strongerScore": number,
        "weakerScore": number,
        "impact": "High" | "Medium" | "Low",
        "explanation": string
      }
    ]
  },
  "recommendations": [
    {
      "id": string,
      "problem": string,
      "evidence": string,
      "whyItMatters": string,
      "solution": string,
      "implementationSteps": [string],
      "priority": "Critical" | "High" | "Medium" | "Low",
      "difficulty": "Easy" | "Medium" | "Hard",
      "estimatedTime": string,
      "verificationMethod": string,
      "codeExample": string,
      "codeExplanation": string,
      "expectedBenefit": string
    }
  ],
  "priorityMatrix": [
    {
      "priority": "Critical" | "High" | "Medium" | "Low",
      "issue": string,
      "recommendedFix": string,
      "difficulty": "Easy" | "Medium" | "Hard",
      "expectedBenefit": string,
      "detailedInstructions": [string],
      "codeExample": string
    }
  ],
  "competitorLearningInsights": [
    {
      "area": string,
      "metricComparison": string,
      "whatBetterSiteDoes": string,
      "actionableTakeaway": string
    }
  ],
  "adaptivePlan": {
    "totalEstimatedMinutes": number,
    "totalEstimatedHoursFormatted": string,
    "totalTasks": number,
    "quickWinsCount": number,
    "criticalCount": number,
    "mediumComplexCount": number,
    "summary": string,
    "tasks": [
      {
        "id": string,
        "problem": string,
        "solution": string,
        "category": "Performance" | "Accessibility" | "Best Practices" | "SEO" | "Verification",
        "priority": "Critical" | "High" | "Medium" | "Low",
        "difficulty": "Low" | "Medium" | "High",
        "estimatedMinutes": number,
        "effortTier": "Quick Fix" | "Medium Fix" | "Complex Fix",
        "expectedBenefit": string,
        "dependencies": string,
        "verificationMethod": string,
        "isQuickWin": boolean,
        "order": number,
        "phase": string
      }
    ],
    "stages": [
      {
        "stageNumber": number,
        "title": string,
        "focusArea": string,
        "estimatedMinutes": number,
        "tasks": [
          {
            "id": string,
            "problem": string,
            "solution": string,
            "estimatedMinutes": number,
            "priority": string,
            "isQuickWin": boolean
          }
        ]
      }
    ]
  },
  "roadmap": [
    {
      "day": number,
      "title": string,
      "focusArea": string,
      "tasks": [
        { "id": string, "task": string, "detail": string, "completed": boolean }
      ]
    }
  ]
}
`.trim();

    const response = await ai.models.generateContent({
      model: config.geminiModel || 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2
      }
    });

    const text = response?.text;
    if (!text) {
      throw new Error('Gemini API returned an empty response.');
    }

    const parsedData = JSON.parse(text);

    // Validate essential sections
    if (!parsedData.verdict || !Array.isArray(parsedData.recommendations)) {
      throw new Error('Gemini API response structure did not match expected schema.');
    }

    // Ensure verdict topProblems exists
    if (!Array.isArray(parsedData.verdict.topProblems) || parsedData.verdict.topProblems.length === 0) {
      parsedData.verdict.topProblems = (parsedData.recommendations || []).slice(0, 3).map((r) => ({
        problem: r.problem,
        solution: r.solution
      }));
    }

    // Ensure adaptivePlan exists and is well-formed
    if (!parsedData.adaptivePlan || !Array.isArray(parsedData.adaptivePlan.tasks)) {
      const generatedPlan = generateAdaptiveImprovementPlan({
        weakerSite: parsedData.verdict?.winner === 'B' ? siteA : siteB,
        strongerSite: parsedData.verdict?.winner === 'B' ? siteB : siteA,
        weakScores: (parsedData.verdict?.winner === 'B' ? siteA : siteB).auditData?.scores || {},
        weakMetrics: (parsedData.verdict?.winner === 'B' ? siteA : siteB).auditData?.metrics || {},
        weakOpps: (parsedData.verdict?.winner === 'B' ? siteA : siteB).auditData?.opportunities || [],
        diff: parsedData.verdict?.scoreDifference || 0
      });
      parsedData.adaptivePlan = generatedPlan;
    }

    // Ensure roadmap is populated for backward compatibility
    if (!Array.isArray(parsedData.roadmap) || parsedData.roadmap.length === 0) {
      parsedData.roadmap = (parsedData.adaptivePlan.stages || []).map((stg) => ({
        day: stg.stageNumber,
        title: stg.title,
        focusArea: stg.focusArea,
        tasks: (stg.tasks || []).map((t) => ({
          id: t.id,
          task: t.problem,
          detail: t.solution,
          completed: false
        }))
      }));
    }

    const finalResult = {
      ...parsedData,
      meta: {
        provider: 'gemini',
        model: config.geminiModel || 'gemini-2.5-flash',
        isFallback: false,
        generatedAt: new Date().toISOString()
      }
    };

    aiInsightsCache.set(cacheKey, { data: finalResult, cachedAt: Date.now() });
    return finalResult;
  } catch (err) {
    console.warn(`[Gemini API Fallback Triggered]: ${err.message}. Using deterministic expert rules engine.`);
    const fallbackResult = generateRulesBasedInsights({ siteA, siteB, comparison });
    fallbackResult.meta = {
      provider: 'rules-engine',
      isFallback: true,
      fallbackReason: `Gemini API notice: ${err.message}. Seamlessly switched to deterministic expert rules engine.`,
      generatedAt: new Date().toISOString()
    };
    aiInsightsCache.set(cacheKey, { data: fallbackResult, cachedAt: Date.now() });
    return fallbackResult;
  }
}

/**
 * Answers questions about the comparison using Gemini API with intelligent context-aware fallback.
 * Follows the Simple Website Improvement Assistant persona:
 * Less explanation. More useful solutions. Simple English. Direct answers.
 *
 * @param {Object} params
 * @param {string} params.question
 * @param {Object} params.comparisonData
 * @returns {Promise<Object>}
 */
export async function answerComparisonChat({ question, comparisonData }) {
  if (!question || typeof question !== 'string') {
    throw new Error('Question must be a valid non-empty string.');
  }

  const { siteA, siteB, insights } = comparisonData || {};
  const urlA = siteA?.url || 'Website A';
  const urlB = siteB?.url || 'Website B';
  const scoreA = siteA?.healthScore ?? 'N/A';
  const scoreB = siteB?.healthScore ?? 'N/A';

  // If Gemini is available, query Gemini model
  if (config.geminiApiKey && config.geminiApiKey.trim() !== '' && config.geminiApiKey !== 'YOUR_GEMINI_API_KEY') {
    try {
      const ai = new GoogleGenAI({ apiKey: config.geminiApiKey });

      const chatPrompt = `
You are a simple, practical Website Improvement Assistant embedded in a website health dashboard.
Your motto: Less explanation. More useful solutions. Simple English. Direct answers.

USER QUESTION: "${question.trim()}"

COMPARISON DATA:
- Website A: ${urlA} (Health Score: ${scoreA}/100, Perf: ${siteA?.auditData?.scores?.performance ?? 'N/A'}, A11y: ${siteA?.auditData?.scores?.accessibility ?? 'N/A'}, SEO: ${siteA?.auditData?.scores?.seo ?? 'N/A'})
- Website B: ${urlB} (Health Score: ${scoreB}/100, Perf: ${siteB?.auditData?.scores?.performance ?? 'N/A'}, A11y: ${siteB?.auditData?.scores?.accessibility ?? 'N/A'}, SEO: ${siteB?.auditData?.scores?.seo ?? 'N/A'})
- LCP: A = ${siteA?.auditData?.metrics?.largestContentfulPaint?.displayValue || 'N/A'} vs B = ${siteB?.auditData?.metrics?.largestContentfulPaint?.displayValue || 'N/A'}
- CLS: A = ${siteA?.auditData?.metrics?.cumulativeLayoutShift?.displayValue || '0'} vs B = ${siteB?.auditData?.metrics?.cumulativeLayoutShift?.displayValue || '0'}
- TBT: A = ${siteA?.auditData?.metrics?.totalBlockingTime?.displayValue || 'N/A'} vs B = ${siteB?.auditData?.metrics?.totalBlockingTime?.displayValue || 'N/A'}
- Weakest Category: ${insights?.verdict?.weakestCategory || 'Performance'}
- Top Identified Problems on Weaker Site: ${(insights?.verdict?.topProblems || insights?.recommendations || []).map(r => r.problem + ' -> ' + r.solution).join('; ')}

INSTRUCTIONS:
1. Answer the user's exact question FIRST in the opening lines.
2. If the user asks how to improve something, provide 3 to 4 simple numbered actions first, followed by one brief sentence explaining why.
3. Keep the total response between 3 and 6 sentences or brief bullet points. Avoid lengthy essays or multiple paragraphs.
4. Use simple, beginner-friendly English. Avoid technical jargon without explanation.
5. Base all advice strictly on the real audit data provided above. Never invent metrics or assume missing features.
6. Never promise an exact future Lighthouse score.
7. If code is needed, give only a short relevant snippet (1-3 lines) with a brief note of where to place it.
`.trim();

      const response = await ai.models.generateContent({
        model: config.geminiModel || 'gemini-2.5-flash',
        contents: chatPrompt,
        config: {
          temperature: 0.2
        }
      });

      const answer = response?.text;
      if (answer && answer.trim().length > 0) {
        return {
          answer: answer.trim(),
          provider: 'gemini',
          isFallback: false
        };
      }
    } catch (err) {
      console.warn(`[Gemini Chat Fallback]: ${err.message}`);
    }
  }

  // Deterministic intelligent fallback answer engine
  // Answers the user's exact question first in simple English, 3 to 6 bullet points or sentences
  const q = question.toLowerCase().trim();
  let answer = '';

  // 1. LCP Question
  if (q.includes('lcp') || q.includes('largest contentful paint')) {
    answer = `To improve your Largest Contentful Paint (LCP), take these 3 actions:\n\n` +
      `1. **Preload the main banner image**: Add \`<link rel="preload" as="image" href="/hero.webp" fetchpriority="high">\` inside your HTML \`<head>\`.\n` +
      `2. **Compress large images**: Convert heavy banners to modern WebP or AVIF format to reduce file sizes.\n` +
      `3. **Eliminate render-blocking resources**: Add \`defer\` to external script tags so the browser displays content without waiting for scripts.\n\n` +
      `These changes ensure visitors see your main banner almost immediately instead of waiting for heavy files to download.`;
  }
  // 2. Slow website loading question
  else if (q.includes('slow') || q.includes('slower') || q.includes('loading') || q.includes('speed')) {
    const weakLcpDisplay = siteB?.auditData?.metrics?.largestContentfulPaint?.displayValue || '4.8s';
    const weakTbtDisplay = siteB?.auditData?.metrics?.totalBlockingTime?.displayValue || '750ms';

    answer = `Your website is loading slowly primarily due to three reasons detected in the audit:\n\n` +
      `1. **Render-blocking assets**: CSS and script files pause page rendering while downloading.\n` +
      `2. **Slow Largest Contentful Paint (LCP)**: The main visual banner takes ${weakLcpDisplay} to appear on screen (target is under 2.5s).\n` +
      `3. **Heavy JavaScript execution**: The main thread is frozen for ${weakTbtDisplay}, delaying user clicks and scrolls.\n\n` +
      `To speed up page loading, preload your hero image, defer non-essential scripts, and compress images.`;
  }
  // 3. SEO question
  else if (q.includes('seo') || q.includes('search engine')) {
    answer = `To improve your SEO score, follow these simple steps:\n\n` +
      `1. **Add a clear meta description**: Add \`<meta name="description" content="...">\` with a 120–160 character summary in your \`<head>\`.\n` +
      `2. **Set a canonical URL**: Add \`<link rel="canonical" href="...">\` to prevent duplicate content indexing across different URLs.\n` +
      `3. **Ensure a single <h1> heading**: Use one descriptive main heading that clearly matches the topic of your page.\n` +
      `4. **Include image alt text**: Add descriptive \`alt\` attributes to all images so search crawlers can index them.\n\n` +
      `These quick fixes help search engines crawl, understand, and display your website accurately in search results.`;
  }
  // 4. Accessibility question
  else if (q.includes('accessibility') || q.includes('a11y') || q.includes('contrast')) {
    answer = `Here are simple and practical solutions for your accessibility problems:\n\n` +
      `1. **Darken low-contrast text**: Make light text colors darker so they achieve at least a 4.5:1 contrast ratio against the background.\n` +
      `2. **Add alt text to images**: Include \`<img alt="Description of image">\` on all visual content so screen readers can describe them.\n` +
      `3. **Enable visible focus outlines**: Add \`:focus-visible { outline: 2px solid #2563eb; }\` in CSS so keyboard users can see what is focused.\n` +
      `4. **Use native <button> tags**: Replace clickable \`<div>\` elements with standard \`<button>\` tags for built-in keyboard navigation.\n\n` +
      `These steps ensure people using screen readers, high-contrast modes, or keyboard navigation can easily use your site.`;
  }
  // 5. Three biggest problems / priorities question
  else if (q.includes('three') || q.includes('biggest') || q.includes('problem') || q.includes('website b') || q.includes('priority')) {
    const targetSiteUrl = q.includes('website a') ? urlA : urlB;
    const topProblems = insights?.verdict?.topProblems || (insights?.recommendations || []).slice(0, 3).map(r => ({ problem: r.problem, solution: r.solution }));

    if (topProblems.length > 0) {
      answer = `The three biggest problems detected with ${targetSiteUrl} and their simple solutions are:\n\n` +
        topProblems.slice(0, 3).map((p, idx) => `${idx + 1}. **${p.problem}**\n   - *Solution*: ${p.solution}`).join('\n\n') +
        `\n\nFixing these three issues first provides the biggest boost to website speed and overall health score.`;
    } else {
      answer = `The three biggest problems to fix on ${targetSiteUrl} are:\n\n` +
        `1. **Slow Main Banner Loading (LCP)**: Preload the hero image with \`<link rel="preload" as="image">\`.\n` +
        `2. **Render-Blocking Files**: Add the \`defer\` attribute to external JavaScript tags.\n` +
        `3. **Content Shifting (CLS)**: Add explicit \`width\` and \`height\` attributes to all images.\n\n` +
        `Addressing these three items will immediately stabilize page layout and speed up initial display.`;
    }
  }
  // Default fallback
  else {
    answer = `Here are the key takeaways from your website comparison:\n\n` +
      `1. **Winner**: ${insights?.verdict?.isTie ? 'Both websites tied with balanced scores' : `${insights?.verdict?.strongerUrl || urlA} leads by ${insights?.verdict?.scoreDifference || 0} points`}.\n` +
      `2. **Weakest Area**: ${insights?.verdict?.weakestCategory || 'Performance'} requires the most improvement.\n` +
      `3. **First Action**: ${insights?.recommendations?.[0]?.solution || 'Preload key visual assets and eliminate render-blocking scripts'}.\n\n` +
      `Review the Priority Matrix and Adaptive Improvement Planner above for step-by-step guidance.`;
  }

  return {
    answer,
    provider: 'rules-engine',
    isFallback: true,
    fallbackReason: 'Answered via deterministic expert rules engine.'
  };
}
