import React from 'react';
import { Zap, Eye, ShieldCheck, SearchCheck, CheckCircle, AlertCircle } from 'lucide-react';
import type { CategoryScores, CategoryDetail } from '../../types/audit';
import { getScoreColor } from '../../utils/healthCalculator';

interface CategoryScoreGridProps {
  scores: CategoryScores;
  categoryDetails?: Record<string, CategoryDetail>;
}

interface CategoryConfig {
  key: keyof CategoryScores;
  detailKey: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

const CATEGORIES: CategoryConfig[] = [
  {
    key: 'performance',
    detailKey: 'performance',
    title: 'Performance',
    description: 'Load speed, Core Web Vitals, responsiveness & visual stability.',
    icon: Zap,
  },
  {
    key: 'accessibility',
    detailKey: 'accessibility',
    title: 'Accessibility',
    description: 'WCAG compliance, screen reader usability, color contrast & ARIA roles.',
    icon: Eye,
  },
  {
    key: 'bestPractices',
    detailKey: 'best-practices',
    title: 'Best Practices',
    description: 'Modern web standards, HTTPS security, console errors & resource hygiene.',
    icon: ShieldCheck,
  },
  {
    key: 'seo',
    detailKey: 'seo',
    title: 'SEO',
    description: 'Search engine discoverability, meta tags, structured data & mobile readiness.',
    icon: SearchCheck,
  },
];

export const CategoryScoreGrid: React.FC<CategoryScoreGridProps> = ({ scores, categoryDetails = {} }) => {
  const safeScores = scores || ({} as CategoryScores);
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
      {CATEGORIES.map((cat) => {
        const score = safeScores[cat.key];
        const color = getScoreColor(score);
        const Icon = cat.icon;
        const details = categoryDetails[cat.detailKey];
        const stats = details?.stats;

        return (
          <div
            key={cat.key}
            className="relative overflow-hidden rounded-2xl bg-[#121215]/90 border border-zinc-800 p-5 md:p-6 transition-all duration-300 hover:border-zinc-700 hover:shadow-xl hover:shadow-black/40 flex flex-col justify-between"
          >
            {/* Top row */}
            <div>
              <div className="flex items-center justify-between gap-2 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300">
                    <Icon size={18} />
                  </div>
                  <h3 className="font-semibold text-white text-base">{cat.title}</h3>
                </div>

                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${color.bg} ${color.text} border ${color.border}`}
                >
                  {color.rating}
                </span>
              </div>

              <p className="text-xs text-zinc-400 mb-5 min-h-[32px] leading-relaxed">
                {cat.description}
              </p>
            </div>

            {/* Score & Progress */}
            <div>
              <div className="flex items-baseline justify-between mb-2">
                <div className="flex items-baseline gap-1">
                  <span className={`text-3xl font-extrabold ${color.text}`}>
                    {score !== null && score !== undefined ? score : 'N/A'}
                  </span>
                  <span className="text-xs text-zinc-400 font-medium">/ 100</span>
                </div>

                {stats && (
                  <div className="flex items-center gap-2 text-[11px] text-zinc-400">
                    <span className="flex items-center gap-0.5 text-emerald-400">
                      <CheckCircle size={11} /> {stats.passed}
                    </span>
                    <span className="flex items-center gap-0.5 text-rose-400">
                      <AlertCircle size={11} /> {stats.failed}
                    </span>
                  </div>
                )}
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-1000 ease-out"
                  style={{
                    width: `${Math.min(Math.max(score || 0, 0), 100)}%`,
                    backgroundColor: color.hex,
                  }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
