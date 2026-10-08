import test from 'node:test';
import assert from 'node:assert/strict';
import { analysisService } from '../services/analysis/analysis.service.ts';
import { evaluateProfilePresentation } from '../services/analysis/profile.rules.ts';
import { evaluateProjectQuality } from '../services/analysis/project.rules.ts';
import { evaluateDocumentation } from '../services/analysis/documentation.rules.ts';
import { evaluateActivityConsistency } from '../services/analysis/activity.rules.ts';
import { evaluateTechnicalSignals } from '../services/analysis/technical.rules.ts';
import type { NormalizedData, NormalizedProfile, NormalizedRepository } from '../types/normalized.ts';

// Helper to build test NormalizedData
function createTestProfile(overrides: Partial<NormalizedProfile> = {}): NormalizedProfile {
  return {
    username: 'johndoe',
    name: 'John Doe',
    bio: 'Full-stack software engineer building open-source developer tooling.',
    avatarUrl: 'https://avatars.githubusercontent.com/u/10001',
    githubUrl: 'https://github.com/johndoe',
    blogUrl: 'https://johndoe.dev',
    location: 'San Francisco, CA',
    company: 'Open Source Labs',
    publicRepoCount: 10,
    followersCount: 150,
    followingCount: 50,
    accountCreatedAt: '2020-01-01T00:00:00Z',
    accountAgeDays: 1500,
    hasBio: true,
    hasCustomName: true,
    hasLocationOrBlog: true,
    hasAvatar: true,
    ...overrides,
  };
}

function createTestRepo(overrides: Partial<NormalizedRepository> = {}): NormalizedRepository {
  return {
    name: 'sample-project',
    fullName: 'johndoe/sample-project',
    url: 'https://github.com/johndoe/sample-project',
    description: 'A complete full-stack web application with setup instructions.',
    language: 'TypeScript',
    homepageUrl: 'https://sample.demo.app',
    stars: 12,
    forks: 3,
    size: 2048,
    openIssues: 1,
    defaultBranch: 'main',
    isFork: false,
    isArchived: false,
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2024-05-01T00:00:00Z',
    pushedAt: '2024-05-01T00:00:00Z',
    daysSinceLastPush: 10,
    topics: ['typescript', 'react', 'nodejs'],
    hasDescription: true,
    hasHomepage: true,
    hasTopics: true,
    hasLicense: true,
    inspectedForReadme: true,
    readme: {
      status: 'found',
      hasReadme: true,
      rawLength: 2500,
      headingsCount: 4,
      hasSetupInstructions: true,
      hasUsageExamples: true,
      hasScreenshotsOrDemo: true,
      hasLicenseSection: true,
      hasProjectDescription: true,
    },
    ...overrides,
  };
}

function buildNormalizedData(
  profile: NormalizedProfile,
  repos: NormalizedRepository[]
): NormalizedData {
  return {
    profile,
    repositories: repos,
    originalRepositories: repos.filter((r) => !r.isFork),
    forkedRepositories: repos.filter((r) => r.isFork),
    analyzedRepositoriesCount: repos.length,
  };
}

// -------------------------------------------------------------
// Category 1: Profile Presentation Tests
// -------------------------------------------------------------
test('Category 1: Complete profile receives 100/100', () => {
  const data = buildNormalizedData(createTestProfile(), []);
  const result = evaluateProfilePresentation(data);

  assert.equal(result.score, 100);
  assert.equal(result.weightedScore, 20); // 100 * 0.20
  assert.equal(result.breakdown.length, 5);
  assert.ok(result.evidence.length >= 4);
});

test('Category 1: Sparse profile handles missing bio, website, location without NaN', () => {
  const sparseProfile = createTestProfile({
    bio: '',
    hasBio: false,
    name: 'johndoe',
    hasCustomName: false,
    avatarUrl: 'https://avatars.githubusercontent.com/u/10001?d=identicon',
    hasAvatar: false,
    blogUrl: '',
    location: '',
    company: '',
    hasLocationOrBlog: false,
  });
  const data = buildNormalizedData(sparseProfile, []);
  const result = evaluateProfilePresentation(data);

  assert.ok(result.score < 25);
  assert.ok(result.score >= 0);
  assert.ok(!Number.isNaN(result.score));
  assert.ok(result.evidence.some((e) => e.text.includes('No public bio')));
});

