import type { WinnerSide } from './comparison';
import type { AuditResponseData } from './audit';

export interface AiTopProblem {
  problem: string;
  solution: string;
}

export interface AiVerdict {
  winner: WinnerSide;
  isTie: boolean;
  strongerUrl: string;
  weakerUrl: string;
  strongerHealthScore: number;
  weakerHealthScore: number;
  scoreDifference: number;
  weakestCategory: string;
  weakestCategoryScore: number;
  summary: string;
  topProblems?: AiTopProblem[];
}

export interface AiCategoryGap {
  category: string;
  difference: number;
  strongerScore: number;
  weakerScore: number;
  impact: 'High' | 'Medium' | 'Low';
  explanation: string;
}

export interface AiGapAnalysis {
  summary: string;
  keyGaps: AiCategoryGap[];
}

export interface AiRecommendation {
  id: string;
  problem: string;
  evidence: string;
  whyItMatters: string;
  solution: string;
  implementationSteps: string[];
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Low' | 'High';
  estimatedTime?: string;
  verificationMethod?: string;
  codeExample?: string;
  codeExplanation?: string;
  expectedBenefit: string;
}

export interface AiPriorityMatrixItem {
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  issue: string;
  recommendedFix: string;
  difficulty: 'Low' | 'Medium' | 'High';
  expectedBenefit: string;
  detailedInstructions?: string[];
  codeExample?: string;
}

export interface CompetitorLearningInsight {
  area: string;
  metricComparison: string;
  whatBetterSiteDoes: string;
  actionableTakeaway: string;
}

export interface AdaptiveTask {
  id: string;
  problem: string;
  solution: string;
  category: 'Performance' | 'Accessibility' | 'Best Practices' | 'SEO' | 'Verification';
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  difficulty: 'Low' | 'Medium' | 'High';
  estimatedMinutes: number;
  effortTier: 'Quick Fix' | 'Medium Fix' | 'Complex Fix';
  expectedBenefit: string;
  dependencies: string;
  verificationMethod: string;
  isQuickWin: boolean;
  order: number;
  phase: string;
}

export interface AdaptivePlanStage {
  stageNumber: number;
  title: string;
  focusArea: string;
  estimatedMinutes: number;
  tasks: AdaptiveTask[];
}

export interface AdaptiveImprovementPlan {
  totalEstimatedMinutes: number;
  totalEstimatedHoursFormatted: string;
  totalTasks: number;
  quickWinsCount: number;
  criticalCount: number;
  mediumComplexCount: number;
  summary: string;
  tasks: AdaptiveTask[];
  stages: AdaptivePlanStage[];
}

export interface PlannerTaskState {
  completed: boolean;
  completedAt?: string;
  actualMinutes?: number;
}

export interface RoadmapTask {
  id: string;
  task: string;
  detail: string;
  completed: boolean;
}

export interface RoadmapDay {
  day: number;
  title: string;
  focusArea: string;
  tasks: RoadmapTask[];
}

export interface AiComparisonMeta {
  provider: 'gemini' | 'rules-engine' | string;
  model?: string;
  isFallback: boolean;
  fallbackReason?: string;
  cached?: boolean;
  generatedAt: string;
}

export interface AiComparisonInsights {
  verdict: AiVerdict;
  gapAnalysis: AiGapAnalysis;
  recommendations: AiRecommendation[];
  priorityMatrix: AiPriorityMatrixItem[];
  competitorLearningInsights: CompetitorLearningInsight[];
  adaptivePlan?: AdaptiveImprovementPlan;
  roadmap: RoadmapDay[];
  meta: AiComparisonMeta;
}

export interface BeforeAfterMetricDelta {
  metricName: string;
  beforeDisplay: string;
  afterDisplay: string;
  beforeVal: number;
  afterVal: number;
  diffVal: number;
  improved: boolean;
  neutral: boolean;
}

export interface BeforeAfterRecord {
  id: string;
  url: string;
  device: string;
  timestamp: string;
  beforeHealthScore: number;
  afterHealthScore: number;
  healthDelta: number;
  beforeAuditData: AuditResponseData;
  afterAuditData: AuditResponseData;
  deltas: BeforeAfterMetricDelta[];
}

export interface AiChatAnswer {
  answer: string;
  provider: string;
  isFallback: boolean;
  fallbackReason?: string;
}

export interface AiStatusResponse {
  status: string;
  provider: string;
  model: string;
  apiKeyConfigured: boolean;
  capabilities: string[];
}

