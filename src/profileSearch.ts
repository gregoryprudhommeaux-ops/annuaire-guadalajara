import type { UserProfile } from './types';
import { normalizedTargetKeywords } from './types';
import { activityCategoryLabel, workFunctionLabel } from './constants';
import { needOptionLabel } from './needOptions';
import { getPassionLabel, sanitizePassionIds } from './lib/passionConfig';

/**
 * Texte concaténé (minuscules) pour la recherche plein texte sur l’annuaire :
 * nom, société, secteur / fonction (FR + ES), bio, lieu, passions (hors business), mots-clés, besoins structurés (libellés FR + ES + codes).
 */
export function buildProfileSearchBlob(p: UserProfile): string {
  const parts: string[] = [
    p.fullName,
    p.companyName,
    p.positionCategory || '',
    workFunctionLabel(p.positionCategory, 'fr'),
    workFunctionLabel(p.positionCategory, 'es'),
    workFunctionLabel(p.positionCategory, 'en'),
    p.activityCategory || '',
    activityCategoryLabel(p.activityCategory, 'fr'),
    activityCategoryLabel(p.activityCategory, 'es'),
    activityCategoryLabel(p.activityCategory, 'en'),
    p.bio || '',
    p.city || '',
    p.state || '',
    p.neighborhood || '',
    ...sanitizePassionIds(p.passionIds).flatMap((id) => [
      getPassionLabel(id, 'fr'),
      getPassionLabel(id, 'es'),
      getPassionLabel(id, 'en'),
      id,
    ]),
    p.linkedin || '',
    p.website || '',
    ...normalizedTargetKeywords(p),
    ...(p.highlightedNeeds || []).flatMap((id) => [
      needOptionLabel(id, 'fr'),
      needOptionLabel(id, 'es'),
      needOptionLabel(id, 'en'),
      id,
    ]),
  ];
  return parts.join(' ').toLowerCase();
}

export function profileMatchesSearchQuery(p: UserProfile, rawQuery: string): boolean {
  const q = rawQuery.trim().toLowerCase();
  if (!q) return true;
  return buildProfileSearchBlob(p).includes(q);
}
