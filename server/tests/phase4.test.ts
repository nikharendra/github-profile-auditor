import test from 'node:test';
import assert from 'node:assert/strict';
import { GeminiService } from '../services/gemini.service.ts';
import { analysisService } from '../services/analysis/analysis.service.ts';
import type { NormalizedData, NormalizedProfile, NormalizedRepository } from '../types/normalized.ts';
import type { GeminiInterpretation } from '../types/gemini.ts';

function createSampleProfile(): NormalizedProfile {
  return {
    username: 'sampledev',
    name: 'Sample Developer',
    bio: 'Software engineer focusing on TypeScript and web tools.',
    avatarUrl: 'https://avatars.githubusercontent.com/u/99999',
    githubUrl: 'https://github.com/sampledev',
    blogUrl: 'https://sampledev.dev',
    location: 'Austin, TX',
    company: 'Dev Inc',
    publicRepoCount: 8,
    followersCount: 80,
    followingCount: 30,
    accountCreatedAt: '2021-01-01T00:00:00Z',
    accountAgeDays: 1200,
    hasBio: true,
    hasCustomName: true,
    hasLocationOrBlog: true,
    hasAvatar: true,
  };
}

function createSampleRepo(): NormalizedRepository {
  return {
    name: 'web-cli',
    fullName: 'sampledev/web-cli',
    url: 'https://github.com/sampledev/web-cli',
    description: 'A developer CLI tool built with TypeScript',
    language: 'TypeScript',
    homepageUrl: 'https://web-cli.dev',
    stars: 35,
    forks: 5,
    size: 1024,
    openIssues: 0,
    defaultBranch: 'main',
    isFork: false,
    isArchived: false,
    createdAt: '2022-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    pushedAt: '2024-01-01T00:00:00Z',
    daysSinceLastPush: 15,
    topics: ['typescript', 'cli', 'developer-tools'],
    hasDescription: true,
    hasHomepage: true,
    hasTopics: true,
    hasLicense: true,
    inspectedForReadme: true,
    readme: {
      status: 'found',
      hasReadme: true,
      rawLength: 1800,
      headingsCount: 3,
      hasSetupInstructions: true,
      hasUsageExamples: true,
      hasScreenshotsOrDemo: true,
      hasLicenseSection: true,
      hasProjectDescription: true,
    },
  };
}

function buildSampleData(): NormalizedData {
  const profile = createSampleProfile();
  const repo = createSampleRepo();
  return {
    profile,
    repositories: [repo],
    originalRepositories: [repo],
    forkedRepositories: [],
    analyzedRepositoriesCount: 1,
  };
}

const validSampleAiOutput: GeminiInterpretation = {
  recruiterView:
    'In the first 30 seconds, a recruiter notices a focused TypeScript profile with clear repository descriptions and recent activity. The primary gap is limited portfolio showcase depth.',
  summary:
    'The profile communicates solid foundational skills in TypeScript. The strongest area is project presentation and recent maintenance, while documentation depth across secondary repositories could be expanded.',
  strengths: [
    'Original repositories demonstrate clear project descriptions and metadata tagging.',
    'Recent push activity indicates active codebase maintenance.',
    'TypeScript is a consistent language foundation across visible projects.',
  ],
  weaknesses: [
    'Secondary repositories lack thorough installation and API documentation.',
    'Limited evidence of deployed live demonstrations across all repositories.',
  ],
  priorities: [
    {
      title: 'Standardize README setup guides',
      why: 'Recruiters assess how easily a team member could clone and run the project.',
      action: 'Add concise setup and run commands to all public repository README files.',
      impact: 'Significantly improves documentation signal and technical readability.',
    },
    {
      title: 'Add live demo links to repository headers',
      why: 'Recruiters review projects in under 30 seconds and rarely build code locally.',
      action: 'Deploy web-based repositories and add demo URLs to the GitHub repo header.',
      impact: 'Demonstrates end-to-end delivery capability immediately.',
    },
  ],
};

