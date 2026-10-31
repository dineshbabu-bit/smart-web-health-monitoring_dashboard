import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Activity, Sun, Moon, AlertCircle, RefreshCw, Cpu, Sparkles } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { ProfileDropdown } from './ProfileDropdown';
import { checkAuditHealth, type SystemHealthResponse } from '../../services/auditService';

type BackendStatus = 'checking' | 'online' | 'offline';

export const Header: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const [backendStatus, setBackendStatus] = useState<BackendStatus>('checking');
  const [healthData, setHealthData] = useState<SystemHealthResponse | null>(null);
  const [isRetrying, setIsRetrying] = useState<boolean>(false);
  const isMountedRef = useRef(true);
  const failCountRef = useRef(0);

  const checkHealth = useCallback(async (manual = false) => {
    if (manual) setIsRetrying(true);
    try {
      const data = await checkAuditHealth();
      if (isMountedRef.current) {
        if (data && (data.status === 'online' || data.backend?.status === 'online' || data.version)) {
          failCountRef.current = 0;
          setBackendStatus('online');
          setHealthData(data);
        } else {
          failCountRef.current += 1;
          if (failCountRef.current >= 2 || manual) {
            setBackendStatus('offline');
            setHealthData(null);
          }
        }
      }
    } catch {
      if (isMountedRef.current) {
        failCountRef.current += 1;
        if (failCountRef.current >= 2 || manual) {
          setBackendStatus('offline');
          setHealthData(null);
        }
      }
    } finally {
      if (isMountedRef.current && manual) {
        setIsRetrying(false);
      }
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    checkHealth();

    // Poll health check every 15 seconds
    const intervalId = setInterval(() => {
      checkHealth();
    }, 15000);

    const handleFocus = () => {
      checkHealth();
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      isMountedRef.current = false;
      clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
    };
  }, [checkHealth]);

  // Derive dynamic Lighthouse Engine status
  const getEngineBadge = () => {
    if (backendStatus === 'offline') {
      return {
        label: 'Audit Engine Offline',
        color: 'bg-rose-500/10 border-rose-500/20 text-rose-400',
        dot: 'bg-rose-400'
      };
    }
    if (backendStatus === 'checking' || !healthData) {
      return {
        label: 'Checking Engine...',
        color: 'bg-amber-500/10 border-amber-500/20 text-amber-300',
        dot: 'bg-amber-400 animate-pulse'
      };
    }
    const engine = healthData.auditEngine;
    if (!engine || !engine.chromeInstalled) {
      return {
        label: 'Chrome Engine Missing',
        color: 'bg-rose-500/10 border-rose-500/20 text-rose-400',
        dot: 'bg-rose-400'
      };
    }
    if (engine.status === 'busy' || engine.activeAudits > 0) {
      return {
        label: `Audit In Progress (${engine.activeAudits})`,
        color: 'bg-blue-500/10 border-blue-500/20 text-blue-300',
        dot: 'bg-blue-400 animate-pulse'
      };
    }
    return {
      label: 'Lighthouse Engine Ready',
      color: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
      dot: 'bg-emerald-400 animate-pulse'
    };
  };

  const engineBadge = getEngineBadge();

  return (
    <header className="h-16 px-6 border-b border-zinc-800/50 bg-[#121215]/80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between transition-colors">
      <div className="flex items-center gap-4">
        <h1 className="text-base md:text-lg font-bold text-white tracking-tight">
          Smart Web Health Monitoring
        </h1>
        
        {/* Dynamic Lighthouse Engine Badge */}
        <div
          className={`hidden sm:flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-semibold ${engineBadge.color}`}
          title={healthData?.auditEngine?.chromePath ? `Chrome Path: ${healthData.auditEngine.chromePath}` : 'Audit Engine Status'}
        >
          <span className={`w-2 h-2 rounded-full ${engineBadge.dot}`} />
          <Cpu size={13} />
          <span>{engineBadge.label}</span>
        </div>

        {/* Dynamic AI Advisor Status Badge */}
        {healthData?.gemini && (
          <div
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-purple-500/20 bg-purple-500/10 text-purple-300 text-[11px] font-medium"
            title={`Active AI Provider: ${healthData.gemini.provider} (${healthData.gemini.model})`}
          >
            <Sparkles size={11} className="text-purple-400" />
            <span>AI: {healthData.gemini.provider === 'gemini' ? 'Gemini Live' : 'Expert Rules'}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Dynamic Backend Status Badge */}
        <button
          type="button"
          onClick={() => checkHealth(true)}
          disabled={isRetrying}
          title={`Backend status: ${backendStatus}. Click to refresh health check.`}
          className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
            backendStatus === 'online'
              ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
              : backendStatus === 'checking'
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 animate-pulse'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20'
          }`}
        >
          {backendStatus === 'online' ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <Activity size={14} className="text-emerald-400" />
              <span>
                Backend: <strong className="text-emerald-400">Online</strong>
              </span>
            </>
          ) : backendStatus === 'checking' ? (
            <>
              <RefreshCw size={13} className="text-amber-400 animate-spin" />
              <span>
                Backend: <strong className="text-amber-300">Checking...</strong>
              </span>
            </>
          ) : (
            <>
              <AlertCircle size={14} className="text-rose-400" />
              <span>
                Backend: <strong className="text-rose-400">Offline</strong>
              </span>
              <RefreshCw size={12} className={`ml-1 text-rose-400 ${isRetrying ? 'animate-spin' : ''}`} />
            </>
          )}
        </button>

        {/* Theme Toggle Button */}
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 transition-colors cursor-pointer"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? <Sun size={17} className="text-amber-400" /> : <Moon size={17} className="text-blue-400" />}
        </button>

        {/* User profile dropdown */}
        <ProfileDropdown />
      </div>
    </header>
  );
};
