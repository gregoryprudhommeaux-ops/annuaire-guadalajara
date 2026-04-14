import type { Language, UserProfile } from '@/types';
import { effectiveMemberBio, firstSlotActivityDescription } from '@/lib/companyActivities';

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

function truncatePreview(text: string, max: number): string {
  if (text.length <= max) return text;
  const slice = text.slice(0, max);
  const lastSpace = slice.lastIndexOf(' ');
  const end = lastSpace > Math.floor(max * 0.55) ? lastSpace : max;
  return `${text.slice(0, end).trim()}…`;
}

export function getMemberBioPreview(
  bio: string | undefined,
  locale: Language = 'fr',
  maxLength = 210
): string {
  const clean = (bio ?? '').replace(/\s+/g, ' ').trim();

  if (!clean) {
    return EMPTY_MEMBER_BIO[locale];
  }

  return truncatePreview(clean, maxLength);
}
