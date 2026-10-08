import type { GitHubRawUser, GitHubRawRepo } from '../types/github.ts';
import type {
  NormalizedProfile,
  NormalizedRepository,
  ReadmeAnalysis,
  NormalizedAuditResponse,
} from '../types/normalized.ts';
import type { ReadmeFetchResult } from './github.service.ts';

/**
 * Normalization Service.
 * Converts external untrusted GitHub API structures into clean internal domain models.
 */
export class NormalizerService {
  /**
   * Normalizes raw user profile into internal domain format.
   */
  normalizeProfile(raw: GitHubRawUser): NormalizedProfile {
    const now = Date.now();
    const createdTime = raw.created_at ? new Date(raw.created_at).getTime() : now;
    const accountAgeDays = Math.max(0, Math.floor((now - createdTime) / (1000 * 60 * 60 * 24)));

    const bio = raw.bio ? raw.bio.trim() : '';
    const name = raw.name ? raw.name.trim() : raw.login;
    const blogUrl = raw.blog ? raw.blog.trim() : '';
    const location = raw.location ? raw.location.trim() : '';
    const company = raw.company ? raw.company.trim() : '';
    const avatarUrl = raw.avatar_url || '';

    return {
      username: raw.login,
      name,
      bio,
      avatarUrl,
      githubUrl: raw.html_url || `https://github.com/${raw.login}`,
      blogUrl,
      location,
      company,
      publicRepoCount: raw.public_repos || 0,
      followersCount: raw.followers || 0,
      followingCount: raw.following || 0,
      accountCreatedAt: raw.created_at || new Date().toISOString(),
      accountAgeDays,
      hasBio: bio.length > 0,
      hasCustomName: Boolean(raw.name && raw.name.trim() !== '' && raw.name.trim() !== raw.login),
      hasLocationOrBlog: blogUrl.length > 0 || location.length > 0,
      hasAvatar: avatarUrl.length > 0 && !avatarUrl.includes('identicons'),
    };
  }

  /**
   * Extracts structural documentation signals from README content.
   */
  normalizeReadme(result?: ReadmeFetchResult): ReadmeAnalysis {
    if (!result || result.status !== 'found' || !result.content) {
      return {
        status: result?.status || 'not_found',
        hasReadme: false,
        rawLength: 0,
        headingsCount: 0,
        hasSetupInstructions: false,
        hasUsageExamples: false,
        hasScreenshotsOrDemo: false,
        hasLicenseSection: false,
        hasProjectDescription: false,
      };
    }

    const content = result.content;
    const headings = content.match(/^#{1,6}\s+.+$/gm) || [];

    // Structural signal detection via regex
    const hasSetup = /\b(install|installation|setup|getting\s*started|prerequisites|requirements|run\s*locally|quick\s*start)\b/i.test(content);
    const hasUsage = /\b(usage|how\s*to\s*use|examples|api|endpoints|commands|features|architecture)\b/i.test(content);
    const hasDemo = /(!\[.*\]\(.*\)|\.png|\.jpg|\.gif|<img|<video|demo|screenshot)/i.test(content);
    const hasLicense = /\b(license|mit|apache|gpl|bsd|unlicense)\b/i.test(content);
    const hasDescription = content.length > 100 && (headings.length > 0 || content.split('\n\n').length >= 2);

    return {
      status: 'found',
      hasReadme: true,
      rawLength: content.length,
      headingsCount: headings.length,
      hasSetupInstructions: hasSetup,
      hasUsageExamples: hasUsage,
      hasScreenshotsOrDemo: hasDemo,
      hasLicenseSection: hasLicense,
      hasProjectDescription: hasDescription,
    };
  }

  /**
   * Normalizes an individual repository.
   */
  normalizeRepository(
    raw: GitHubRawRepo,
    inspectedForReadme: boolean,
    readmeResult?: ReadmeFetchResult
  ): NormalizedRepository {
    const now = Date.now();
    const pushTime = raw.pushed_at ? new Date(raw.pushed_at).getTime() : now;
    const daysSinceLastPush = Math.max(0, Math.floor((now - pushTime) / (1000 * 60 * 60 * 24)));

    const description = raw.description ? raw.description.trim() : '';
    const homepageUrl = raw.homepage ? raw.homepage.trim() : '';
    const topics = Array.isArray(raw.topics) ? raw.topics : [];

    const normalized: NormalizedRepository = {
      name: raw.name,
      fullName: raw.full_name || raw.name,
      url: raw.html_url || `https://github.com/${raw.full_name}`,
      description,
      language: raw.language || 'Unspecified',
      homepageUrl,
      stars: raw.stargazers_count || 0,
      forks: raw.forks_count || 0,
      size: raw.size || 0,
      openIssues: raw.open_issues_count || 0,
      defaultBranch: raw.default_branch || 'main',
      isFork: Boolean(raw.fork),
      isArchived: Boolean(raw.archived),
      createdAt: raw.created_at || new Date().toISOString(),
      updatedAt: raw.updated_at || new Date().toISOString(),
      pushedAt: raw.pushed_at || new Date().toISOString(),
      daysSinceLastPush,
      topics,
      hasDescription: description.length > 0,
      hasHomepage: homepageUrl.length > 0,
      hasTopics: topics.length > 0,
      hasLicense: Boolean(raw.license && raw.license.name),
      inspectedForReadme,
    };

    if (inspectedForReadme) {
      normalized.readme = this.normalizeReadme(readmeResult);
    }

    return normalized;
  }

  /**
   * Normalizes user, repositories, and README signals into a complete audit response.
   */
  normalizeAll(
    rawUser: GitHubRawUser,
    rawRepos: GitHubRawRepo[],
    readmeMap: Map<string, ReadmeFetchResult>,
    inspectedRepos: GitHubRawRepo[],
    cached = false
  ): NormalizedAuditResponse {
    const profile = this.normalizeProfile(rawUser);
    const inspectedNames = new Set(inspectedRepos.map((r) => r.name));

    const repositories = rawRepos.map((raw) => {
      const isInspected = inspectedNames.has(raw.name);
      const readmeResult = isInspected ? readmeMap.get(raw.name) : undefined;
      return this.normalizeRepository(raw, isInspected, readmeResult);
    });

    const originalRepositories = repositories.filter((r) => !r.isFork);
    const forkedRepositories = repositories.filter((r) => r.isFork);

    return {
      profile,
      repositories,
      originalRepositories,
      forkedRepositories,
      analyzedRepositoriesCount: repositories.length,
      metadata: {
        repositoriesFetched: repositories.length,
        repositoriesInspected: inspectedNames.size,
        originalRepositoriesCount: originalRepositories.length,
        forkedRepositoriesCount: forkedRepositories.length,
        cached,
        timestamp: new Date().toISOString(),
      },
    };
  }
}

export const normalizerService = new NormalizerService();
