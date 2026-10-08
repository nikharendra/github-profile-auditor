import type { NormalizedData } from '../../types/normalized.ts';
import type { CategoryScore, ScoreBreakdownItem, EvidenceItem } from '../../types/audit.ts';
import { clamp, round, createEvidence } from './analysis.utils.ts';

export const DOCUMENTATION_COMPONENT_WEIGHTS = {
  readmeAvailability: 35,
  setupInstructions: 25,
  usageExamples: 20,
  structureAndVisuals: 20,
} as const;

export const CATEGORY_DOCUMENTATION_WEIGHT = 0.20;

/**
 * Category 3: Documentation Signals (20%)
 * Evaluates README presence, setup guides, usage examples, and structural clarity
 * on the inspected candidate repositories.
 */
export function evaluateDocumentation(data: NormalizedData): CategoryScore {
  const inspectedRepos = data.repositories.filter((r) => r.inspectedForReadme && r.readme);
  const breakdown: ScoreBreakdownItem[] = [];
  const evidence: EvidenceItem[] = [];

  const inspectedCount = inspectedRepos.length;

  // Edge case: No repositories inspected
  if (inspectedCount === 0) {
    evidence.push(
      createEvidence('no-readme-inspected', 'warning', 'No repositories were available for deep documentation inspection.')
    );
    return {
      id: 'documentation',
      label: 'Documentation',
      weight: CATEGORY_DOCUMENTATION_WEIGHT,
      score: 0,
      weightedScore: 0,
      breakdown: [
        {
          component: 'README Availability',
          earned: 0,
          max: DOCUMENTATION_COMPONENT_WEIGHTS.readmeAvailability,
          description: '0 repositories inspected',
        },
        {
          component: 'Setup Instructions',
          earned: 0,
          max: DOCUMENTATION_COMPONENT_WEIGHTS.setupInstructions,
          description: '0 repositories inspected',
        },
        {
          component: 'Usage Examples',
          earned: 0,
          max: DOCUMENTATION_COMPONENT_WEIGHTS.usageExamples,
          description: '0 repositories inspected',
        },
        {
          component: 'Structure & Licensing',
          earned: 0,
          max: DOCUMENTATION_COMPONENT_WEIGHTS.structureAndVisuals,
          description: '0 repositories inspected',
        },
      ],
      evidence,
    };
  }

  evidence.push(
    createEvidence(
      'inspection-scope',
      'neutral',
      `Documentation structural signals evaluated across ${inspectedCount} selected candidate repositories.`,
      `${inspectedCount} inspected`
    )
  );

  // 1. README Availability (Max 35)
  const reposWithReadme = inspectedRepos.filter((r) => r.readme?.hasReadme);
  const readmeRatio = reposWithReadme.length / inspectedCount;
  const readmeScore = Math.round(readmeRatio * DOCUMENTATION_COMPONENT_WEIGHTS.readmeAvailability);

  evidence.push(
    createEvidence(
      'readme-count',
      readmeRatio >= 0.75 ? 'positive' : readmeRatio >= 0.5 ? 'neutral' : 'warning',
      `${reposWithReadme.length} of ${inspectedCount} inspected repositories contain README documentation files.`,
      `${reposWithReadme.length}/${inspectedCount}`
    )
  );

  breakdown.push({
    component: 'README Availability',
    earned: readmeScore,
    max: DOCUMENTATION_COMPONENT_WEIGHTS.readmeAvailability,
    description: `${reposWithReadme.length} of ${inspectedCount} repositories have a README`,
  });

  // 2. Setup / Installation Instructions (Max 25)
  const reposWithSetup = inspectedRepos.filter((r) => r.readme?.hasSetupInstructions);
  const setupRatio = reposWithSetup.length / inspectedCount;
  const setupScore = Math.round(setupRatio * DOCUMENTATION_COMPONENT_WEIGHTS.setupInstructions);

  if (reposWithSetup.length > 0) {
    evidence.push(
      createEvidence(
        'setup-signals',
        setupRatio >= 0.5 ? 'positive' : 'neutral',
        `${reposWithSetup.length} of ${inspectedCount} inspected repositories contain clear installation/setup instructions.`,
        `${reposWithSetup.length}/${inspectedCount}`
      )
    );
  } else {
    evidence.push(
      createEvidence('setup-missing', 'warning', 'No setup or installation guides detected in inspected README files.')
    );
  }

  breakdown.push({
    component: 'Setup Instructions',
    earned: setupScore,
    max: DOCUMENTATION_COMPONENT_WEIGHTS.setupInstructions,
    description: `${reposWithSetup.length} of ${inspectedCount} READMEs include setup or install sections`,
  });

  // 3. Usage Examples & Features (Max 20)
  const reposWithUsage = inspectedRepos.filter((r) => r.readme?.hasUsageExamples);
  const usageRatio = reposWithUsage.length / inspectedCount;
  const usageScore = Math.round(usageRatio * DOCUMENTATION_COMPONENT_WEIGHTS.usageExamples);

  if (reposWithUsage.length > 0) {
    evidence.push(
      createEvidence(
        'usage-signals',
        usageRatio >= 0.5 ? 'positive' : 'neutral',
        `${reposWithUsage.length} of ${inspectedCount} inspected repositories explain usage or API endpoints.`,
        `${reposWithUsage.length}/${inspectedCount}`
      )
    );
  } else {
    evidence.push(
      createEvidence('usage-missing', 'neutral', 'Limited or no usage examples found in inspected READMEs.')
    );
  }

  breakdown.push({
    component: 'Usage Examples',
    earned: usageScore,
    max: DOCUMENTATION_COMPONENT_WEIGHTS.usageExamples,
    description: `${reposWithUsage.length} of ${inspectedCount} READMEs include usage walkthroughs`,
  });

  // 4. Structure, Visuals & Licensing (Max 20)
  const reposWithLicense = inspectedRepos.filter((r) => r.readme?.hasLicenseSection || r.hasLicense);
  const licenseRatio = reposWithLicense.length / inspectedCount;
  const licenseScore = Math.round(licenseRatio * 10);

  const reposWithVisualsOrHeadings = inspectedRepos.filter(
    (r) => (r.readme?.headingsCount || 0) >= 2 || r.readme?.hasScreenshotsOrDemo
  );
  const visualsRatio = reposWithVisualsOrHeadings.length / inspectedCount;
  const visualsScore = Math.round(visualsRatio * 10);

  const structureScore = Math.min(
    licenseScore + visualsScore,
    DOCUMENTATION_COMPONENT_WEIGHTS.structureAndVisuals
  );

  if (reposWithLicense.length > 0) {
    evidence.push(
      createEvidence(
        'license-signals',
        'positive',
        `${reposWithLicense.length} of ${inspectedCount} inspected repositories specify software licensing terms.`,
        `${reposWithLicense.length}/${inspectedCount}`
      )
    );
  } else {
    evidence.push(
      createEvidence('license-missing', 'neutral', 'No license notices detected in inspected repositories.')
    );
  }

  breakdown.push({
    component: 'Structure & Licensing',
    earned: structureScore,
    max: DOCUMENTATION_COMPONENT_WEIGHTS.structureAndVisuals,
    description: `${reposWithLicense.length} licensed, ${reposWithVisualsOrHeadings.length} structured with headings or visuals`,
  });

  const totalScore = clamp(
    readmeScore + setupScore + usageScore + structureScore,
    0,
    100
  );

  return {
    id: 'documentation',
    label: 'Documentation',
    weight: CATEGORY_DOCUMENTATION_WEIGHT,
    score: totalScore,
    weightedScore: round(totalScore * CATEGORY_DOCUMENTATION_WEIGHT, 1),
    breakdown,
    evidence,
  };
}