// -------------------------------------------------------------
// Category 2: Project Quality & Presentation Tests
// -------------------------------------------------------------
test('Category 2: Zero repositories returns 0 without crashing', () => {
  const data = buildNormalizedData(createTestProfile(), []);
  const result = evaluateProjectQuality(data);

  assert.equal(result.score, 0);
  assert.equal(result.weightedScore, 0);
  assert.ok(result.evidence.some((e) => e.id === 'no-repos'));
});

test('Category 2: Only forks separates original work and caps score', () => {
  const forkRepos = [
    createTestRepo({ name: 'fork-1', isFork: true }),
    createTestRepo({ name: 'fork-2', isFork: true }),
  ];
  const data = buildNormalizedData(createTestProfile(), forkRepos);
  const result = evaluateProjectQuality(data);

  assert.equal(result.score, 0);
  assert.ok(result.evidence.some((e) => e.id === 'all-forks'));
});

test('Category 2: Well-documented original repositories earn high score', () => {
  const originalRepos = [
    createTestRepo({ name: 'app-1' }),
    createTestRepo({ name: 'app-2' }),
    createTestRepo({ name: 'app-3' }),
  ];
  const data = buildNormalizedData(createTestProfile(), originalRepos);
  const result = evaluateProjectQuality(data);

  assert.ok(result.score >= 80);
  assert.ok(result.score <= 100);
});

// -------------------------------------------------------------
// Category 3: Documentation Tests
// -------------------------------------------------------------
test('Category 3: Complete README signals across inspected repos earns 100/100', () => {
  const repos = [
    createTestRepo({ name: 'repo-1' }),
    createTestRepo({ name: 'repo-2' }),
  ];
  const data = buildNormalizedData(createTestProfile(), repos);
  const result = evaluateDocumentation(data);

  assert.equal(result.score, 100);
  assert.equal(result.weightedScore, 20); // 100 * 0.20
});

test('Category 3: Missing READMEs handles 0 documentation gracefully', () => {
  const repos = [
    createTestRepo({
      name: 'repo-no-readme',
      hasLicense: false,
      readme: {
        status: 'not_found',
        hasReadme: false,
        rawLength: 0,
        headingsCount: 0,
        hasSetupInstructions: false,
        hasUsageExamples: false,
        hasScreenshotsOrDemo: false,
        hasLicenseSection: false,
        hasProjectDescription: false,
      },
    }),
  ];
  const data = buildNormalizedData(createTestProfile(), repos);
  const result = evaluateDocumentation(data);

  assert.equal(result.score, 0);
  assert.ok(result.evidence.some((e) => e.text.includes('0 of 1 inspected repositories contain README')));
});

test('Category 3: Zero inspected repositories returns 0 without crashing', () => {
  const repos = [createTestRepo({ inspectedForReadme: false, readme: undefined })];
  const data = buildNormalizedData(createTestProfile(), repos);
  const result = evaluateDocumentation(data);

  assert.equal(result.score, 0);
  assert.ok(result.evidence.some((e) => e.id === 'no-readme-inspected'));
});

// -------------------------------------------------------------
// Category 4: Activity & Consistency Tests
// -------------------------------------------------------------
test('Category 4: Recent push within 30 days earns top recency points', () => {
  const repos = [
    createTestRepo({ daysSinceLastPush: 5 }),
    createTestRepo({ daysSinceLastPush: 40 }),
    createTestRepo({ daysSinceLastPush: 100 }),
  ];
  const data = buildNormalizedData(createTestProfile(), repos);
  const result = evaluateActivityConsistency(data);

  assert.ok(result.score >= 80);
  assert.ok(result.evidence.some((e) => e.id === 'push-recent-30'));
});

