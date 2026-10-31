import React, { useState } from 'react';
import { Trash2, Eye, Monitor, Smartphone, Calendar } from 'lucide-react';
import type { ScanHistoryRecord } from '../../types/history';
import { getScoreColor } from '../../utils/healthCalculator';

interface HistoryTableProps {
  scans: ScanHistoryRecord[];
  onViewScan: (scan: ScanHistoryRecord) => void;
  onDeleteScan: (id: string) => void;
  selectedScanId?: string;
}

export const HistoryTable: React.FC<HistoryTableProps> = ({
  scans,
  onViewScan,
  onDeleteScan,
  selectedScanId,
}) => {
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeleteConfirmId(id);
  };

  const handleConfirmDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    onDeleteScan(id);
    setDeleteConfirmId(null);
  };

  const handleCancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteConfirmId(null);
  };

  return (
    <div className="bg-[#121215]/90 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl mb-8">
      {/* Responsive Table for Desktop & Tablet */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-zinc-900/90 text-zinc-400 uppercase text-[10px] tracking-wider border-b border-zinc-800">
            <tr>
              <th className="py-3.5 px-4 font-semibold">Website</th>
              <th className="py-3.5 px-3 font-semibold">Device</th>
              <th className="py-3.5 px-3 font-semibold text-center">Health</th>
              <th className="py-3.5 px-3 font-semibold text-center">Perf</th>
              <th className="py-3.5 px-3 font-semibold text-center">LCP</th>
              <th className="py-3.5 px-3 font-semibold text-center">INP</th>
              <th className="py-3.5 px-3 font-semibold text-center">CLS</th>
              <th className="py-3.5 px-4 font-semibold">Scanned Date</th>
              <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {scans.map((scan) => {
              const healthColor = getScoreColor(scan.healthScore);
              const perfColor = getScoreColor(scan.scores?.performance);
              const isSelected = selectedScanId === scan.id;

              return (
                <tr
                  key={scan.id}
                  onClick={() => onViewScan(scan)}
                  className={`hover:bg-zinc-800/40 transition-colors cursor-pointer group ${
                    isSelected ? 'bg-zinc-800/60 border-l-2 border-emerald-400' : ''
                  }`}
                >
                  {/* Website Hostname & URL */}
                  <td className="py-3.5 px-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-white text-sm group-hover:text-emerald-400 transition-colors flex items-center gap-1.5">
                        {scan.hostname}
                      </span>
                      <span className="text-[11px] text-zinc-400 truncate max-w-[200px] md:max-w-[260px] font-mono">
                        {scan.url}
                      </span>
                    </div>
                  </td>

                  {/* Device Badge */}
                  <td className="py-3.5 px-3">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-zinc-900 border border-zinc-800 text-zinc-300">
                      {scan.device === 'desktop' ? (
                        <Monitor size={12} className="text-emerald-400" />
                      ) : (
                        <Smartphone size={12} className="text-emerald-400" />
                      )}
                      <span className="capitalize">{scan.device}</span>
                    </span>
                  </td>

                  {/* Overall Health Score */}
                  <td className="py-3.5 px-3 text-center">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold font-mono ${healthColor.bg} ${healthColor.text} border ${healthColor.border}`}
                    >
                      {scan.healthScore}
                    </span>
                  </td>

                  {/* Performance Score */}
                  <td className="py-3.5 px-3 text-center">
                    <span className={`font-mono font-bold text-xs ${perfColor.text}`}>
                      {scan.scores?.performance ?? 'N/A'}
                    </span>
                  </td>

                  {/* LCP */}
                  <td className="py-3.5 px-3 text-center font-mono text-zinc-300">
                    {scan.metrics?.largestContentfulPaint?.displayValue || 'N/A'}
                  </td>

                  {/* INP */}
                  <td className="py-3.5 px-3 text-center font-mono text-zinc-300">
                    {scan.metrics?.interactionToNextPaint?.displayValue || 'N/A'}
                  </td>

                  {/* CLS */}
                  <td className="py-3.5 px-3 text-center font-mono text-zinc-300">
                    {scan.metrics?.cumulativeLayoutShift?.displayValue || '0'}
                  </td>

                  {/* Date */}
                  <td className="py-3.5 px-4 text-zinc-400 text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={12} className="text-zinc-500" />
                      <span>{formatDate(scan.timestamp)}</span>
                    </div>
                  </td>

                  {/* Action Buttons */}
                  <td className="py-3.5 px-4 text-right">
                    {deleteConfirmId === scan.id ? (
                      <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={(e) => handleConfirmDelete(e, scan.id)}
                          className="px-2 py-1 rounded bg-rose-500 hover:bg-rose-600 text-white text-[11px] font-semibold"
                        >
                          Confirm
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelDelete}
                          className="px-2 py-1 rounded bg-zinc-800 text-zinc-300 text-[11px]"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => onViewScan(scan)}
                          className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 transition-colors"
                          title="View Full Scan Dashboard"
                        >
                          <Eye size={14} />
                        </button>

                        <button
                          type="button"
                          onClick={(e) => handleDeleteClick(e, scan.id)}
                          className="p-1.5 rounded-lg bg-zinc-900 hover:bg-rose-500/20 text-zinc-500 hover:text-rose-400 border border-zinc-800 hover:border-rose-500/30 transition-colors"
                          title="Delete Scan Record"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
