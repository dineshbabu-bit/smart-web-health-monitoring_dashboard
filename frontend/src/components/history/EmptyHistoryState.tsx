import React from 'react';
import { History, ArrowRight, Zap, TrendingUp, ShieldCheck } from 'lucide-react';

interface EmptyHistoryStateProps {
  onStartAudit: () => void;
}

export const EmptyHistoryState: React.FC<EmptyHistoryStateProps> = ({ onStartAudit }) => {
  return (
    <div className="py-16 px-4 max-w-3xl mx-auto text-center animate-fadeIn">
      <div className="w-20 h-20 mx-auto rounded-3xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-6 shadow-2xl">
        <History size={36} className="text-zinc-500" />
      </div>

      <h3 className="text-2xl md:text-3xl font-bold text-white mb-3 tracking-tight">
        No Scan History Yet
      </h3>

      <p className="text-zinc-400 text-sm max-w-md mx-auto mb-8 leading-relaxed">
        Every website you audit with Lighthouse will automatically be recorded here so you can track Core Web Vitals progression, score improvements, and performance trends.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left max-w-xl mx-auto mb-8">
        <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
          <Zap size={18} className="text-emerald-400 mb-2" />
          <h4 className="text-xs font-bold text-white mb-1">Automatic Recording</h4>
          <p className="text-[11px] text-zinc-400">Scans are saved instantly with full Lighthouse result snapshots.</p>
        </div>
        <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
          <TrendingUp size={18} className="text-blue-400 mb-2" />
          <h4 className="text-xs font-bold text-white mb-1">Score Progression</h4>
          <p className="text-[11px] text-zinc-400">View historical score trajectories & Core Web Vitals changes.</p>
        </div>
        <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
          <ShieldCheck size={18} className="text-purple-400 mb-2" />
          <h4 className="text-xs font-bold text-white mb-1">Delta Analysis</h4>
          <p className="text-[11px] text-zinc-400">Compare latest audits against previous baselines to verify fixes.</p>
        </div>
      </div>

      <button
        type="button"
        onClick={onStartAudit}
        className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 font-semibold text-sm rounded-xl inline-flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
      >
        <span>Analyze Your First Website</span>
        <ArrowRight size={16} />
      </button>
    </div>
  );
};
