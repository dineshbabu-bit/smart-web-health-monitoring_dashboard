import React, { useState } from 'react';
import { Lightbulb, Zap, HardDrive, Clock, CheckCircle2, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import type { OpportunityItem, DiagnosticItem } from '../../types/audit';
import { formatBytes, formatMs } from '../../utils/healthCalculator';

interface SmartRecommendationsProps {
  opportunities: OpportunityItem[];
  diagnostics: DiagnosticItem[];
}

export const SmartRecommendations: React.FC<SmartRecommendationsProps> = ({
  opportunities = [],
  diagnostics = [],
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'opportunities' | 'diagnostics'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Generate actionable suggested steps based on audit ID
  const getSuggestedAction = (id: string, title: string): string => {
    const map: Record<string, string> = {
      'render-blocking-resources': 'Defer non-critical CSS/JS using `defer` or `async` tags, and inline critical above-the-fold CSS.',
      'unused-css-rules': 'Remove unused CSS rules or split CSS bundles using Tailwind Purge / PostCSS.',
      'unused-javascript': 'Implement code-splitting and dynamic imports (`import()`) to load JavaScript on demand.',
      'modern-image-formats': 'Convert PNG/JPEG assets into modern formats like WebP or AVIF for 30-70% size reduction.',
      'uses-optimized-images': 'Compress and resize oversized images to match their rendered display dimensions.',
      'uses-text-compression': 'Enable Gzip or Brotli compression on your web server (Nginx/Apache/Cloudflare).',
      'uses-responsive-images': 'Serve responsive images using `srcset` and `<picture>` elements for different device viewports.',
      'unminified-css': 'Minify stylesheets during your build step (e.g. cssnano, Vite).',
      'unminified-javascript': 'Minify and uglify JavaScript bundles during production build.',
      'server-response-time': 'Optimize backend database queries, implement Redis caching, or utilize a CDN.',
      'redirects': 'Eliminate multiple HTTP redirect hops leading to the final destination URL.',
      'dom-size': 'Reduce excessive DOM nodes (keep total elements < 800 and depth < 32).',
      'uses-long-cache-ttl': 'Set `Cache-Control: max-age=31536000, immutable` for static immutable assets.',
      'font-display': 'Use `font-display: swap` in `@font-face` rules to allow text rendering before web fonts load.',
    };

    return map[id] || `Review and optimize ${(title || 'this item').toLowerCase()} according to web performance guidelines.`;
  };

  const getImpactBadge = (item: OpportunityItem | DiagnosticItem) => {
    const opp = item as OpportunityItem;
    if (opp.savingsMs && opp.savingsMs > 500) {
      return {
        label: 'High Impact',
        className: 'bg-rose-500/15 text-rose-400 border border-rose-500/30',
        icon: AlertTriangle,
      };
    }
    if (opp.savingsMs && opp.savingsMs > 100) {
      return {
        label: 'Medium Impact',
        className: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
        icon: Zap,
      };
    }
    if (opp.savingsBytes && opp.savingsBytes > 50000) {
      return {
        label: 'Data Savings',
        className: 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
        icon: HardDrive,
      };
    }
    return {
      label: 'Diagnostic',
      className: 'bg-zinc-800 text-zinc-400 border border-zinc-700',
      icon: Clock,
    };
  };

  const allItems = [
    ...opportunities.map((opp) => ({ ...opp, type: 'opportunity' as const })),
    ...diagnostics.map((diag) => ({ ...diag, type: 'diagnostic' as const, savingsMs: null, savingsBytes: null })),
  ];

  const filteredItems = allItems.filter((item) => {
    if (activeFilter === 'opportunities') return item.type === 'opportunity';
    if (activeFilter === 'diagnostics') return item.type === 'diagnostic';
    return true;
  });

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="rounded-2xl bg-[#121215]/90 border border-zinc-800 p-6 md:p-8 shadow-xl mb-8">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800/80 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Lightbulb size={18} />
            </div>
            <h3 className="text-xl font-bold text-white tracking-tight">
              Smart Performance Recommendations
            </h3>
          </div>
          <p className="text-xs text-zinc-400">
            Actionable Lighthouse optimization opportunities sorted by highest potential performance gain.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-zinc-900 border border-zinc-800 rounded-xl text-xs self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeFilter === 'all'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            All ({allItems.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('opportunities')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeFilter === 'opportunities'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Opportunities ({opportunities.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('diagnostics')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeFilter === 'diagnostics'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Diagnostics ({diagnostics.length})
          </button>
        </div>
      </div>

      {/* Recommendations List */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-12 text-zinc-400">
          <CheckCircle2 size={40} className="mx-auto text-emerald-400 mb-3 opacity-80" />
          <h4 className="text-base font-semibold text-white">Outstanding Performance!</h4>
          <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
            No critical optimization opportunities were found. Your website is adhering to modern performance best practices.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item) => {
            const isExpanded = expandedId === item.id;
            const badge = getImpactBadge(item);
            const BadgeIcon = badge.icon;
            const suggestedAction = getSuggestedAction(item.id, item.title);

            return (
              <div
                key={item.id}
                className="rounded-xl bg-zinc-900/70 border border-zinc-800/80 overflow-hidden transition-all duration-200 hover:border-zinc-700"
              >
                {/* Header row */}
                <button
                  type="button"
                  onClick={() => toggleExpand(item.id)}
                  className="w-full text-left px-5 py-4 flex items-center justify-between gap-4 cursor-pointer"
                >
                  <div className="flex-1 flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${badge.className}`}
                      >
                        <BadgeIcon size={12} />
                        {badge.label}
                      </span>
                    </div>

                    <h4 className="text-sm font-semibold text-white leading-snug">
                      {item.title}
                    </h4>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {item.displayValue && (
                      <span className="text-xs font-mono font-medium text-amber-400 hidden sm:inline-block">
                        {item.displayValue}
                      </span>
                    )}

                    <div className="p-1 rounded-lg bg-zinc-800 text-zinc-400">
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </div>
                </button>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-1 border-t border-zinc-800/60 bg-zinc-950/40 space-y-3 text-xs">
                    {/* Description */}
                    <div>
                      <span className="font-semibold text-zinc-400 uppercase text-[10px] tracking-wider block mb-1">
                        Issue Description
                      </span>
                      <p className="text-zinc-300 leading-relaxed">
                        {(item.description || '').replace(/\[Learn more\]\(.*?\)\.?/i, '').trim()}
                      </p>
                    </div>

                    {/* Impact / Savings details */}
                    {(item.savingsMs || item.savingsBytes) && (
                      <div className="flex flex-wrap gap-4 p-3 rounded-lg bg-zinc-900 border border-zinc-800">
                        {item.savingsMs && (
                          <div className="flex items-center gap-1.5 text-zinc-300">
                            <Clock size={14} className="text-amber-400" />
                            <span>Estimated Time Saved:</span>
                            <strong className="text-white font-mono">{formatMs(item.savingsMs)}</strong>
                          </div>
                        )}
                        {item.savingsBytes && (
                          <div className="flex items-center gap-1.5 text-zinc-300">
                            <HardDrive size={14} className="text-blue-400" />
                            <span>Estimated Size Reduced:</span>
                            <strong className="text-white font-mono">{formatBytes(item.savingsBytes)}</strong>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Suggested Action */}
                    <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                      <div className="flex items-center gap-1.5 text-emerald-400 font-semibold mb-1 text-[11px] uppercase tracking-wide">
                        <CheckCircle2 size={14} />
                        <span>Suggested Action</span>
                      </div>
                      <p className="text-zinc-200 leading-relaxed font-medium">
                        {suggestedAction}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
