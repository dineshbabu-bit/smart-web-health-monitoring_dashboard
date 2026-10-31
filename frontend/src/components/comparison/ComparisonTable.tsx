import React from 'react';
import { Check, Minus, Info } from 'lucide-react';
import type { ComparisonResult, ComparisonMetricRow } from '../../types/comparison';
import { extractHostname } from '../../services/scanHistoryService';

interface ComparisonTableProps {
  comparison: ComparisonResult;
}

export const ComparisonTable: React.FC<ComparisonTableProps> = ({ comparison }) => {
  const hostA = extractHostname(comparison.siteA.url);
  const hostB = extractHostname(comparison.siteB.url);

  const renderWinnerBadge = (row: ComparisonMetricRow) => {
    if (row.winner === 'A') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
          <Check size={12} />
          <span>Site A ({hostA})</span>
        </span>
      );
    }
    if (row.winner === 'B') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
          <Check size={12} />
          <span>Site B ({hostB})</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-zinc-800 text-zinc-400">
        <Minus size={12} />
        <span>Tie</span>
      </span>
    );
  };

  return (
    <div className="bg-[#121215]/90 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl mb-8">
      <div className="p-5 border-b border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight">
            Detailed Side-by-Side Metric Breakdown
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Evaluated using Google Lighthouse v12 benchmark standards.
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg">
          <Info size={13} className="text-emerald-400 shrink-0" />
          <span>Scores: Higher is better  |  Timings/Shifts (LCP, INP, CLS): Lower is better</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-zinc-900/90 text-zinc-400 uppercase text-[10px] tracking-wider border-b border-zinc-800">
            <tr>
              <th className="py-3.5 px-4 font-semibold">Evaluation Metric</th>
              <th className="py-3.5 px-4 font-semibold text-center text-emerald-400">
                [A] {hostA} ({comparison.siteA.device})
              </th>
              <th className="py-3.5 px-4 font-semibold text-center text-blue-400">
                [B] {hostB} ({comparison.siteB.device})
              </th>
              <th className="py-3.5 px-4 font-semibold text-center">Advantage</th>
              <th className="py-3.5 px-4 font-semibold text-right">Difference</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {comparison.metrics.map((row, idx) => {
              const isHighlight = row.category === 'health' || row.category === 'pillar';

              return (
                <tr
                  key={idx}
                  className={`hover:bg-zinc-800/30 transition-colors ${
                    isHighlight ? 'bg-zinc-950/40' : ''
                  }`}
                >
                  {/* Metric Name & Guidance */}
                  <td className="py-3.5 px-4">
                    <div className="flex flex-col">
                      <span className="font-semibold text-white text-xs">{row.name}</span>
                      <span className="text-[10px] text-zinc-500">
                        {row.isBetterLower ? 'Lower value is faster' : 'Higher score is better (0-100)'}
                      </span>
                    </div>
                  </td>

                  {/* Site A Value */}
                  <td className="py-3.5 px-4 text-center font-mono font-bold text-xs text-emerald-300">
                    {row.displayA}
                  </td>

                  {/* Site B Value */}
                  <td className="py-3.5 px-4 text-center font-mono font-bold text-xs text-blue-300">
                    {row.displayB}
                  </td>

                  {/* Winner Badge */}
                  <td className="py-3.5 px-4 text-center">
                    {renderWinnerBadge(row)}
                  </td>

                  {/* Difference */}
                  <td className="py-3.5 px-4 text-right font-mono text-xs text-zinc-400">
                    {row.diffText}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