test('Category 4: New developer account is not penalized if active', () => {
  const youngProfile = createTestProfile({ accountAgeDays: 45 });
  const repos = [createTestRepo({ daysSinceLastPush: 12 })];
  const data = buildNormalizedData(youngProfile, repos);
  const result = evaluateActivityConsistency(data);

  // Should earn continuity points for new developer momentum
  assert.ok(result.score >= 60);
  assert.ok(result.evidence.some((e) => e.id === 'new-account-active'));
});

test('Category 4: Inactive accounts (> 365 days since push) score low on recency', () => {
  const repos = [createTestRepo({ daysSinceLastPush: 400 })];
  const data = buildNormalizedData(createTestProfile(), repos);
  const result = evaluateActivityConsistency(data);

  assert.ok(result.score <= 30);
  assert.ok(result.evidence.some((e) => e.id === 'push-stale'));
});

// -------------------------------------------------------------
// Category 5: Technical Signals Tests
// -------------------------------------------------------------
test('Category 5: Cohesive stack with detected languages scores high', () => {
  const repos = [
    createTestRepo({ name: 'r1', language: 'TypeScript' }),
    createTestRepo({ name: 'r2', language: 'TypeScript' }),
    createTestRepo({ name: 'r3', language: 'Python' }),
  ];
  const data = buildNormalizedData(createTestProfile(), repos);
  const result = evaluateTechnicalSignals(data);

  assert.ok(result.score >= 70);
  assert.ok(result.evidence.some((e) => e.id === 'primary-language-focus'));
});

test('Category 5: No language metadata returns safe low score without error', () => {
  const repos = [
    createTestRepo({ language: 'Unspecified', hasTopics: false, topics: [] }),
  ];
  const data = buildNormalizedData(createTestProfile(), repos);
  const result = evaluateTechnicalSignals(data);

  assert.equal(result.score, 0);
  assert.ok(result.evidence.some((e) => e.id === 'no-languages-detected'));
});

// -------------------------------------------------------------
// Central Engine Weighted Formula Tests
// -------------------------------------------------------------
test('Overall Weighted Score formula calculation is exact', () => {
  // Test mock scenario matching specification example:
  // Profile = 80, Projects = 70, Documentation = 60, Activity = 50, Technical = 90
  // Expected: 80*0.20 + 70*0.30 + 60*0.20 + 50*0.15 + 90*0.15 = 16 + 21 + 12 + 7.5 + 13.5 = 70.0
  const expectedScore = Math.round(80 * 0.20 + 70 * 0.30 + 60 * 0.20 + 50 * 0.15 + 90 * 0.15);
  assert.equal(expectedScore, 70);

  const repos = [
    createTestRepo({ name: 'r1', language: 'TypeScript', daysSinceLastPush: 10 }),
    createTestRepo({ name: 'r2', language: 'TypeScript', daysSinceLastPush: 20 }),
    createTestRepo({ name: 'r3', language: 'Go', daysSinceLastPush: 60 }),
  ];
  const data = buildNormalizedData(createTestProfile(), repos);
  const audit = analysisService.analyze(data);

  // Calculate manually from actual category outputs:
  const manualOverall = Math.round(
    audit.categories.profilePresentation.score * 0.20 +
    audit.categories.projectQuality.score * 0.30 +
    audit.categories.documentation.score * 0.20 +
    audit.categories.activityConsistency.score * 0.15 +
    audit.categories.technicalSignals.score * 0.15
  );

  assert.equal(audit.overallScore, manualOverall);
  assert.ok(audit.overallScore >= 0 && audit.overallScore <= 100);
});

test('Central Engine is 100% deterministic (repeated runs produce identical scores and evidence)', () => {
  const repos = [createTestRepo({ name: 'deterministic-repo' })];
  const data = buildNormalizedData(createTestProfile(), repos);

  const run1 = analysisService.analyze(data);
  const run2 = analysisService.analyze(data);

  assert.equal(run1.overallScore, run2.overallScore);
  assert.deepEqual(run1.categories, run2.categories);
  assert.deepEqual(run1.summaryStats, run2.summaryStats);
});
