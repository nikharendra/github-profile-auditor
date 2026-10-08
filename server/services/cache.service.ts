import type { NormalizedAuditResponse } from '../types/normalized.ts';

interface CacheEntry {
  data: NormalizedAuditResponse;
  expiresAt: number;
}

/**
 * Lightweight in-memory TTL cache for normalized audit data.
 * Prevents redundant GitHub API requests within a 10-minute window.
 * Requires zero external infrastructure (no Redis / DB).
 */
export class InMemoryCache {
  private cache = new Map<string, CacheEntry>();
  private readonly ttlMs: number;

  constructor(ttlMinutes = 10) {
    this.ttlMs = ttlMinutes * 60 * 1000;
  }

  get(username: string): NormalizedAuditResponse | null {
    const key = username.toLowerCase().trim();
    const entry = this.cache.get(key);

    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  set(username: string, data: NormalizedAuditResponse): void {
    const key = username.toLowerCase().trim();
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + this.ttlMs,
    });
  }

  delete(username: string): void {
    this.cache.delete(username.toLowerCase().trim());
  }

  clear(): void {
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }
}

export const auditCache = new InMemoryCache(10);
