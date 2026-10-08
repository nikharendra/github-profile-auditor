import type { NormalizedData } from '../../types/normalized.ts';
import type { DeterministicAudit, CategoryId, CategoryScore } from '../../types/audit.ts';
import { evaluateProfilePresentation } from './profile.rules.ts';
import { evaluateProjectQuality } from './project.rules.ts';
import { evaluateDocumentation } from './documentation.rules.ts';
import { evaluateActivityConsistency } from './activity.rules.ts';
import { evaluateTechnicalSignals } from './technical.rules.ts';
import { clamp, round } from './analysis.utils.ts';

/**
 * Deterministic Analysis Service.
 * Coordinates pure scoring rule modules across all 5 categories.
 * Calculates exact weighted overall score backed by transparent itemized evidence.
 */
export class AnalysisService {
  /**
   * Computes complete deterministic audit from normalized data.
   */
  analyze(data: NormalizedData): DeterministicAudit {
    // 1. Run isolated, pure category evaluations
    const profileScore = evaluateProfilePresentation(data);
    const projectScore = evaluateProjectQuality(data);
    const documentationScore = evaluateDocumentation(data);
    const activityScore = evaluateActivityConsistency(data);
    const technicalScore = evaluateTechnicalSignals(data);

    // 2. Strict frozen weighted formula:
    // Profile: 20%, Project: 30%, Documentation: 20%, Activity: 15%, Technical: 15%
    const rawOverall =
      profileScore.score * 0.20 +
      projectScore.score * 0.30 +
      documentationScore.score * 0.20 +
      activityScore.score * 0.15 +
      technicalScore.score * 0.15;

    const overallScore = clamp(round(rawOverall, 0), 0, 100);

    const categories: Record<CategoryId, CategoryScore> = {
      profilePresentation: profileScore,
      projectQuality: projectScore,
      documentation: documentationScore,
      activityConsistency: activityScore,
      technicalSignals: technicalScore,
    };

    // 3. Compile summary statistics for UI and future AI synthesis
    const originalRepos = data.originalRepositories;
    const languages = Array.from(
      new Set(
        originalRepos
          .map((r) => r.language)
          .filter((l) => l && l !== 'Unspecified')
      )
    );

    const inspectedWithReadme = data.repositories.filter(
      (r) => r.inspectedForReadme && r.readme?.hasReadme
    ).length;

    const reposWithDescription = originalRepos.filter((r) => r.hasDescription).length;

    // Last active date from most recently pushed repo
    let lastActiveDate = data.profile.accountCreatedAt;
    if (data.repositories.length > 0) {
      const sortedByPush = [...data.repositories].sort(
        (a, b) => new Date(b.pushedAt).getTime() - new Date(a.pushedAt).getTime()
      );
      if (sortedByPush[0]?.pushedAt) {
        lastActiveDate = sortedByPush[0].pushedAt;
      }
    }

    return {
      overallScore,
      categories,
      summaryStats: {
        totalRepos: data.repositories.length,
        originalRepos: originalRepos.length,
        forkedRepos: data.forkedRepositories.length,
        primaryLanguages: languages,
        reposWithReadme: inspectedWithReadme,
        reposWithDescription,
        lastActiveDate,
      },
    };
  }
}

export const analysisService = new AnalysisService();
