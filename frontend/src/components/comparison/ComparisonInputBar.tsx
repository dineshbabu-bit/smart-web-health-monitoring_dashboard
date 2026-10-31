import React, { useState } from 'react';
import { Globe, Monitor, Smartphone, ArrowRight, Loader2, Sparkles, Scale } from 'lucide-react';
import type { DeviceType } from '../../types/audit';

interface ComparisonInputBarProps {
  onCompare: (urlA: string, deviceA: DeviceType, urlB: string, deviceB: DeviceType) => void;
  isLoading: boolean;
  loadingProgress?: { siteA: boolean; siteB: boolean };
}

const COMPARISON_PRESETS = [
  { label: 'Example.com vs React.dev', urlA: 'https://example.com', urlB: 'https://react.dev' },
  { label: 'GitHub vs Wikipedia', urlA: 'https://github.com', urlB: 'https://wikipedia.org' },
];

export const ComparisonInputBar: React.FC<ComparisonInputBarProps> = ({
  onCompare,
  isLoading,
  loadingProgress = { siteA: false, siteB: false },
}) => {
  const [urlA, setUrlA] = useState('https://example.com');
  const [deviceA, setDeviceA] = useState<DeviceType>('desktop');
  const [urlB, setUrlB] = useState('https://react.dev');
  const [deviceB, setDeviceB] = useState<DeviceType>('desktop');
  const [validationError, setValidationError] = useState<string | null>(null);

  const normalizeUrl = (raw: string): string => {
    let trimmed = raw.trim();
    if (!/^https?:\/\//i.test(trimmed)) {
      trimmed = `https://${trimmed}`;
    }
    return trimmed;
  };

  const handleCompare = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setValidationError(null);

    const cleanA = normalizeUrl(urlA);
    const cleanB = normalizeUrl(urlB);

    if (!urlA.trim() || !urlB.trim()) {
      setValidationError('Please enter both Website A and Website B URLs to run comparison.');
      return;
    }

    try {
      const parsedA = new URL(cleanA);
      const parsedB = new URL(cleanB);
      if (!parsedA.hostname.includes('.') && parsedA.hostname !== 'localhost') {
        setValidationError('Website A has an invalid domain.');
        return;
      }
      if (!parsedB.hostname.includes('.') && parsedB.hostname !== 'localhost') {
        setValidationError('Website B has an invalid domain.');
        return;
      }
    } catch {
      setValidationError('Please provide valid URL addresses.');
      return;
    }

    onCompare(cleanA, deviceA, cleanB, deviceB);
  };

  const handleSelectPreset = (preset: { urlA: string; urlB: string }) => {
    setUrlA(preset.urlA);
    setUrlB(preset.urlB);
    setValidationError(null);
    onCompare(preset.urlA, deviceA, preset.urlB, deviceB);
  };

  return (
    <div className="w-full bg-[#121215]/90 border border-zinc-800 rounded-2xl p-5 md:p-6 shadow-xl mb-8">
      <form onSubmit={handleCompare} className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Website A Box */}
          <div className="p-4 rounded-xl bg-zinc-900/80 border border-emerald-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Website A (Baseline)
              </span>

              {/* Device Selector A */}
              <div className="flex items-center p-0.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs">
                <button
                  type="button"
                  onClick={() => setDeviceA('desktop')}
                  className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 ${
                    deviceA === 'desktop' ? 'bg-zinc-800 text-white font-medium' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Monitor size={12} />
                  <span>Desktop</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDeviceA('mobile')}
                  className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 ${
                    deviceA === 'mobile' ? 'bg-zinc-800 text-white font-medium' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Smartphone size={12} />
                  <span>Mobile</span>
                </button>
              </div>
            </div>

            <div className="relative">
              <Globe size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                value={urlA}
                onChange={(e) => setUrlA(e.target.value)}
                placeholder="https://example.com"
                disabled={isLoading}
                className="w-full h-11 pl-10 pr-4 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-xs md:text-sm font-mono placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500"
              />
            </div>
            {loadingProgress.siteA && (
              <div className="flex items-center gap-2 text-xs text-emerald-400 animate-pulse">
                <Loader2 size={13} className="animate-spin" />
                <span>Auditing Website A with Lighthouse...</span>
              </div>
            )}
          </div>

          {/* Website B Box */}
          <div className="p-4 rounded-xl bg-zinc-900/80 border border-blue-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-400" />
                Website B (Competitor / Alternate)
              </span>

              {/* Device Selector B */}
              <div className="flex items-center p-0.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs">
                <button
                  type="button"
                  onClick={() => setDeviceB('desktop')}
                  className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 ${
                    deviceB === 'desktop' ? 'bg-zinc-800 text-white font-medium' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Monitor size={12} />
                  <span>Desktop</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDeviceB('mobile')}
                  className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 ${
                    deviceB === 'mobile' ? 'bg-zinc-800 text-white font-medium' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Smartphone size={12} />
                  <span>Mobile</span>
                </button>
              </div>
            </div>

            <div className="relative">
              <Globe size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                value={urlB}
                onChange={(e) => setUrlB(e.target.value)}
                placeholder="https://react.dev"
                disabled={isLoading}
                className="w-full h-11 pl-10 pr-4 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-xs md:text-sm font-mono placeholder:text-zinc-600 focus:outline-none focus:border-blue-500"
              />
            </div>
            {loadingProgress.siteB && (
              <div className="flex items-center gap-2 text-xs text-blue-400 animate-pulse">
                <Loader2 size={13} className="animate-spin" />
                <span>Auditing Website B with Lighthouse...</span>
              </div>
            )}
          </div>
        </div>

        {/* Validation error */}
        {validationError && (
          <div className="text-xs text-rose-400 font-medium px-1 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Action Row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          {/* Quick Presets */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400">
            <div className="flex items-center gap-1 text-zinc-500 font-medium">
              <Sparkles size={13} className="text-amber-400" />
              <span>Sample comparisons:</span>
            </div>
            {COMPARISON_PRESETS.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                disabled={isLoading}
                className="px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full sm:w-auto h-12 px-8 bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-500 hover:opacity-90 text-zinc-950 font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="animate-spin text-zinc-950" />
                <span>Running Comparative Audits...</span>
              </>
            ) : (
              <>
                <Scale size={18} />
                <span>Compare Websites</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
