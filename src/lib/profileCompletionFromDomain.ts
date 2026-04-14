import type { Language, UserProfile } from '../types';
import { calculateProfileCompletion } from '../domain/member/profile-completion';
import { mapUserProfileToMember } from '../domain/member/member.mappers';
import {
  getPriorityMissingFields,
  getProfileCompletionPercent,
  profileCompletionDefaultLabels,
  type CompletionItem,
  type ProfileCompletionInput,
  type ProfileCompletionKey,
} from './profileCompletion';

/** Domain rule keys → checklist keys used by the profile form / scroll targets. */
const DOMAIN_MISSING_TO_PROFILE_KEY: Partial<Record<string, ProfileCompletionKey>> = {
  fullName: 'fullName',
  email: 'email',
  linkedin: 'linkedinUrl',
  phoneWhatsapp: 'preferredContact',
  languages: 'workLanguages',
  bio: 'memberBio',
  companyName: 'companyName',
  activityDescription: 'activityDescription',
  lookingForText: 'networkGoal',
  helpOfferText: 'helpNewcomers',
  hobbies: 'passions',
};

function tryUserProfile(profile: ProfileCompletionInput): UserProfile | null {
  const p = profile as Partial<UserProfile>;
  if (!p?.uid || typeof p.fullName !== 'string') return null;
  return p as UserProfile;
}

/**
 * Profile completion % from the Step 2 canonical {@link Member} rules, with fallback
 * to the legacy checklist if mapping fails or the draft is too incomplete for a member id.
 */
export function getProfileCompletionPercentFromDomain(profile: ProfileCompletionInput): number {
  const full = tryUserProfile(profile);
  if (!full) return getProfileCompletionPercent(profile);
  try {
    return calculateProfileCompletion(mapUserProfileToMember(full)).percent;
  } catch {
    return getProfileCompletionPercent(profile);
  }
}

/**
 * Top missing fields for the profile card: derived from domain rules when possible,
 * mapped to existing {@link ProfileCompletionKey} values so scroll/focus keeps working.
 */
export function getPriorityMissingFieldsFromDomain(
  profile: ProfileCompletionInput,
  lang: Language
): CompletionItem[] {
  const labels = profileCompletionDefaultLabels(lang);
  const full = tryUserProfile(profile);
  if (!full) return getPriorityMissingFields(profile, labels);
  try {
    const { missingFields } = calculateProfileCompletion(mapUserProfileToMember(full));
    const mapped: ProfileCompletionKey[] = [];
    const seen = new Set<ProfileCompletionKey>();
    for (const k of missingFields) {
      const pk = DOMAIN_MISSING_TO_PROFILE_KEY[k];
      if (!pk || seen.has(pk)) continue;
      seen.add(pk);
      mapped.push(pk);
    }
    if (mapped.length === 0) {
      return getPriorityMissingFields(profile, labels);
    }
    return mapped.slice(0, 3).map((key) => ({
      key,
      label: labels[key],
      done: false,
      weight: 1,
    }));
  } catch {
    return getPriorityMissingFields(profile, labels);
  }
}
