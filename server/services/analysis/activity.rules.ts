import type { NormalizedData } from '../../types/normalized.ts';
import type { CategoryScore, ScoreBreakdownItem, EvidenceItem } from '../../types/audit.ts';
import { clamp, round, createEvidence } from './analysis.utils.ts';

export const ACTIVITY_COMPONENT_WEIGHTS = {
  pushRecency: 40,
  activeReposCount: 35,
  continuity: 25,
} as const;

export const CATEGORY_ACTIVITY_WEIGHT = 0.15;

/**
 * Category 4: Activity & Consistency (15%)
 * Evaluates observable repository push recency and project maintenance.
 * Note: Measures repository-level push metadata, NOT individual commit frequency.
 */
export function evaluateActivityConsistency(data: NormalizedData): CategoryScore {
  const profile = data.profile;
  const reposToEvaluate = data.originalRepositories.length > 0
    ? data.originalRepositories
    : data.repositories;

  const breakdown: ScoreBreakdownItem[] = [];
  const evidence: EvidenceItem[] = [];

  // Edge case: No repositories
  if (reposToEvaluate.length === 0) {
    evidence.push(
      createEvidence('no-activity', 'warning', 'No repositories available to evaluate activity signals.')
    );
    return {
      id: 'activityConsistency',
      label: 'Activity & Consistency',
      weight: CATEGORY_ACTIVITY_WEIGHT,
      score: 0,
      weightedScore: 0,
      breakdown: [
        {
          component: 'Recent Push Activity',
          earned: 0,
          max: ACTIVITY_COMPONENT_WEIGHTS.pushRecency,
          description: 'No repositories found',
        },
        {
          component: 'Active Projects in Window',
          earned: 0,
          max: ACTIVITY_COMPONENT_WEIGHTS.activeReposCount,
          description: 'No repositories found',
        },
        {
          component: 'Account Continuity',
          earned: 0,
          max: ACTIVITY_COMPONENT_WEIGHTS.continuity,
          description: 'No repositories found',
        },
      ],
      evidence,
    };
  }

  // 1. Most Recent Push Recency (Max 40)
  const unarchivedRepos = reposToEvaluate.filter((r) => !r.isArchived);
  const activeCandidates = unarchivedRepos.length > 0 ? unarchivedRepos : reposToEvaluate;

  const minDaysSincePush = Math.min(...activeCandidates.map((r) => r.daysSinceLastPush));
  let recencyScore = 0;

  if (minDaysSincePush <= 30) {
    recencyScore = 40;
    evidence.push(
      createEvidence('push-recent-30', 'positive', `Most recent repository push was ${minDaysSincePush} days ago (within 30 days).`, `${minDaysSincePush}d ago`)
    );
  } else if (minDaysSincePush <= 90) {
    recencyScore = 30;
    evidence.push(
      createEvidence('push-recent-90', 'positive', `Most recent repository push was ${minDaysSincePush} days ago (within 3 months).`, `${minDaysSincePush}d ago`)
    );
  } else if (minDaysSincePush <= 180) {
    recencyScore = 20;
    evidence.push(
      createEvidence('push-recent-180', 'neutral', `Most recent repository push was ${minDaysSincePush} days ago (within 6 months).`, `${minDaysSincePush}d ago`)
    );
  } else if (minDaysSincePush <= 365) {
    recencyScore = 10;
    evidence.push(
      createEvidence('push-recent-365', 'warning', `Most recent repository push was ${minDaysSincePush} days ago (within 1 year).`, `${minDaysSincePush}d ago`)
    );
  } else {
    recencyScore = 0;
    evidence.push(
      createEvidence('push-stale', 'warning', `No repository push detected within the past year (last active ${minDaysSincePush} days ago).`, `${minDaysSincePush}d ago`)
    );
  }

  breakdown.push({
    component: 'Recent Push Activity',
    earned: recencyScore,
    max: ACTIVITY_COMPONENT_WEIGHTS.pushRecency,
    description: `Last pushed code ${minDaysSincePush} days ago`,
  });

  // 2. Active Projects in Recent Window (last 180 days) (Max 35)
  const activeIn180Days = activeCandidates.filter((r) => r.daysSinceLastPush <= 180);
  let activeReposScore = 0;

  if (activeIn180Days.length >= 3) {
    activeReposScore = 35;
  } else if (activeIn180Days.length === 2) {
    activeReposScore = 25;
  } else if (activeIn180Days.length === 1) {
    activeReposScore = 15;
  } else {
    activeReposScore = 0;
  }

  evidence.push(
    createEvidence(
      'active-repos-180d',
      activeIn180Days.length >= 2 ? 'positive' : activeIn180Days.length === 1 ? 'neutral' : 'warning',
      `${activeIn180Days.length} original projects received updates within the last 180 days.`,
      `${activeIn180Days.length} projects`
    )
  );

  breakdown.push({
    component: 'Active Projects in Window',
    earned: activeReposScore,
    max: ACTIVITY_COMPONENT_WEIGHTS.activeReposCount,
    description: `${activeIn180Days.length} projects updated within the last 6 months`,
  });

  // 3. Continuity & Tenure (Max 25)
  // Anti-bias rule: Fairly handles new accounts without penalizing young developers
  let continuityScore = 0;
  const isNewAccount = profile.accountAgeDays < 180;

  if (isNewAccount) {
    if (minDaysSincePush <= 45) {
      continuityScore = 25;
      evidence.push(
        createEvidence('new-account-active', 'positive', `New developer account (${profile.accountAgeDays} days old) showing active development momentum.`)
      );
    } else {
      continuityScore = 15;
      evidence.push(
        createEvidence('new-account-idle', 'neutral', `New account (${profile.accountAgeDays} days old) with initial repositories.`)
      );
    }
  } else {
    if (activeIn180Days.length >= 2) {
      continuityScore = 25;
      evidence.push(
        createEvidence('established-active', 'positive', `Established GitHub account (${Math.floor(profile.accountAgeDays / 365)} years) maintaining active projects.`)
      );
    } else if (minDaysSincePush <= 180) {
      continuityScore = 18;
      evidence.push(
        createEvidence('established-moderate', 'neutral', `Established account with ongoing periodic updates.`)
      );
    } else {
      continuityScore = 8;
      evidence.push(
        createEvidence('established-dormant', 'neutral', `Longstanding account with extended quiet interval.`)
      );
    }
  }

  breakdown.push({
    component: 'Account Continuity',
    earned: continuityScore,
    max: ACTIVITY_COMPONENT_WEIGHTS.continuity,
    description: isNewAccount ? 'New developer account momentum' : 'Established account maintenance',
  });

  const totalScore = clamp(
    recencyScore + activeReposScore + continuityScore,
    0,
    100
  );

  return {
    id: 'activityConsistency',
    label: 'Activity & Consistency',
    weight: CATEGORY_ACTIVITY_WEIGHT,
    score: totalScore,
    weightedScore: round(totalScore * CATEGORY_ACTIVITY_WEIGHT, 1),
    breakdown,
    evidence,
  };
}
