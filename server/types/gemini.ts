/**
 * Gemini AI interpretation layer types.
 * Strict contract for qualitative analysis and actionable recommendations.
 */

export interface GeminiPriority {
  title: string;
  why: string;
  action: string;
  impact: string;
}

export interface GeminiInterpretation {
  recruiterView: string;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  priorities: GeminiPriority[];
}

export type AiAuditResult =
  | {
      available: true;
      recruiterView: string;
      summary: string;
      strengths: string[];
      weaknesses: string[];
      priorities: GeminiPriority[];
      modelUsed: string;
      timestamp: string;
    }
  | {
      available: false;
      errorCode: string;
      message: string;
      timestamp: string;
    };

export interface CompactAiContext {
  profile: {
    username: string;
    name: string;
    bio: string;
    hasBio: boolean;
    hasCustomName: boolean;
    hasLocationOrBlog: boolean;
    publicRepoCount: number;
    
    accountAgeDays: number;
    location?: string;
    company?: string;
  };
  deterministicAudit: {
    overallScore: number;
    categoryScores: Record<
      string,
      { score: number; weight: number; weightedScore: number }
    >;
    evidence: Record<string, string[]>;
    summaryStats: {
      totalRepos: number;
      originalRepos: number;
      forkedRepos: number;
      primaryLanguages: string[];
      reposWithReadme: number;
      reposWithDescription: number;
      lastActiveDate: string;
    };
  };
  topRepositories: Array<{
    name: string;
    description: string;
    language: string;
    
    isFork: boolean;
    isArchived: boolean;
    daysSinceLastPush: number;
    topics: string[];
    hasReadme: boolean;
    hasSetupInstructions: boolean;
    hasUsageExamples: boolean;
    hasLicense: boolean;
  }>;
}
