import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  History,
  Scale,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Activity
} from 'lucide-react';
import { cn } from '../../utils/cn';

const navItems = [
  { name: 'Live Audit Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { name: 'Scan History & Trends', icon: History, path: '/history' },
  { name: 'Website Comparison', icon: Scale, path: '/compare' },
];

export const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <motion.aside
      initial={{ width: 240 }}
      animate={{ width: collapsed ? 72 : 240 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="h-screen bg-[#121215] border-r border-zinc-800 flex flex-col relative shrink-0 z-20"
    >
      <div className="h-16 flex items-center px-5 border-b border-zinc-800/50">
        <div className="flex items-center gap-3 overflow-hidden text-nowrap">
          <div className="h-8 w-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Activity size={18} />
          </div>
          {!collapsed && (
            <motion.span 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="font-bold text-white tracking-wide text-sm"
            >
              WebHealth<span className="text-emerald-400">Pro</span>
            </motion.span>
          )}
        </div>
      </div>

      <div className="flex-1 py-6 px-3 flex flex-col gap-2 overflow-y-auto overflow-x-hidden">
        {navItems.map((item, index) => (
          <NavLink
            key={index}
            to={item.path}
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors group relative",
              isActive 
                ? "bg-zinc-800/90 text-white font-medium shadow-sm" 
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40"
            )}
            title={collapsed ? item.name : undefined}
          >
            {({ isActive }) => (
              <>
                <item.icon size={18} className="shrink-0 text-emerald-400" />
                {!collapsed && (
                  <span className="text-xs font-medium whitespace-nowrap">{item.name}</span>
                )}
                {isActive && (
                  <motion.div 
                    layoutId="activeTab"
                    className="absolute left-0 w-1 h-5 bg-emerald-400 rounded-r-full"
                  />
                )}
              </>
            )}
          </NavLink>
        ))}

        <div className="mt-auto p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/60 text-xs text-zinc-400">
          {!collapsed ? (
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <ShieldCheck size={14} />
                <span>Phase 3 Active</span>
              </div>
              <p className="text-[11px] text-zinc-500">Comparison & PDF Reports Ready</p>
            </div>
          ) : (
            <div className="text-center text-emerald-400">
              <ShieldCheck size={16} className="mx-auto" />
            </div>
          )}
        </div>
      </div>

      <div className="p-3 border-t border-zinc-800/50 flex justify-center">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 rounded-lg bg-zinc-800/50 text-zinc-400 hover:text-white transition-colors cursor-pointer"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>
    </motion.aside>
  );
};
