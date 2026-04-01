import type { CommunityCompanyKind, CommunityMemberStatus, UserProfile } from '../types';
import { isEmployeeCountRange } from '../constants';
import { sanitizePassionIds } from './passionConfig';
import { effectiveMemberBio, firstSlotActivityDescription } from './companyActivities';

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
 * (Effectifs / mots-clés / besoins mis en avant : optionnels ; état, pays et champs analytics requis ; au moins une passion requise.)
 */
export function profileMeetsPublicationRequirements(
  p: Partial<UserProfile> | null | undefined
): boolean {
  return getProfilePublicationBlockReason(p) === null;
}

/** Première cause bloquante (pour messages d’erreur explicites côté formulaire). */
const PUBLICATION_COMMUNITY_COMPANY_KINDS: readonly CommunityCompanyKind[] = [
  'startup',
  'pme',
  'corporate',
  'independent',
  'association',
  'nonprofit',
  'club',
];
const PUBLICATION_COMMUNITY_MEMBER_STATUSES: readonly CommunityMemberStatus[] = [
  'freelance',
  'employee',
  'owner',
  'volunteer',
];

export type ProfilePublicationBlockReason =
  | 'identity'
  | 'activity'
  | 'city'
  | 'state'
  | 'country'
  | 'communityCompanyKind'
  | 'communityMemberStatus'
  | 'website'
  | 'whatsapp'
  | 'bio'
  | 'activityDescription'
  | 'passions';

export function getProfilePublicationBlockReason(
  p: Partial<UserProfile> | null | undefined
): ProfilePublicationBlockReason | null {
  if (!p) return 'identity';
  if (!(p.fullName?.trim() && p.companyName?.trim() && p.email?.trim())) return 'identity';
  if (!(p.activityCategory?.trim() && p.positionCategory?.trim())) return 'activity';
  if (!p.city?.trim()) return 'city';
  if (!p.state?.trim()) return 'state';
  if (!p.country?.trim()) return 'country';
  const cck = p.communityCompanyKind;
  if (!cck || !(PUBLICATION_COMMUNITY_COMPANY_KINDS as readonly string[]).includes(cck)) {
    return 'communityCompanyKind';
  }
  const cms = p.communityMemberStatus;
  if (!cms || !(PUBLICATION_COMMUNITY_MEMBER_STATUSES as readonly string[]).includes(cms)) {
    return 'communityMemberStatus';
  }
  const web = p.website?.trim() ?? '';
  if (!web || !/^https?:\/\/.+/i.test(web)) return 'website';
  if (!p.whatsapp?.trim()) return 'whatsapp';
  const memberBio = effectiveMemberBio(p);
  if (memberBio.length < PUBLICATION_BIO_MIN_LEN) return 'bio';
  const actDesc = firstSlotActivityDescription(p);
  if (actDesc.length < PUBLICATION_BIO_MIN_LEN) return 'activityDescription';
  if (sanitizePassionIds(p.passionIds).length < 1) return 'passions';
  return null;
}
