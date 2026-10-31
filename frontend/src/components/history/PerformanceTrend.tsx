import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { TrendingUp, ArrowUpRight, Globe } from 'lucide-react';
import type { ScanHistoryRecord } from '../../types/history';

interface PerformanceTrendProps {
  scans: ScanHistoryRecord[];
  selectedHostname?: string;
  onSelectHostname?: (host: string) => void;
  uniqueWebsites: { hostname: string; count: number }[];
}

export const PerformanceTrend: React.FC<PerformanceTrendProps> = ({
  scans,
  selectedHostname,
  onSelectHostname,
  uniqueWebsites,
}) => {
  const [activeMetric, setActiveMetric] = useState<'all' | 'health' | 'performance' | 'seo'>('all');

  // Memoize filtered scans & chart data O(N log N) -> O(1) on subsequent renders
  const chartData = useMemo(() => {
    const isAll = !selectedHostname || selectedHostname === 'all';
    const targetHost = isAll ? '' : selectedHostname.toLowerCase();

    const matched = isAll
      ? scans.slice()
      : scans.filter((s) => (s.hostname || '').toLowerCase() === targetHost);

    // Fast chronological sort using numeric epoch
    matched.sort((a, b) => (Date.parse(a.timestamp) || 0) - (Date.parse(b.timestamp) || 0));

    return matched.map((scan, index) => {
      const d = new Date(scan.timestamp);
      const dateLabel = `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
      return {
        name: `#${index + 1} (${dateLabel})`,
        fullDate: d.toLocaleString(),
        hostname: scan.hostname,
        device: scan.device,
        healthScore: scan.healthScore,
        performance: scan.scores?.performance ?? null,
        accessibility: scan.scores?.accessibility ?? null,
        bestPractices: scan.scores?.bestPractices ?? null,
        seo: scan.scores?.seo ?? null,
      };
    });
  }, [scans, selectedHostname]);

  return (
    <div className="bg-[#121215]/90 border border-zinc-800 rounded-2xl p-6 shadow-xl mb-8">
      {/* Header with Metric & Website Selectors */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-zinc-800/80 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <TrendingUp size={18} />
            </div>
            <h3 className="text-lg font-bold text-white tracking-tight">
              Website Health & Score Progression
            </h3>
          </div>
          <p className="text-xs text-zinc-400 flex items-center gap-1.5">
            <span>Historical score trends across audit runs.</span>
            <span className="text-emerald-400 font-semibold inline-flex items-center gap-0.5">
              <ArrowUpRight size={13} /> Higher score is better (0–100)
            </span>
          </p>
        </div>

        {/* Website & Metric filter dropdowns */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Website selector */}
          {uniqueWebsites.length > 1 && onSelectHostname && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-300">
              <Globe size={13} className="text-zinc-500" />
              <select
                value={selectedHostname || 'all'}
                onChange={(e) => onSelectHostname(e.target.value)}
                className="bg-transparent text-xs text-white focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-zinc-900 text-white">All Websites ({scans.length})</option>
                {uniqueWebsites.map((site) => (
                  <option key={site.hostname} value={site.hostname} className="bg-zinc-900 text-white">
                    {site.hostname} ({site.count})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Metric Selector Pills */}
          <div className="flex items-center p-1 bg-zinc-900 border border-zinc-800 rounded-xl text-xs">
            <button
              type="button"
              onClick={() => setActiveMetric('all')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                activeMetric === 'all' ? 'bg-zinc-800 text-white font-medium' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              All Pillars
            </button>
            <button
              type="button"
              onClick={() => setActiveMetric('health')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                activeMetric === 'health' ? 'bg-zinc-800 text-emerald-400 font-medium' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Overall Health
            </button>
            <button
              type="button"
              onClick={() => setActiveMetric('performance')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                activeMetric === 'performance' ? 'bg-zinc-800 text-blue-400 font-medium' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Performance
            </button>
          </div>
        </div>
      </div>

      {/* Recharts Line Chart */}
      {chartData.length < 2 ? (
        <div className="py-12 text-center text-zinc-400">
          <p className="text-sm font-semibold text-zinc-300">Insufficient Data for Trend Analysis</p>
          <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
            Audit this website at least 2 times to visualize health and performance improvements over time.
          </p>
        </div>
      ) : (
        <div className="w-full h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="name" stroke="#71717a" fontSize={11} tickLine={false} />
              <YAxis domain={[0, 100]} stroke="#71717a" fontSize={11} tickLine={false} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-3 shadow-2xl text-xs space-y-1">
                        <p className="font-bold text-white">{data.hostname} ({data.device})</p>
                        <p className="text-zinc-400 text-[11px]">{data.fullDate}</p>
                        <div className="pt-2 border-t border-zinc-800 space-y-0.5">
                          <p className="text-emerald-400 font-mono font-semibold">
                            Overall Health: {data.healthScore}
                          </p>
                          <p className="text-blue-400 font-mono">Performance: {data.performance ?? 'N/A'}</p>
                          <p className="text-purple-400 font-mono">Accessibility: {data.accessibility ?? 'N/A'}</p>
                          <p className="text-amber-400 font-mono">SEO: {data.seo ?? 'N/A'}</p>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />

              {(activeMetric === 'all' || activeMetric === 'health') && (
                <Line
                  type="monotone"
                  dataKey="healthScore"
                  name="Overall Health"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#10b981' }}
                  activeDot={{ r: 6 }}
                />
              )}

              {(activeMetric === 'all' || activeMetric === 'performance') && (
                <Line
                  type="monotone"
                  dataKey="performance"
                  name="Performance"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#3b82f6' }}
                />
              )}

              {activeMetric === 'all' && (
                <>
                  <Line
                    type="monotone"
                    dataKey="accessibility"
                    name="Accessibility"
                    stroke="#a855f7"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    dot={{ r: 2 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="seo"
                    name="SEO"
                    stroke="#f59e0b"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    dot={{ r: 2 }}
                  />
                </>
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};
