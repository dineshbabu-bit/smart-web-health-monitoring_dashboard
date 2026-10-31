import React from 'react';
import { Search, Monitor, Smartphone, Layers, Trash2, ArrowUpDown } from 'lucide-react';
import type { HistoryFilterOptions, HistorySortOption } from '../../types/history';

interface HistoryFiltersProps {
  filters: HistoryFilterOptions;
  onFilterChange: (filters: HistoryFilterOptions) => void;
  onClearAll: () => void;
  totalCount: number;
  filteredCount: number;
}

export const HistoryFilters: React.FC<HistoryFiltersProps> = ({
  filters,
  onFilterChange,
  onClearAll,
  totalCount,
  filteredCount,
}) => {
  return (
    <div className="bg-[#121215]/90 border border-zinc-800 rounded-2xl p-4 md:p-5 mb-6 shadow-xl">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Search input */}
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={filters.searchQuery}
            onChange={(e) => onFilterChange({ ...filters, searchQuery: e.target.value })}
            placeholder="Search scans by URL or domain (e.g. example.com)..."
            className="w-full h-10 pl-10 pr-4 bg-zinc-900 border border-zinc-800 rounded-xl text-xs md:text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        {/* Controls row */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Device filter pills */}
          <div className="flex items-center p-1 bg-zinc-900 border border-zinc-800 rounded-xl text-xs">
            <button
              type="button"
              onClick={() => onFilterChange({ ...filters, device: 'all' })}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                filters.device === 'all'
                  ? 'bg-zinc-800 text-white shadow-sm font-medium'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Layers size={13} />
              <span>All</span>
            </button>
            <button
              type="button"
              onClick={() => onFilterChange({ ...filters, device: 'desktop' })}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                filters.device === 'desktop'
                  ? 'bg-zinc-800 text-white shadow-sm font-medium'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Monitor size={13} className={filters.device === 'desktop' ? 'text-emerald-400' : ''} />
              <span>Desktop</span>
            </button>
            <button
              type="button"
              onClick={() => onFilterChange({ ...filters, device: 'mobile' })}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                filters.device === 'mobile'
                  ? 'bg-zinc-800 text-white shadow-sm font-medium'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Smartphone size={13} className={filters.device === 'mobile' ? 'text-emerald-400' : ''} />
              <span>Mobile</span>
            </button>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-300">
            <ArrowUpDown size={14} className="text-zinc-500" />
            <select
              value={filters.sortBy}
              onChange={(e) => onFilterChange({ ...filters, sortBy: e.target.value as HistorySortOption })}
              className="bg-transparent text-xs text-white focus:outline-none cursor-pointer"
            >
              <option value="newest" className="bg-zinc-900 text-white">Newest First</option>
              <option value="oldest" className="bg-zinc-900 text-white">Oldest First</option>
              <option value="health_desc" className="bg-zinc-900 text-white">Highest Health</option>
              <option value="health_asc" className="bg-zinc-900 text-white">Lowest Health</option>
            </select>
          </div>

          {/* Clear All Button */}
          {totalCount > 0 && (
            <button
              type="button"
              onClick={onClearAll}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-medium transition-colors cursor-pointer"
            >
              <Trash2 size={13} />
              <span>Clear History</span>
            </button>
          )}
        </div>
      </div>

      {/* Result stats summary */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-zinc-800/60 text-[11px] text-zinc-400">
        <span>
          Showing <strong className="text-white font-mono">{filteredCount}</strong> of <strong className="text-white font-mono">{totalCount}</strong> total audits
        </span>
        {filters.searchQuery && (
          <button
            type="button"
            onClick={() => onFilterChange({ ...filters, searchQuery: '' })}
            className="text-emerald-400 hover:underline cursor-pointer"
          >
            Clear search
          </button>
        )}
      </div>
    </div>
  );
};
