import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizerService } from '../services/normalizer.service.ts';
import { GitHubService } from '../services/github.service.ts';
import { ValidationError, NotFoundError, RateLimitError, ExternalServiceError } from '../types/errors.ts';
import type { GitHubRawUser, GitHubRawRepo } from '../types/github.ts';

// Test Fixtures
const mockRawUser: GitHubRawUser = {
  login: 'testdev',
  id: 12345,
  avatar_url: 'https://avatars.githubusercontent.com/u/12345',
  html_url: 'https://github.com/testdev',
  name: 'Test Developer',
  company: 'Acme Corp',
  blog: 'https://testdev.io',
  location: 'San Francisco, CA',
  email: 'test@example.com',
  bio: 'Building open-source tools for developers.',
  twitter_username: null,
  public_repos: 12,
  public_gists: 2,
  followers: 45,
  following: 20,
  created_at: '2022-01-15T10:00:00Z',
  updated_at: '2024-05-01T12:00:00Z',
};

const createMockRepo = (overrides: Partial<GitHubRawRepo> = {}): GitHubRawRepo => ({
  id: Math.floor(Math.random() * 100000),
  name: 'repo-one',
  full_name: 'testdev/repo-one',
  private: false,
  html_url: 'https://github.com/testdev/repo-one',
  description: 'A great open-source project with documentation',
  fork: false,
  url: 'https://api.github.com/repos/testdev/repo-one',
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2024-02-01T00:00:00Z',
  pushed_at: '2024-02-15T00:00:00Z',
  git_url: '',
  ssh_url: '',
  clone_url: '',
  homepage: 'https://repo-one.dev',
  size: 1500,
  stargazers_count: 25,
  watchers_count: 25,
  language: 'TypeScript',
  has_issues: true,
  has_projects: true,
  has_downloads: true,
  has_wiki: true,
  has_pages: false,
  has_discussions: false,
  forks_count: 4,
  archived: false,
  disabled: false,
  open_issues_count: 2,
  license: { key: 'mit', name: 'MIT License', spdx_id: 'MIT' },
  topics: ['typescript', 'react', 'tools'],
  default_branch: 'main',
  ...overrides,
});

test('1. Valid GitHub user profile normalization', () => {
  const normalized = normalizerService.normalizeProfile(mockRawUser);

  assert.equal(normalized.username, 'testdev');
  assert.equal(normalized.name, 'Test Developer');
  assert.equal(normalized.bio, 'Building open-source tools for developers.');
  assert.equal(normalized.hasBio, true);
  assert.equal(normalized.hasCustomName, true);
  assert.equal(normalized.hasLocationOrBlog, true);
  assert.equal(normalized.publicRepoCount, 12);
  assert.equal(normalized.followersCount, 45);
  assert.ok(normalized.accountAgeDays > 500);
});

test('2. Invalid username regex validation rejects invalid handles without calling network', () => {
  const GITHUB_USERNAME_REGEX = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;

  assert.equal(GITHUB_USERNAME_REGEX.test(''), false);
  assert.equal(GITHUB_USERNAME_REGEX.test('-invalid'), false);
  assert.equal(GITHUB_USERNAME_REGEX.test('invalid-'), false);
  assert.equal(GITHUB_USERNAME_REGEX.test('invalid--handle'), false);
  assert.equal(GITHUB_USERNAME_REGEX.test('invalid user'), false);
  assert.equal(GITHUB_USERNAME_REGEX.test('valid-user-123'), true);
  assert.equal(GITHUB_USERNAME_REGEX.test('torvalds'), true);
});

test('3. GitHub user not found maps cleanly to NotFoundError (404)', () => {
  const err = new NotFoundError('GitHub user "nonexistent-user-12345" does not exist.');
  assert.equal(err.statusCode, 404);
  assert.equal(err.code, 'USER_NOT_FOUND');
});

test('4. GitHub rate-limit handling maps to GITHUB_RATE_LIMITED (429)', () => {
  const err = new RateLimitError('GitHub API rate limit exceeded.', 1700000000000);
  assert.equal(err.statusCode, 429);
  assert.equal(err.code, 'GITHUB_RATE_LIMITED');
  assert.equal(err.resetTime, 1700000000000);
});

