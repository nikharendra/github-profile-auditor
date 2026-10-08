import type { NormalizedData } from '../../types/normalized.ts';
import type { CategoryScore, ScoreBreakdownItem, EvidenceItem } from '../../types/audit.ts';
import { clamp, round, createEvidence } from './analysis.utils.ts';

export const TECHNICAL_COMPONENT_WEIGHTS = {
  languageCoverage: 40,
  stackFocus: 35,
  topicMetadata: 25,
} as const;

export const CATEGORY_TECHNICAL_WEIGHT = 0.15;

/**
 * Category 5: Technical Signals (15%)
 * Evaluates observable language metadata and technology topic tagging.
 * Note: Measures observable repository metadata, NOT absolute programming skill.
 */
export function evaluateTechnicalSignals(data: NormalizedData): CategoryScore {
  const originalRepos = data.originalRepositories.length > 0
    ? data.originalRepositories
    : data.repositories;

  const breakdown: ScoreBreakdownItem[] = [];
  const evidence: EvidenceItem[] = [];

  // Edge case: No repositories
  if (originalRepos.length === 0) {
    evidence.push(
      createEvidence('no-tech-signals', 'warning', 'No repositories available to evaluate technical signals.')
    );
    return {
      id: 'technicalSignals',
      label: 'Technical Signals',
      weight: CATEGORY_TECHNICAL_WEIGHT,
      score: 0,
      weightedScore: 0,
      breakdown: [
        {
          component: 'Language Metadata Coverage',
          earned: 0,
          max: TECHNICAL_COMPONENT_WEIGHTS.languageCoverage,
          description: 'No repositories available',
        },
        {
          component: 'Stack Focus & Cohesion',
          earned: 0,
          max: TECHNICAL_COMPONENT_WEIGHTS.stackFocus,
          description: 'No repositories available',
        },
        {
          component: 'Technology Topic Tags',
          earned: 0,
          max: TECHNICAL_COMPONENT_WEIGHTS.topicMetadata,
          description: 'No repositories available',
        },
      ],
      evidence,
    };
  }

  // 1. Language Metadata Coverage (Max 40)
  const reposWithLanguage = originalRepos.filter(
    (r) => r.language && r.language.trim() !== '' && r.language !== 'Unspecified'
  );
  const languageCoverageRatio = reposWithLanguage.length / originalRepos.length;
  const coverageScore = Math.round(languageCoverageRatio * TECHNICAL_COMPONENT_WEIGHTS.languageCoverage);

  evidence.push(
    createEvidence(
      'language-coverage',
      languageCoverageRatio >= 0.7 ? 'positive' : languageCoverageRatio >= 0.4 ? 'neutral' : 'warning',
      `${reposWithLanguage.length} of ${originalRepos.length} analyzed repositories have detected language metadata.`,
      `${reposWithLanguage.length}/${originalRepos.length}`
    )
  );

  breakdown.push({
    component: 'Language Metadata Coverage',
    earned: coverageScore,
    max: TECHNICAL_COMPONENT_WEIGHTS.languageCoverage,
    description: `${Math.round(languageCoverageRatio * 100)}% of repositories have detected language metadata`,
  });

  // 2. Stack Focus and Language Concentration (Max 35)
  // Count frequency per language
  const languageCounts: Record<string, number> = {};
  for (const repo of reposWithLanguage) {
    languageCounts[repo.language] = (languageCounts[repo.language] || 0) + 1;
  }

  const distinctLanguages = Object.keys(languageCounts);
  let stackScore = 0;
  let primaryLang = 'None';
  let primaryCount = 0;

  for (const [lang, count] of Object.entries(languageCounts)) {
    if (count > primaryCount) {
      primaryCount = count;
      primaryLang = lang;
    }
  }

  if (distinctLanguages.length === 0) {
    stackScore = 0;
    evidence.push(
      createEvidence('no-languages-detected', 'warning', 'No programming languages detected in repository metadata.')
    );
  } else {
    const primaryShare = primaryCount / reposWithLanguage.length;

    // Primary language represents a recognizable foundation
    if (primaryShare >= 0.35) {
      stackScore += 25;
      evidence.push(
        createEvidence(
          'primary-language-focus',
          'positive',
          `Primary technical focus is ${primaryLang} (${primaryCount} repositories, ${Math.round(primaryShare * 100)}% of codebases).`,
          primaryLang
        )
      );
    } else {
      stackScore += 18;
      evidence.push(
        createEvidence(
          'distributed-stack',
          'neutral',
          `Diverse language distribution across projects (${distinctLanguages.join(', ')}).`,
          `${distinctLanguages.length} languages`
        )
      );
    }

    // Complementary stack breadth (2 to 5 languages)
    if (distinctLanguages.length >= 2 && distinctLanguages.length <= 5) {
      stackScore += 10;
      evidence.push(
        createEvidence(
          'complementary-breadth',
          'positive',
          `Cohesive stack breadth across ${distinctLanguages.length} complementary languages (${distinctLanguages.slice(0, 4).join(', ')}).`
        )
      );
    } else if (distinctLanguages.length === 1) {
      // Specialized in single language
      evidence.push(
        createEvidence('single-language-focus', 'neutral', `Deep specialization in ${primaryLang}.`)
      );
    } else if (distinctLanguages.length > 5) {
      stackScore += 5;
      evidence.push(
        createEvidence('wide-language-variety', 'neutral', `${distinctLanguages.length} distinct languages observed across repositories.`)
      );
    }
  }

  stackScore = Math.min(stackScore, TECHNICAL_COMPONENT_WEIGHTS.stackFocus);

  breakdown.push({
    component: 'Stack Focus & Cohesion',
    earned: stackScore,
    max: TECHNICAL_COMPONENT_WEIGHTS.stackFocus,
    description: distinctLanguages.length > 0
      ? `Primary: ${primaryLang} with ${distinctLanguages.length} languages identified`
      : 'No detected language focus',
  });

  // 3. Technology Topic Tags (Max 25)
  const reposWithTopics = originalRepos.filter((r) => r.hasTopics);
  let topicsScore = 0;

  if (reposWithTopics.length >= 3) {
    topicsScore = 25;
    evidence.push(
      createEvidence('topics-strong', 'positive', `${reposWithTopics.length} repositories are indexed with technology topic tags.`)
    );
  } else if (reposWithTopics.length >= 1) {
    topicsScore = 15;
    evidence.push(
      createEvidence('topics-partial', 'neutral', `${reposWithTopics.length} repositories have topic tags configured.`)
    );
  } else {
    topicsScore = 0;
    evidence.push(
      createEvidence('topics-none', 'neutral', 'Repositories do not specify technology topics or framework keywords.')
    );
  }

  breakdown.push({
    component: 'Technology Topic Tags',
    earned: topicsScore,
    max: TECHNICAL_COMPONENT_WEIGHTS.topicMetadata,
    description: `${reposWithTopics.length} repositories tagged with framework/technology topics`,
  });

  const totalScore = clamp(
    coverageScore + stackScore + topicsScore,
    0,
    100
  );

  return {
    id: 'technicalSignals',
    label: 'Technical Signals',
    weight: CATEGORY_TECHNICAL_WEIGHT,
    score: totalScore,
    weightedScore: round(totalScore * CATEGORY_TECHNICAL_WEIGHT, 1),
    breakdown,
    evidence,
  };
}
