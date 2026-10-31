import React from 'react';
import { Trophy, Download, Save, CheckCircle2, Scale } from 'lucide-react';
import type { ComparisonResult } from '../../types/comparison';
import { extractHostname } from '../../services/scanHistoryService';

interface ComparisonWinnerCardProps {
  comparison: ComparisonResult;
  onDownloadPdf: () => void;
  onSaveToHistory: () => void;
  hasSaved?: boolean;
}

export const ComparisonWinnerCard: React.FC<ComparisonWinnerCardProps> = ({
  comparison,
  onDownloadPdf,
  onSaveToHistory,
  hasSaved,
}) => {
  const hostA = extractHostname(comparison.siteA.url);
  const hostB = extractHostname(comparison.siteB.url);

  const getWinnerTitle = () => {
    if (comparison.winner === 'A') return `🏆 Website A (${hostA}) is the Overall Winner!`;
    if (comparison.winner === 'B') return `🏆 Website B (${hostB}) is the Overall Winner!`;
    return `🤝 Both Websites are Tied in Overall Performance!`;
  };

  const getWinnerGlow = () => {
    if (comparison.winner === 'A') return 'from-emerald-500/20 via-[#121215] to-[#121215] border-emerald-500/40';
    if (comparison.winner === 'B') return 'from-blue-500/20 via-[#121215] to-[#121215] border-blue-500/40';
    return 'from-amber-500/20 via-[#121215] to-[#121215] border-zinc-700';
  };

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${getWinnerGlow()} border p-6 md:p-8 shadow-2xl mb-8`}>
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-zinc-900 border border-zinc-800 text-amber-400">
              <Trophy size={14} />
              <span>Head-to-Head Benchmark Verdict</span>
            </span>
          </div>

          <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight mb-2">
            {getWinnerTitle()}
          </h2>

          <p className="text-xs md:text-sm text-zinc-300 leading-relaxed max-w-2xl mb-5">
            {comparison.winnerReason}
          </p>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onDownloadPdf}
              className="px-4 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-bold text-xs flex items-center gap-2 shadow-md transition-colors cursor-pointer"
            >
              <Download size={14} />
              <span>Download Comparison PDF</span>
            </button>

            <button
              type="button"
              onClick={onSaveToHistory}
              disabled={hasSaved}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 border transition-colors ${
                hasSaved
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 cursor-default'
                  : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-800 cursor-pointer'
              }`}
            >
              {hasSaved ? <CheckCircle2 size={14} className="text-emerald-400" /> : <Save size={14} />}
              <span>{hasSaved ? 'Saved to Scan History' : 'Save Both to History'}</span>
            </button>
          </div>
        </div>

        {/* Head-to-Head Health Badge Scoreboard */}
        <div className="flex items-center gap-4 self-center lg:self-auto shrink-0 bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 backdrop-blur-md">
          {/* Site A Box */}
          <div className="text-center px-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 block truncate max-w-[100px]">
              {hostA}
            </span>
            <div className="my-1">
              <span className="text-3xl md:text-4xl font-black text-white font-mono">
                {comparison.siteA.healthScore}
              </span>
            </div>
            <span className="text-[10px] text-zinc-500 uppercase font-semibold">Health Score</span>
          </div>

          <div className="h-12 w-[1px] bg-zinc-800" />

          {/* VS Divider */}
          <div className="p-2 rounded-full bg-zinc-800 text-zinc-400">
            <Scale size={16} />
          </div>

          <div className="h-12 w-[1px] bg-zinc-800" />

          {/* Site B Box */}
          <div className="text-center px-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400 block truncate max-w-[100px]">
              {hostB}
            </span>
            <div className="my-1">
              <span className="text-3xl md:text-4xl font-black text-white font-mono">
                {comparison.siteB.healthScore}
              </span>
            </div>
            <span className="text-[10px] text-zinc-500 uppercase font-semibold">Health Score</span>
          </div>
        </div>
      </div>
    </div>
  );
};