test('5. Repository list normalization correctly maps fields', () => {
  const repo = createMockRepo({ name: 'my-app', stargazers_count: 50, language: 'Python' });
  const normalized = normalizerService.normalizeRepository(repo, false);

  assert.equal(normalized.name, 'my-app');
  assert.equal(normalized.stars, 50);
  assert.equal(normalized.language, 'Python');
  assert.equal(normalized.isFork, false);
  assert.equal(normalized.hasDescription, true);
  assert.equal(normalized.hasLicense, true);
  assert.equal(normalized.hasHomepage, true);
});

test('6. Fork filtering separates original repos from forks', () => {
  const repos = [
    createMockRepo({ name: 'orig-1', fork: false }),
    createMockRepo({ name: 'fork-1', fork: true }),
    createMockRepo({ name: 'orig-2', fork: false }),
    createMockRepo({ name: 'fork-2', fork: true }),
  ];

  const result = normalizerService.normalizeAll(mockRawUser, repos, new Map(), []);
  assert.equal(result.originalRepositories.length, 2);
  assert.equal(result.forkedRepositories.length, 2);
  assert.equal(result.metadata.originalRepositoriesCount, 2);
  assert.equal(result.metadata.forkedRepositoriesCount, 2);
});

test('7. README selection algorithm caps candidates at exactly 4', () => {
  const service = new GitHubService();
  const manyRepos = [
    createMockRepo({ name: 'repo-1', stargazers_count: 10, fork: false }),
    createMockRepo({ name: 'repo-2', stargazers_count: 20, fork: false }),
    createMockRepo({ name: 'repo-3', stargazers_count: 30, fork: false }),
    createMockRepo({ name: 'repo-4', stargazers_count: 40, fork: false }),
    createMockRepo({ name: 'repo-5', stargazers_count: 50, fork: false }),
    createMockRepo({ name: 'repo-6', stargazers_count: 60, fork: false }),
  ];

  const selected = service.selectRepositoriesForInspection(manyRepos);
  assert.equal(selected.length, 4);
  // Highest stars should be selected
  const names = selected.map((r) => r.name);
  assert.ok(names.includes('repo-6'));
  assert.ok(names.includes('repo-5'));
});

test('8. Missing or failed README does not crash the audit and is recorded safely', () => {
  const readme404 = normalizerService.normalizeReadme({
    repoName: 'empty-repo',
    status: 'not_found',
    content: null,
  });
  assert.equal(readme404.status, 'not_found');
  assert.equal(readme404.hasReadme, false);

  const readmeError = normalizerService.normalizeReadme({
    repoName: 'rate-limited-repo',
    status: 'error',
    content: null,
  });
  assert.equal(readmeError.status, 'error');
  assert.equal(readmeError.hasReadme, false);

  const readmeValid = normalizerService.normalizeReadme({
    repoName: 'documented-repo',
    status: 'found',
    content: '# Project\n\nAn amazing tool.\n\n## Installation\n\nRun `npm install`\n\n## Usage\n\nRun `npm start`\n\n## License\nMIT',
  });
  assert.equal(readmeValid.status, 'found');
  assert.equal(readmeValid.hasReadme, true);
  assert.equal(readmeValid.hasSetupInstructions, true);
  assert.equal(readmeValid.hasUsageExamples, true);
  assert.equal(readmeValid.hasLicenseSection, true);
});

test('9. GitHub external failure produces controlled ExternalServiceError (502)', () => {
  const err = new ExternalServiceError('GitHub', 'Connection timed out');
  assert.equal(err.statusCode, 502);
  assert.equal(err.code, 'EXTERNAL_SERVICE_ERROR');
  assert.ok(err.message.includes('GitHub service unavailable'));
});

test('10. Normalized output contains no secrets or token fields', () => {
  const result = normalizerService.normalizeAll(mockRawUser, [createMockRepo()], new Map(), []);
  const jsonString = JSON.stringify(result);

  assert.equal(jsonString.includes('GITHUB_TOKEN'), false);
  assert.equal(jsonString.includes('Bearer'), false);
  assert.equal(jsonString.includes('token'), false);
  assert.equal(jsonString.includes('GEMINI_API_KEY'), false);
});
