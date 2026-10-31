import React from 'react';
import { Lightbulb, ShieldCheck, Zap, Gauge, SearchCheck } from 'lucide-react';
import type { ComparisonInsight } from '../../types/comparison';

interface ComparisonInsightsProps {
  insights: ComparisonInsight[];
}

export const ComparisonInsights: React.FC<ComparisonInsightsProps> = ({ insights }) => {
  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'performance':
        return <Zap size={16} className="text-emerald-400" />;
      case 'accessibility':
        return <ShieldCheck size={16} className="text-purple-400" />;
      case 'core web vitals':
      case 'visual stability':
        return <Gauge size={16} className="text-blue-400" />;
      case 'seo':
        return <SearchCheck size={16} className="text-amber-400" />;
      default:
        return <Lightbulb size={16} className="text-emerald-400" />;
    }
  };

  return (
    <div className="bg-[#121215]/90 border border-zinc-800 rounded-2xl p-6 shadow-xl mb-8">
      <div className="flex items-center gap-2 mb-1 pb-4 border-b border-zinc-800/80">
        <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <Lightbulb size={18} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white tracking-tight">
            Automated Comparison Insights
          </h3>
          <p className="text-xs text-zinc-400">
            Key analytical takeaways and competitive advantages identified across both websites.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
        {insights.map((ins) => (
          <div
            key={ins.id}
            className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex items-start gap-3 hover:border-zinc-700 transition-colors"
          >
            <div className="p-2 rounded-lg bg-zinc-800 shrink-0 mt-0.5">
              {getCategoryIcon(ins.category)}
            </div>

            <div className="flex-1">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  {ins.category}
                </span>
                {ins.winner !== 'tie' && (
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      ins.winner === 'A'
                        ? 'bg-emerald-500/15 text-emerald-400'
                        : 'bg-blue-500/15 text-blue-400'
                    }`}
                  >
                    Site {ins.winner} Advantage
                  </span>
                )}
              </div>

              <p className="text-xs text-zinc-200 leading-relaxed font-medium">
                {ins.text}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
