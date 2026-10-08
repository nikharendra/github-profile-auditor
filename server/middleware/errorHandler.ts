import type { Request, Response, NextFunction } from 'express';
import { AppError, type ApiErrorResponse } from '../types/errors.ts';

/**
 * Central Express error handler.
 * Formats errors into a consistent JSON response and suppresses internal traces.
 */
export function errorHandler(
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const isAppError = err instanceof AppError;
  const statusCode = isAppError ? err.statusCode : 500;
  const code = isAppError ? err.code : 'INTERNAL_SERVER_ERROR';
  const message = isAppError ? err.message : 'An unexpected server error occurred.';

  const payload: ApiErrorResponse = {
    error: message,
    code,
    statusCode,
    timestamp: new Date().toISOString(),
    ...(isAppError && err.details ? { details: err.details } : {}),
  };

  // Safe server logging in non-production environments
  if (process.env.NODE_ENV !== 'production' && statusCode >= 500) {
    console.error(`[Server Error] ${err.name}: ${err.message}`, err.stack);
  }

  res.status(statusCode).json(payload);
}
