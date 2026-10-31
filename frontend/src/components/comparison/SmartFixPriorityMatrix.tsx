import React, { useState } from 'react';
import type { AiPriorityMatrixItem } from '../../types/ai';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { ChevronDown, ChevronUp, Layers, Code } from 'lucide-react';

interface SmartFixPriorityMatrixProps {
  items: AiPriorityMatrixItem[];
}

export const SmartFixPriorityMatrix: React.FC<SmartFixPriorityMatrixProps> = ({ items }) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  if (!items || items.length === 0) return null;

  const renderPriorityBadge = (priority: AiPriorityMatrixItem['priority']) => {
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

  const renderDifficultyBadge = (difficulty: AiPriorityMatrixItem['difficulty']) => {
    switch (difficulty) {
      case 'High':
        return <span className="text-xs px-2 py-0.5 rounded bg-rose-950/40 text-rose-300 border border-rose-800/40">High</span>;
      case 'Medium':
        return <span className="text-xs px-2 py-0.5 rounded bg-amber-950/40 text-amber-300 border border-amber-800/40">Medium</span>;
      default:
        return <span className="text-xs px-2 py-0.5 rounded bg-emerald-950/40 text-emerald-300 border border-emerald-800/40">Low</span>;
    }
  };

  const renderBenefitBadge = (benefit: string) => {
    const isHigh = benefit.toLowerCase().includes('high') || benefit.toLowerCase().includes('significant');
    return (
      <span className={`text-xs px-2 py-0.5 rounded font-medium ${
        isHigh
          ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/40'
          : 'bg-blue-950/40 text-blue-300 border border-blue-800/40'
      }`}>
        {benefit}
      </span>
    );
  };

  return (
    <Card className="p-6 md:p-8 bg-[#11131a] border-gray-800 shadow-xl space-y-5">
      <div className="flex items-center gap-3 pb-5 border-b border-gray-800">
        <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
          <Layers className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
            SMART FIX PRIORITY MATRIX
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Ranked triage matrix balancing implementation difficulty against projected user experience benefits
          </p>
        </div>
      </div>

      {/* Responsive Matrix Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-800">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="bg-gray-900/80 text-gray-400 text-xs font-semibold uppercase tracking-wider border-b border-gray-800">
              <th className="py-3 px-4 w-28">Priority</th>
              <th className="py-3 px-4">Detected Issue</th>
              <th className="py-3 px-4">Recommended Fix</th>
              <th className="py-3 px-4 w-24">Difficulty</th>
              <th className="py-3 px-4 w-32">Expected Benefit</th>
              <th className="py-3 px-4 w-16 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/60">
            {items.map((row, idx) => {
              const isExpanded = expandedIndex === idx;

              return (
                <React.Fragment key={idx}>
                  <tr
                    onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                    className="hover:bg-gray-800/30 transition cursor-pointer group"
                  >
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {renderPriorityBadge(row.priority)}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-gray-200">
                      {row.issue}
                    </td>
                    <td className="py-3.5 px-4 text-gray-300 text-xs">
                      {row.recommendedFix}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {renderDifficultyBadge(row.difficulty)}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {renderBenefitBadge(row.expectedBenefit)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        aria-label="Toggle details"
                        className="p-1 rounded bg-gray-800/50 text-gray-400 group-hover:text-white transition"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </td>
                  </tr>

                  {/* Expanded Detail Row */}
                  {isExpanded && (
                    <tr className="bg-gray-900/40">
                      <td colSpan={6} className="p-4 sm:p-5 border-t border-gray-800/80">
                        <div className="space-y-3 text-xs">
                          {row.detailedInstructions && row.detailedInstructions.length > 0 && (
                            <div>
                              <span className="font-semibold text-indigo-300 uppercase tracking-wider block mb-1.5">
                                Step-by-Step Instructions:
                              </span>
                              <ul className="list-disc list-inside space-y-1 text-gray-300 pl-1">
                                {row.detailedInstructions.map((step, sIdx) => (
                                  <li key={sIdx}>{step}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {row.codeExample && (
                            <div className="mt-2">
                              <span className="font-semibold text-gray-400 uppercase tracking-wider block mb-1 flex items-center gap-1.5">
                                <Code className="w-3.5 h-3.5 text-indigo-400" />
                                Example Code Snippet:
                              </span>
                              <pre className="p-3 bg-black/60 rounded-lg text-emerald-300 font-mono text-xs overflow-x-auto border border-gray-800">
                                <code>{row.codeExample}</code>
                              </pre>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
};
