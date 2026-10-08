import type { NormalizedData } from '../../types/normalized.ts';
import type { CategoryScore, ScoreBreakdownItem, EvidenceItem } from '../../types/audit.ts';
import { clamp, round, createEvidence } from './analysis.utils.ts';

export const PROFILE_COMPONENT_WEIGHTS = {
  bio: 30,
  name: 20,
  avatar: 20,
  website: 15,
  locationOrCompany: 15,
} as const;

export const CATEGORY_PROFILE_WEIGHT = 0.20;

/**
 * Category 1: Profile Presentation (20%)
 * Evaluates whether the public profile communicates clear professional context.
 */
export function evaluateProfilePresentation(data: NormalizedData): CategoryScore {
  const profile = data.profile;
  const breakdown: ScoreBreakdownItem[] = [];
  const evidence: EvidenceItem[] = [];

  // 1. Bio Assessment (Max 30)
  let bioScore = 0;
  if (profile.hasBio) {
    bioScore += 20;
    if (profile.bio.length > 25) {
      bioScore += 10;
      evidence.push(
        createEvidence('bio-detailed', 'positive', `Public bio provides detailed context (${profile.bio.length} characters).`, `${profile.bio.length} chars`)
      );
    } else {
      evidence.push(
        createEvidence('bio-short', 'neutral', `Public bio is present but concise (${profile.bio.length} characters).`, `${profile.bio.length} chars`)
      );
    }
  } else {
    evidence.push(
      createEvidence('bio-missing', 'warning', 'No public bio detected on GitHub profile.')
    );
  }
  breakdown.push({
    component: 'Bio Context',
    earned: bioScore,
    max: PROFILE_COMPONENT_WEIGHTS.bio,
    description: profile.hasBio ? 'Bio present and communicating focus' : 'Missing public bio',
  });

  // 2. Display Name Assessment (Max 20)
  let nameScore = 5; // Base fallback
  if (profile.hasCustomName) {
    nameScore = PROFILE_COMPONENT_WEIGHTS.name;
    evidence.push(
      createEvidence('name-custom', 'positive', `Display name configured as "${profile.name}".`)
    );
  } else {
    evidence.push(
      createEvidence('name-default', 'neutral', `Profile uses raw username (@${profile.username}) as display name.`)
    );
  }
  breakdown.push({
    component: 'Display Name',
    earned: nameScore,
    max: PROFILE_COMPONENT_WEIGHTS.name,
    description: profile.hasCustomName ? 'Custom human display name set' : 'Using raw username',
  });

  // 3. Avatar Assessment (Max 20)
  let avatarScore = 5;
  if (profile.hasAvatar) {
    avatarScore = PROFILE_COMPONENT_WEIGHTS.avatar;
    evidence.push(
      createEvidence('avatar-custom', 'positive', 'Custom profile avatar is active.')
    );
  } else {
    evidence.push(
      createEvidence('avatar-default', 'warning', 'Default or generated identicon avatar in use.')
    );
  }
  breakdown.push({
    component: 'Profile Avatar',
    earned: avatarScore,
    max: PROFILE_COMPONENT_WEIGHTS.avatar,
    description: profile.hasAvatar ? 'Custom photo / icon uploaded' : 'Default avatar',
  });

  // 4. Website / Portfolio Link (Max 15)
  let websiteScore = 0;
  if (profile.blogUrl && profile.blogUrl.trim().length > 0) {
    websiteScore = PROFILE_COMPONENT_WEIGHTS.website;
    evidence.push(
      createEvidence('website-present', 'positive', `Public website/portfolio linked: ${profile.blogUrl}`)
    );
  } else {
    evidence.push(
      createEvidence('website-missing', 'neutral', 'No external website, blog, or portfolio link provided.')
    );
  }
  breakdown.push({
    component: 'Portfolio Link',
    earned: websiteScore,
    max: PROFILE_COMPONENT_WEIGHTS.website,
    description: profile.blogUrl ? 'External portfolio/link provided' : 'No external link',
  });

  // 5. Location and Company (Max 15)
  let locationScore = 0;
  const hasLoc = profile.location && profile.location.trim().length > 0;
  const hasComp = profile.company && profile.company.trim().length > 0;

  if (hasLoc) locationScore += 10;
  if (hasComp) locationScore += 5;
  locationScore = Math.min(locationScore, PROFILE_COMPONENT_WEIGHTS.locationOrCompany);

  if (hasLoc && hasComp) {
    evidence.push(
      createEvidence('location-company', 'positive', `Location (${profile.location}) and affiliation (${profile.company}) specified.`)
    );
  } else if (hasLoc) {
    evidence.push(
      createEvidence('location-only', 'neutral', `Location specified (${profile.location}).`)
    );
  } else if (hasComp) {
    evidence.push(
      createEvidence('company-only', 'neutral', `Affiliation specified (${profile.company}).`)
    );
  } else {
    evidence.push(
      createEvidence('location-company-missing', 'neutral', 'No location or organization affiliation specified.')
    );
  }
  breakdown.push({
    component: 'Location & Affiliation',
    earned: locationScore,
    max: PROFILE_COMPONENT_WEIGHTS.locationOrCompany,
    description: hasLoc || hasComp ? 'Location or organization metadata present' : 'None specified',
  });

  const totalScore = clamp(
    bioScore + nameScore + avatarScore + websiteScore + locationScore,
    0,
    100
  );

  return {
    id: 'profilePresentation',
    label: 'Profile Presentation',
    weight: CATEGORY_PROFILE_WEIGHT,
    score: totalScore,
    weightedScore: round(totalScore * CATEGORY_PROFILE_WEIGHT, 1),
    breakdown,
    evidence,
  };
}
