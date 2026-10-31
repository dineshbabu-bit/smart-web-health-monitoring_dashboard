import { Card } from '../ui/Card';
import type { Application } from '../../types/monitoring';
import { Server, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

interface HealthSummaryCardsProps {
  applications: Application[];
}

export const HealthSummaryCards = ({ applications }: HealthSummaryCardsProps) => {
  const total = applications.length;
  const healthy = applications.filter(a => a.status === 'Healthy').length;
  const degraded = applications.filter(a => a.status === 'Degraded').length;
  const down = applications.filter(a => a.status === 'Down').length;

  const metrics = [
    {
      title: 'Total Applications',
      value: total,
      subtext: '+2 this month',
      icon: Server,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20'
    },
    {
      title: 'Healthy',
      value: healthy,
      subtext: total > 0 ? `${Math.round((healthy / total) * 100)}%` : '0%',
      icon: CheckCircle2,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20'
    },
    {
      title: 'Degraded',
      value: degraded,
      subtext: total > 0 ? `${Math.round((degraded / total) * 100)}%` : '0%',
      icon: AlertTriangle,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20'
    },
    {
      title: 'Down',
      value: down,
      subtext: total > 0 ? `${Math.round((down / total) * 100)}%` : '0%',
      icon: XCircle,
      color: 'text-rose-500',
      bg: 'bg-rose-500/10',
      border: 'border-rose-500/20'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {metrics.map((metric, i) => (
        <Card key={i} hoverEffect className="p-5 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-zinc-400 font-medium text-sm">{metric.title}</h3>
            <div className={`p-2 rounded-lg ${metric.bg} ${metric.color}`}>
              <metric.icon size={18} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white tabular-nums">{metric.value}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full border ${metric.bg} ${metric.color} ${metric.border}`}>
              {metric.subtext}
            </span>
          </div>
        </Card>
      ))}
    </div>
  );
};
