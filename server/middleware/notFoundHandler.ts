import type { Request, Response } from 'express';
import type { ApiErrorResponse } from '../types/errors.ts';

/**
 * Handles undefined API routes.
 */
export function notFoundHandler(req: Request, res: Response): void {
  const payload: ApiErrorResponse = {
    error: `API route not found: ${req.method} ${req.originalUrl}`,
    code: 'NOT_FOUND' as any,
    statusCode: 404,
    timestamp: new Date().toISOString(),
  };

  res.status(404).json(payload);
}
