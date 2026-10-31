import { cn } from '../../utils/cn';

interface StatusIndicatorProps {
  status: 'Healthy' | 'Degraded' | 'Down' | 'Unknown';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  animate?: boolean;
}

export const StatusIndicator = ({ status, size = 'md', className, animate = true }: StatusIndicatorProps) => {
  const colors = {
    Healthy: 'bg-emerald-500',
    Degraded: 'bg-amber-500',
    Down: 'bg-rose-500',
    Unknown: 'bg-zinc-500'
  };

  const sizes = {
    sm: 'h-1.5 w-1.5',
    md: 'h-2 w-2',
    lg: 'h-3 w-3'
  };

  return (
    <span className={cn('relative flex', sizes[size], className)}>
      {animate && status !== 'Unknown' && (
        <span className={cn('animate-ping absolute inline-flex h-full w-full rounded-full opacity-75', colors[status])}></span>
      )}
      <span className={cn('relative inline-flex rounded-full', sizes[size], colors[status])}></span>
    </span>
  );
};
