import React, { useState, useEffect, useMemo } from 'react';
import type { AdaptiveImprovementPlan, AdaptiveTask, RoadmapDay } from '../../types/ai';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  CalendarDays,
  CheckCircle2,
  Circle,
  RotateCcw,
  Sparkles,
  Zap,
  Clock,
  Layers,
  AlertTriangle,
  Play,
  Sliders,
  History,
  Check,
  ChevronDown,
  ChevronUp,
  FileCheck2,
  HelpCircle,
  ShieldCheck
} from 'lucide-react';
import {
  getPlannerTaskStates,
  setPlannerTaskState,
  getPlannerWorkload,
  setPlannerWorkload,
  resetPlannerState,
  formatMinutes,
  calculateWorkingDays
} from '../../services/aiService';

interface AdaptiveImprovementPlannerProps {
  adaptivePlan?: AdaptiveImprovementPlan;
  roadmap?: RoadmapDay[];
  planKey: string;
  targetUrl: string;
  onTriggerReAudit?: () => void;
  isReAuditing?: boolean;
}

export const AdaptiveImprovementPlanner: React.FC<AdaptiveImprovementPlannerProps> = ({
  adaptivePlan,
  roadmap,
  planKey,
  targetUrl,
  onTriggerReAudit,
  isReAuditing = false
}) => {
  // Active filter tab: 'all' | 'quick-wins' | 'by-stage'
  const [activeTab, setActiveTab] = useState<'all' | 'quick-wins' | 'by-stage'>('all');
  const [taskStates, setTaskStates] = useState<Record<string, { completed: boolean; completedAt?: string; actualMinutes?: number }>>({});
  const [workloadMinutes, setWorkloadMinutes] = useState<number>(60);
  const [isCustomWorkload, setIsCustomWorkload] = useState(false);
  const [customWorkloadInput, setCustomWorkloadInput] = useState('60');
  const [showHistory, setShowHistory] = useState(false);
  const [editingActualId, setEditingActualId] = useState<string | null>(null);
  const [actualInputMap, setActualInputMap] = useState<Record<string, string>>({});

  // Sync state from localStorage on mount or key change
  useEffect(() => {
    if (planKey) {
      setTaskStates(getPlannerTaskStates(planKey));
      const savedWorkload = getPlannerWorkload(planKey);
      setWorkloadMinutes(savedWorkload);
      setCustomWorkloadInput(String(savedWorkload));
      setIsCustomWorkload(![30, 60, 120, 240].includes(savedWorkload));
    }
  }, [planKey]);

  // Extract tasks array either from adaptivePlan or fallback from legacy roadmap
  const allTasks: AdaptiveTask[] = useMemo(() => {
    if (adaptivePlan && Array.isArray(adaptivePlan.tasks) && adaptivePlan.tasks.length > 0) {
      return adaptivePlan.tasks;
    }

    // Fallback synthesis if only roadmap is present
    if (roadmap && Array.isArray(roadmap) && roadmap.length > 0) {
      const fallbackTasks: AdaptiveTask[] = [];
      let order = 1;
      roadmap.forEach((day) => {
        (day.tasks || []).forEach((t) => {
          fallbackTasks.push({
            id: t.id,
            problem: t.task,
            solution: t.detail,
            category: 'Performance',
            priority: order <= 2 ? 'Critical' : order <= 5 ? 'High' : 'Medium',
            difficulty: order % 2 === 0 ? 'Low' : 'Medium',
            estimatedMinutes: order % 3 === 0 ? 60 : 30,
            effortTier: order % 3 === 0 ? 'Medium Fix' : 'Quick Fix',
            expectedBenefit: 'Expected improvement based on Google Lighthouse diagnostic guidelines.',
            dependencies: 'Standard web development deployment access',
            verificationMethod: 'Execute a fresh Google Lighthouse audit to verify metric gains',
            isQuickWin: order % 2 === 0,
            order: order++,
            phase: day.title
          });
        });
      });
      return fallbackTasks;
    }

    return [];
  }, [adaptivePlan, roadmap]);

  // Filter tasks based on activeTab
  const visibleTasks = useMemo(() => {
    if (activeTab === 'quick-wins') {
      return allTasks.filter((t) => t.isQuickWin);
    }
    return allTasks;
  }, [allTasks, activeTab]);

  if (allTasks.length === 0) return null;

  // Metric totals
  const totalTasksCount = allTasks.length;
  const completedTasks = allTasks.filter((t) => taskStates[t.id]?.completed);
  const completedCount = completedTasks.length;
  const progressPercent = totalTasksCount > 0 ? Math.round((completedCount / totalTasksCount) * 100) : 0;

  const totalEstimatedMinutes = allTasks.reduce((acc, t) => acc + (t.estimatedMinutes || 30), 0);
  const completedEstimatedMinutes = completedTasks.reduce((acc, t) => acc + (t.estimatedMinutes || 30), 0);
  const remainingEstimatedMinutes = Math.max(0, totalEstimatedMinutes - completedEstimatedMinutes);

  const quickWinsCount = allTasks.filter((t) => t.isQuickWin).length;
  const criticalCount = allTasks.filter((t) => t.priority === 'Critical').length;
  const mediumComplexCount = allTasks.filter((t) => t.difficulty === 'Medium' || t.difficulty === 'High').length;

  const estimatedCalendarDays = calculateWorkingDays(remainingEstimatedMinutes, workloadMinutes);

  // Toggle task completion
  const handleToggleTask = (taskId: string) => {
    const currentState = Boolean(taskStates[taskId]?.completed);
    const nextCompleted = !currentState;
    const existingActual = taskStates[taskId]?.actualMinutes;

    const updated = setPlannerTaskState(planKey, taskId, nextCompleted, existingActual);
    setTaskStates({ ...updated });
  };

  // Save actual time spent
  const handleSaveActualTime = (taskId: string, mins: number) => {
    const isCompleted = Boolean(taskStates[taskId]?.completed);
    const updated = setPlannerTaskState(planKey, taskId, isCompleted, mins);
    setTaskStates({ ...updated });
    setEditingActualId(null);
  };

  // Change workload
  const handleWorkloadChange = (minutes: number) => {
    setWorkloadMinutes(minutes);
    setIsCustomWorkload(false);
    setPlannerWorkload(planKey, minutes);
  };

  const handleCustomWorkloadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(customWorkloadInput, 10);
    if (!isNaN(val) && val > 0) {
      setWorkloadMinutes(val);
      setIsCustomWorkload(true);
      setPlannerWorkload(planKey, val);
    }
  };

  // Reset planner states
  const handleReset = () => {
    if (window.confirm('Reset all task checkmarks and logged completion times for this website plan?')) {
      resetPlannerState(planKey);
      setTaskStates({});
    }
  };

  // Priority badge styling
  const renderPriorityBadge = (priority: AdaptiveTask['priority']) => {
    switch (priority) {
      case 'Critical':
        return <Badge variant="down" className="bg-rose-950/80 text-rose-300 border border-rose-500/50">Critical</Badge>;
      case 'High':
        return <Badge variant="degraded" className="bg-amber-950/80 text-amber-300 border border-amber-500/50">High</Badge>;
      case 'Medium':
        return <Badge variant="info" className="bg-blue-950/80 text-blue-300 border border-blue-500/50">Medium</Badge>;
      default:
        return <Badge variant="default" className="bg-gray-800 text-gray-400">Low</Badge>;
    }
  };

  // Effort Tier badge styling
  const renderEffortTierBadge = (tier: AdaptiveTask['effortTier'], minutes: number) => {
    switch (tier) {
      case 'Quick Fix':
        return (
          <span className="text-[11px] px-2 py-0.5 rounded font-medium bg-emerald-950/50 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
            <Zap className="w-3 h-3 text-emerald-400" />
            <span>Quick Fix ({formatMinutes(minutes)})</span>
          </span>
        );
      case 'Medium Fix':
        return (
          <span className="text-[11px] px-2 py-0.5 rounded font-medium bg-indigo-950/50 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
            <Clock className="w-3 h-3 text-indigo-400" />
            <span>Medium Fix ({formatMinutes(minutes)})</span>
          </span>
        );
      default:
        return (
          <span className="text-[11px] px-2 py-0.5 rounded font-medium bg-purple-950/50 text-purple-300 border border-purple-500/30 flex items-center gap-1">
            <Layers className="w-3 h-3 text-purple-400" />
            <span>Complex Fix ({formatMinutes(minutes)})</span>
          </span>
        );
    }
  };

  return (
    <Card className="p-6 md:p-8 bg-[#11131a] border-gray-800 shadow-2xl space-y-6">
      {/* 1. Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-emerald-600 to-blue-600 text-white shadow-lg shadow-emerald-500/20">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="text-lg md:text-xl font-bold text-white tracking-tight flex items-center gap-2">
              ADAPTIVE WEBSITE IMPROVEMENT PLANNER
              <Badge variant="default" className="bg-emerald-950/60 text-emerald-300 border-emerald-500/30 text-[10px]">
                Dynamic Task Plan
              </Badge>
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Evidence-based engineering sprint customized to {targetUrl}'s measured gaps — replacing rigid fixed-day roadmaps with real effort estimates.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {onTriggerReAudit && (
            <Button
              variant="primary"
              size="sm"
              onClick={onTriggerReAudit}
              disabled={isReAuditing}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-3.5 py-1.5 flex items-center gap-1.5 shadow-md shadow-emerald-600/20 font-semibold cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isReAuditing ? 'Auditing...' : 'Re-Audit Improved Website'}</span>
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="text-gray-400 hover:text-rose-400 text-xs px-2.5 py-1.5 flex items-center gap-1 border border-gray-800 cursor-pointer"
            title="Reset task checkmarks"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </Button>
        </div>
      </div>

      {/* 2. Top Analytics Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Estimated Effort */}
        <div className="p-3.5 rounded-xl bg-gray-900/40 border border-gray-800 flex flex-col justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            Total Effort
          </span>
          <div className="my-1.5">
            <span className="text-xl font-black text-white font-mono">
              {formatMinutes(totalEstimatedMinutes)}
            </span>
          </div>
          <span className="text-[10px] text-gray-400">
            Guideline estimate
          </span>
        </div>

        {/* Remaining Effort */}
        <div className="p-3.5 rounded-xl bg-gray-900/40 border border-gray-800 flex flex-col justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            Remaining
          </span>
          <div className="my-1.5">
            <span className="text-xl font-black text-amber-400 font-mono">
              {formatMinutes(remainingEstimatedMinutes)}
            </span>
          </div>
          <span className="text-[10px] text-gray-400">
            {completedCount}/{totalTasksCount} tasks done
          </span>
        </div>

        {/* Identified Issues */}
        <div className="p-3.5 rounded-xl bg-gray-900/40 border border-gray-800 flex flex-col justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-blue-400" />
            Identified Tasks
          </span>
          <div className="my-1.5 flex items-baseline gap-1.5">
            <span className="text-xl font-black text-white font-mono">{totalTasksCount}</span>
            <span className="text-xs text-gray-400">tasks</span>
          </div>
          <span className="text-[10px] text-gray-400">
            Backed by audit data
          </span>
        </div>

        {/* Quick Wins */}
        <div
          onClick={() => setActiveTab(activeTab === 'quick-wins' ? 'all' : 'quick-wins')}
          className={`p-3.5 rounded-xl border flex flex-col justify-between cursor-pointer transition ${
            activeTab === 'quick-wins'
              ? 'bg-emerald-950/40 border-emerald-500/60 shadow-md shadow-emerald-500/10'
              : 'bg-gray-900/40 border-gray-800 hover:border-gray-700'
          }`}
        >
          <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
            Quick Wins
          </span>
          <div className="my-1.5 flex items-baseline gap-1.5">
            <span className="text-xl font-black text-emerald-400 font-mono">{quickWinsCount}</span>
            <span className="text-xs text-emerald-300/80">fast fixes</span>
          </div>
          <span className="text-[10px] text-gray-400 underline">
            {activeTab === 'quick-wins' ? 'Viewing quick wins' : 'Filter quick wins'}
          </span>
        </div>

        {/* Critical Fixes */}
        <div className="p-3.5 rounded-xl bg-gray-900/40 border border-gray-800 flex flex-col justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-rose-400 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            Critical Fixes
          </span>
          <div className="my-1.5 flex items-baseline gap-1.5">
            <span className="text-xl font-black text-rose-400 font-mono">{criticalCount}</span>
            <span className="text-xs text-gray-400">high severity</span>
          </div>
          <span className="text-[10px] text-gray-400">
            {mediumComplexCount} moderate/complex
          </span>
        </div>

        {/* Projected Calendar Duration */}
        <div className="p-3.5 rounded-xl bg-gray-900/40 border border-gray-800 flex flex-col justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-purple-400 flex items-center gap-1">
            <CalendarDays className="w-3.5 h-3.5 text-purple-400" />
            Est. Calendar
          </span>
          <div className="my-1.5 flex items-baseline gap-1.5">
            <span className="text-xl font-black text-purple-300 font-mono">
              ~{estimatedCalendarDays}
            </span>
            <span className="text-xs text-gray-400">{estimatedCalendarDays === 1 ? 'day' : 'days'}</span>
          </div>
          <span className="text-[10px] text-gray-400 truncate">
            at {formatMinutes(workloadMinutes)}/day
          </span>
        </div>
      </div>

      {/* 3. Progress Bar & Workload Configuration Row */}
      <div className="p-4 rounded-xl bg-gray-900/50 border border-gray-800 space-y-4">
        {/* Progress header & Bar */}
        <div>
          <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
            <span className="font-semibold text-gray-300 flex items-center gap-1.5">
              <FileCheck2 className="w-4 h-4 text-emerald-400" />
              <span>Sprint Completion Progress</span>
            </span>
            <span className="font-mono text-emerald-400 font-bold">
              {progressPercent}% ({completedCount} of {totalTasksCount} completed)
            </span>
          </div>
          <div className="w-full bg-gray-950 rounded-full h-2.5 overflow-hidden border border-gray-800">
            <div
              className="bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500 h-2.5 transition-all duration-500 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Workload Settings Bar */}
        <div className="pt-3 border-t border-gray-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-indigo-400" />
            <span className="font-semibold text-gray-300">Available Daily Workload:</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { label: '30m/day', mins: 30 },
              { label: '1h/day', mins: 60 },
              { label: '2h/day', mins: 120 },
              { label: '4h/day', mins: 240 }
            ].map((option) => (
              <button
                key={option.mins}
                type="button"
                onClick={() => handleWorkloadChange(option.mins)}
                className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition cursor-pointer ${
                  workloadMinutes === option.mins && !isCustomWorkload
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm'
                    : 'bg-gray-950 border-gray-800 hover:border-gray-700 text-gray-400'
                }`}
              >
                {option.label}
              </button>
            ))}

            {/* Custom workload form */}
            <form onSubmit={handleCustomWorkloadSubmit} className="flex items-center gap-1 ml-1">
              <input
                type="number"
                min="15"
                max="960"
                step="15"
                value={customWorkloadInput}
                onChange={(e) => setCustomWorkloadInput(e.target.value)}
                placeholder="mins"
                className="w-16 px-2 py-1 rounded-lg bg-gray-950 border border-gray-800 text-white text-xs font-mono focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                className={`px-2 py-1 rounded-lg border text-xs transition cursor-pointer ${
                  isCustomWorkload
                    ? 'bg-indigo-600 border-indigo-500 text-white'
                    : 'bg-gray-950 border-gray-800 hover:border-gray-700 text-gray-400'
                }`}
              >
                Set Custom
              </button>
            </form>
          </div>
        </div>

        <div className="text-[11px] text-gray-400 flex items-center gap-1.5">
          <HelpCircle className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <span>
            Calendar days reflect remaining active engineering effort divided by your daily workload. Tasks requiring staging review or deployments are non-continuous.
          </span>
        </div>
      </div>

      {/* 4. Filter View Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'all'
                ? 'bg-indigo-950/60 text-indigo-300 border-indigo-500/50'
                : 'bg-gray-900/40 text-gray-400 border-gray-800 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>All Identified Tasks ({totalTasksCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('quick-wins')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'quick-wins'
                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/50'
                : 'bg-gray-900/40 text-gray-400 border-gray-800 hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
            <span>Quick Wins Only ({quickWinsCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('by-stage')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'by-stage'
                ? 'bg-purple-950/60 text-purple-300 border-purple-500/50'
                : 'bg-gray-900/40 text-gray-400 border-gray-800 hover:text-white'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5 text-purple-400" />
            <span>Grouped by Phase</span>
          </button>
        </div>

        {completedCount > 0 && (
          <button
            type="button"
            onClick={() => setShowHistory(!showHistory)}
            className="text-xs text-gray-400 hover:text-gray-200 flex items-center gap-1 cursor-pointer"
          >
            <History className="w-3.5 h-3.5 text-indigo-400" />
            <span>{showHistory ? 'Hide Completed History' : `Completed History (${completedCount})`}</span>
            {showHistory ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>

      {/* 5. Completed Tasks History Drawer */}
      {showHistory && completedTasks.length > 0 && (
        <div className="p-4 rounded-xl bg-gray-950/70 border border-gray-800 space-y-2.5 text-xs animate-fadeIn">
          <div className="font-semibold text-emerald-400 flex items-center gap-1.5 pb-2 border-b border-gray-800">
            <CheckCircle2 className="w-4 h-4" />
            <span>Completed Task History Log</span>
          </div>
          <div className="space-y-2 divide-y divide-gray-800/60">
            {completedTasks.map((t) => {
              const state = taskStates[t.id];
              return (
                <div key={t.id} className="pt-2 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="text-gray-300 line-through">{t.problem}</span>
                  </div>
                  <div className="text-[11px] text-gray-400 shrink-0 flex items-center gap-2">
                    <span>Est: {formatMinutes(t.estimatedMinutes)}</span>
                    {state?.actualMinutes && (
                      <span className="text-emerald-400 font-semibold font-mono">
                        (Actual: {formatMinutes(state.actualMinutes)})
                      </span>
                    )}
                    {state?.completedAt && (
                      <span>{new Date(state.completedAt).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 6. Dynamic Task List Rendering */}
      <div className="space-y-3.5">
        {visibleTasks.map((task) => {
          const isDone = Boolean(taskStates[task.id]?.completed);
          const state = taskStates[task.id];
          const isEditingActual = editingActualId === task.id;

          return (
            <div
              key={task.id}
              className={`p-4 md:p-5 rounded-xl border transition duration-200 ${
                isDone
                  ? 'bg-emerald-950/15 border-emerald-500/30 text-gray-300'
                  : 'bg-gray-900/40 border-gray-800 hover:border-gray-700 text-white'
              }`}
            >
              <div className="flex items-start gap-3.5">
                {/* Interactive Checkbox */}
                <button
                  type="button"
                  onClick={() => handleToggleTask(task.id)}
                  aria-label={isDone ? 'Mark as incomplete' : 'Mark as complete'}
                  className="mt-1 shrink-0 text-indigo-400 hover:text-emerald-400 transition cursor-pointer"
                >
                  {isDone ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <Circle className="w-5 h-5 text-gray-500 hover:text-gray-300" />
                  )}
                </button>

                {/* Content body */}
                <div className="space-y-2 flex-1">
                  {/* Top Badges Row */}
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    {renderPriorityBadge(task.priority)}
                    {renderEffortTierBadge(task.effortTier, task.estimatedMinutes)}
                    <span className="text-[11px] px-2 py-0.5 rounded bg-gray-800 text-gray-300">
                      {task.category}
                    </span>
                    {task.isQuickWin && (
                      <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 font-semibold flex items-center gap-1">
                        <Zap className="w-3 h-3 text-emerald-400" />
                        <span>Quick Win</span>
                      </span>
                    )}
                    {task.phase && (
                      <span className="text-[10px] text-gray-400 font-mono hidden sm:inline">
                        [{task.phase}]
                      </span>
                    )}
                  </div>

                  {/* Problem Statement */}
                  <h4 className={`text-sm md:text-base font-bold tracking-tight ${isDone ? 'line-through text-gray-400' : 'text-white'}`}>
                    {task.problem}
                  </h4>

                  {/* Recommended Solution */}
                  <p className="text-xs text-gray-300 leading-relaxed">
                    <span className="font-semibold text-emerald-400">Recommended Solution: </span>
                    {task.solution}
                  </p>

                  {/* Metadata: Dependencies & Verification */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1 text-xs">
                    <div className="p-2.5 rounded-lg bg-black/40 border border-gray-800/80 text-gray-300">
                      <span className="text-[11px] font-semibold uppercase text-indigo-300 block mb-0.5">
                        Required Dependencies:
                      </span>
                      <span>{task.dependencies || 'None - local code change'}</span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-black/40 border border-gray-800/80 text-gray-300">
                      <span className="text-[11px] font-semibold uppercase text-emerald-300 block mb-0.5 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-emerald-400" />
                        Verification Method:
                      </span>
                      <span>{task.verificationMethod || 'Verify in fresh Lighthouse audit'}</span>
                    </div>
                  </div>

                  {/* Expected Benefit & Actual Time logger */}
                  <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-gray-800/60 text-xs">
                    <div className="text-gray-400">
                      <span className="font-medium text-gray-300">Expected Benefit: </span>
                      <span className="text-emerald-400">{task.expectedBenefit}</span>
                    </div>

                    {/* Actual Time Logger */}
                    <div className="flex items-center gap-2">
                      {isEditingActual ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="1"
                            max="999"
                            placeholder="mins"
                            value={actualInputMap[task.id] || ''}
                            onChange={(e) => setActualInputMap({ ...actualInputMap, [task.id]: e.target.value })}
                            className="w-16 px-1.5 py-0.5 rounded bg-gray-950 border border-gray-700 text-white text-xs font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const val = parseInt(actualInputMap[task.id] || '', 10);
                              if (!isNaN(val) && val > 0) {
                                handleSaveActualTime(task.id, val);
                              }
                            }}
                            className="px-2 py-0.5 rounded bg-emerald-600 text-white text-xs"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingActualId(null)}
                            className="px-1.5 py-0.5 rounded text-gray-400 text-xs"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingActualId(task.id);
                            setActualInputMap({ ...actualInputMap, [task.id]: String(state?.actualMinutes || '') });
                          }}
                          className="text-[11px] text-gray-400 hover:text-indigo-300 underline cursor-pointer"
                        >
                          {state?.actualMinutes ? `Actual time: ${formatMinutes(state.actualMinutes)}` : '+ Log actual time spent'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 7. Bottom Disclaimer */}
      <div className="pt-2 text-[11px] text-gray-400 border-t border-gray-800 flex items-start gap-1.5">
        <HelpCircle className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
        <span>
          Task time estimates are diagnostic guidelines calibrated to typical front-end engineering velocity, not contractual delivery promises. Always verify production performance gains using the live Before-and-After Tracker.
        </span>
      </div>
    </Card>
  );
};

// Also export alias for backward compatibility
export const ImprovementRoadmap = AdaptiveImprovementPlanner;
