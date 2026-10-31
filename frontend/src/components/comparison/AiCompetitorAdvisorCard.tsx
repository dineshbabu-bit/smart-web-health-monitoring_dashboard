import React from 'react';
import type { AiVerdict, AiComparisonMeta } from '../../types/ai';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Sparkles, Trophy, ArrowRight, AlertTriangle, Scale, Bot, Cpu } from 'lucide-react';

interface AiCompetitorAdvisorCardProps {
  verdict: AiVerdict;
  meta: AiComparisonMeta;
}

export const AiCompetitorAdvisorCard: React.FC<AiCompetitorAdvisorCardProps> = ({ verdict, meta }) => {
  const isTie = verdict.isTie || verdict.winner === 'tie';

  return (
    <Card className="p-6 md:p-8 bg-gradient-to-br from-[#13151f] via-[#10121a] to-[#0c0d14] border-indigo-500/30 shadow-2xl relative overflow-hidden">
      {/* Decorative ambient glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

      {/* Top Header Badge Row */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-gray-800/80">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                AI-POWERED COMPETITOR IMPROVEMENT ADVISOR
              </h2>
            </div>
            <p className="text-sm text-gray-400 mt-0.5">
              Deep gap analysis, metric differentiators, and prioritized action plan
            </p>
          </div>
        </div>

        {/* AI Provider Badge */}
        <div className="flex items-center gap-2">
          {meta.provider === 'gemini' ? (
            <Badge variant="default" className="bg-indigo-950/80 text-indigo-300 border border-indigo-500/40 px-3 py-1 flex items-center gap-1.5 shadow-sm">
              <Bot className="w-3.5 h-3.5 text-indigo-400" />
              <span>Gemini 2.5 Flash</span>
            </Badge>
          ) : (
            <Badge variant="default" className="bg-amber-950/50 text-amber-300 border border-amber-500/40 px-3 py-1 flex items-center gap-1.5 shadow-sm" title={meta.fallbackReason || 'Deterministic Rules Engine'}>
              <Cpu className="w-3.5 h-3.5 text-amber-400" />
              <span>Deterministic Expert Engine</span>
            </Badge>
          )}
          {meta.cached && (
            <Badge variant="default" className="bg-gray-800/60 text-gray-400 border border-gray-700 text-xs">
              Cached
            </Badge>
          )}
        </div>
      </div>

      {/* Primary Verdict Banner */}
      <div className="relative z-10 mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Stronger Site Card */}
        <div className={`p-5 rounded-xl border ${isTie ? 'bg-gray-900/60 border-gray-700/60' : 'bg-emerald-950/20 border-emerald-500/30'}`}>
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider mb-2">
            <span className={isTie ? 'text-gray-400' : 'text-emerald-400 flex items-center gap-1.5'}>
              {isTie ? <Scale className="w-4 h-4 text-gray-400" /> : <Trophy className="w-4 h-4 text-emerald-400" />}
              {isTie ? 'Balanced Baseline' : 'Stronger Website'}
            </span>
            <span className="text-2xl font-black text-white">{verdict.strongerHealthScore}</span>
          </div>
          <p className="text-sm font-semibold text-gray-200 truncate" title={verdict.strongerUrl}>
            {verdict.strongerUrl}
          </p>
          <div className="mt-2 text-xs text-gray-400">
            Overall Health Score ({verdict.strongerHealthScore}/100)
          </div>
        </div>

        {/* Gap Differential Indicator */}
        <div className="p-5 rounded-xl bg-gray-900/40 border border-gray-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
            <span>Score Differential</span>
            <span className="text-xs font-normal text-indigo-400">
              {isTie ? '0 points' : `+${verdict.scoreDifference} gap`}
            </span>
          </div>
          <div className="my-auto flex items-center justify-center gap-3">
            <span className="text-3xl font-black text-indigo-400 tracking-tight">
              {verdict.scoreDifference}
            </span>
            <span className="text-xs text-gray-400 leading-tight">
              points difference<br />overall
            </span>
          </div>
          <div className="text-xs text-center text-gray-400 mt-2">
            {isTie ? 'Both websites scored equally' : `${verdict.scoreDifference} pts to close the competitor gap`}
          </div>
        </div>

        {/* Weaker / Target Site Card */}
        <div className={`p-5 rounded-xl border ${isTie ? 'bg-gray-900/60 border-gray-700/60' : 'bg-rose-950/20 border-rose-500/30'}`}>
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider mb-2">
            <span className={isTie ? 'text-gray-400' : 'text-rose-400 flex items-center gap-1.5'}>
              {isTie ? <Scale className="w-4 h-4 text-gray-400" /> : <AlertTriangle className="w-4 h-4 text-rose-400" />}
              {isTie ? 'Benchmark Target' : 'Requires Improvement'}
            </span>
            <span className="text-2xl font-black text-white">{verdict.weakerHealthScore}</span>
          </div>
          <p className="text-sm font-semibold text-gray-200 truncate" title={verdict.weakerUrl}>
            {verdict.weakerUrl}
          </p>
          <div className="mt-2 text-xs text-rose-300/80 font-medium flex items-center gap-1">
            <span>Weakest:</span>
            <span className="font-bold underline">{verdict.weakestCategory}</span>
            <span>({verdict.weakestCategoryScore}/100)</span>
          </div>
        </div>
      </div>

      {/* Summary Narrative */}
      <div className="relative z-10 mt-5 p-4 rounded-xl bg-gray-900/50 border border-gray-800 text-sm text-gray-300 leading-relaxed flex items-start gap-3">
        <ArrowRight className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-white">Advisor Assessment: </span>
          {verdict.summary}
        </div>
      </div>

      {/* Top Problems & Simple Solutions on Weaker Site */}
      {verdict.topProblems && verdict.topProblems.length > 0 && (
        <div className="relative z-10 mt-5 pt-5 border-t border-gray-800/80">
          <div className="text-xs font-semibold uppercase tracking-wider text-rose-400 mb-3 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <span>Top {verdict.topProblems.length} Problems on Weaker Website & Simple Solutions</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {verdict.topProblems.map((tp, idx) => (
              <div key={idx} className="p-3.5 rounded-lg bg-gray-900/60 border border-gray-800 flex flex-col justify-between">
                <div>
                  <div className="text-xs font-bold text-rose-300 mb-1 flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-rose-500/20 text-rose-400 text-[10px] flex items-center justify-center font-mono">
                      {idx + 1}
                    </span>
                    <span>Problem</span>
                  </div>
                  <p className="text-xs text-gray-200 font-medium leading-snug mb-2">
                    {tp.problem}
                  </p>
                </div>
                <div className="pt-2 border-t border-gray-800/60">
                  <div className="text-[11px] font-semibold text-emerald-400 mb-0.5">Simple Solution:</div>
                  <p className="text-xs text-gray-300 leading-snug">
                    {tp.solution}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};
