import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import type { Application } from '../../types/monitoring';
import { MoreVertical, ExternalLink, Activity } from 'lucide-react';
import { cn } from '../../utils/cn';

interface LiveAppMonitoringTableProps {
  applications: Application[];
}

export const LiveAppMonitoringTable = ({ applications }: LiveAppMonitoringTableProps) => {
  const getResponseTimeColor = (time: number | null, threshold: number) => {
    if (time === null) return 'text-zinc-500';
    if (time > threshold) return 'text-amber-500';
    return 'text-emerald-500';
  };

  return (
    <Card className="overflow-hidden">
      <div className="px-6 py-4 border-b border-zinc-800/50 flex justify-between items-center">
        <h3 className="font-semibold text-white">Live Application Monitoring</h3>
        <button className="text-xs text-zinc-400 hover:text-white transition-colors flex items-center gap-1">
          View All <ExternalLink size={12} />
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-zinc-500 bg-[#121215]/50 uppercase">
            <tr>
              <th className="px-6 py-3 font-medium">Application</th>
              <th className="px-6 py-3 font-medium">Status</th>
              <th className="px-6 py-3 font-medium">Response Time</th>
              <th className="px-6 py-3 font-medium">Uptime</th>
              <th className="px-6 py-3 font-medium">Last Checked</th>
              <th className="px-6 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50">
            {applications.map((app) => (
              <tr key={app.id} className="hover:bg-zinc-800/20 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="font-medium text-zinc-200">{app.name}</span>
                    <span className="text-xs text-zinc-500 truncate max-w-[200px]">{app.url}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <Badge variant={app.status.toLowerCase() as any} dot={true}>
                    {app.status}
                  </Badge>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Activity size={14} className={getResponseTimeColor(app.lastResponseTime, app.warningThreshold)} />
                    <span className={cn('tabular-nums font-mono', getResponseTimeColor(app.lastResponseTime, app.warningThreshold))}>
                      {app.lastResponseTime ? `${app.lastResponseTime}ms` : 'Timeout'}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="tabular-nums font-mono text-zinc-300">{app.uptime.toFixed(2)}%</span>
                </td>
                <td className="px-6 py-4 text-zinc-500 text-xs tabular-nums">
                  {app.lastChecked ? new Date(app.lastChecked).toLocaleTimeString() : 'N/A'}
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="text-zinc-500 hover:text-white p-1 rounded-md hover:bg-zinc-800 transition-colors opacity-0 group-hover:opacity-100">
                    <MoreVertical size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};
