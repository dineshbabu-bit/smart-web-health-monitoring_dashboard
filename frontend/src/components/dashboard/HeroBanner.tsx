import { Button } from '../ui/Button';
import { Plus, Activity } from 'lucide-react';
import { StatusIndicator } from '../ui/StatusIndicator';

export const HeroBanner = () => {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Activity size={18} className="text-emerald-500" />
          <h2 className="text-2xl font-bold text-white tracking-tight">Good afternoon, Admin</h2>
        </div>
        <p className="text-zinc-400 text-sm max-w-lg">
          Monitor the health and performance of your applications in real time.
        </p>
      </div>
      
      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#121215] border border-zinc-800 text-zinc-400 text-xs">
          <StatusIndicator status="Healthy" size="sm" animate={true} />
          <span>All systems operational</span>
        </div>
        <Button variant="primary" className="group">
          <Plus size={16} className="mr-2 group-hover:rotate-90 transition-transform duration-300" />
          Add Application
        </Button>
      </div>
    </div>
  );
};
