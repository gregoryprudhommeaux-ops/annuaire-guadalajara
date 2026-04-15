import type { Language, UserProfile } from '@/types';
import { effectiveMemberBio, firstSlotActivityDescription } from '@/lib/companyActivities';
import { getCleanPreviewText } from '@/features/network/utils/memberProfilePreview';

const EMPTY_MEMBER_BIO: Record<Language, string> = {
  fr: 'Présentation à compléter.',
  es: 'Presentación por completar.',
  en: 'Profile presentation to be completed.',
};

/** Texte brut pour cartes annuaire : bio membre, sinon 1ʳᵉ description d’activité / repli legacy. */
export function memberListingBioSource(p: Partial<UserProfile> | null | undefined): string {
  const direct = effectiveMemberBio(p).trim();
  if (direct) return direct;
  return firstSlotActivityDescription(p).trim();
}

export function getMemberBioPreview(
  bio: string | undefined,
  locale: Language = 'fr',
  maxLength = 210
): string {
  return getCleanPreviewText(bio, EMPTY_MEMBER_BIO[locale], maxLength);
}
