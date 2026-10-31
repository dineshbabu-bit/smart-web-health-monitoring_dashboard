import React, { useState } from 'react';
import type { ComparisonSiteData } from '../../types/comparison';
import type { BeforeAfterRecord } from '../../types/ai';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import {
  History,
  Play,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  AlertCircle,
  BarChart3,
  Loader2
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { analyzeWebsite } from '../../services/auditService';
import {
  computeBeforeAfterDeltas,
  saveBeforeAfterRecord,
  getBeforeAfterHistory
} from '../../services/aiService';

interface BeforeAfterTrackerProps {
  weakerSite: ComparisonSiteData;
  onAuditUpdated?: (updatedSite: ComparisonSiteData) => void;
}

export const BeforeAfterTracker: React.FC<BeforeAfterTrackerProps> = ({
  weakerSite,
  onAuditUpdated
}) => {
  const [isRunningAudit, setIsRunningAudit] = useState(false);
  const [auditError, setAuditError] = useState<string | null>(null);
  const [latestRecord, setLatestRecord] = useState<BeforeAfterRecord | null>(() => {
    const list = getBeforeAfterHistory(weakerSite.url);
    return list.length > 0 ? list[0] : null;
  });

  const handleRunReAudit = async () => {
    setIsRunningAudit(true);
    setAuditError(null);

    try {
      console.log(`[Before/After] Triggering fresh re-audit for ${weakerSite.url} (${weakerSite.device})...`);
      const newAuditResult = await analyzeWebsite(weakerSite.url, weakerSite.device);

      const { healthDelta, newHealth, deltas } = computeBeforeAfterDeltas(
        weakerSite.auditData,
        newAuditResult.data
      );

      const record: BeforeAfterRecord = {
        id: `ba_${Date.now()}`,
        url: weakerSite.url,
        device: weakerSite.device,
        timestamp: new Date().toISOString(),
        beforeHealthScore: weakerSite.healthScore,
        afterHealthScore: newHealth,
        healthDelta,
        beforeAuditData: weakerSite.auditData,
        afterAuditData: newAuditResult.data,
        deltas
      };

      saveBeforeAfterRecord(record);
      setLatestRecord(record);

      if (onAuditUpdated) {
        onAuditUpdated({
          ...weakerSite,
          healthScore: newHealth,
          auditData: newAuditResult.data,
          meta: newAuditResult.meta
        });
      }
    } catch (err: unknown) {
      console.error('Re-audit failed in Before-and-After Tracker:', err);
      const msg = err instanceof Error ? err.message : 'Re-audit execution failed. Please verify site connectivity.';
      setAuditError(msg);
    } finally {
      setIsRunningAudit(false);
    }
  };

  // Prepare chart data for Pillars & Web Vitals
  const chartData = latestRecord
    ? [
        {
          name: 'Overall Health',
          Before: latestRecord.beforeHealthScore,
          After: latestRecord.afterHealthScore
        },
        {
          name: 'Performance',
          Before: latestRecord.beforeAuditData.scores.performance,
          After: latestRecord.afterAuditData.scores.performance
        },
        {
          name: 'Accessibility',
          Before: latestRecord.beforeAuditData.scores.accessibility,
          After: latestRecord.afterAuditData.scores.accessibility
        },
        {
          name: 'Best Practices',
          Before: latestRecord.beforeAuditData.scores.bestPractices,
          After: latestRecord.afterAuditData.scores.bestPractices
        },
        {
          name: 'SEO',
          Before: latestRecord.beforeAuditData.scores.seo,
          After: latestRecord.afterAuditData.scores.seo
        }
      ]
    : [];

  return (
    <Card className="p-6 md:p-8 bg-[#11131a] border-gray-800 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
              BEFORE-AND-AFTER IMPROVEMENT TRACKER
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Execute real Lighthouse re-audits on {weakerSite.url} to verify measured health score and Core Web Vitals gains
            </p>
          </div>
        </div>

        {/* Trigger re-audit button */}
        <Button
          variant="primary"
          onClick={handleRunReAudit}
          disabled={isRunningAudit}
          className="bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-2 text-sm shadow-lg shadow-emerald-600/20 px-4 py-2"
        >
          {isRunningAudit ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Running Live Re-Audit...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              <span>Re-Audit Weaker Site Now</span>
            </>
          )}
        </Button>
      </div>

      {auditError && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 text-xs text-rose-300 flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Re-Audit Error: </span>
            {auditError}
          </div>
        </div>
      )}

      {/* Primary Delta Display */}
      {latestRecord ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Before Score */}
            <div className="p-5 rounded-xl bg-gray-900/50 border border-gray-800">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Baseline Overall Health
              </span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-black text-gray-200">{latestRecord.beforeHealthScore}</span>
                <span className="text-xs text-gray-400">/ 100</span>
              </div>
              <span className="text-xs text-gray-400 mt-1 block">Initial measured benchmark</span>
            </div>

            {/* Delta Change */}
            <div className={`p-5 rounded-xl border ${
              latestRecord.healthDelta > 0
                ? 'bg-emerald-950/20 border-emerald-500/30'
                : latestRecord.healthDelta < 0
                ? 'bg-rose-950/20 border-rose-500/30'
                : 'bg-gray-900/50 border-gray-800'
            }`}>
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Verified Health Delta
              </span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className={`text-3xl font-black ${
                  latestRecord.healthDelta > 0 ? 'text-emerald-400' : latestRecord.healthDelta < 0 ? 'text-rose-400' : 'text-gray-300'
                }`}>
                  {latestRecord.healthDelta > 0 ? `+${latestRecord.healthDelta}` : latestRecord.healthDelta}
                </span>
                <span className="text-xs text-gray-400">points</span>
              </div>
              <span className="text-xs text-gray-400 mt-1 block">
                {latestRecord.healthDelta > 0
                  ? 'Genuine performance improvement measured'
                  : latestRecord.healthDelta < 0
                  ? 'Score regressed; inspect active bottlenecks'
                  : 'No net score change detected'}
              </span>
            </div>

            {/* After Score */}
            <div className="p-5 rounded-xl bg-gray-900/50 border border-gray-800">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                Current Post-Optimization
              </span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-black text-emerald-400">{latestRecord.afterHealthScore}</span>
                <span className="text-xs text-gray-400">/ 100</span>
              </div>
              <span className="text-xs text-gray-400 mt-1 block">
                Re-audited at {new Date(latestRecord.timestamp).toLocaleTimeString()}
              </span>
            </div>
          </div>

          {/* Visual Delta Bar Chart */}
          <div className="p-5 rounded-xl bg-gray-900/30 border border-gray-800 space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-gray-400">
              <span className="flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-indigo-400" />
                Score Delta Comparison
              </span>
              <span className="text-gray-400 font-normal">Real measured values</span>
            </div>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#9ca3af" fontSize={11} tickLine={false} />
                  <YAxis domain={[0, 100]} stroke="#9ca3af" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#181b26', borderColor: '#374151', borderRadius: '8px', color: '#fff' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Bar dataKey="Before" fill="#6b7280" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="After" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Detailed Metric Delta Table */}
          <div className="overflow-x-auto rounded-xl border border-gray-800">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-900/80 text-gray-400 font-semibold uppercase tracking-wider border-b border-gray-800">
                  <th className="py-2.5 px-3.5">Metric</th>
                  <th className="py-2.5 px-3.5">Before</th>
                  <th className="py-2.5 px-3.5">After</th>
                  <th className="py-2.5 px-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {latestRecord.deltas.map((d, idx) => (
                  <tr key={idx} className="hover:bg-gray-800/20">
                    <td className="py-2.5 px-3.5 font-medium text-gray-200">{d.metricName}</td>
                    <td className="py-2.5 px-3.5 font-mono text-gray-400">{d.beforeDisplay}</td>
                    <td className="py-2.5 px-3.5 font-mono text-gray-200 font-semibold">{d.afterDisplay}</td>
                    <td className="py-2.5 px-3.5">
                      {d.neutral ? (
                        <span className="text-gray-400">Unchanged</span>
                      ) : d.improved ? (
                        <span className="text-emerald-400 font-medium flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" /> Improved
                        </span>
                      ) : (
                        <span className="text-rose-400 font-medium flex items-center gap-1">
                          <TrendingDown className="w-3.5 h-3.5" /> Regressed
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center rounded-xl bg-gray-900/30 border border-gray-800/80 space-y-2">
          <History className="w-8 h-8 text-gray-500 mx-auto" />
          <h4 className="text-sm font-semibold text-gray-300">No Re-Audit Recorded Yet</h4>
          <p className="text-xs text-gray-400 max-w-md mx-auto">
            Implement the recommended fixes, then click <strong>"Re-Audit Weaker Site Now"</strong> to trigger a real Lighthouse audit and verify your improvements.
          </p>
        </div>
      )}
    </Card>
  );
};
