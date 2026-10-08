
export interface GitHubProfile {
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

export interface ReadmeSignals {
  status: string;
  hasReadme: boolean;
  rawLength: number;
  headingsCount: number;
  hasSetupInstructions: boolean;
  hasUsageExample: boolean;
  hasScreenshotsOrDemo: boolean;
  hasLicenseSection: boolean;
  hasProjectDescription: boolean;
}

export interface Repository {
  name: string;
  fullName: string;
  url: string;
  description: string;

  language: string | null;
  homepageUrl: string | null;

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

  daysSinceLastPush: number | null;

  topics: string[];

  hasDescription: boolean;
  hasHomepage: boolean;
  hasTopics: boolean;
  hasLicense: boolean;

  inspectedForReadme: boolean;
  readme?: ReadmeSignals;
}

export interface CategoryAudit {
  label: string;
  weight: number;
  score: number;
  weightedScore: number;

  // Category-specific evidence structure.
  // The backend owns the exact shape.
  breakdown: unknown;

  evidence: string[];
}

export interface Audit {
  overallScore: number;

  categories: {
    profilePresentation: CategoryAudit;
    projectQuality: CategoryAudit;
    documentation: CategoryAudit;
    activityConsistency: CategoryAudit;
    technicalSignals: CategoryAudit;
  };
}

export interface SummaryStats {
  totalRepos: number;
  originalRepos: number;
  forkedRepos: number;

  primaryLanguages: string[];

  reposWithReadme: number;
  reposWithDescription: number;

  lastActiveDate: string | null;
}

export interface AuditMetadata {
  repositoriesFetched: number;
  repositoriesInspected: number;

  originalRepositoriesCount: number;
  forkedRepositoriesCount: number;

  cached: boolean;
  timestamp: string;
}

export interface AiAuditResult {
  available: boolean;

  errorCode?: string;
  message?: string;
  timestamp: string;

  recruiterView?: string;
  summary?: string;

  strengths?: string[];
  weaknesses?: string[];

  priorities?: Array<{
    title: string;
    why: string;
    action: string;
    impact: string;
  }>;
}

export interface AuditResponse {
  profile: GitHubProfile;

  repositories: Repository[];
  forkedRepositories: Repository[];

  analyzedRepositoriesCount: number;

  metadata: AuditMetadata;
  audit: Audit;

  summaryStats: SummaryStats | null;

  ai: AiAuditResult;
}

interface ApiErrorResponse {
  error?: string;
  code?: string;
  statusCode?: number;
}

export class AuditApiError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);

    this.name = "AuditApiError";
    this.status = status;
    this.code = code;

    // Required when extending Error in some transpilation/runtime setups.
    Object.setPrototypeOf(this, AuditApiError.prototype);
  }
}

function isApiErrorResponse(value: unknown): value is ApiErrorResponse {
  if (!value || typeof value !== "object") {
    return false;
  }

  const data = value as Record<string, unknown>;

  return (
    (data.error === undefined || typeof data.error === "string") &&
    (data.code === undefined || typeof data.code === "string") &&
    (data.statusCode === undefined || typeof data.statusCode === "number")
  );
}

async function parseResponseBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.includes("application/json")) {
    return null;
  }

  try {
    return await response.json();
  } catch {
    return null;
  }
}

export async function auditGitHubProfile(
  username: string,
): Promise<AuditResponse> {
  const trimmedUsername = username.trim();

  if (!trimmedUsername) {
    throw new AuditApiError(
      "Please enter a GitHub username.",
      400,
      "INVALID_USERNAME",
    );
  }

  const response = await fetch(
    `/api/audit/${encodeURIComponent(trimmedUsername)}`,
  );

  const data = await parseResponseBody(response);

  if (!response.ok) {
    const errorMessage = isApiErrorResponse(data)
      ? data.error
      : undefined;

    const errorCode = isApiErrorResponse(data)
      ? data.code
      : undefined;

    throw new AuditApiError(
      errorMessage || "Unable to analyze this GitHub profile.",
      response.status,
      errorCode,
    );
  }

  if (!data || typeof data !== "object") {
    throw new AuditApiError(
      "The server returned an invalid response.",
      response.status,
      "INVALID_RESPONSE",
    );
  }

  return data as AuditResponse;
}
