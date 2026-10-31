import React, { useState } from 'react';
import { Scale, Sparkles, Loader2, Download } from 'lucide-react';
import { ComparisonInputBar } from '../components/comparison/ComparisonInputBar';
import { ComparisonWinnerCard } from '../components/comparison/ComparisonWinnerCard';
import { ComparisonTable } from '../components/comparison/ComparisonTable';
import { ComparisonCharts } from '../components/comparison/ComparisonCharts';
import { ComparisonInsights } from '../components/comparison/ComparisonInsights';
import { AiCompetitorAdvisorCard } from '../components/comparison/AiCompetitorAdvisorCard';
import { CompetitorLearningInsights } from '../components/comparison/CompetitorLearningInsights';
import { AiRecommendationsList } from '../components/comparison/AiRecommendationsList';
import { SmartFixPriorityMatrix } from '../components/comparison/SmartFixPriorityMatrix';
import { AdaptiveImprovementPlanner } from '../components/comparison/ImprovementRoadmap';
import { BeforeAfterTracker } from '../components/comparison/BeforeAfterTracker';
import { AiComparisonChat } from '../components/comparison/AiComparisonChat';
import { ErrorAlert } from '../components/dashboard/ErrorAlert';
import { analyzeWebsite } from '../services/auditService';
import { AppApiError } from '../services/api';
import { buildComparisonResult } from '../services/comparisonService';
import { generateComparisonPdf } from '../services/pdfReportService';
import { getAiComparisonInsights } from '../services/aiService';
import { saveScan } from '../services/scanHistoryService';
import { calculateOverallHealth } from '../utils/healthCalculator';
import type { DeviceType, AuditApiResponse } from '../types/audit';
import type { ComparisonResult, ComparisonSiteData } from '../types/comparison';
import type { AiComparisonInsights } from '../types/ai';

