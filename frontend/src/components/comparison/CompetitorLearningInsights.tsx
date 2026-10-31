import React from 'react';
import type { CompetitorLearningInsight } from '../../types/ai';
import { Card } from '../ui/Card';
import { Lightbulb, CheckCircle2, TrendingUp, Sparkles } from 'lucide-react';

interface CompetitorLearningInsightsProps {
  insights: CompetitorLearningInsight[];
  strongerUrl: string;
  isTie?: boolean;
}

export const CompetitorLearningInsights: React.FC<CompetitorLearningInsightsProps> = ({
  insights,
  strongerUrl,
  isTie = false
}) => {
  if (!insights || insights.length === 0) return null;

  return (
    <Card className="p-6 md:p-8 bg-[#11131a] border-gray-800 shadow-xl">
      <div className="flex items-center gap-3 pb-5 border-b border-gray-800">
        <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
          <Lightbulb className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
            WHAT CAN WE LEARN FROM THE BETTER WEBSITE?
            <Sparkles className="w-4 h-4 text-amber-400" />
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            {isTie
              ? 'Benchmarking strengths across both websites derived directly from measured Lighthouse metrics'
              : `Concrete engineering takeaways observed from ${strongerUrl}'s measured performance and best practices`}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        {insights.map((item, idx) => (
          <div
            key={idx}
            className="p-4 rounded-xl bg-gray-900/40 border border-gray-800/80 hover:border-gray-700 transition flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-950/60 text-indigo-300 border border-indigo-800/50">
                  {item.area}
                </span>
                <span className="text-xs text-gray-400 font-mono text-[11px] truncate max-w-[150px]">
                  {item.metricComparison}
                </span>
              </div>

              <div className="mt-2 text-xs text-emerald-400 font-medium flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>{item.whatBetterSiteDoes}</span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-800/80 text-xs text-gray-300 flex items-start gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-gray-400 font-medium">Takeaway: </span>
                {item.actionableTakeaway}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

