import type { NormalizedData } from '../../types/normalized.ts';
import type { CategoryScore, ScoreBreakdownItem, EvidenceItem } from '../../types/audit.ts';
import { clamp, round, createEvidence } from './analysis.utils.ts';

export const PROJECT_COMPONENT_WEIGHTS = {
  originalRatio: 30,
  descriptionCoverage: 30,
  activeProjects: 20,
  contextMetadata: 20,
} as const;

export const CATEGORY_PROJECT_WEIGHT = 0.30;

/**
 * Category 2: Project Quality & Presentation (30%)
 * Evaluates original repository creation, clear descriptive metadata, and project ownership.
 */
export function evaluateProjectQuality(data: NormalizedData): CategoryScore {
  const totalRepos = data.repositories;
  const originalRepos = data.originalRepositories;
  const forkedRepos = data.forkedRepositories;

  const breakdown: ScoreBreakdownItem[] = [];
  const evidence: EvidenceItem[] = [];

  // Edge case: No repositories at all
  if (totalRepos.length === 0) {
    evidence.push(
      createEvidence('no-repos', 'warning', 'No public repositories found on this GitHub account.')
    );
    return {
      id: 'projectQuality',
      label: 'Project Quality & Presentation',
      weight: CATEGORY_PROJECT_WEIGHT,
      score: 0,
      weightedScore: 0,
      breakdown: [
        {
          component: 'Original Project Ratio',
          earned: 0,
          max: PROJECT_COMPONENT_WEIGHTS.originalRatio,
          description: 'No repositories available to evaluate',
        },
        {
          component: 'Description Coverage',
          earned: 0,
          max: PROJECT_COMPONENT_WEIGHTS.descriptionCoverage,
          description: 'No repositories available',
        },
        {
          component: 'Active Projects',
          earned: 0,
          max: PROJECT_COMPONENT_WEIGHTS.activeProjects,
          description: 'No repositories available',
        },
        {
          component: 'Demo & Topic Metadata',
          earned: 0,
          max: PROJECT_COMPONENT_WEIGHTS.contextMetadata,
          description: 'No repositories available',
        },
      ],
      evidence,
    };
  }

  // 1. Original Project Ratio (Max 30)
  const originalRatio = originalRepos.length / totalRepos.length;
  let originalRatioScore = 0;
  if (originalRatio >= 0.7) {
    originalRatioScore = 30;
  } else if (originalRatio >= 0.4) {
    originalRatioScore = 20;
  } else if (originalRatio > 0) {
    originalRatioScore = 10;
  } else {
    originalRatioScore = 0;
  }

  evidence.push(
    createEvidence(
      'orig-ratio',
      originalRatio >= 0.5 ? 'positive' : originalRepos.length > 0 ? 'neutral' : 'warning',
      `${originalRepos.length} of ${totalRepos.length} analyzed repositories are original projects (${Math.round(originalRatio * 100)}%).`,
      `${originalRepos.length}/${totalRepos.length}`
    )
  );

  if (forkedRepos.length > 0) {
    evidence.push(
      createEvidence('fork-count', 'neutral', `${forkedRepos.length} repositories are forks (evaluated separately from original work).`)
    );
  }

  breakdown.push({
    component: 'Original Project Ratio',
    earned: originalRatioScore,
    max: PROJECT_COMPONENT_WEIGHTS.originalRatio,
    description: `${originalRepos.length} original vs ${forkedRepos.length} forks`,
  });

  // Edge case: User only has forks
  if (originalRepos.length === 0) {
    evidence.push(
      createEvidence('all-forks', 'warning', 'All repositories are forks. No original repositories available for project quality assessment.')
    );
    return {
      id: 'projectQuality',
      label: 'Project Quality & Presentation',
      weight: CATEGORY_PROJECT_WEIGHT,
      score: originalRatioScore,
      weightedScore: round(originalRatioScore * CATEGORY_PROJECT_WEIGHT, 1),
      breakdown: [
        ...breakdown,
        {
          component: 'Description Coverage',
          earned: 0,
          max: PROJECT_COMPONENT_WEIGHTS.descriptionCoverage,
          description: '0 original repositories to evaluate',
        },
        {
          component: 'Active Projects',
          earned: 0,
          max: PROJECT_COMPONENT_WEIGHTS.activeProjects,
          description: '0 original repositories to evaluate',
        },
        {
          component: 'Demo & Topic Metadata',
          earned: 0,
          max: PROJECT_COMPONENT_WEIGHTS.contextMetadata,
          description: '0 original repositories to evaluate',
        },
      ],
      evidence,
    };
  }

  // 2. Description Coverage across original repositories (Max 30)
  const reposWithDesc = originalRepos.filter((r) => r.hasDescription && r.description.length >= 10);
  const descRatio = reposWithDesc.length / originalRepos.length;
  const descScore = Math.round(descRatio * PROJECT_COMPONENT_WEIGHTS.descriptionCoverage);

  evidence.push(
    createEvidence(
      'desc-coverage',
      descRatio >= 0.6 ? 'positive' : descRatio >= 0.3 ? 'neutral' : 'warning',
      `${reposWithDesc.length} of ${originalRepos.length} original repositories have project descriptions.`,
      `${reposWithDesc.length}/${originalRepos.length}`
    )
  );

  breakdown.push({
    component: 'Description Coverage',
    earned: descScore,
    max: PROJECT_COMPONENT_WEIGHTS.descriptionCoverage,
    description: `${Math.round(descRatio * 100)}% of original projects have clear descriptions`,
  });

  // 3. Active / Maintained Projects (Max 20)
  const unarchivedRepos = originalRepos.filter((r) => !r.isArchived);
  const unarchivedRatio = unarchivedRepos.length / originalRepos.length;
  let activeScore = Math.round(unarchivedRatio * 15);

  const hasSubstantiveProject = originalRepos.some((r) => r.size > 50 || r.stars > 0);
  if (hasSubstantiveProject) activeScore += 5;
  activeScore = Math.min(activeScore, PROJECT_COMPONENT_WEIGHTS.activeProjects);

  const archivedCount = originalRepos.length - unarchivedRepos.length;
  if (archivedCount > 0) {
    evidence.push(
      createEvidence('archived-repos', 'neutral', `${archivedCount} original repositories are archived.`)
    );
  } else {
    evidence.push(
      createEvidence('unarchived-repos', 'positive', 'All original repositories are active (none archived).')
    );
  }

  breakdown.push({
    component: 'Active Projects',
    earned: activeScore,
    max: PROJECT_COMPONENT_WEIGHTS.activeProjects,
    description: `${unarchivedRepos.length} of ${originalRepos.length} original projects unarchived`,
  });

  // 4. Demo Links and Topic Metadata (Max 20)
  const reposWithTopics = originalRepos.filter((r) => r.hasTopics);
  const topicsRatio = reposWithTopics.length / originalRepos.length;
  const topicsScore = Math.round(topicsRatio * 10);

  const reposWithDemo = originalRepos.filter((r) => r.hasHomepage);
  const demoScore = reposWithDemo.length > 0 ? 10 : 0;
  const contextScore = Math.min(topicsScore + demoScore, PROJECT_COMPONENT_WEIGHTS.contextMetadata);

  if (reposWithDemo.length > 0) {
    evidence.push(
      createEvidence('demo-links', 'positive', `${reposWithDemo.length} original repositories include live demo or homepage URLs.`)
    );
  } else {
    evidence.push(
      createEvidence('demo-missing', 'neutral', 'No live demo or homepage links attached to repository headers.')
    );
  }

  if (reposWithTopics.length > 0) {
    evidence.push(
      createEvidence('topics-tagged', 'positive', `${reposWithTopics.length} original repositories use topic tags for searchability.`)
    );
  } else {
    evidence.push(
      createEvidence('topics-missing', 'neutral', 'Repositories do not use GitHub topic tags.')
    );
  }

  breakdown.push({
    component: 'Demo & Topic Metadata',
    earned: contextScore,
    max: PROJECT_COMPONENT_WEIGHTS.contextMetadata,
    description: `${reposWithDemo.length} demo links, ${reposWithTopics.length} projects tagged with topics`,
  });

  const totalScore = clamp(
    originalRatioScore + descScore + activeScore + contextScore,
    0,
    100
  );

  return {
    id: 'projectQuality',
    label: 'Project Quality & Presentation',
    weight: CATEGORY_PROJECT_WEIGHT,
    score: totalScore,
    weightedScore: round(totalScore * CATEGORY_PROJECT_WEIGHT, 1),
    breakdown,
    evidence,
  };
}
