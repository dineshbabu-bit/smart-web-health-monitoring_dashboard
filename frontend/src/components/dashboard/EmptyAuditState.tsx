import React from 'react';
import { Activity, Zap, SearchCheck, Gauge, ArrowRight } from 'lucide-react';

interface EmptyAuditStateProps {
  onSelectSample: (url: string) => void;
}

export const EmptyAuditState: React.FC<EmptyAuditStateProps> = ({ onSelectSample }) => {
  const features = [
    {
      icon: Activity,
      title: 'Overall Web Health',
      description: 'Comprehensive composite scoring combining speed, UX, compliance, and SEO.',
      color: 'text-emerald-400',
      border: 'hover:border-emerald-500/40',
    },
    {
      icon: Gauge,
      title: 'Core Web Vitals',
      description: 'Real Google-standard metrics: LCP, INP, CLS, FCP, TBT, Speed Index & TTI.',
      color: 'text-blue-400',
      border: 'hover:border-blue-500/40',
    },
    {
      icon: Zap,
      title: 'Smart Recommendations',
      description: 'Prioritized actionable opportunities with estimated millisecond and byte savings.',
      color: 'text-amber-400',
      border: 'hover:border-amber-500/40',
    },
    {
      icon: SearchCheck,
      title: 'Accessibility & SEO',
      description: 'Thorough inspection for WCAG compliance, search discoverability, and best practices.',
      color: 'text-purple-400',
      border: 'hover:border-purple-500/40',
    },
  ];

  return (
    <div className="py-12 px-4 max-w-5xl mx-auto text-center animate-fadeIn">
      {/* Hero Badge */}
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-6">
        <Activity size={14} />
        <span>Automated Google Lighthouse Engine</span>
      </div>

      <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight mb-4">
        Smart Web Application <br className="hidden sm:inline" />
        <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
          Health & Performance Monitoring
        </span>
      </h2>

      <p className="text-zinc-400 text-sm md:text-base max-w-2xl mx-auto mb-10 leading-relaxed">
        Enter any website URL above to generate an in-depth audit covering Performance, Core Web Vitals, Accessibility, Best Practices, and SEO.
      </p>

      {/* 4 Pillars Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left mb-12">
        {features.map((feat, i) => {
          const Icon = feat.icon;
          return (
            <div
              key={i}
              className={`rounded-2xl bg-[#121215]/80 border border-zinc-800/80 p-5 transition-all duration-300 ${feat.border} hover:bg-zinc-900/60`}
            >
              <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 w-fit mb-3">
                <Icon size={20} className={feat.color} />
              </div>
              <h3 className="text-sm font-bold text-white mb-1.5">{feat.title}</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">{feat.description}</p>
            </div>
          );
        })}
      </div>

      {/* Quick Launch Cards */}
      <div className="rounded-2xl bg-zinc-900/50 border border-zinc-800/60 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-left">
          <h4 className="text-sm font-semibold text-white">Want to see a quick demonstration?</h4>
          <p className="text-xs text-zinc-400">Launch a live test on a verified benchmark website.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onSelectSample('https://example.com')}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer active:scale-95"
          >
            <span>Example.com</span>
            <ArrowRight size={13} />
          </button>
          <button
            type="button"
            onClick={() => onSelectSample('https://react.dev')}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer active:scale-95"
          >
            <span>React.dev</span>
            <ArrowRight size={13} />
          </button>
          <button
            type="button"
            onClick={() => onSelectSample('https://github.com')}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer active:scale-95"
          >
            <span>GitHub.com</span>
            <ArrowRight size={13} />
          </button>
        </div>
      </div>
    </div>
  );
};
