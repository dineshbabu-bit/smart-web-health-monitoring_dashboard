import React, { useState } from 'react';
import type { AiRecommendation } from '../../types/ai';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import {
  Wrench,
  ChevronDown,
  ChevronUp,
  FileCode,
  CheckCircle,
  HelpCircle,
  Flame,
  Info,
  Clock,
  ShieldCheck
} from 'lucide-react';

interface AiRecommendationsListProps {
  recommendations: AiRecommendation[];
  targetUrl: string;
}

export const AiRecommendationsList: React.FC<AiRecommendationsListProps> = ({
  recommendations,
  targetUrl
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(
    recommendations && recommendations.length > 0 ? recommendations[0].id : null
  );

  if (!recommendations || recommendations.length === 0) return null;

  const getPriorityBadge = (priority: AiRecommendation['priority']) => {
    switch (priority) {
      case 'Critical':
        return <Badge variant="down" className="bg-rose-950/80 text-rose-300 border border-rose-500/50">Critical</Badge>;
      case 'High':
        return <Badge variant="degraded" className="bg-amber-950/80 text-amber-300 border border-amber-500/50">High</Badge>;
      case 'Medium':
        return <Badge variant="info" className="bg-blue-950/80 text-blue-300 border border-blue-500/50">Medium</Badge>;
      default:
        return <Badge variant="default" className="bg-gray-800 text-gray-400">Low</Badge>;
    }
  };

  const getDifficultyBadge = (difficulty: AiRecommendation['difficulty']) => {
    switch (difficulty) {
      case 'Hard':
      case 'High':
        return <span className="text-xs px-2 py-0.5 rounded bg-rose-950/40 text-rose-300 border border-rose-800/40 font-medium">Difficulty: Hard</span>;
      case 'Medium':
        return <span className="text-xs px-2 py-0.5 rounded bg-amber-950/40 text-amber-300 border border-amber-800/40 font-medium">Difficulty: Medium</span>;
      case 'Easy':
      case 'Low':
      default:
        return <span className="text-xs px-2 py-0.5 rounded bg-emerald-950/40 text-emerald-300 border border-emerald-800/40 font-medium">Difficulty: Easy</span>;
    }
  };

  return (
    <Card className="p-6 md:p-8 bg-[#11131a] border-gray-800 shadow-xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
              AI-POWERED IMPROVEMENT RECOMMENDATIONS
              <Flame className="w-4 h-4 text-orange-400" />
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Evidence-based remediation steps formulated directly from {targetUrl}'s audit gaps
            </p>
          </div>
        </div>
        <div className="text-xs text-gray-400 flex items-center gap-1.5 bg-gray-900/80 px-3 py-1.5 rounded-lg border border-gray-800">
          <Info className="w-3.5 h-3.5 text-indigo-400" />
          <span>Expected benefits are estimated diagnostic projections, not verified guarantees</span>
        </div>
      </div>

      <div className="space-y-4">
        {recommendations.map((rec) => {
          const isExpanded = expandedId === rec.id;

          return (
            <div
              key={rec.id}
              className={`rounded-xl border transition duration-200 overflow-hidden ${
                isExpanded ? 'bg-gray-900/70 border-indigo-500/40 shadow-lg' : 'bg-gray-900/30 border-gray-800 hover:border-gray-700'
              }`}
            >
              {/* Header row */}
              <button
                type="button"
                onClick={() => setExpandedId(isExpanded ? null : rec.id)}
                className="w-full text-left p-4 md:p-5 flex items-start justify-between gap-4 focus:outline-none"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {getPriorityBadge(rec.priority)}
                    {getDifficultyBadge(rec.difficulty)}
                    {rec.estimatedTime && (
                      <span className="text-xs text-gray-300 flex items-center gap-1 font-mono bg-gray-800/80 px-2 py-0.5 rounded border border-gray-700">
                        <Clock className="w-3 h-3 text-indigo-400" />
                        <span>{rec.estimatedTime}</span>
                      </span>
                    )}
                    <span className="text-xs text-gray-400 font-mono">#{rec.id}</span>
                  </div>
                  <h4 className="text-base font-semibold text-white tracking-tight flex items-center gap-2">
                    {rec.problem}
                  </h4>
                  <div className="text-xs text-gray-400 flex items-center gap-1">
                    <span className="text-indigo-400 font-medium">Audit Evidence:</span>
                    <span className="truncate">{rec.evidence}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right hidden sm:block">
                    <span className="text-[11px] text-gray-400 block">Expected Impact</span>
                    <span className="text-xs font-semibold text-emerald-400">{rec.expectedBenefit}</span>
                  </div>
                  <div className="p-1 rounded bg-gray-800/80 text-gray-300">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>
              </button>

              {/* Collapsible Body */}
              {isExpanded && (
                <div className="px-5 pb-5 pt-1 border-t border-gray-800/80 space-y-4 text-sm">
                  {/* Why it matters & Solution */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                    <div className="p-3.5 rounded-lg bg-gray-950/60 border border-gray-800/80">
                      <div className="text-xs font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-1.5 mb-1.5">
                        <HelpCircle className="w-3.5 h-3.5" />
                        Why This Matters
                      </div>
                      <p className="text-xs text-gray-300 leading-relaxed">{rec.whyItMatters}</p>
                    </div>

                    <div className="p-3.5 rounded-lg bg-gray-950/60 border border-gray-800/80">
                      <div className="text-xs font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5 mb-1.5">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Recommended Solution
                      </div>
                      <p className="text-xs text-gray-300 leading-relaxed">{rec.solution}</p>
                    </div>
                  </div>

                  {/* Step-by-Step Instructions */}
                  {rec.implementationSteps && rec.implementationSteps.length > 0 && (
                    <div className="p-3.5 rounded-lg bg-gray-950/40 border border-gray-800/60">
                      <div className="text-xs font-semibold uppercase tracking-wider text-indigo-300 mb-2">
                        Step-by-Step Implementation Instructions
                      </div>
                      <ol className="space-y-1.5 text-xs text-gray-300 list-decimal list-inside pl-1">
                        {rec.implementationSteps.map((step, sIdx) => (
                          <li key={sIdx} className="leading-relaxed">
                            <span className="text-gray-200">{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {/* Code Example (if available) */}
                  {rec.codeExample && (
                    <div className="rounded-lg bg-black/60 border border-gray-800 overflow-hidden">
                      <div className="px-3.5 py-1.5 bg-gray-900/80 border-b border-gray-800 flex items-center gap-2 text-xs text-gray-400 font-mono">
                        <FileCode className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Recommended Code Pattern</span>
                      </div>
                      <pre className="p-3.5 text-xs text-emerald-300 font-mono overflow-x-auto leading-relaxed">
                        <code>{rec.codeExample}</code>
                      </pre>
                      {rec.codeExplanation && (
                        <div className="px-3.5 py-2 bg-gray-950/80 border-t border-gray-800/80 text-xs text-gray-300">
                          <span className="font-semibold text-indigo-400">Where & Why: </span>
                          {rec.codeExplanation}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Verification Method */}
                  {rec.verificationMethod && (
                    <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/20 text-xs text-emerald-300 flex items-start gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-emerald-400">Verify Fix: </strong>
                        <span>{rec.verificationMethod}</span>
                      </div>
                    </div>
                  )}

                  {/* Impact disclaimer */}
                  <div className="flex items-center justify-between text-xs text-gray-400 pt-2 border-t border-gray-800/60">
                    <span className="text-gray-400">
                      Estimated Benefit: <strong className="text-emerald-400">{rec.expectedBenefit}</strong>
                    </span>
                    <span className="text-[11px] text-gray-400">
                      Verify improvements after deployment using the Before-and-After Tracker
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
};