// -------------------------------------------------------------
// Validation Tests
// -------------------------------------------------------------
test('Gemini Validation: Valid structured response is accepted', () => {
  const service = new GeminiService();
  const validation = service.validateInterpretation(validSampleAiOutput);

  assert.equal(validation.valid, true);
  if (validation.valid) {
    assert.equal(validation.data.strengths.length, 3);
    assert.equal(validation.data.weaknesses.length, 2);
    assert.equal(validation.data.priorities.length, 2);
  }
});

test('Gemini Validation: Missing recruiterView is rejected', () => {
  const service = new GeminiService();
  const invalid = { ...validSampleAiOutput, recruiterView: '' };
  const validation = service.validateInterpretation(invalid);

  assert.equal(validation.valid, false);
});

test('Gemini Validation: Missing summary is rejected', () => {
  const service = new GeminiService();
  const invalid = { ...validSampleAiOutput, summary: 'short' };
  const validation = service.validateInterpretation(invalid);

  assert.equal(validation.valid, false);
});

test('Gemini Validation: Non-string or empty strengths rejected', () => {
  const service = new GeminiService();
  const invalid = { ...validSampleAiOutput, strengths: [123, 'valid string'] };
  const validation = service.validateInterpretation(invalid);

  assert.equal(validation.valid, false);
});

test('Gemini Validation: Excessive strengths array count (> 6) rejected', () => {
  const service = new GeminiService();
  const invalid = {
    ...validSampleAiOutput,
    strengths: ['s1', 's2', 's3', 's4', 's5', 's6', 's7'],
  };
  const validation = service.validateInterpretation(invalid);

  assert.equal(validation.valid, false);
});

test('Gemini Validation: Malformed priority item (missing action) rejected', () => {
  const service = new GeminiService();
  const invalid = {
    ...validSampleAiOutput,
    priorities: [
      {
        title: 'Only title',
        why: 'Only why',
        // missing action and impact
      },
    ],
  };
  const validation = service.validateInterpretation(invalid);

  assert.equal(validation.valid, false);
});

test('Gemini Validation: Excessive string lengths rejected', () => {
  const service = new GeminiService();
  const invalid = {
    ...validSampleAiOutput,
    recruiterView: 'a'.repeat(1500), // Exceeds 1200 max
  };
  const validation = service.validateInterpretation(invalid);

  assert.equal(validation.valid, false);
});

// -------------------------------------------------------------
// Data & Boundary Isolation Tests
// -------------------------------------------------------------
test('Compact AI Context contains zero secrets or raw sensitive tokens', () => {
  const service = new GeminiService();
  const data = buildSampleData();
  const audit = analysisService.analyze(data);

  const context = service.prepareCompactContext(data, audit);
  const jsonString = JSON.stringify(context);

  assert.equal(jsonString.includes('GITHUB_TOKEN'), false);
  assert.equal(jsonString.includes('GEMINI_API_KEY'), false);
  assert.equal(jsonString.includes('Bearer'), false);
  assert.equal(jsonString.includes('Authorization'), false);
});

test('Deterministic category scores are preserved unchanged after AI processing', () => {
  const data = buildSampleData();
  const audit = analysisService.analyze(data);

  const initialOverall = audit.overallScore;
  const initialProfileScore = audit.categories.profilePresentation.score;
  const initialProjectScore = audit.categories.projectQuality.score;

  // The AI context receives a read-only snapshot
  const service = new GeminiService();
  service.prepareCompactContext(data, audit);

  assert.equal(audit.overallScore, initialOverall);
  assert.equal(audit.categories.profilePresentation.score, initialProfileScore);
  assert.equal(audit.categories.projectQuality.score, initialProjectScore);
});

// -------------------------------------------------------------
// Failure & Fallback Handling Tests
// -------------------------------------------------------------
test('Missing GEMINI_API_KEY gracefully returns available: false without throwing', async () => {
  const originalKey = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;

  try {
    const service = new GeminiService();
    const data = buildSampleData();
    const audit = analysisService.analyze(data);

    const result = await service.generateInterpretation(data, audit);

    assert.equal(result.available, false);
    if (!result.available) {
      assert.equal(result.errorCode, 'MISSING_API_KEY');
      assert.ok(result.message.includes('GEMINI_API_KEY is not configured'));
    }
  } finally {
    if (originalKey) process.env.GEMINI_API_KEY = originalKey;
  }
});
