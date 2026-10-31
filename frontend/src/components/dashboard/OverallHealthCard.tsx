import React from 'react';
import { Activity, Clock, Monitor, Smartphone, CheckCircle2, AlertTriangle, XCircle, Info, Download } from 'lucide-react';
import type { CategoryScores, DeviceType } from '../../types/audit';
import { calculateOverallHealth } from '../../utils/healthCalculator';

interface OverallHealthCardProps {
  scores: CategoryScores;
  targetUrl: string;
  device: DeviceType;
  durationMs?: number;
  fetchTime?: string;
  onDownloadPdf?: () => void;
}

export const OverallHealthCard: React.FC<OverallHealthCardProps> = ({
  scores,
  targetUrl,
  device,
  durationMs,
  fetchTime,
  onDownloadPdf,
}) => {
  const health = calculateOverallHealth(scores);

  const getTierIcon = () => {
    switch (health.tier) {
      case 'Excellent':
        return <CheckCircle2 size={18} className="text-emerald-400" />;
      case 'Good':
        return <CheckCircle2 size={18} className="text-blue-400" />;
      case 'Needs Improvement':
        return <AlertTriangle size={18} className="text-amber-400" />;
      case 'Poor':
        return <XCircle size={18} className="text-rose-400" />;
    }
  };

  const circumference = 2 * Math.PI * 46;
  const strokeDashoffset = circumference - (health.score / 100) * circumference;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#121215] via-[#16161b] to-[#121215] border border-zinc-800 p-6 md:p-8 shadow-2xl mb-8">
      {/* Background glow orb */}
      <div
        className="absolute -top-24 -right-24 w-80 h-80 rounded-full blur-3xl pointer-events-none opacity-40 transition-all duration-700"
        style={{ backgroundColor: health.color }}
      />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        {/* Left info column */}
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-zinc-800/80 border border-zinc-700 text-zinc-300">
              <Activity size={14} className="text-emerald-400" />
              <span>Lighthouse Audit Result</span>
            </span>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-zinc-900 border border-zinc-800 text-zinc-400">
              {device === 'desktop' ? <Monitor size={14} /> : <Smartphone size={14} />}
              <span className="capitalize">{device} Viewport</span>
            </span>

            {typeof durationMs === 'number' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-zinc-900 border border-zinc-800 text-zinc-400">
                <Clock size={14} />
                <span>{(durationMs / 1000).toFixed(2)}s scan time</span>
              </span>
            )}
          </div>

          <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight break-all mb-2">
            {targetUrl}
          </h2>

          <div className="flex items-center gap-2 mb-4">
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border"
              style={{
                backgroundColor: health.bgGlow,
                borderColor: health.color,
                color: health.color,
              }}
            >
              {getTierIcon()}
              <span>{health.tier} Health</span>
            </div>
            <span className="text-xs text-zinc-400">
              {health.description}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 bg-zinc-900/60 border border-zinc-800/80 rounded-lg px-3 py-1.5 w-fit">
              <Info size={13} className="text-zinc-400 shrink-0" />
              <span>
                <strong>Overall Website Health</strong> is a custom composite metric (0–100) calculated from Performance, Accessibility, Best Practices, and SEO.
              </span>
            </div>

            {onDownloadPdf && (
              <button
                type="button"
                onClick={onDownloadPdf}
                className="px-3.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-xs border border-zinc-700 flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              >
                <Download size={13} className="text-emerald-400" />
                <span>Generate PDF Report</span>
              </button>
            )}
          </div>
        </div>

        {/* Right Score Gauge */}
        <div className="flex items-center gap-6 self-center lg:self-auto shrink-0 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5 md:p-6 backdrop-blur-md">
          <div className="relative flex items-center justify-center w-32 h-32">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 108 108">
              {/* Background track circle */}
              <circle
                cx="54"
                cy="54"
                r="46"
                fill="none"
                stroke="#27272a"
                strokeWidth="9"
              />
              {/* Animated Progress circle */}
              <circle
                cx="54"
                cy="54"
                r="46"
                fill="none"
                stroke={health.color}
                strokeWidth="9"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
                style={{
                  filter: `drop-shadow(0 0 8px ${health.color})`,
                }}
              />
            </svg>

            {/* Centered Score */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
                {health.score}
              </span>
              <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                out of 100
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Overall Website Health
            </span>
            <span className="text-xl font-bold text-white">
              {health.label}
            </span>
            <span className="text-xs text-zinc-400">
              {fetchTime ? new Date(fetchTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
