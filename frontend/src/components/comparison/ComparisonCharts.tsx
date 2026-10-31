import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { BarChart3, Gauge } from 'lucide-react';
import type { ComparisonResult } from '../../types/comparison';
import { extractHostname } from '../../services/scanHistoryService';

interface ComparisonChartsProps {
  comparison: ComparisonResult;
}

export const ComparisonCharts: React.FC<ComparisonChartsProps> = ({ comparison }) => {
  const { hostA, hostB, categoryData, timingsData } = useMemo(() => {
    const rawHostA = extractHostname(comparison.siteA?.url);
    const rawHostB = extractHostname(comparison.siteB?.url);
    const isSameHost = rawHostA.toLowerCase() === rawHostB.toLowerCase();
    const hA = isSameHost ? `${rawHostA} (${comparison.siteA.device})` : rawHostA;
    const hB = isSameHost ? `${rawHostB} (${comparison.siteB.device}${comparison.siteA.device === comparison.siteB.device ? ' #2' : ''})` : rawHostB;

    const scoresA = comparison.siteA?.auditData?.scores || {};
    const scoresB = comparison.siteB?.auditData?.scores || {};
    const metricsA = comparison.siteA?.auditData?.metrics || {};
    const metricsB = comparison.siteB?.auditData?.metrics || {};

    const catData = [
      {
        category: 'Overall Health',
        [hA]: comparison.siteA.healthScore,
        [hB]: comparison.siteB.healthScore,
      },
      {
        category: 'Performance',
        [hA]: scoresA.performance ?? 0,
        [hB]: scoresB.performance ?? 0,
      },
      {
        category: 'Accessibility',
        [hA]: scoresA.accessibility ?? 0,
        [hB]: scoresB.accessibility ?? 0,
      },
      {
        category: 'Best Practices',
        [hA]: scoresA.bestPractices ?? 0,
        [hB]: scoresB.bestPractices ?? 0,
      },
      {
        category: 'SEO',
        [hA]: scoresA.seo ?? 0,
        [hB]: scoresB.seo ?? 0,
      },
    ];

    const lcpA = metricsA.largestContentfulPaint?.value ? Number((metricsA.largestContentfulPaint.value / 1000).toFixed(2)) : 0;
    const lcpB = metricsB.largestContentfulPaint?.value ? Number((metricsB.largestContentfulPaint.value / 1000).toFixed(2)) : 0;
    const fcpA = metricsA.firstContentfulPaint?.value ? Number((metricsA.firstContentfulPaint.value / 1000).toFixed(2)) : 0;
    const fcpB = metricsB.firstContentfulPaint?.value ? Number((metricsB.firstContentfulPaint.value / 1000).toFixed(2)) : 0;
    const siA = metricsA.speedIndex?.value ? Number((metricsA.speedIndex.value / 1000).toFixed(2)) : 0;
    const siB = metricsB.speedIndex?.value ? Number((metricsB.speedIndex.value / 1000).toFixed(2)) : 0;
    const tbtA = metricsA.totalBlockingTime?.value ? Math.round(metricsA.totalBlockingTime.value) : 0;
    const tbtB = metricsB.totalBlockingTime?.value ? Math.round(metricsB.totalBlockingTime.value) : 0;

    const timData = [
      {
        metric: 'LCP (s)',
        [hA]: lcpA,
        [hB]: lcpB,
      },
      {
        metric: 'FCP (s)',
        [hA]: fcpA,
        [hB]: fcpB,
      },
      {
        metric: 'Speed Index (s)',
        [hA]: siA,
        [hB]: siB,
      },
      {
        metric: 'TBT (ms)',
        [hA]: tbtA,
        [hB]: tbtB,
      },
    ];

    return { hostA: hA, hostB: hB, categoryData: catData, timingsData: timData };
  }, [comparison]);


  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* 1. Category Score Benchmark Chart */}
      <div className="bg-[#121215]/90 border border-zinc-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <BarChart3 size={16} />
            </div>
            <h3 className="text-base font-bold text-white">
              Lighthouse Scores Comparison
            </h3>
          </div>
          <p className="text-xs text-zinc-400">
            Higher score is better (0–100 scale across all evaluated categories).
          </p>
        </div>

        <div className="w-full h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="category" stroke="#71717a" fontSize={10} tickLine={false} />
              <YAxis domain={[0, 100]} stroke="#71717a" fontSize={11} tickLine={false} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-3 shadow-xl text-xs space-y-1">
                        <p className="font-bold text-white">{data.category}</p>
                        <p className="text-emerald-400 font-mono font-semibold">
                          [A] {hostA}: {data[hostA]}
                        </p>
                        <p className="text-blue-400 font-mono font-semibold">
                          [B] {hostB}: {data[hostB]}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              <Bar dataKey={hostA} name={`[A] ${hostA}`} fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey={hostB} name={`[B] ${hostB}`} fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Key Render Timings Comparison Chart */}
      <div className="bg-[#121215]/90 border border-zinc-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Gauge size={16} />
            </div>
            <h3 className="text-base font-bold text-white">
              Critical Loading Timings (Seconds)
            </h3>
          </div>
          <p className="text-xs text-zinc-400">
            Lower duration represents faster rendering and quicker page loads.
          </p>
        </div>

        <div className="w-full h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={timingsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="metric" stroke="#71717a" fontSize={11} tickLine={false} />
              <YAxis stroke="#71717a" fontSize={11} tickLine={false} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-3 shadow-xl text-xs space-y-1">
                        <p className="font-bold text-white">{data.metric}</p>
                        <p className="text-emerald-400 font-mono font-semibold">
                          [A] {hostA}: {data[hostA]} s
                        </p>
                        <p className="text-blue-400 font-mono font-semibold">
                          [B] {hostB}: {data[hostB]} s
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              <Bar dataKey={hostA} name={`[A] ${hostA}`} fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey={hostB} name={`[B] ${hostB}`} fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
