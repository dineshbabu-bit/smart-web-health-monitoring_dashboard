import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import { BarChart3, Radar as RadarIcon } from 'lucide-react';
import type { CategoryScores, MetricsMap } from '../../types/audit';

interface AuditChartsProps {
  scores: CategoryScores;
  metrics: MetricsMap;
}

export const AuditCharts: React.FC<AuditChartsProps> = ({ scores, metrics }) => {
  const [chartType, setChartType] = useState<'radar' | 'bar'>('radar');

  // Memoize Category Scores Data O(1)
  const categoryData = useMemo(() => {
    const s = scores || ({} as CategoryScores);
    return [
      { subject: 'Performance', score: s.performance ?? 0, fullMark: 100, fill: '#10b981' },
      { subject: 'Accessibility', score: s.accessibility ?? 0, fullMark: 100, fill: '#3b82f6' },
      { subject: 'Best Practices', score: s.bestPractices ?? 0, fullMark: 100, fill: '#8b5cf6' },
      { subject: 'SEO', score: s.seo ?? 0, fullMark: 100, fill: '#f59e0b' },
    ];
  }, [scores]);

  // Memoize Key Metrics Data O(1)
  const vitalsData = useMemo(() => {
    const m = metrics || ({} as MetricsMap);
    return [
      {
        name: 'FCP (s)',
        val: m.firstContentfulPaint?.value ? Number((m.firstContentfulPaint.value / 1000).toFixed(2)) : 0,
        threshold: 1.8,
        rating: m.firstContentfulPaint?.rating || 'info',
      },
      {
        name: 'LCP (s)',
        val: m.largestContentfulPaint?.value ? Number((m.largestContentfulPaint.value / 1000).toFixed(2)) : 0,
        threshold: 2.5,
        rating: m.largestContentfulPaint?.rating || 'info',
      },
      {
        name: 'TBT (ms)',
        val: m.totalBlockingTime?.value ? Math.round(m.totalBlockingTime.value) : 0,
        threshold: 200,
        rating: m.totalBlockingTime?.rating || 'info',
      },
      {
        name: 'Speed Index (s)',
        val: m.speedIndex?.value ? Number((m.speedIndex.value / 1000).toFixed(2)) : 0,
        threshold: 3.4,
        rating: m.speedIndex?.rating || 'info',
      },
    ];
  }, [metrics]);

  const getMetricColor = (rating: string) => {
    if (rating === 'good') return '#10b981';
    if (rating === 'needs-improvement') return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* 1. Category Score Distribution Chart */}
      <div className="rounded-2xl bg-[#121215]/90 border border-zinc-800 p-6 flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>Lighthouse Category Balance</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Multi-dimensional profile across all 4 Lighthouse pillars.
            </p>
          </div>

          <div className="flex items-center p-1 bg-zinc-900 border border-zinc-800 rounded-lg">
            <button
              type="button"
              onClick={() => setChartType('radar')}
              className={`p-1.5 rounded text-xs transition-colors ${
                chartType === 'radar' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Radar Chart"
            >
              <RadarIcon size={16} />
            </button>
            <button
              type="button"
              onClick={() => setChartType('bar')}
              className={`p-1.5 rounded text-xs transition-colors ${
                chartType === 'bar' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Bar Chart"
            >
              <BarChart3 size={16} />
            </button>
          </div>
        </div>

        <div className="w-full h-64 flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'radar' ? (
              <RadarChart data={categoryData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
                <PolarGrid stroke="#27272a" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#a1a1aa', fontSize: 12 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#71717a', fontSize: 10 }} />
                <Radar
                  name="Score"
                  dataKey="score"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.4}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-2.5 shadow-xl text-xs">
                          <p className="font-semibold text-white">{data.subject}</p>
                          <p className="text-emerald-400 font-mono font-bold">{data.score} / 100</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </RadarChart>
            ) : (
              <BarChart data={categoryData} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
                <XAxis dataKey="subject" stroke="#71717a" fontSize={11} tickLine={false} />
                <YAxis stroke="#71717a" domain={[0, 100]} fontSize={11} tickLine={false} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-2.5 shadow-xl text-xs">
                          <p className="font-semibold text-white">{data.subject}</p>
                          <p className="text-emerald-400 font-mono font-bold">{data.score} / 100</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Core Timings & Metrics Chart */}
      <div className="rounded-2xl bg-[#121215]/90 border border-zinc-800 p-6 flex flex-col justify-between">
        <div className="mb-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <span>Critical Render Timings</span>
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Key loading & blocking duration metrics vs Google targets.
          </p>
        </div>

        <div className="w-full h-64 flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={vitalsData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
              <XAxis type="number" stroke="#71717a" fontSize={11} tickLine={false} />
              <YAxis dataKey="name" type="category" stroke="#a1a1aa" fontSize={11} tickLine={false} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-2.5 shadow-xl text-xs">
                        <p className="font-semibold text-white">{data.name}</p>
                        <p className="font-mono font-bold" style={{ color: getMetricColor(data.rating) }}>
                          Value: {data.val}
                        </p>
                        <p className="text-zinc-400 text-[11px]">Google Target: &le; {data.threshold}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="val" radius={[0, 6, 6, 0]}>
                {vitalsData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getMetricColor(entry.rating)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
