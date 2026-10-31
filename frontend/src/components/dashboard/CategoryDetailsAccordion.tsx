import React, { useState } from 'react';
import { ShieldCheck, Eye, SearchCheck, ChevronDown, ChevronUp, CheckCircle, XCircle } from 'lucide-react';
import type { CategoryDetail } from '../../types/audit';

interface CategoryDetailsAccordionProps {
  categoryDetails: Record<string, CategoryDetail>;
}

export const CategoryDetailsAccordion: React.FC<CategoryDetailsAccordionProps> = ({
  categoryDetails = {},
}) => {
  const [openCategory, setOpenCategory] = useState<string | null>(null);

  const categories = [
    { key: 'accessibility', title: 'Accessibility Compliance', icon: Eye },
    { key: 'best-practices', title: 'Best Practices & Security', icon: ShieldCheck },
    { key: 'seo', title: 'Search Engine Optimization (SEO)', icon: SearchCheck },
  ];

  return (
    <div className="rounded-2xl bg-[#121215]/90 border border-zinc-800 p-6 md:p-8 shadow-xl mb-8">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-white tracking-tight">
          Category Audits & Detailed Diagnostics
        </h3>
        <p className="text-xs text-zinc-400 mt-0.5">
          Detailed check breakdown for Accessibility, Web Best Practices, and SEO.
        </p>
      </div>

      <div className="space-y-3">
        {categories.map((cat) => {
          const detail = categoryDetails[cat.key];
          if (!detail) return null;

          const isOpen = openCategory === cat.key;
          const Icon = cat.icon;
          const issues = detail.criticalIssues || [];

          return (
            <div
              key={cat.key}
              className="rounded-xl bg-zinc-900/60 border border-zinc-800/80 overflow-hidden transition-all duration-200"
            >
              <button
                type="button"
                onClick={() => setOpenCategory(isOpen ? null : cat.key)}
                className="w-full px-5 py-4 flex items-center justify-between gap-4 text-left cursor-pointer hover:bg-zinc-800/30"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-zinc-800 text-zinc-300">
                    <Icon size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">{detail.title || cat.title}</h4>
                    <div className="flex items-center gap-3 text-[11px] text-zinc-400 mt-0.5">
                      <span className="text-emerald-400 font-medium">
                        {detail.stats?.passed ?? 0} Passed
                      </span>
                      <span>•</span>
                      <span className={issues.length > 0 ? 'text-rose-400 font-medium' : 'text-zinc-500'}>
                        {detail.stats?.failed ?? 0} Failed
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-white">
                    {detail.score !== null ? `${detail.score}%` : 'N/A'}
                  </span>
                  <div className="p-1 rounded-lg bg-zinc-800 text-zinc-400">
                    {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </div>
              </button>

              {isOpen && (
                <div className="px-5 pb-5 pt-2 border-t border-zinc-800/60 bg-zinc-950/40 text-xs">
                  {issues.length === 0 ? (
                    <div className="py-4 text-center text-emerald-400 flex items-center justify-center gap-2 font-medium">
                      <CheckCircle size={16} />
                      <span>All evaluated checks in this category passed successfully!</span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <span className="font-semibold text-zinc-400 uppercase text-[10px] tracking-wider block mb-2">
                        Failing / Incomplete Audits
                      </span>
                      {issues.map((issue) => (
                        <div
                          key={issue.id}
                          className="p-3 rounded-lg bg-zinc-900 border border-zinc-800/80 flex items-start gap-2.5"
                        >
                          <XCircle size={15} className="text-rose-400 shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <h5 className="font-semibold text-white text-xs">{issue.title}</h5>
                            <p className="text-zinc-400 text-[11px] mt-0.5 leading-relaxed">
                              {(issue.description || '').replace(/\[Learn more\]\(.*?\)\.?/i, '').trim()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
