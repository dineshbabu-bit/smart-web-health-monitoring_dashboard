import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, TrendingUp, ArrowRight } from 'lucide-react';
import { AuditInputBar } from '../components/dashboard/AuditInputBar';
import { OverallHealthCard } from '../components/dashboard/OverallHealthCard';
import { CategoryScoreGrid } from '../components/dashboard/CategoryScoreGrid';
import { WebVitalsGrid } from '../components/dashboard/WebVitalsGrid';
import { AuditCharts } from '../components/dashboard/AuditCharts';
import { SmartRecommendations } from '../components/dashboard/SmartRecommendations';
import { CategoryDetailsAccordion } from '../components/dashboard/CategoryDetailsAccordion';
import { EmptyAuditState } from '../components/dashboard/EmptyAuditState';
import { LoadingAuditState } from '../components/dashboard/LoadingAuditState';
import { ErrorAlert } from '../components/dashboard/ErrorAlert';
import { analyzeWebsite } from '../services/auditService';
import { AppApiError } from '../services/api';
import { saveScan, extractHostname, getHistoryByHostname, calculateDeltas } from '../services/scanHistoryService';
import { generateAuditPdf } from '../services/pdfReportService';
import type { AuditResponseData, AuditApiMeta, DeviceType } from '../types/audit';
import type { WebsiteDeltaComparison } from '../types/history';

