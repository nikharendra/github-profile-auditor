/**
 * Deterministic scoring, evidence items, and AI interpretation types.
 */

export type CategoryId =
  | 'profilePresentation'
  | 'projectQuality'
  | 'documentation'
  | 'activityConsistency'
  | 'technicalSignals';

export interface EvidenceItem {
  id: string;
  type: 'positive' | 'warning' | 'neutral';
  text: string;
  metric?: string;
}

export interface ScoreBreakdownItem {
  component: string;
  earned: number;
  max: number;
  description: string;
}

export interface CategoryScore {
  id: CategoryId;
  label: string;
  weight: number; // e.g. 0.20 for 20%
  score: number; // 0 to 100
  weightedScore: number; // score * weight
  breakdown: ScoreBreakdownItem[];
  evidence: EvidenceItem[];
}

export interface DeterministicAudit {
  overallScore: number; // 0 to 100
  categories: Record<CategoryId, CategoryScore>;
  summaryStats: {
    totalRepos: number;
    originalRepos: number;
    forkedRepos: number;
    primaryLanguages: string[];
    reposWithReadme: number;
    reposWithDescription: number;
    lastActiveDate: string;
  };
}

export interface ActionPriority {
  rank: number;
  category: CategoryId;
  title: string;
  problem: string;
  whyItMatters: string;
  action: string;
  expectedImpact: 'High' | 'Medium' | 'Low';
}

export interface RecruiterPerspective {
  overallImpression: string;
  firstThirtySeconds: {
    strongestSignal: string;
    primaryConcern: string;
    immediateRecommendation: string;
  };
  strengths: string[];
  weaknesses: string[];
  priorities: ActionPriority[];
}

export interface FullAuditReport {
  username: string;
  timestamp: string;
  deterministic: DeterministicAudit;
  recruiterView?: RecruiterPerspective;
  aiAssisted: boolean; // false until Phase 4 Gemini integration
}
