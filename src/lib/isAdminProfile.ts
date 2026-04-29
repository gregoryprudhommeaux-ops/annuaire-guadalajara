import type { UserProfile } from '@/types';

/**
 * Heuristic used for analytics counters: the admin account should never be counted as a "member".
 * We rely on the stored profile role flag when present.
 */
export function isAdminProfileLike(row: Partial<Pick<UserProfile, 'role'>> | null | undefined): boolean {
  return row?.role === 'admin';
}
