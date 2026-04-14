import type { Language } from '../../types';
import type { UserProfile } from '../../types';
import {
  getProfileCompletionPercent,
  getPriorityMissingFields,
  profileCompletionDefaultLabels,
} from '../../lib/profileCompletion';

export type ProfileCompletionScore = {
  percent: number;
  missingTop: { key: string; label: string }[];
};

/**
 * Canonical adapter around the existing scoring rules.
 * SAFE: does not change current scoring; just packages it as a domain object.
 */
export function computeProfileCompletion(
  profile: Partial<UserProfile> | null | undefined,
  lang: Language
): ProfileCompletionScore {
  const percent = getProfileCompletionPercent(profile);
  const labels = profileCompletionDefaultLabels(lang);
  const missingTop = getPriorityMissingFields(profile, labels).map((x) => ({
    key: x.key,
    label: x.label,
  }));
  return { percent, missingTop };
}

