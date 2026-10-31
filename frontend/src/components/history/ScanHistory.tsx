import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { History, TrendingUp, Gauge, AlertTriangle, X } from 'lucide-react';
import type { ScanHistoryRecord, HistoryFilterOptions } from '../../types/history';
import {
  getAllScans,
  deleteScan,
  clearAllHistory,
  getUniqueWebsites,
} from '../../services/scanHistoryService';
import { HistoryFilters } from './HistoryFilters';
import { HistoryTable } from './HistoryTable';
import { PerformanceTrend } from './PerformanceTrend';
import { VitalsTrend } from './VitalsTrend';
import { HistoryDetail } from './HistoryDetail';
import { EmptyHistoryState } from './EmptyHistoryState';

interface ScanHistoryProps {
  onNavigateToAudit?: () => void;
  initialSelectedScanId?: string | null;
}

export const ScanHistory: React.FC<ScanHistoryProps> = ({
  onNavigateToAudit,
  initialSelectedScanId,
}) => {
  const [scans, setScans] = useState<ScanHistoryRecord[]>([]);
  const [selectedScan, setSelectedScan] = useState<ScanHistoryRecord | null>(null);
  const [previousScan, setPreviousScan] = useState<ScanHistoryRecord | null>(null);
  const [activeTab, setActiveTab] = useState<'scans' | 'trends' | 'vitals'>('scans');
  const [selectedHostname, setSelectedHostname] = useState<string>('all');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const [filters, setFilters] = useState<HistoryFilterOptions>({
    searchQuery: '',
    device: 'all',
    sortBy: 'newest',
  });

  const handleViewScan = useCallback((scan: ScanHistoryRecord, currentScansList = scans) => {
    setSelectedScan(scan);

    // Find the previous scan for the same hostname to compute deltas
    const hostScans = currentScansList
      .filter((s) => (s.hostname || '').toLowerCase() === (scan.hostname || '').toLowerCase())
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    const currentIndex = hostScans.findIndex((s) => s.id === scan.id);
    if (currentIndex > 0) {
      setPreviousScan(hostScans[currentIndex - 1]);
    } else {
      setPreviousScan(null);
    }
  }, [scans]);

  const loadScans = useCallback(() => {
    const loaded = getAllScans();
    setScans(loaded);

    if (initialSelectedScanId) {
      const target = loaded.find((s) => s.id === initialSelectedScanId);
      if (target) {
        handleViewScan(target, loaded);
      }
    }
  }, [initialSelectedScanId, handleViewScan]);

  useEffect(() => {
    loadScans();
  }, [loadScans]);

  const handleDeleteScan = (id: string) => {
    deleteScan(id);
    if (selectedScan?.id === id) {
      setSelectedScan(null);
    }
    loadScans();
  };

  const handleClearAll = () => {
    clearAllHistory();
    setScans([]);
    setSelectedScan(null);
    setShowClearConfirm(false);
  };

  // Memoize filtered and sorted scans O(N log N) -> O(1) on non-filter renders
  const filteredScans = useMemo(() => {
    const q = filters.searchQuery ? filters.searchQuery.toLowerCase().trim() : '';
    const isDeviceAll = filters.device === 'all';
    const isHostAll = selectedHostname === 'all';
    const targetHost = isHostAll ? '' : selectedHostname.toLowerCase();

    const matched = scans.filter((scan) => {
      // 1. Search Query filter
      if (q) {
        const matchesUrl = scan.url.toLowerCase().includes(q);
        const matchesHost = scan.hostname.toLowerCase().includes(q);
        if (!matchesUrl && !matchesHost) return false;
      }

      // 2. Device filter
      if (!isDeviceAll && scan.device !== filters.device) {
        return false;
      }

      // 3. Hostname filter
      if (!isHostAll && scan.hostname.toLowerCase() !== targetHost) {
        return false;
      }

      return true;
    });

    return matched.sort((a, b) => {
      switch (filters.sortBy) {
        case 'newest':
          return (Date.parse(b.timestamp) || 0) - (Date.parse(a.timestamp) || 0);
        case 'oldest':
          return (Date.parse(a.timestamp) || 0) - (Date.parse(b.timestamp) || 0);
        case 'health_desc':
          return b.healthScore - a.healthScore;
        case 'health_asc':
          return a.healthScore - b.healthScore;
        default:
          return 0;
      }
    });
  }, [scans, filters, selectedHostname]);

  // Memoize unique websites list O(N) -> O(1)
  const uniqueWebsites = useMemo(() => getUniqueWebsites(scans), [scans]);

  // If a specific scan is selected for full detail inspection
  if (selectedScan) {
    return (
      <HistoryDetail
        currentScan={selectedScan}
        previousScan={previousScan}
        onBack={() => setSelectedScan(null)}
      />
    );
  }

  // If no scans recorded yet
  if (scans.length === 0) {
    return <EmptyHistoryState onStartAudit={onNavigateToAudit || (() => {})} />;
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Header & Tab Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <History size={22} className="text-emerald-400" />
            <span>Audit History & Trend Studio</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Review past Lighthouse audits, track score progression, and measure Core Web Vitals trajectories.
          </p>
        </div>

        {/* View mode tabs */}
        <div className="flex items-center p-1 bg-zinc-900 border border-zinc-800 rounded-xl text-xs self-start md:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('scans')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'scans' ? 'bg-zinc-800 text-white font-semibold shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <History size={14} />
            <span>Scan Log ({scans.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('trends')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'trends' ? 'bg-zinc-800 text-white font-semibold shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <TrendingUp size={14} className={activeTab === 'trends' ? 'text-emerald-400' : ''} />
            <span>Health Trends</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('vitals')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'vitals' ? 'bg-zinc-800 text-white font-semibold shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Gauge size={14} className={activeTab === 'vitals' ? 'text-blue-400' : ''} />
            <span>Web Vitals Trajectory</span>
          </button>
        </div>
      </div>

      {/* Filter and search bar */}
      <HistoryFilters
        filters={filters}
        onFilterChange={setFilters}
        onClearAll={() => setShowClearConfirm(true)}
        totalCount={scans.length}
        filteredCount={filteredScans.length}
      />

      {/* Tab Contents */}
      {activeTab === 'scans' && (
        <HistoryTable
          scans={filteredScans}
          onViewScan={handleViewScan}
          onDeleteScan={handleDeleteScan}
        />
      )}

      {activeTab === 'trends' && (
        <PerformanceTrend
          scans={scans}
          selectedHostname={selectedHostname}
          onSelectHostname={setSelectedHostname}
          uniqueWebsites={uniqueWebsites}
        />
      )}

      {activeTab === 'vitals' && (
        <VitalsTrend
          scans={scans}
          selectedHostname={selectedHostname}
        />
      )}

      {/* Clear All Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#121215] border border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5 text-rose-400">
                <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20">
                  <AlertTriangle size={20} />
                </div>
                <h3 className="font-bold text-white text-base">Clear All Scan History?</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="text-zinc-500 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed mb-6">
              Are you sure you want to delete all <strong className="text-white">{scans.length}</strong> recorded audit snapshots? This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold border border-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleClearAll}
                className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold transition-colors"
              >
                Yes, Clear All History
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
