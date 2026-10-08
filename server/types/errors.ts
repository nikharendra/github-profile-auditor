/**
 * Domain and HTTP Error classes for the backend.
 * Guarantees uniform error shapes without leaking sensitive internals or stack traces.
 */

export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'USER_NOT_FOUND'
  | 'GITHUB_RATE_LIMITED'
  | 'EXTERNAL_SERVICE_ERROR'
  | 'INTERNAL_SERVER_ERROR'
  | 'NOT_IMPLEMENTED';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;
  public readonly details?: unknown;

  constructor(message: string, statusCode = 500, code: ErrorCode = 'INTERNAL_SERVER_ERROR', details?: unknown) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found', details?: unknown) {
    super(message, 404, 'USER_NOT_FOUND', details);
  }
}

export class RateLimitError extends AppError {
  public readonly resetTime?: number;
  constructor(message = 'GitHub API rate limit reached. Please wait or configure GITHUB_TOKEN.', resetTime?: number) {
    super(message, 429, 'GITHUB_RATE_LIMITED', { resetTime });
    this.resetTime = resetTime;
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, message: string, details?: unknown) {
    super(`${service} service unavailable: ${message}`, 502, 'EXTERNAL_SERVICE_ERROR', details);
  }
}

export interface ApiErrorResponse {
  error: string;
  code: ErrorCode;
  statusCode: number;
  timestamp: string;
  details?: unknown;
}
