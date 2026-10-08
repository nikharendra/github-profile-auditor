import type { EvidenceItem } from '../../types/audit.ts';

/**
 * Clamps a number to the range [min, max].
 */
export function clamp(value: number, min = 0, max = 100): number {
  if (Number.isNaN(value) || !Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

/**
 * Rounds a number to a fixed number of decimal places (default: 0).
 */
export function round(value: number, decimals = 0): number {
  if (Number.isNaN(value) || !Number.isFinite(value)) return 0;
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/**
 * Calculates a percentage (0 to 100), returning 0 if total <= 0.
 */
export function safePercentage(part: number, total: number): number {
  if (total <= 0) return 0;
  return clamp((part / total) * 100);
}

/**
 * Creates an EvidenceItem helper.
 */
export function createEvidence(
  id: string,
  type: 'positive' | 'warning' | 'neutral',
  text: string,
  metric?: string
): EvidenceItem {
  return { id, type, text, metric };
}
