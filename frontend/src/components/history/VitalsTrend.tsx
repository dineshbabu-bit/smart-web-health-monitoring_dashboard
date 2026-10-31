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
import { Gauge, ArrowDownRight, Info } from 'lucide-react';
import type { ScanHistoryRecord } from '../../types/history';

interface VitalsTrendProps {
  scans: ScanHistoryRecord[];
  selectedHostname?: string;
}

export const VitalsTrend: React.FC<VitalsTrendProps> = ({ scans, selectedHostname }) => {
  const [activeVital, setActiveVital] = useState<'lcp' | 'inp' | 'cls'>('lcp');

  // Memoize filtered scans & chart data O(N log N) -> O(1) on re-render
  const chartData = useMemo(() => {
    const isAll = !selectedHostname || selectedHostname === 'all';
    const targetHost = isAll ? '' : selectedHostname.toLowerCase();

    const matched = isAll
      ? scans.slice()
      : scans.filter((s) => (s.hostname || '').toLowerCase() === targetHost);

    // Fast chronological sort using numeric epoch
    matched.sort((a, b) => (Date.parse(a.timestamp) || 0) - (Date.parse(b.timestamp) || 0));

    return matched.map((scan, idx) => {
      const d = new Date(scan.timestamp);
      const dateLabel = `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;

      const lcpMs = scan.metrics?.largestContentfulPaint?.value;
      const lcpSec = typeof lcpMs === 'number' ? Number((lcpMs / 1000).toFixed(2)) : null;

      const inpMs = scan.metrics?.interactionToNextPaint?.value;
      const clsVal = scan.metrics?.cumulativeLayoutShift?.value;

      return {
        name: `#${idx + 1} (${dateLabel})`,
        fullDate: d.toLocaleString(),
        hostname: scan.hostname,
        device: scan.device,
        lcp: lcpSec,
        inp: typeof inpMs === 'number' ? Math.round(inpMs) : null,
        cls: typeof clsVal === 'number' ? Number(clsVal.toFixed(3)) : null,
      };
    });
  }, [scans, selectedHostname]);

  const getVitalConfig = () => {
    switch (activeVital) {
      case 'lcp':
        return {
          key: 'lcp',
          name: 'Largest Contentful Paint (LCP)',
          unit: 's',
          target: '≤ 2.5 s',
          color: '#3b82f6',
          description: 'Measures perceived loading speed. Lower values mean the main content appears faster.',
        };
      case 'inp':
        return {
          key: 'inp',
          name: 'Interaction to Next Paint (INP)',
          unit: 'ms',
          target: '≤ 200 ms',
          color: '#10b981',
          description: 'Measures page responsiveness to user clicks and taps. Lower values mean smoother interactivity.',
        };
      case 'cls':
        return {
          key: 'cls',
          name: 'Cumulative Layout Shift (CLS)',
          unit: 'score',
          target: '≤ 0.1',
          color: '#f59e0b',
          description: 'Measures visual stability. Lower scores mean content does not jump around unexpectedly.',
        };
    }
  };

  const currentConfig = getVitalConfig();

  return (
    <div className="bg-[#121215]/90 border border-zinc-800 rounded-2xl p-6 shadow-xl mb-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-zinc-800/80 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Gauge size={18} />
            </div>
            <h3 className="text-lg font-bold text-white tracking-tight">
              Core Web Vitals Trajectory
            </h3>
          </div>
          <p className="text-xs text-zinc-400 flex items-center gap-1.5">
            <span>Tracking user-centric speed & layout shifts over time.</span>
            <span className="text-emerald-400 font-semibold inline-flex items-center gap-0.5">
              <ArrowDownRight size={13} /> Lower values are better (Reduction = Faster)
            </span>
          </p>
        </div>

        {/* Vital Selector Pills */}
        <div className="flex items-center p-1 bg-zinc-900 border border-zinc-800 rounded-xl text-xs">
          <button
            type="button"
            onClick={() => setActiveVital('lcp')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeVital === 'lcp' ? 'bg-zinc-800 text-blue-400 shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            LCP (Load Speed)
          </button>
          <button
            type="button"
            onClick={() => setActiveVital('inp')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeVital === 'inp' ? 'bg-zinc-800 text-emerald-400 shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            INP (Responsiveness)
          </button>
          <button
            type="button"
            onClick={() => setActiveVital('cls')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeVital === 'cls' ? 'bg-zinc-800 text-amber-400 shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            CLS (Stability)
          </button>
        </div>
      </div>

      {/* Metric Context Info Box */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/70 border border-zinc-800 text-xs text-zinc-300 mb-6">
        <div className="flex items-center gap-2">
          <Info size={15} className="text-blue-400 shrink-0" />
          <span>{currentConfig.description}</span>
        </div>
        <span className="shrink-0 font-mono text-[11px] bg-zinc-800 px-2 py-0.5 rounded text-zinc-300">
          Target: <strong className="text-emerald-400">{currentConfig.target}</strong>
        </span>
      </div>

      {/* Chart */}
      {chartData.length < 2 ? (
        <div className="py-12 text-center text-zinc-400">
          <p className="text-sm font-semibold text-zinc-300">Insufficient Data for Web Vitals Trend</p>
          <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
            Audit this site multiple times to plot loading latency and layout shift changes.
          </p>
        </div>
      ) : (
        <div className="w-full h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="name" stroke="#71717a" fontSize={11} tickLine={false} />
              <YAxis stroke="#71717a" fontSize={11} tickLine={false} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    const val = data[currentConfig.key];
                    return (
                      <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-3 shadow-2xl text-xs space-y-1">
                        <p className="font-bold text-white">{data.hostname} ({data.device})</p>
                        <p className="text-zinc-400 text-[11px]">{data.fullDate}</p>
                        <div className="pt-2 border-t border-zinc-800">
                          <p className="font-semibold font-mono" style={{ color: currentConfig.color }}>
                            {currentConfig.name}: {val !== null ? `${val} ${currentConfig.unit}` : 'N/A'}
                          </p>
                          <p className="text-[10px] text-zinc-400 mt-0.5">
                            Google Target: {currentConfig.target}
                          </p>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Line
                type="monotone"
                dataKey={currentConfig.key}
                name={currentConfig.name}
                stroke={currentConfig.color}
                strokeWidth={2.5}
                dot={{ r: 4, fill: currentConfig.color }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};