export const DashboardPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [auditData, setAuditData] = useState<AuditResponseData | null>(null);
  const [meta, setMeta] = useState<AuditApiMeta | null>(null);
  const [errorInfo, setErrorInfo] = useState<{ message: string; code?: string; statusCode?: number } | null>(null);
  const [currentUrl, setCurrentUrl] = useState<string>('');
  const [currentDevice, setCurrentDevice] = useState<DeviceType>('desktop');
  const [savedNotification, setSavedNotification] = useState<boolean>(false);
  const [deltaComparison, setDeltaComparison] = useState<WebsiteDeltaComparison | null>(null);

  const handleAnalyze = async (url: string, device: DeviceType = 'desktop') => {
    if (isLoading) return;
    setIsLoading(true);
    setErrorInfo(null);
    setCurrentUrl(url);
    setCurrentDevice(device);
    setSavedNotification(false);
    setDeltaComparison(null);

    try {
      const response = await analyzeWebsite(url, device);
      if (response.success && response.data) {
        setAuditData(response.data);
        setMeta(response.meta);

        // Auto-save to scan history
        const hostname = extractHostname(response.data.finalUrl || response.data.url);
        const priorScans = getHistoryByHostname(hostname);
        const previousRecord = priorScans.length > 0 ? priorScans[priorScans.length - 1] : null;

        const newRecord = saveScan(response.data, response.meta);

        // Compute deltas if prior scan exists
        if (previousRecord) {
          const deltas = calculateDeltas(newRecord, previousRecord);
          setDeltaComparison(deltas);
        }

        // Show "Scan saved to history." feedback toast
        setSavedNotification(true);
        setTimeout(() => {
          setSavedNotification(false);
        }, 5000);
      } else {
        throw new Error('Analysis failed to return valid audit data.');
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
          message: 'An unexpected error occurred during website analysis.',
          code: 'UNKNOWN_ERROR',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPdf = () => {
    if (auditData) {
      try {
        generateAuditPdf(auditData, meta || undefined);
      } catch {
        setErrorInfo({
          message: 'Failed to generate PDF audit report. Please check browser popups or permissions and try again.',
          code: 'PDF_ERROR',
        });
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto pb-16">
      {/* Top Search & Audit Input Bar */}
      <AuditInputBar
        onAnalyze={handleAnalyze}
        isLoading={isLoading}
        currentUrl={currentUrl}
        currentDevice={currentDevice}
      />

      {/* Auto-Saved Notification Toast */}
      {savedNotification && (
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs mb-6 animate-fadeIn shadow-lg shadow-emerald-500/5">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-400" />
            <span className="font-semibold text-white">Scan saved to history.</span>
            <span className="text-emerald-300/80 hidden sm:inline">
              Track score changes and Core Web Vitals progression over time.
            </span>
          </div>

          <Link
            to="/history"
            className="font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 hover:underline ml-4"
          >
            <span>View History & Trends</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      )}

      {/* Error State */}
      {errorInfo && !isLoading && (
        <ErrorAlert
          message={errorInfo.message}
          code={errorInfo.code}
          statusCode={errorInfo.statusCode}
          onRetry={() => handleAnalyze(currentUrl, currentDevice)}
          onDismiss={() => setErrorInfo(null)}
          onSelectSample={(url) => handleAnalyze(url, 'desktop')}
        />
      )}

      {/* Loading State */}
      {isLoading && (
        <LoadingAuditState url={currentUrl} device={currentDevice} />
      )}

      {/* Empty State */}
      {!isLoading && !auditData && !errorInfo && (
        <EmptyAuditState onSelectSample={(url) => handleAnalyze(url, 'desktop')} />
      )}

      {/* Results Dashboard */}
      {!isLoading && auditData && (
        <div className="space-y-8 animate-fadeIn">
          {/* Quick Delta comparison indicator if prior scan existed */}
          {deltaComparison && deltaComparison.healthScore.delta !== null && (
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs">
              <div className="flex items-center gap-2">
                <TrendingUp size={16} className="text-emerald-400" />
                <span className="text-zinc-300">
                  Compared to previous run on this website:
                </span>
                <span
                  className={`font-bold font-mono px-2 py-0.5 rounded ${
                    deltaComparison.healthScore.isImprovement
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : deltaComparison.healthScore.isNeutral
                      ? 'bg-zinc-800 text-zinc-300'
                      : 'bg-rose-500/20 text-rose-400'
                  }`}
                >
                  Health {deltaComparison.healthScore.formattedDelta}
                </span>
                <span
                  className={`font-bold font-mono px-2 py-0.5 rounded ${
                    deltaComparison.performance.isImprovement
                      ? 'bg-blue-500/20 text-blue-400'
                      : deltaComparison.performance.isNeutral
                      ? 'bg-zinc-800 text-zinc-300'
                      : 'bg-rose-500/20 text-rose-400'
                  }`}
                >
                  Perf {deltaComparison.performance.formattedDelta}
                </span>
              </div>

              <Link
                to="/history"
                className="text-emerald-400 hover:underline flex items-center gap-1 text-[11px] font-medium"
              >
                <span>Full historical trends</span>
                <ArrowRight size={12} />
              </Link>
            </div>
          )}

          {/* 1. Overall Website Health Summary */}
          <OverallHealthCard
            scores={auditData.scores}
            targetUrl={auditData.finalUrl || auditData.url}
            device={auditData.device}
            durationMs={meta?.analysisDurationMs}
            fetchTime={auditData.fetchTime}
            onDownloadPdf={handleDownloadPdf}
          />

          {/* 2. Four Lighthouse Pillar Scores */}
          <CategoryScoreGrid
            scores={auditData.scores}
            categoryDetails={auditData.categoryDetails}
          />

          {/* 3. Interactive Score & Timing Charts */}
          <AuditCharts
            scores={auditData.scores}
            metrics={auditData.metrics}
          />

          {/* 4. Core Web Vitals & Diagnostics Grid */}
          <WebVitalsGrid metrics={auditData.metrics} />

          {/* 5. Smart Recommendations & High-Impact Opportunities */}
          <SmartRecommendations
            opportunities={auditData.opportunities}
            diagnostics={auditData.diagnostics}
          />

          {/* 6. Deep Dive Accordion */}
          <CategoryDetailsAccordion
            categoryDetails={auditData.categoryDetails}
          />
        </div>
      )}
    </div>
  );
};
