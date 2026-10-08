// export interface AuditResponse {
//   username: string;
//   cached?: boolean;

//   profile: {
//     username: string;
//     name: string;
//     avatarUrl?: string;
//     bio?: string;
//     htmlUrl?: string;
//     publicRepoCount: number;
//     followersCount?: number;
//     followingCount?: number;
//     accountAgeDays: number;
//     location?: string;
//     company?: string;
//     blog?: string;
//   };

//   repositories: Array<{
//     name: string;
//     description: string;
//     language: string | null;
//     htmlUrl?: string;
//     isFork: boolean;
//     isArchived: boolean;
//     daysSinceLastPush: number | null;
//     topics: string[];
//     hasReadme: boolean;
//     hasSetupInstructions: boolean;
//     hasUsageExamples: boolean;
//     hasLicense: boolean;
//   }>;

//   analysis: {
//     overallScore: number;
//     categories: {
//       profile: {
//         score: number;
//         evidence: string[];
//       };
//       project: {
//         score: number;
//         evidence: string[];
//       };
//       documentation: {
//         score: number;
//         evidence: string[];
//       };
//       activity: {
//         score: number;
//         evidence: string[];
//       };
//       technical: {
//         score: number;
//         evidence: string[];
//       };
//     };
//   };

//   ai: {
//     available: boolean;
//     recruiterView?: string;
//     summary?: string;
//     strengths?: string[];
//     weaknesses?: string[];
//     priorities?: Array<{
//       title: string;
//       why: string;
//       action: string;
//       impact: string;
//     }>;
//     modelName?: string;
//     generatedAt?: string;
//     errorCode?: string;
//     message?: string;
//   };
// }

// export class AuditApiError extends Error {
//   status: number;

//   constructor(message: string, status: number) {
//     super(message);
//     this.name = "AuditApiError";
//     this.status = status;
//   }
// }

// export async function auditGitHubProfile(
//   username: string,
// ): Promise<AuditResponse> {
//   const cleanUsername = username.trim();

//   if (!cleanUsername) {
//     throw new AuditApiError("Please enter a GitHub username.", 400);
//   }

//   const response = await fetch(
//     `/api/audit/${encodeURIComponent(cleanUsername)}`,
//     {
//       method: "GET",
//       headers: {
//         Accept: "application/json",
//       },
//     },
//   );

//   let body: unknown;

//   try {
//     body = await response.json();
//   } catch {
//     throw new AuditApiError(
//       "The audit service returned an invalid response.",
//       response.status,
//     );
//   }

//   if (!response.ok) {
//     const message =
//       typeof body === "object" &&
//       body !== null &&
//       "message" in body &&
//       typeof body.message === "string"
//         ? body.message
//         : "Unable to analyze this GitHub profile.";

//     throw new AuditApiError(message, response.status);
//   }

//   return body as AuditResponse;
// }







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
  hasUsageExamples: boolean;
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

export class AuditApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "AuditApiError";
    this.status = status;
    this.code = code;
  }
}

export async function auditGitHubProfile(
  username: string
): Promise<AuditResponse> {
  const trimmedUsername = username.trim();

  if (!trimmedUsername) {
    throw new AuditApiError(
      "Please enter a GitHub username.",
      400,
      "INVALID_USERNAME"
    );
  }

  const response = await fetch(
    `/api/audit/${encodeURIComponent(trimmedUsername)}`
  );

  let data: unknown;

  try {
    data = await response.json();
  } catch {
    throw new AuditApiError(
      "The server returned an invalid response.",
      response.status
    );
  }

  if (!response.ok) {
    const errorData = data as {
      message?: string;
      errorCode?: string;
    };

    throw new AuditApiError(
      errorData.message || "Unable to analyze this GitHub profile.",
      response.status,
      errorData.errorCode
    );
  }

  return data as AuditResponse;
}
