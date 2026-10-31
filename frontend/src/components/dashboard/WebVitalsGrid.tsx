import React from 'react';
import { Gauge, Zap, Clock, Move, MousePointerClick, Timer, Sparkles } from 'lucide-react';
import type { MetricsMap, MetricItem } from '../../types/audit';
import { getMetricRatingBadge } from '../../utils/healthCalculator';

interface WebVitalsGridProps {
  metrics: MetricsMap;
}

interface MetricCardConfig {
  key: keyof MetricsMap;
  title: string;
  shortName: string;
  category: 'core' | 'additional';
  idealThreshold: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

const METRIC_CONFIGS: MetricCardConfig[] = [
  // Core Web Vitals
  {
    key: 'largestContentfulPaint',
    title: 'Largest Contentful Paint',
    shortName: 'LCP',
    category: 'core',
    idealThreshold: '= 2.5 s',
    icon: Gauge,
  },
  {
    key: 'interactionToNextPaint',
    title: 'Interaction to Next Paint',
    shortName: 'INP',
    category: 'core',
    idealThreshold: '= 200 ms',
    icon: MousePointerClick,
  },
  {
    key: 'cumulativeLayoutShift',
    title: 'Cumulative Layout Shift',
    shortName: 'CLS',
    category: 'core',
    idealThreshold: '= 0.1',
    icon: Move,
  },
  // Additional Performance Metrics
  {
    key: 'firstContentfulPaint',
    title: 'First Contentful Paint',
    shortName: 'FCP',
    category: 'additional',
    idealThreshold: '= 1.8 s',
    icon: Zap,
  },
  {
    key: 'totalBlockingTime',
    title: 'Total Blocking Time',
    shortName: 'TBT',
    category: 'additional',
    idealThreshold: '= 200 ms',
    icon: Clock,
  },
  {
    key: 'speedIndex',
    title: 'Speed Index',
    shortName: 'SI',
    category: 'additional',
    idealThreshold: '= 3.4 s',
    icon: Timer,
  },
  {
    key: 'timeToInteractive',
    title: 'Time to Interactive',
    shortName: 'TTI',
    category: 'additional',
    idealThreshold: '= 3.8 s',
    icon: Sparkles,
  },
];

export const WebVitalsGrid: React.FC<WebVitalsGridProps> = ({ metrics }) => {
  const safeMetrics = metrics || ({} as MetricsMap);
  const coreMetrics = METRIC_CONFIGS.filter((m) => m.category === 'core');
  const additionalMetrics = METRIC_CONFIGS.filter((m) => m.category === 'additional');

  const renderMetricCard = (config: MetricCardConfig) => {
    const metric: MetricItem | undefined = safeMetrics[config.key];
    const rating = metric?.rating || 'info';
    const ratingStyle = getMetricRatingBadge(rating);
    const Icon = config.icon;

    return (
      <div
        key={config.key}
        className="rounded-xl bg-[#121215]/90 border border-zinc-800 p-5 transition-all duration-200 hover:border-zinc-700 flex flex-col justify-between"
      >
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300">
                <Icon size={16} />
              </div>
              <div>
                <span className="text-xs font-bold text-emerald-400 font-mono block">
                  {config.shortName}
                </span>
                <h4 className="text-sm font-semibold text-white truncate max-w-[140px] md:max-w-[180px]">
                  {config.title}
                </h4>
              </div>
            </div>

            <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${ratingStyle.badgeClass}`}>
              {ratingStyle.label}
            </span>
          </div>

          <p className="text-xs text-zinc-400 mb-4 line-clamp-2">
            {metric?.description || 'Measures page loading and responsiveness.'}
          </p>
        </div>

        <div className="pt-3 border-t border-zinc-800/60 flex items-baseline justify-between">
          <div>
            <span className="text-2xl font-black text-white tracking-tight">
              {metric?.displayValue || 'N/A'}
            </span>
            <span className="text-[11px] text-zinc-400 ml-1.5 font-mono">
              ({metric?.numericUnit || 'ms'})
            </span>
          </div>

          <span className="text-[11px] text-zinc-400">
            Target: <span className="text-zinc-300 font-mono">{config.idealThreshold}</span>
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 mb-8">
      {/* Core Web Vitals Group */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span>Core Web Vitals</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Google SEO Essential
              </span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              The primary real-world user experience metrics measured by Google for search rankings.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {coreMetrics.map(renderMetricCard)}
        </div>
      </div>

      {/* Additional Performance Metrics Group */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>Additional Performance Metrics</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Diagnostic timings identifying rendering, blocking script, and interactivity bottlenecks.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {additionalMetrics.map(renderMetricCard)}
        </div>
      </div>
    </div>
  );
};
