import type { DeterministicAudit } from './audit.ts';
import type { AiAuditResult } from './gemini.ts';

/**
 * Normalized Internal Domain Models.
 * Decouples application logic and deterministic engines from raw GitHub API responses.
 */

export interface NormalizedProfile {
  username: string;
  name: string;
  bio: string;
  avatarUrl: string;
  githubUrl: string;
  blogUrl: string;
  location: string;
  company: string;
  publicRepoCount: number;
  followersCount: number;
  followingCount: number;
  accountCreatedAt: string;
  accountAgeDays: number;
  hasBio: boolean;
  hasCustomName: boolean;
  hasLocationOrBlog: boolean;
  hasAvatar: boolean;
}

export type ReadmeStatus = 'found' | 'not_found' | 'error';

export interface ReadmeAnalysis {
  status: ReadmeStatus;
  hasReadme: boolean;
  rawLength: number;
  headingsCount: number;
  hasSetupInstructions: boolean;
  hasUsageExamples: boolean;
  hasScreenshotsOrDemo: boolean;
  hasLicenseSection: boolean;
  hasProjectDescription: boolean;
}

export interface NormalizedRepository {
  name: string;
  fullName: string;
  url: string;
  description: string;
  language: string;
  homepageUrl: string;
  stars: number;
  forks: number;
  size: number;
  openIssues: number;
  defaultBranch: string;
  isFork: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  pushedAt: string;
  daysSinceLastPush: number;
  topics: string[];
  hasDescription: boolean;
  hasHomepage: boolean;
  hasTopics: boolean;
  hasLicense: boolean;
  inspectedForReadme: boolean;
  readme?: ReadmeAnalysis;
}

export interface NormalizedAuditMetadata {
  repositoriesFetched: number;
  repositoriesInspected: number;
  originalRepositoriesCount: number;
  forkedRepositoriesCount: number;
  cached: boolean;
  timestamp: string;
}

export interface NormalizedAuditResponse {
  profile: NormalizedProfile;
  repositories: NormalizedRepository[];
  originalRepositories: NormalizedRepository[];
  forkedRepositories: NormalizedRepository[];
  analyzedRepositoriesCount: number;
  metadata: NormalizedAuditMetadata;
  audit?: DeterministicAudit;
  ai?: AiAuditResult;
}

export interface NormalizedData {
  profile: NormalizedProfile;
  repositories: NormalizedRepository[];
  originalRepositories: NormalizedRepository[];
  forkedRepositories: NormalizedRepository[];
  analyzedRepositoriesCount: number;
}
