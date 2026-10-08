import type { GitHubRawUser, GitHubRawRepo, GitHubRawReadme } from '../types/github.ts';
import type { ReadmeStatus } from '../types/normalized.ts';
import {
  NotFoundError,
  RateLimitError,
  ExternalServiceError,
} from '../types/errors.ts';

export interface ReadmeFetchResult {
  repoName: string;
  status: ReadmeStatus;
  content: string | null;
}

/**
 * Service for communicating with GitHub REST API.
 * Uses native fetch, safe rate limit detection, and bounded request budgets.
 */
export class GitHubService {
  private readonly baseUrl = 'https://api.github.com';

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'GitHub-Profile-Auditor/1.0',
    };

    const token = process.env.GITHUB_TOKEN?.trim();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  private handleRateLimits(res: Response): void {
    const remaining = res.headers.get('x-ratelimit-remaining');
    const reset = res.headers.get('x-ratelimit-reset');
    const resetTime = reset ? Number(reset) * 1000 : undefined;

    if (res.status === 403 || res.status === 429 || remaining === '0') {
      throw new RateLimitError(
        'GitHub API rate limit exceeded. Please wait a few minutes or provide a GITHUB_TOKEN.',
        resetTime
      );
    }
  }

  /**
   * Fetches public user profile from GET /users/:username
   */
  async fetchUserProfile(username: string): Promise<GitHubRawUser> {
    const url = `${this.baseUrl}/users/${encodeURIComponent(username)}`;

    let res: Response;
    try {
      res = await fetch(url, { headers: this.getHeaders() });
    } catch (err: unknown) {
      throw new ExternalServiceError('GitHub', (err as Error).message);
    }

    if (res.status === 404) {
      throw new NotFoundError(`GitHub user "${username}" does not exist.`);
    }

    this.handleRateLimits(res);

    if (!res.ok) {
      throw new ExternalServiceError('GitHub', `Failed with HTTP status ${res.status}`);
    }

    return (await res.json()) as GitHubRawUser;
  }

  /**
   * Fetches up to 30 public repositories sorted by pushed_at
   */
  async fetchUserRepositories(username: string): Promise<GitHubRawRepo[]> {
    const url = `${this.baseUrl}/users/${encodeURIComponent(username)}/repos?per_page=30&sort=pushed&type=public`;

    let res: Response;
    try {
      res = await fetch(url, { headers: this.getHeaders() });
    } catch (err: unknown) {
      throw new ExternalServiceError('GitHub', (err as Error).message);
    }

    if (res.status === 404) {
      throw new NotFoundError(`Repositories for "${username}" not found.`);
    }

    this.handleRateLimits(res);

    if (!res.ok) {
      throw new ExternalServiceError('GitHub', `Failed to fetch repos with HTTP ${res.status}`);
    }

    return (await res.json()) as GitHubRawRepo[];
  }

  /**
   * Deterministically selects up to 4 candidate repositories for deep README inspection.
   * Filters out forks and archives, prioritizing substance and recent activity.
   */
  selectRepositoriesForInspection(repos: GitHubRawRepo[]): GitHubRawRepo[] {
    if (!repos || repos.length === 0) return [];

    // Filter out forks
    let candidates = repos.filter((r) => !r.fork);

    // If candidate list is empty because user only has forks, fallback to non-forks if available or top repos
    if (candidates.length === 0) {
      candidates = [...repos];
    }

    // Rank candidates deterministically
    const scored = candidates.map((repo) => {
      let priorityScore = 0;

      // Prefer non-archived
      if (!repo.archived) priorityScore += 5;

      // Substantive project description
      if (repo.description && repo.description.trim().length > 10) priorityScore += 3;

      // Stars signal
      priorityScore += Math.min(repo.stargazers_count, 50);

      // Has topics
      if (repo.topics && repo.topics.length > 0) priorityScore += 2;

      // Has homepage or live demo
      if (repo.homepage && repo.homepage.trim().length > 0) priorityScore += 2;

      // Recency factor based on pushed_at timestamp (higher is more recent)
      const pushTime = repo.pushed_at ? new Date(repo.pushed_at).getTime() : 0;

      return { repo, priorityScore, pushTime };
    });

    // Sort descending by priorityScore, then descending by push recency
    scored.sort((a, b) => {
      if (b.priorityScore !== a.priorityScore) {
        return b.priorityScore - a.priorityScore;
      }
      return b.pushTime - a.pushTime;
    });

    // Select at most 4 repositories
    return scored.slice(0, 4).map((item) => item.repo);
  }

  /**
   * Fetches README for a single repository.
   * Missing READMEs (404) or transient errors do NOT fail the audit.
   */
  async fetchRepositoryReadme(owner: string, repo: string): Promise<ReadmeFetchResult> {
    const url = `${this.baseUrl}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/readme`;

    try {
      const res = await fetch(url, { headers: this.getHeaders() });

      if (res.status === 404) {
        return { repoName: repo, status: 'not_found', content: null };
      }

      if (res.status === 403 || res.status === 429) {
        return { repoName: repo, status: 'error', content: null };
      }

      if (!res.ok) {
        return { repoName: repo, status: 'error', content: null };
      }

      const data = (await res.json()) as GitHubRawReadme;

      if (!data.content) {
        return { repoName: repo, status: 'not_found', content: null };
      }

      // GitHub returns base64 encoded content
      const decoded = Buffer.from(data.content, 'base64').toString('utf-8');
      return { repoName: repo, status: 'found', content: decoded };
    } catch {
      return { repoName: repo, status: 'error', content: null };
    }
  }

  /**
   * Concurrently fetches READMEs for selected candidate repositories with Promise.allSettled
   */
  async fetchBatchReadmes(owner: string, repos: GitHubRawRepo[]): Promise<Map<string, ReadmeFetchResult>> {
    const resultsMap = new Map<string, ReadmeFetchResult>();
    if (!repos || repos.length === 0) return resultsMap;

    const promises = repos.map((r) => this.fetchRepositoryReadme(owner, r.name));
    const settlements = await Promise.allSettled(promises);

    settlements.forEach((settlement, index) => {
      const repoName = repos[index].name;
      if (settlement.status === 'fulfilled') {
        resultsMap.set(repoName, settlement.value);
      } else {
        resultsMap.set(repoName, {
          repoName,
          status: 'error',
          content: null,
        });
      }
    });

    return resultsMap;
  }
}

export const gitHubService = new GitHubService();
