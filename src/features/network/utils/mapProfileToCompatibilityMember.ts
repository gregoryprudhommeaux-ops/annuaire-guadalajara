import type { CompatibilityMember } from '../types/compatibility';

export type RawProfile = {
  id?: string;
  uid?: string;
  slug?: string;
  profileSlug?: string;
  fullName?: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;

  companyName?: string;
  company?: string;

  sector?: string;
  city?: string;

  currentNeeds?: string[];
  helpOfferText?: string;
  lookingForText?: string;

  passions?: string[];
  hobbies?: string[];

  openness?: string[];
  openTo?: string[];

  keywords?: string[] | string;
};

function buildFullName(profile?: RawProfile | null): string {
  if (!profile) return '';
  if (profile.fullName?.trim()) return profile.fullName.trim();
  if (profile.displayName?.trim()) return profile.displayName.trim();

  const first = profile.firstName?.trim() ?? '';
  const last = profile.lastName?.trim() ?? '';
  return `${first} ${last}`.trim();
}

export function mapProfileToCompatibilityMember(
  profile?: RawProfile | null
): CompatibilityMember | null {
  if (!profile) return null;

  return {
    id: profile.id ?? profile.uid,
    slug: profile.slug ?? profile.profileSlug,
    fullName: buildFullName(profile),
    companyName: profile.companyName ?? profile.company,
    sector: profile.sector ?? '',
    city: profile.city ?? '',
    currentNeeds: Array.isArray(profile.currentNeeds) ? profile.currentNeeds : [],
    helpOfferText: profile.helpOfferText ?? '',
    lookingForText: profile.lookingForText ?? '',
    passions: Array.isArray(profile.passions)
      ? profile.passions
      : Array.isArray(profile.hobbies)
        ? profile.hobbies
        : [],
    openness: Array.isArray(profile.openness)
      ? profile.openness
      : Array.isArray(profile.openTo)
        ? profile.openTo
        : [],
    keywords: profile.keywords ?? [],
  };
}
