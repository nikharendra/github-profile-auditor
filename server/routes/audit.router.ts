import { Router, type Request, type Response, type NextFunction } from 'express';
import { ValidationError } from '../types/errors.ts';
import { gitHubService, normalizerService, auditCache, analysisService, geminiService } from '../services/index.ts';
import type { NormalizedAuditResponse } from '../types/normalized.ts';

export const auditRouter = Router();

// Standard GitHub username regex: 1-39 alphanumeric chars or single hyphens, no leading/trailing hyphen
const GITHUB_USERNAME_REGEX = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;

auditRouter.get('/:username', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rawUsername = req.params.username;

    // 1. Validate username format before any network calls
    if (!rawUsername || !GITHUB_USERNAME_REGEX.test(rawUsername.trim())) {
      throw new ValidationError(
        'Invalid GitHub username format. Usernames must be 1-39 characters and contain only alphanumeric characters or single hyphens.'
      );
    }

    const username = rawUsername.trim();

    // 2. Check in-memory cache for recent audits
    const cached = auditCache.get(username);
    if (cached) {
      res.status(200).json({
        ...cached,
        metadata: {
          ...cached.metadata,
          cached: true,
        },
      });
      return;
    }

    // 3. Fetch user profile and repository list from GitHub REST API
    const rawUser = await gitHubService.fetchUserProfile(username);
    const rawRepos = await gitHubService.fetchUserRepositories(username);

    // 4. Deterministically select candidate repositories for deeper README inspection (max 4)
    const inspectedRepos = gitHubService.selectRepositoriesForInspection(rawRepos);

    // 5. Concurrently fetch READMEs for selected candidate repositories
    const readmeMap = await gitHubService.fetchBatchReadmes(rawUser.login, inspectedRepos);

    // 6. Normalize external data into our internal domain model
    const normalizedData = normalizerService.normalizeAll(
      rawUser,
      rawRepos,
      readmeMap,
      inspectedRepos,
      false
    );

    // 7. Execute pure deterministic analysis engine across 5 categories
    const audit = analysisService.analyze(normalizedData);

    // 8. Generate qualitative recruiter interpretation via Gemini (isolated, non-blocking fallback)
    const ai = await geminiService.generateInterpretation(normalizedData, audit);

    const fullResponse: NormalizedAuditResponse = {
      ...normalizedData,
      audit,
      ai,
    };

    // 9. Store in in-memory TTL cache (10 min)
    auditCache.set(username, fullResponse);

    // 10. Return combined response
    res.status(200).json(fullResponse);
  } catch (err) {
    next(err);
  }
});
