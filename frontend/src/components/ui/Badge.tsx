import { type HTMLAttributes, forwardRef } from 'react';
import { cn } from '../../utils/cn';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'healthy' | 'degraded' | 'down' | 'info' | 'default';
  dot?: boolean;
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', dot = false, children, ...props }, ref) => {
    const variants = {
      healthy: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
      degraded: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
      down: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
      info: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      default: 'bg-zinc-800 text-zinc-300 border-zinc-700',
    };

    const dotColors = {
      healthy: 'bg-emerald-500',
      degraded: 'bg-amber-500',
      down: 'bg-rose-500',
      info: 'bg-blue-500',
      default: 'bg-zinc-400',
    };

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
          variants[variant],
          className
        )}
        {...props}
      >
        {dot && (
          <span className="relative flex h-2 w-2 mr-1.5">
            <span className={cn('animate-ping absolute inline-flex h-full w-full rounded-full opacity-75', dotColors[variant])}></span>
            <span className={cn('relative inline-flex rounded-full h-2 w-2', dotColors[variant])}></span>
          </span>
        )}
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';
