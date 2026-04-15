import type { Language, UserProfile } from '@/types';
import { normalizedTargetKeywords } from '@/types';
import { needOptionLabel, sanitizeHighlightedNeeds } from '@/needOptions';
import { getPassionLabel, sanitizePassionIds, type PassionLocale } from '@/lib/passionConfig';
import type { CompatibilityMember } from '../types/compatibility';

/** Données d’affichage recommandations : même shape que `CompatibilityMember` + photo optionnelle. */
export type RecommendedCompatibilityMember = CompatibilityMember & { photoURL?: string };

const MENTORING_LABEL_FR = 'Mentorat / partage d’expérience';
const TALKS_LABEL_FR = 'Interventions / prises de parole';
const EVENTS_LABEL_FR = 'Co-organisation d’événements';

export function userProfileToCompatibilityMember(p: UserProfile, lang: Language): CompatibilityMember {
  const locale = lang as PassionLocale;
  const currentNeedsLabels = sanitizeHighlightedNeeds(p.highlightedNeeds).map((id) =>
    needOptionLabel(id, lang)
  );
  const passionIds = sanitizePassionIds(p.passionIds);
  const passions = passionIds.map((id) => getPassionLabel(id, locale));

  const openness: string[] = [];
  if (p.openToMentoring) openness.push(MENTORING_LABEL_FR);
  if (p.openToTalks) openness.push(TALKS_LABEL_FR);
  if (p.openToEvents) openness.push(EVENTS_LABEL_FR);

  return {
    id: p.uid,
    slug: p.uid,
    fullName: p.fullName,
    companyName: p.companyName,
    sector: p.activityCategory,
    city: p.city,
    currentNeeds: currentNeedsLabels,
    helpOfferText: p.helpNewcomers,
    lookingForText: p.networkGoal ?? p.lookingFor,
    passions,
    openness,
    keywords: normalizedTargetKeywords(p),
  };
}

export function userProfileToRecommendedMember(
  p: UserProfile,
  lang: Language
): RecommendedCompatibilityMember {
  return {
    ...userProfileToCompatibilityMember(p, lang),
    photoURL: p.photoURL?.trim() || undefined,
  };
}
