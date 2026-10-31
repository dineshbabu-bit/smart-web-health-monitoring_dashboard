import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Sun, 
  Moon, 
  Info, 
  ShieldCheck, 
  Check, 
  Cpu, 
  Clock, 
  Sparkles,
  X
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export const ProfileDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { theme, setTheme } = useTheme();

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent | TouchEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('touchstart', handleOutsideClick);
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [isOpen]);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (showAboutModal) {
          setShowAboutModal(false);
        } else if (isOpen) {
          setIsOpen(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, showAboutModal]);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Profile Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label="User Profile and Application Settings"
        className={`h-9 w-9 rounded-full flex items-center justify-center transition-all cursor-pointer border ${
          isOpen
            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 ring-2 ring-emerald-500/20'
            : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border-zinc-700'
        }`}
        title="Account Profile & Settings"
      >
        <User size={16} />
      </button>

      {/* Popover Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute right-0 mt-2 w-80 rounded-2xl bg-[#121215] border border-zinc-800 shadow-2xl z-50 overflow-hidden text-xs"
          >
            {/* Header: Auditor Profile Info */}
            <div className="p-4 border-b border-zinc-800 bg-zinc-900/50">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 text-zinc-950 font-bold flex items-center justify-center text-sm shadow-md shadow-emerald-500/10">
                  <User size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-white truncate text-sm">Health Auditor</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  </div>
                  <p className="text-[11px] text-zinc-400 truncate">Local Monitoring Workspace</p>
                </div>
              </div>
            </div>

            {/* Menu Sections */}
            <div className="p-2 space-y-1">
              {/* Profile Details Item */}
              <div className="px-3 py-2 rounded-xl bg-zinc-900/40 border border-zinc-800/60 mb-2">
                <div className="flex items-center justify-between text-zinc-400 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Profile Status</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono">ACTIVE</span>
                </div>
                <div className="flex items-center justify-between text-zinc-300">
                  <span>Workspace:</span>
                  <strong className="text-white font-mono text-[11px]">Desktop Localhost</strong>
                </div>
                <div className="flex items-center justify-between text-zinc-300 mt-0.5">
                  <span>Role:</span>
                  <span className="text-zinc-400">System Administrator</span>
                </div>
              </div>

              {/* Application Settings Section */}
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                Application Settings
              </div>

              <div className="px-3 py-2 rounded-xl hover:bg-zinc-800/40 transition-colors">
                <div className="flex items-center gap-2.5 text-zinc-300">
                  <Cpu size={14} className="text-blue-400 shrink-0" />
                  <div className="flex-1">
                    <div className="text-white font-medium">Audit Engine</div>
                    <div className="text-[11px] text-zinc-400">Google Lighthouse 12.3 & Headless Chrome</div>
                  </div>
                </div>
              </div>

              <div className="px-3 py-2 rounded-xl hover:bg-zinc-800/40 transition-colors">
                <div className="flex items-center gap-2.5 text-zinc-300">
                  <Clock size={14} className="text-amber-400 shrink-0" />
                  <div className="flex-1">
                    <div className="text-white font-medium">Request Timeout</div>
                    <div className="text-[11px] text-zinc-400">180 seconds watchdog (queued audits enabled)</div>
                  </div>
                </div>
              </div>

              {/* Theme Preference Section */}
              <div className="pt-2 border-t border-zinc-800/60 mt-1">
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                  Theme Appearance
                </div>

                <div className="grid grid-cols-2 gap-1.5 px-2 py-1">
                  <button
                    type="button"
                    onClick={() => setTheme('dark')}
                    className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border transition-all cursor-pointer ${
                      theme === 'dark'
                        ? 'bg-zinc-800 text-white border-zinc-700 font-semibold shadow-sm'
                        : 'bg-zinc-900/50 text-zinc-400 hover:text-zinc-200 border-zinc-800/60 hover:bg-zinc-800/40'
                    }`}
                  >
                    <Moon size={14} className="text-blue-400" />
                    <span>Dark</span>
                    {theme === 'dark' && <Check size={12} className="text-emerald-400 ml-auto" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setTheme('light')}
                    className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border transition-all cursor-pointer ${
                      theme === 'light'
                        ? 'bg-zinc-800 text-white border-zinc-700 font-semibold shadow-sm'
                        : 'bg-zinc-900/50 text-zinc-400 hover:text-zinc-200 border-zinc-800/60 hover:bg-zinc-800/40'
                    }`}
                  >
                    <Sun size={14} className="text-amber-400" />
                    <span>Light</span>
                    {theme === 'light' && <Check size={12} className="text-emerald-400 ml-auto" />}
                  </button>
                </div>
              </div>

              {/* About Section Button */}
              <div className="pt-2 border-t border-zinc-800/60 mt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    setShowAboutModal(true);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-zinc-300 hover:text-white hover:bg-zinc-800/40 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <Info size={14} className="text-emerald-400 shrink-0" />
                    <span>About Smart Web Health</span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-500">v1.0.0</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* About Application Modal */}
      <AnimatePresence>
        {showAboutModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-[#121215] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">Smart Web Health Monitoring</h3>
                    <p className="text-xs text-zinc-400">Enterprise Web Performance & Diagnostics</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAboutModal(false)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                  title="Close"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3 text-xs text-zinc-300 leading-relaxed">
                <p>
                  A real-time health diagnostics platform designed to measure, benchmark, and monitor web performance using Google Lighthouse and Core Web Vitals standards.
                </p>

                <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">Version:</span>
                    <strong className="text-white font-mono">1.0.0 (Phase 3)</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">Frontend Stack:</span>
                    <span className="text-zinc-200">React 19, TypeScript, Tailwind CSS, Vite</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">Backend Engine:</span>
                    <span className="text-zinc-200">Express, Lighthouse 12, Headless Chrome</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">Audit Timeout:</span>
                    <span className="text-emerald-400 font-mono">180s Watchdog</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-zinc-400 text-[11px] pt-1">
                  <Sparkles size={14} className="text-amber-400 shrink-0" />
                  <span>Includes Desktop/Mobile Audits, Head-to-Head Comparison, and PDF Reports.</span>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowAboutModal(false)}
                  className="px-5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-medium text-xs border border-zinc-700 transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
