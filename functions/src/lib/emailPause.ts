import { defineString } from 'firebase-functions/params';
import { logger } from 'firebase-functions/v2';

/**
 * Temporary Resend quota guard.
 * Empty string = no pause. ISO timestamp = skip automated sends until then.
 * Default: ~24h from the Oct 8 2026 quota spike (tomorrow afternoon Mexico).
 */
const EMAIL_PAUSE_UNTIL = defineString('EMAIL_PAUSE_UNTIL', {
  default: '2026-10-09T20:00:00.000Z',
});

/** True while Resend daily quota should be preserved (skip digests / campaigns). */
export function isAutomatedEmailPaused(now = new Date()): boolean {
  const raw = EMAIL_PAUSE_UNTIL.value().trim();
  if (!raw) return false;
  const until = Date.parse(raw);
  if (Number.isNaN(until)) {
    logger.warn('EMAIL_PAUSE_UNTIL invalid, ignoring', { raw });
    return false;
  }
  return now.getTime() < until;
}

export function logEmailPauseSkip(job: string): void {
  logger.info('Resend pause: skip automated email job', {
    job,
    until: EMAIL_PAUSE_UNTIL.value().trim() || null,
  });
}
