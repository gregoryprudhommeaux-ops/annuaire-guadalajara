import type { UserProfile } from '../types';
import { normalizedTargetKeywords } from '../types';
import { isEmployeeCountRange } from '../constants';
import { sanitizePassionIds } from './passionConfig';
import { sanitizeHighlightedNeeds } from '../needOptions';

/** Longueur minimale de la bio pour considérer la fiche « publiable ». */
export const PUBLICATION_BIO_MIN_LEN = 15;

/** Seuil d’optimisation IA (aligné sur `getProfileAiRecommendationReadiness`). */
export const AI_OPTIMIZATION_READINESS_TARGET = 0.8;

function hasEmployeeInfo(p: Partial<UserProfile>): boolean {
  if (p.companySize) return true;
  const ec = p.employeeCount;
  if (typeof ec === 'string' && isEmployeeCountRange(ec)) return true;
  if (typeof ec === 'number' && Number.isFinite(ec)) return true;
  return false;
}

/**
 * Champs minimum pour qu’un admin puisse valider / publier la fiche annuaire.
 * À garder aligné avec les astérisques du formulaire et la validation à l’enregistrement.
 */
export function profileMeetsPublicationRequirements(
  p: Partial<UserProfile> | null | undefined
): boolean {
  if (!p) return false;
  if (!(p.fullName?.trim() && p.companyName?.trim() && p.email?.trim())) return false;
  if (!(p.activityCategory?.trim() && p.positionCategory?.trim())) return false;
  if (!p.city?.trim()) return false;
  const web = p.website?.trim() ?? '';
  if (!web || !/^https?:\/\/.+/i.test(web)) return false;
  if (!p.whatsapp?.trim()) return false;
  const bio = p.bio?.trim() ?? '';
  if (bio.length < PUBLICATION_BIO_MIN_LEN) return false;
  if (!hasEmployeeInfo(p)) return false;
  if (sanitizeHighlightedNeeds(p.highlightedNeeds).length < 1) return false;
  const passions = sanitizePassionIds(p.passionIds);
  const kw = normalizedTargetKeywords(p as UserProfile);
  if (passions.length < 1 && kw.length < 1) return false;
  return true;
}
