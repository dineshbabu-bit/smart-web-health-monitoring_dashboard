import React, { useState } from 'react';
import { 
  AlertCircle, 
  AlertTriangle,
  RefreshCw, 
  X, 
  Copy, 
  Check, 
  ServerCrash, 
  WifiOff, 
  Clock, 
  ShieldAlert, 
  Sparkles,
  FileText,
  FileWarning
} from 'lucide-react';

export interface ErrorAlertProps {
  message: string;
  code?: string;
  statusCode?: number;
  onRetry?: () => void;
  onDismiss?: () => void;
  onSelectSample?: (url: string) => void;
}

export const ErrorAlert: React.FC<ErrorAlertProps> = ({ 
  message, 
  code,
  statusCode,
  onRetry, 
  onDismiss,
  onSelectSample 
}) => {
  const [copied, setCopied] = useState(false);

  const lowerMsg = (message || '').toLowerCase();
  const errorCode = (code || '').toUpperCase();

  // 1. Invalid URL
  const isInvalidUrl = 
    errorCode === 'INVALID_URL' || 
    lowerMsg.includes('invalid url') || 
    lowerMsg.includes('unsupported protocol') || 
    lowerMsg.includes('malformed json');

  // 2. DNS Resolution Failure
  const isDnsError = 
    errorCode === 'DNS_ERROR' || 
    lowerMsg.includes('dns') || 
    lowerMsg.includes('err_name_not_resolved') || 
    lowerMsg.includes('domain could not be resolved');

  // 3. Website Navigation / Target Failure
  const isNavigationError = 
    errorCode === 'LIGHTHOUSE_ERROR' || 
    errorCode === 'TARGET_UNREACHABLE' || 
    errorCode === 'NAVIGATION_FAILURE' || 
    lowerMsg.includes('navigation audit failed') || 
    lowerMsg.includes('failed to complete navigation') || 
    lowerMsg.includes('connection to') || 
    lowerMsg.includes('no_fcp') || 
    lowerMsg.includes('first contentful paint') || 
    lowerMsg.includes('target page could not be audited');

  // 4. Chrome Launch Failure
  const isChromeError = 
    errorCode === 'CHROME_ERROR' || 
    lowerMsg.includes('browser engine') || 
    lowerMsg.includes('chrome failed to start') || 
    lowerMsg.includes('no chrome installations found');

  // 5. Audit or Target Timeout
  const isTimeout = 
    errorCode === 'LIGHTHOUSE_TIMEOUT' || 
    errorCode === 'TARGET_TIMEOUT' || 
    lowerMsg.includes('timed out') || 
    lowerMsg.includes('timeout') || 
    lowerMsg.includes('too slow to respond');

  // 6. Backend Server Unavailable
  const isBackendOffline = 
    errorCode === 'BACKEND_ERROR' || 
    statusCode === 0 || 
    (!code && (
      lowerMsg.includes('cannot connect to the audit engine') || 
      lowerMsg.includes('backend service is running') || 
      lowerMsg.includes('econnrefused')
    ));

  // 7. Invalid or Incomplete Response
  const isInvalidResponse = 
    errorCode === 'INVALID_RESPONSE' || 
    lowerMsg.includes('failed to return valid audit data') || 
    lowerMsg.includes('did not return a valid audit report');

  // 8. PDF Generation Failure
  const isPdfError = 
    errorCode === 'PDF_ERROR' || 
    lowerMsg.includes('pdf generation failed') || 
    lowerMsg.includes('autotable');

  const getErrorBadge = () => {
    if (isInvalidUrl) {
      return {
        label: 'Invalid Website Address',
        icon: AlertTriangle,
        color: 'bg-amber-500/20 text-amber-300 border-amber-500/30'
      };
    }
    if (isDnsError) {
      return {
        label: 'DNS Resolution Failure',
        icon: WifiOff,
        color: 'bg-amber-500/20 text-amber-300 border-amber-500/30'
      };
    }
    if (isNavigationError) {
      return {
        label: 'Website Navigation Failure',
        icon: ShieldAlert,
        color: 'bg-rose-500/20 text-rose-300 border-rose-500/30'
      };
    }
    if (isChromeError) {
      return {
        label: 'Chrome Engine Failure',
        icon: ServerCrash,
        color: 'bg-rose-500/20 text-rose-300 border-rose-500/30'
      };
    }
    if (isTimeout) {
      return {
        label: 'Audit Execution Timeout',
        icon: Clock,
        color: 'bg-orange-500/20 text-orange-300 border-orange-500/30'
      };
    }
    if (isBackendOffline) {
      return {
        label: 'Audit Server Unavailable',
        icon: ServerCrash,
        color: 'bg-rose-500/20 text-rose-300 border-rose-500/30'
      };
    }
    if (isInvalidResponse) {
      return {
        label: 'Incomplete Audit Data',
        icon: FileWarning,
        color: 'bg-amber-500/20 text-amber-300 border-amber-500/30'
      };
    }
    if (isPdfError) {
      return {
        label: 'PDF Generation Failure',
        icon: FileText,
        color: 'bg-rose-500/20 text-rose-300 border-rose-500/30'
      };
    }
    return {
      label: 'Audit Notice',
      icon: AlertCircle,
      color: 'bg-rose-500/20 text-rose-300 border-rose-500/30'
    };
  };

  const badge = getErrorBadge();
  const BadgeIcon = badge.icon;

  const handleCopy = () => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="rounded-2xl bg-[#181116] border border-rose-500/30 p-5 md:p-6 mb-8 text-rose-200 shadow-2xl animate-fadeIn relative overflow-hidden">
      {/* Decorative ambient backdrop glow */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex items-start justify-between gap-4 relative z-10">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 shrink-0 mt-0.5 border border-rose-500/30 shadow-inner">
            <BadgeIcon size={22} />
          </div>

          <div className="space-y-1.5 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="font-bold text-white text-base">
                {isPdfError ? 'PDF Report Generation Issue' : 'Audit Could Not Be Completed'}
              </h4>

              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${badge.color}`}>
                <BadgeIcon size={12} />
                <span>{badge.label}</span>
              </span>
            </div>

            <p className="text-sm text-zinc-300 leading-relaxed max-w-3xl whitespace-pre-line">
              {message}
            </p>

            {/* Context-aware suggestions */}
            <div className="mt-3 pt-3 border-t border-rose-500/20 text-xs text-zinc-400 space-y-1">
              <strong className="text-zinc-200">Recommended Steps:</strong>
              {isInvalidUrl && (
                <ul className="list-disc list-inside space-y-0.5 text-zinc-300">
                  <li>Check for typos in the address (e.g. <span className="text-emerald-400 font-medium">https://example.com</span>).</li>
                  <li>Ensure the URL uses HTTP or HTTPS protocol and has a valid domain name.</li>
                </ul>
              )}
              {isDnsError && (
                <ul className="list-disc list-inside space-y-0.5 text-zinc-300">
                  <li>Double check spelling of the domain.</li>
                  <li>Verify that the website is publicly accessible on the public Internet.</li>
                  <li>Check that your computer has an active internet connection.</li>
                </ul>
              )}
              {isNavigationError && (
                <ul className="list-disc list-inside space-y-0.5 text-zinc-300">
                  <li>The backend audit server is <strong className="text-emerald-400">online</strong>, but the target page failed to complete navigation.</li>
                  <li>The target website may be blocking automated headless browsers (Cloudflare, CAPTCHA, or bot protection).</li>
                  <li>Try auditing a public landing page or documentation subpage instead.</li>
                </ul>
              )}
              {isChromeError && (
                <ul className="list-disc list-inside space-y-0.5 text-zinc-300">
                  <li>Ensure Google Chrome or Chromium is installed on the host server.</li>
                  <li>Check server memory and ensure Chrome has sufficient privileges to spawn child processes.</li>
                </ul>
              )}
              {isTimeout && (
                <ul className="list-disc list-inside space-y-0.5 text-zinc-300">
                  <li>The target server is taking too long to reply. Try switching to <strong>Mobile mode</strong> or retry.</li>
                  <li>Heavier web pages with many external scripts may need a second attempt to warm up cache.</li>
                </ul>
              )}
              {isBackendOffline && (
                <ul className="list-disc list-inside space-y-0.5 text-zinc-300">
                  <li>Ensure the backend is running in your terminal: <code className="px-1.5 py-0.5 bg-zinc-900 border border-zinc-700 rounded text-emerald-300 font-mono text-[11px]">npm run dev</code> or <code className="px-1.5 py-0.5 bg-zinc-900 border border-zinc-700 rounded text-emerald-300 font-mono text-[11px]">npm run backend</code>.</li>
                  <li>Check whether port 5000 is occupied. Run <code className="px-1.5 py-0.5 bg-zinc-900 border border-zinc-700 rounded text-amber-300 font-mono text-[11px]">npm run check:ports</code> and inspect the reported process before stopping an old server.</li>
                </ul>
              )}
              {isInvalidResponse && (
                <ul className="list-disc list-inside space-y-0.5 text-zinc-300">
                  <li>The audit engine finished execution, but the returned report was missing metric categories.</li>
                  <li>Try running the audit again with all categories selected.</li>
                </ul>
              )}
              {isPdfError && (
                <ul className="list-disc list-inside space-y-0.5 text-zinc-300">
                  <li>Ensure popups or automatic file downloads are permitted by your browser for this site.</li>
                  <li>Try refreshing the page and generating the PDF report again.</li>
                </ul>
              )}
            </div>
          </div>
        </div>

        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss error"
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-colors cursor-pointer shrink-0"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Action Footer */}
      <div className="mt-5 pt-4 border-t border-rose-500/20 flex flex-wrap items-center justify-between gap-3 relative z-10">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="px-3 py-1.5 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-700/60 text-zinc-300 text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
            <span>{copied ? 'Copied Details' : 'Copy Error Details'}</span>
          </button>

          {onSelectSample && (
            <button
              type="button"
              onClick={() => onSelectSample('https://example.com')}
              className="px-3 py-1.5 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-700/60 text-zinc-300 text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Sparkles size={13} className="text-amber-400" />
              <span>Test With Example.com</span>
            </button>
          )}
        </div>

        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-amber-600 hover:from-rose-400 hover:to-amber-500 text-zinc-950 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer active:scale-95 shadow-md shadow-rose-950/40"
          >
            <RefreshCw size={13} />
            <span>Retry Audit</span>
          </button>
        )}
      </div>
    </div>
  );
};