export const ComparisonPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState({ siteA: false, siteB: false });
  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null);
  const [errorInfo, setErrorInfo] = useState<{ message: string; code?: string; statusCode?: number } | null>(null);
  const [hasSaved, setHasSaved] = useState(false);

  // AI Gap Analyzer & Improvement Advisor states
  const [aiInsights, setAiInsights] = useState<AiComparisonInsights | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const [lastParams, setLastParams] = useState<{
    urlA: string;
    deviceA: DeviceType;
    urlB: string;
    deviceB: DeviceType;
  } | null>(null);

  const fetchAiAdvisorInsights = async (
    siteA: ComparisonSiteData,
    siteB: ComparisonSiteData,
    comp: ComparisonResult
  ) => {
    setIsAiLoading(true);
    setAiError(null);
    try {
      console.log('[AI Advisor] Requesting competitor gap analysis from backend...');
      const data = await getAiComparisonInsights(siteA, siteB, comp);
      setAiInsights(data);
    } catch (err: unknown) {
      console.error('[AI Advisor] Failed to retrieve AI insights:', err);
      const msg = err instanceof Error ? err.message : 'Failed to generate AI competitor gap analysis.';
      setAiError(msg);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleCompare = async (
    urlA: string,
    deviceA: DeviceType,
    urlB: string,
    deviceB: DeviceType
  ) => {
    if (isLoading) return;
    setIsLoading(true);
    setErrorInfo(null);
    setComparisonResult(null);
    setAiInsights(null);
    setAiError(null);
    setHasSaved(false);
    setLastParams({ urlA, deviceA, urlB, deviceB });

    let resA: AuditApiResponse | null = null;
    let resB: AuditApiResponse | null = null;
    let errA: unknown = null;
    let errB: unknown = null;

    try {
      // Step 1: Execute Audit on Website A first
      setLoadingProgress({ siteA: true, siteB: false });
      try {
        resA = await analyzeWebsite(urlA, deviceA);
      } catch (e) {
        errA = e;
      }

      // Step 2: Execute Audit on Website B sequentially to avoid CPU/port contention
      setLoadingProgress({ siteA: false, siteB: true });
      try {
        resB = await analyzeWebsite(urlB, deviceB);
      } catch (e) {
        errB = e;
      }

      setLoadingProgress({ siteA: false, siteB: false });

      if (resA && resB && resA.data && resB.data) {
        const healthA = calculateOverallHealth(resA.data.scores);
        const healthB = calculateOverallHealth(resB.data.scores);

        const siteAData: ComparisonSiteData = {
          url: urlA,
          device: deviceA,
          auditData: resA.data,
          meta: resA.meta,
          healthScore: healthA.score,
        };

        const siteBData: ComparisonSiteData = {
          url: urlB,
          device: deviceB,
          auditData: resB.data,
          meta: resB.meta,
          healthScore: healthB.score,
        };

        const comparison = buildComparisonResult(siteAData, siteBData);
        setComparisonResult(comparison);

        // Auto-trigger AI Competitor Gap Analysis
        fetchAiAdvisorInsights(siteAData, siteBData, comparison);
      } else if (resA && resA.data && errB) {
        // Website A succeeded; preserve result and save to history
        saveScan(resA.data, resA.meta);
        const healthA = calculateOverallHealth(resA.data.scores);
        const msgB = errB instanceof Error ? errB.message : String(errB);
        setErrorInfo({
          message: `Website A (${urlA}) audit succeeded and was saved to Scan History (Health Score: ${healthA.score}/100).\n\nWebsite B (${urlB}) audit could not be completed: ${msgB}`,
          code: (errB as any)?.code || 'LIGHTHOUSE_ERROR',
          statusCode: (errB as any)?.statusCode,
        });
      } else if (resB && resB.data && errA) {
        // Website B succeeded; preserve result and save to history
        saveScan(resB.data, resB.meta);
        const healthB = calculateOverallHealth(resB.data.scores);
        const msgA = errA instanceof Error ? errA.message : String(errA);
        setErrorInfo({
          message: `Website B (${urlB}) audit succeeded and was saved to Scan History (Health Score: ${healthB.score}/100).\n\nWebsite A (${urlA}) audit could not be completed: ${msgA}`,
          code: (errA as any)?.code || 'LIGHTHOUSE_ERROR',
          statusCode: (errA as any)?.statusCode,
        });
      } else {
        // Both failed
        const msgA = errA instanceof Error ? errA.message : String(errA);
        const msgB = errB instanceof Error ? errB.message : String(errB);
        const code = (errA as any)?.code || (errB as any)?.code || 'LIGHTHOUSE_ERROR';
        setErrorInfo({
          message: `Both website audits failed:\n• Website A (${urlA}): ${msgA}\n• Website B (${urlB}): ${msgB}`,
          code,
        });
      }
    } catch (err: unknown) {
      if (err instanceof AppApiError) {
        setErrorInfo({
          message: err.message,
          code: err.code,
          statusCode: err.statusCode,
        });
      } else if (err instanceof Error) {
        setErrorInfo({
          message: err.message,
          code: (err as any).code || 'UNKNOWN_ERROR',
        });
      } else {
        setErrorInfo({
          message: 'An error occurred during website comparison.',
          code: 'UNKNOWN_ERROR',
        });
      }
    } finally {
      setIsLoading(false);
      setLoadingProgress({ siteA: false, siteB: false });
    }
  };

  const handleDownloadPdf = (includeAi = false) => {
    if (comparisonResult) {
      try {
        generateComparisonPdf(comparisonResult, includeAi ? aiInsights : null);
      } catch {
        setErrorInfo({
          message: 'Failed to generate comparison PDF report. Please check browser popups or permissions and try again.',
          code: 'PDF_ERROR',
        });
      }
    }
  };

  const handleSaveToHistory = () => {
    if (comparisonResult && !hasSaved) {
      saveScan(comparisonResult.siteA.auditData, comparisonResult.siteA.meta);
      saveScan(comparisonResult.siteB.auditData, comparisonResult.siteB.meta);
      setHasSaved(true);
    }
  };

  // Determine the target site requiring improvement
  const getWeakerSite = (): ComparisonSiteData | null => {
    if (!comparisonResult) return null;
    if (comparisonResult.winner === 'B') return comparisonResult.siteA;
    return comparisonResult.siteB; // If siteA won or tie, defaults to siteB as target benchmark
  };

  const weakerSite = getWeakerSite();
  const strongerSite = comparisonResult ? (comparisonResult.winner === 'B' ? comparisonResult.siteB : comparisonResult.siteA) : null;
  const roadmapKey = comparisonResult ? `${comparisonResult.siteA.url}__${comparisonResult.siteB.url}` : '';

  return (
    <div className="max-w-7xl mx-auto pb-16">
      {/* Page Title */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Scale size={24} className="text-emerald-400" />
            <span>Head-to-Head Website Comparison Studio</span>
          </h1>
          <p className="text-xs md:text-sm text-zinc-400 mt-1">
            Benchmark two websites side-by-side to compare Overall Web Health, Performance, Core Web Vitals, and AI gap remediation.
          </p>
        </div>

        {comparisonResult && aiInsights && (
          <button
            type="button"
            onClick={() => handleDownloadPdf(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/25 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <Download className="w-4 h-4" />
            <span>Export Comparison + AI Report (PDF)</span>
          </button>
        )}
      </div>

      {/* Input Bar */}
      <ComparisonInputBar
        onCompare={handleCompare}
        isLoading={isLoading}
        loadingProgress={loadingProgress}
      />

      {/* Error state */}
      {errorInfo && !isLoading && (
        <ErrorAlert
          message={errorInfo.message}
          code={errorInfo.code}
          statusCode={errorInfo.statusCode}
          onDismiss={() => setErrorInfo(null)}
          onRetry={
            lastParams
              ? () =>
                  handleCompare(
                    lastParams.urlA,
                    lastParams.deviceA,
                    lastParams.urlB,
                    lastParams.deviceB
                  )
              : undefined
          }
        />
      )}

      {/* Empty State before comparison */}
      {!isLoading && !comparisonResult && !errorInfo && (
        <div className="py-16 text-center max-w-xl mx-auto text-zinc-400 animate-fadeIn">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4">
            <Scale size={30} className="text-emerald-400" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Ready to Compare Websites</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Enter two target URLs above (e.g. your website vs. a competitor) and click <strong>Compare Websites</strong> to generate a comprehensive benchmark analysis and AI improvement plan.
          </p>
        </div>
      )}

      {/* Results View */}
      {!isLoading && comparisonResult && (
        <div className="space-y-8 animate-fadeIn">
          {/* 1. Winner Banner */}
          <ComparisonWinnerCard
            comparison={comparisonResult}
            onDownloadPdf={() => handleDownloadPdf(false)}
            onSaveToHistory={handleSaveToHistory}
            hasSaved={hasSaved}
          />

          {/* 2. Side-by-Side Breakdown Table */}
          <ComparisonTable comparison={comparisonResult} />

          {/* 3. Grouped Bar Charts */}
          <ComparisonCharts comparison={comparisonResult} />

          {/* 4. Automated Insights Section */}
          <ComparisonInsights insights={comparisonResult.insights} />

          {/* AI ADVISOR LOADING / ERROR / RESULTS */}
          {isAiLoading && (
            <div className="p-8 rounded-2xl bg-[#11131a] border border-indigo-500/30 flex flex-col items-center justify-center gap-3 text-center">
              <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
              <h4 className="text-sm font-bold text-white">Analyzing Competitor Metrics with AI Advisor...</h4>
              <p className="text-xs text-gray-400 max-w-md">
                Synthesizing Google Lighthouse diagnostics, Core Web Vitals gaps, and generating evidence-based remediation strategies.
              </p>
            </div>
          )}

          {aiError && !isAiLoading && (
            <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/40 text-xs text-amber-300">
              <strong>Notice:</strong> {aiError}
            </div>
          )}

          {/* 5. AI Competitor Advisor Main Card */}
          {aiInsights && !isAiLoading && (
            <div className="space-y-8 animate-fadeIn pt-4">
              {/* Verdict & Gap Summary Card */}
              <AiCompetitorAdvisorCard verdict={aiInsights.verdict} meta={aiInsights.meta} />

              {/* What Can We Learn From The Better Website */}
              <CompetitorLearningInsights
                insights={aiInsights.competitorLearningInsights}
                strongerUrl={strongerSite?.url || 'Competitor'}
                isTie={aiInsights.verdict.isTie}
              />

              {/* Smart Fix Priority Matrix */}
              <SmartFixPriorityMatrix items={aiInsights.priorityMatrix} />

              {/* AI Improvement Recommendations */}
              <AiRecommendationsList
                recommendations={aiInsights.recommendations}
                targetUrl={weakerSite?.url || 'target website'}
              />

              {/* Adaptive Website Improvement Planner (Evidence-based Dynamic Task Sprints) */}
              <AdaptiveImprovementPlanner
                adaptivePlan={aiInsights.adaptivePlan}
                roadmap={aiInsights.roadmap}
                planKey={roadmapKey}
                targetUrl={weakerSite?.url || 'target website'}
                onTriggerReAudit={() => {
                  const el = document.getElementById('before-after-tracker-section');
                  if (el) {
                    el.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
              />

              {/* Before-and-After Improvement Tracker */}
              {weakerSite && (
                <div id="before-after-tracker-section">
                  <BeforeAfterTracker
                    weakerSite={weakerSite}
                    onAuditUpdated={(updatedSite) => {
                      // Update the comparison result in real-time
                      if (comparisonResult) {
                        const newSiteA = comparisonResult.winner === 'B' ? updatedSite : comparisonResult.siteA;
                        const newSiteB = comparisonResult.winner === 'B' ? comparisonResult.siteB : updatedSite;
                        const recomputed = buildComparisonResult(newSiteA, newSiteB);
                        setComparisonResult(recomputed);
                      }
                    }}
                  />
                </div>
              )}

              {/* Grounded AI Chat Assistant */}
              <AiComparisonChat
                siteA={comparisonResult.siteA}
                siteB={comparisonResult.siteB}
                insights={aiInsights}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

