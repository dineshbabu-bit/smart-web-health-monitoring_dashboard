import React from 'react';
import { ArrowLeft, Calendar, TrendingUp, TrendingDown, Minus, Info, Download } from 'lucide-react';
import type { ScanHistoryRecord, MetricDelta } from '../../types/history';
import { calculateDeltas } from '../../services/scanHistoryService';
import { generateAuditPdf } from '../../services/pdfReportService';
import { OverallHealthCard } from '../dashboard/OverallHealthCard';
import { CategoryScoreGrid } from '../dashboard/CategoryScoreGrid';
import { WebVitalsGrid } from '../dashboard/WebVitalsGrid';
import { AuditCharts } from '../dashboard/AuditCharts';
import { SmartRecommendations } from '../dashboard/SmartRecommendations';
import { CategoryDetailsAccordion } from '../dashboard/CategoryDetailsAccordion';

interface HistoryDetailProps {
  currentScan: ScanHistoryRecord;
  previousScan?: ScanHistoryRecord | null;
  onBack: () => void;
}

export const HistoryDetail: React.FC<HistoryDetailProps> = ({
  currentScan,
  previousScan,
  onBack,
}) => {
  const deltas = calculateDeltas(currentScan, previousScan);

  const handleDownloadPdf = () => {
    generateAuditPdf(currentScan.auditData, {
      analysisDurationMs: currentScan.durationMs || 0,
      device: currentScan.device,
      analyzedUrl: currentScan.url,
    });
  };

  const renderDeltaBadge = (deltaObj: MetricDelta | undefined) => {
    if (!deltaObj || deltaObj.delta === null) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] text-zinc-500 font-mono">
          <Minus size={12} /> Baseline Scan
        </span>
      );
    }

    if (deltaObj.isNeutral) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] text-zinc-400 font-mono">
          <Minus size={12} /> 0 (No Change)
        </span>
      );
    }

    const isGood = deltaObj.isImprovement;

    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold font-mono border ${
          isGood
            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
            : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
        }`}
        title={deltaObj.explanation}
      >
        {isGood ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
        <span>{deltaObj.formattedDelta}</span>
      </span>
    );
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#121215]/90 border border-zinc-800">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 transition-colors cursor-pointer"
            title="Back to History List"
          >
            <ArrowLeft size={18} />
          </button>

          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>{currentScan.hostname}</span>
              <span className="text-xs px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-400 font-normal">
                Historical Snapshot
              </span>
            </h2>
            <p className="text-xs text-zinc-400 flex items-center gap-2 mt-0.5">
              <Calendar size={12} className="text-zinc-500" />
              <span>{new Date(currentScan.timestamp).toLocaleString()}</span>
              <span>•</span>
              <span className="capitalize">{currentScan.device} viewport</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={handleDownloadPdf}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
          >
            <Download size={14} />
            <span>Generate PDF Report</span>
          </button>

          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-medium border border-zinc-800 transition-colors cursor-pointer"
          >
            View All Scans
          </button>
        </div>
      </div>

      {/* Comparison & Delta Matrix (Current vs Previous) */}
      {previousScan && deltas && (
        <div className="bg-gradient-to-br from-[#121215] via-[#15151a] to-[#121215] border border-zinc-800 rounded-2xl p-6 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-4 border-b border-zinc-800/80 mb-5">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Comparison vs. Previous Scan</span>
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Comparing this scan ({new Date(currentScan.timestamp).toLocaleDateString()}) against prior run ({new Date(previousScan.timestamp).toLocaleDateString()}).
              </p>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 bg-zinc-900/80 border border-zinc-800 px-3 py-1.5 rounded-lg">
              <Info size={13} className="text-blue-400 shrink-0" />
              <span>For LCP, INP, & CLS: A decrease in value indicates faster performance (improvement).</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Health Delta */}
            <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 flex flex-col justify-between">
              <span className="text-[11px] text-zinc-400 font-medium">Overall Health</span>
              <div className="my-2">
                <span className="text-xl font-extrabold text-white font-mono">
                  {currentScan.healthScore}
                </span>
                <span className="text-xs text-zinc-500 font-mono ml-1">
                  (was {previousScan.healthScore})
                </span>
              </div>
              <div>{renderDeltaBadge(deltas.healthScore)}</div>
            </div>

            {/* Performance Delta */}
            <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 flex flex-col justify-between">
              <span className="text-[11px] text-zinc-400 font-medium">Performance</span>
              <div className="my-2">
                <span className="text-xl font-extrabold text-blue-400 font-mono">
                  {currentScan.scores?.performance ?? 'N/A'}
                </span>
                <span className="text-xs text-zinc-500 font-mono ml-1">
                  (was {previousScan.scores?.performance ?? 'N/A'})
                </span>
              </div>
              <div>{renderDeltaBadge(deltas.performance)}</div>
            </div>

            {/* Accessibility Delta */}
            <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 flex flex-col justify-between">
              <span className="text-[11px] text-zinc-400 font-medium">Accessibility</span>
              <div className="my-2">
                <span className="text-xl font-extrabold text-purple-400 font-mono">
                  {currentScan.scores?.accessibility ?? 'N/A'}
                </span>
              </div>
              <div>{renderDeltaBadge(deltas.accessibility)}</div>
            </div>

            {/* LCP Delta */}
            <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 flex flex-col justify-between">
              <span className="text-[11px] text-zinc-400 font-medium">LCP (Load Speed)</span>
              <div className="my-2">
                <span className="text-xl font-extrabold text-white font-mono">
                  {currentScan.metrics?.largestContentfulPaint?.displayValue || 'N/A'}
                </span>
              </div>
              <div>{renderDeltaBadge(deltas.lcp)}</div>
            </div>

            {/* INP Delta */}
            <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 flex flex-col justify-between">
              <span className="text-[11px] text-zinc-400 font-medium">INP (Latency)</span>
              <div className="my-2">
                <span className="text-xl font-extrabold text-white font-mono">
                  {currentScan.metrics?.interactionToNextPaint?.displayValue || 'N/A'}
                </span>
              </div>
              <div>{renderDeltaBadge(deltas.inp)}</div>
            </div>

            {/* CLS Delta */}
            <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 flex flex-col justify-between">
              <span className="text-[11px] text-zinc-400 font-medium">CLS (Layout Shift)</span>
              <div className="my-2">
                <span className="text-xl font-extrabold text-white font-mono">
                  {currentScan.metrics?.cumulativeLayoutShift?.displayValue || '0'}
                </span>
              </div>
              <div>{renderDeltaBadge(deltas.cls)}</div>
            </div>
          </div>
        </div>
      )}

      {/* Render Full Phase 1 Dashboard for this Historical Record */}
      <OverallHealthCard
        scores={currentScan.scores}
        targetUrl={currentScan.finalUrl || currentScan.url}
        device={currentScan.device}
        durationMs={currentScan.durationMs}
        fetchTime={currentScan.timestamp}
        onDownloadPdf={handleDownloadPdf}
      />

      <CategoryScoreGrid
        scores={currentScan.scores}
        categoryDetails={currentScan.auditData?.categoryDetails}
      />

      <AuditCharts
        scores={currentScan.scores}
        metrics={currentScan.metrics}
      />

      <WebVitalsGrid metrics={currentScan.metrics} />

      <SmartRecommendations
        opportunities={currentScan.auditData?.opportunities || []}
        diagnostics={currentScan.auditData?.diagnostics || []}
      />

      <CategoryDetailsAccordion
        categoryDetails={currentScan.auditData?.categoryDetails || {}}
      />
    </div>
  );
};
