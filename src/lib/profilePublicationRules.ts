import type { UserProfile } from '../types';
import { isEmployeeCountRange } from '../constants';
import { sanitizePassionIds } from './passionConfig';
import { sanitizeHighlightedNeeds } from '../needOptions';

/** Longueur minimale de la bio pour considérer la fiche « publiable ». */
export const PUBLICATION_BIO_MIN_LEN = 15;

/** Seuil d’optimisation IA (aligné sur `getProfileAiRecommendationReadiness`). */
export const AI_OPTIMIZATION_READINESS_TARGET = 0.8;

export function hasEmployeeInfo(p: Partial<UserProfile>): boolean {
  if (p.companySize) return true;
  const ec = p.employeeCount;
  if (typeof ec === 'string' && isEmployeeCountRange(ec)) return true;
  if (typeof ec === 'number' && Number.isFinite(ec)) return true;
  return false;
}

/**
 * Champs minimum pour qu’un admin puisse valider / publier la fiche annuaire.
 * À garder aligné avec les astérisques du formulaire et la validation à l’enregistrement.
 * (Effectifs / mots-clés secteur : optionnels ; au moins une passion requise.)
 */
export function profileMeetsPublicationRequirements(
  p: Partial<UserProfile> | null | undefined
): boolean {
  return getProfilePublicationBlockReason(p) === null;
}

/** Première cause bloquante (pour messages d’erreur explicites côté formulaire). */
export type ProfilePublicationBlockReason =
  | 'identity'
  | 'activity'
  | 'city'
  | 'website'
  | 'whatsapp'
  | 'bio'
  | 'needs'
  | 'passions';

export function getProfilePublicationBlockReason(
  p: Partial<UserProfile> | null | undefined
): ProfilePublicationBlockReason | null {
  if (!p) return 'identity';
  if (!(p.fullName?.trim() && p.companyName?.trim() && p.email?.trim())) return 'identity';
  if (!(p.activityCategory?.trim() && p.positionCategory?.trim())) return 'activity';
  if (!p.city?.trim()) return 'city';
  const web = p.website?.trim() ?? '';
  if (!web || !/^https?:\/\/.+/i.test(web)) return 'website';
  if (!p.whatsapp?.trim()) return 'whatsapp';
  const bio = p.bio?.trim() ?? '';
  if (bio.length < PUBLICATION_BIO_MIN_LEN) return 'bio';
  if (sanitizeHighlightedNeeds(p.highlightedNeeds).length < 1) return 'needs';
  if (sanitizePassionIds(p.passionIds).length < 1) return 'passions';
  return null;
}
