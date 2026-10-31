import React, { useState, useEffect } from 'react';
import { Globe, Monitor, Smartphone, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import type { DeviceType } from '../../types/audit';

interface AuditInputBarProps {
  onAnalyze: (url: string, device: DeviceType) => void;
  isLoading: boolean;
  currentUrl?: string;
  currentDevice?: DeviceType;
}

const PRESET_URLS = [
  { label: 'Example.com', url: 'https://example.com' },
  { label: 'React.dev', url: 'https://react.dev' },
  { label: 'GitHub.com', url: 'https://github.com' },
  { label: 'Wikipedia.org', url: 'https://wikipedia.org' },
  { label: 'Google.com', url: 'https://google.com' },
];

const LOADING_TEXTS = ['Analyzing...', 'Running Lighthouse...', 'Processing Results...'];

export const AuditInputBar: React.FC<AuditInputBarProps> = ({
  onAnalyze,
  isLoading,
  currentUrl = '',
  currentDevice = 'desktop',
}) => {
  const [url, setUrl] = useState(currentUrl);
  const [device, setDevice] = useState<DeviceType>(currentDevice);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (currentUrl) {
      setUrl(currentUrl);
    }
  }, [currentUrl]);

  useEffect(() => {
    if (currentDevice) {
      setDevice(currentDevice);
    }
  }, [currentDevice]);

  const [loadingTextIndex, setLoadingTextIndex] = useState(0);

  useEffect(() => {
    if (!isLoading) {
      setLoadingTextIndex(0);
      return;
    }
    const interval = setInterval(() => {
      setLoadingTextIndex((prev) => (prev + 1) % LOADING_TEXTS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [isLoading]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isLoading) return; // Prevent duplicate clicks
    setValidationError(null);

    const trimmed = url.trim().replace(/^['"`<([\]+|['"`>)\]]+$/g, '').trim();
    if (!trimmed) {
      setValidationError('Please enter a website URL to analyze.');
      return;
    }

    // Basic client-side normalization
    let formattedUrl = trimmed;
    if (!/^https?:\/\//i.test(formattedUrl)) {
      if (/^(localhost|127\.0\.0\.1|0\.0\.0\.0|::1)(:\d+)?(\/.*)?$/i.test(formattedUrl)) {
        formattedUrl = `http://${formattedUrl}`;
      } else {
        formattedUrl = `https://${formattedUrl}`;
      }
    }

    try {
      const parsed = new URL(formattedUrl);
      const isLocal =
        parsed.hostname === 'localhost' ||
        parsed.hostname === '127.0.0.1' ||
        parsed.hostname === '::1';

      if (!parsed.hostname || (!parsed.hostname.includes('.') && !isLocal)) {
        setValidationError('Please enter a valid website domain (e.g. example.com or localhost:3000).');
        return;
      }
    } catch {
      setValidationError('Invalid URL format. Please provide a valid web address.');
      return;
    }

    onAnalyze(formattedUrl, device);
  };

  const handleSelectPreset = (presetUrl: string) => {
    if (isLoading) return;
    setUrl(presetUrl);
    setValidationError(null);
  };

  return (
    <div className="w-full bg-[#121215]/90 border border-zinc-800/80 rounded-2xl p-4 md:p-6 shadow-xl backdrop-blur-xl mb-8">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
          {/* URL Input Box */}
          <div className="relative flex-1">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none flex items-center">
              <Globe size={18} className="text-emerald-400" />
            </div>
            <input
              type="text"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                if (validationError) setValidationError(null);
              }}
              placeholder="Enter website URL (e.g., https://example.com or example.com)"
              disabled={isLoading}
              className="w-full h-13 pl-11 pr-4 bg-zinc-900/90 border border-zinc-800 rounded-xl text-white text-sm md:text-base placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all disabled:opacity-50"
            />
          </div>

          {/* Device Selector Pill */}
          <div className="flex items-center p-1 bg-zinc-900/90 border border-zinc-800 rounded-xl shrink-0 self-start lg:self-auto">
            <button
              type="button"
              onClick={() => setDevice('desktop')}
              disabled={isLoading}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs md:text-sm font-medium transition-all ${
                device === 'desktop'
                  ? 'bg-zinc-800 text-white shadow-sm shadow-black/40 border border-zinc-700/60'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Monitor size={16} className={device === 'desktop' ? 'text-emerald-400' : ''} />
              <span>Desktop</span>
            </button>
            <button
              type="button"
              onClick={() => setDevice('mobile')}
              disabled={isLoading}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs md:text-sm font-medium transition-all ${
                device === 'mobile'
                  ? 'bg-zinc-800 text-white shadow-sm shadow-black/40 border border-zinc-700/60'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Smartphone size={16} className={device === 'mobile' ? 'text-emerald-400' : ''} />
              <span>Mobile</span>
            </button>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="h-13 px-7 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 font-semibold text-sm md:text-base rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shrink-0 cursor-pointer active:scale-[0.99]"
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="animate-spin text-zinc-950" />
                <span className="animate-fadeIn">{LOADING_TEXTS[loadingTextIndex]}</span>
              </>
            ) : (
              <>
                <span>Analyze Website</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </div>

        {/* Validation Error Message */}
        {validationError && (
          <div className="text-xs text-rose-400 font-medium flex items-center gap-1.5 px-1 animate-fadeIn">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-rose-400"></span>
            {validationError}
          </div>
        )}

        {/* Quick Presets */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-zinc-800/40 text-xs text-zinc-400">
          <div className="flex items-center gap-1.5 text-zinc-500 font-medium">
            <Sparkles size={13} className="text-amber-400" />
            <span>Try sample website:</span>
          </div>
          {PRESET_URLS.map((preset) => (
            <button
              key={preset.url}
              type="button"
              onClick={() => handleSelectPreset(preset.url)}
              disabled={isLoading}
              className="px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:text-zinc-200 text-zinc-400 transition-colors cursor-pointer"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </form>
    </div>
  );
};
