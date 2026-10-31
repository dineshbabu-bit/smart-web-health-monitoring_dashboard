import React, { useState, useEffect } from 'react';
import { Loader2, Globe, ShieldCheck, CheckCircle2, Clock, Activity, Cpu } from 'lucide-react';
import type { DeviceType } from '../../types/audit';

interface LoadingAuditStateProps {
  url: string;
  device: DeviceType;
}

const STAGES = [
  { label: 'Connecting to audit server...', icon: Globe, duration: 2000 },
  { label: 'Checking website domain and accessibility...', icon: Activity, duration: 3000 },
  { label: 'Launching headless Google Chrome instance...', icon: Cpu, duration: 4000 },
  { label: 'Running Lighthouse (Performance, A11y, Best Practices, SEO)...', icon: ShieldCheck, duration: 18000 },
  { label: 'Processing results and generating Web Vitals report...', icon: CheckCircle2, duration: 999999 },
];

export const LoadingAuditState: React.FC<LoadingAuditStateProps> = ({ url, device }) => {
  const [currentStage, setCurrentStage] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (elapsedSeconds < 2) {
      setCurrentStage(0);
    } else if (elapsedSeconds < 4) {
      setCurrentStage(1);
    } else if (elapsedSeconds < 6) {
      setCurrentStage(2);
    } else if (elapsedSeconds < 14) {
      setCurrentStage(3);
    } else {
      setCurrentStage(4);
    }
  }, [elapsedSeconds]);

  return (
    <div className="py-12 px-4 max-w-4xl mx-auto text-center animate-fadeIn">
      {/* Central Spinner & Progress */}
      <div className="relative w-24 h-24 mx-auto mb-6 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-emerald-500/10 animate-ping" />
        <div className="relative w-20 h-20 rounded-2xl bg-zinc-900 border border-emerald-500/30 flex items-center justify-center shadow-xl shadow-emerald-500/10">
          <Loader2 size={36} className="text-emerald-400 animate-spin" />
        </div>
      </div>

      <h3 className="text-xl md:text-2xl font-bold text-white mb-2">
        Auditing Website with Google Lighthouse
      </h3>

      <p className="text-zinc-400 text-sm mb-4 break-all max-w-lg mx-auto font-mono">
        {url} <span className="text-emerald-400">({device})</span>
      </p>

      {/* Live Elapsed Time Pill */}
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-300 mb-8 shadow-sm">
        <Clock size={13} className="text-emerald-400 animate-pulse" />
        <span>Elapsed Time: <strong className="text-emerald-400">{elapsedSeconds}s</strong></span>
      </div>

      {/* Progress Stages */}
      <div className="max-w-md mx-auto bg-[#121215] border border-zinc-800 rounded-2xl p-5 mb-6 text-left space-y-3 shadow-lg">
        {STAGES.map((stage, idx) => {
          const Icon = stage.icon;
          const isDone = idx < currentStage;
          const isCurrent = idx === currentStage;

          return (
            <div
              key={idx}
              className={`flex items-center gap-3 text-xs transition-opacity duration-300 ${
                isDone
                  ? 'text-emerald-400'
                  : isCurrent
                  ? 'text-white font-semibold'
                  : 'text-zinc-600'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] ${
                  isDone
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : isCurrent
                    ? 'bg-emerald-500 text-zinc-950 font-bold'
                    : 'bg-zinc-800 text-zinc-600'
                }`}
              >
                {isDone ? '✓' : idx + 1}
              </div>

              <div className="flex items-center gap-1.5 flex-1 truncate">
                <Icon size={14} className="shrink-0" />
                <span className="truncate">{stage.label}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Slow target website advisory notice */}
      {elapsedSeconds >= 25 && (
        <div className="max-w-md mx-auto p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs text-left mb-8 animate-fadeIn flex items-start gap-2.5">
          <Clock size={16} className="text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold block mb-0.5">Extended Analysis in Progress</span>
            <span className="text-amber-300/90 text-[11px] leading-relaxed">
              The website is taking longer than expected. Lighthouse is still analyzing it.
            </span>
          </div>
        </div>
      )}

      {/* Skeleton placeholders */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 opacity-50">
        {[1, 2, 3, 4].map((n) => (
          <div key={n} className="h-32 rounded-2xl bg-zinc-900/60 border border-zinc-800 animate-pulse" />
        ))}
      </div>
    </div>
  );
};
