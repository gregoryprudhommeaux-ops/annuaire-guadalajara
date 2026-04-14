import type { UserProfile, Language, CompanyActivitySlot } from '../../types';
import { normalizedTargetKeywords } from '../../types';
import type { Company, Location } from '../company/company.types';
import type { Member, ProfileRole } from './member.types';
import { sanitizeHighlightedNeeds } from '../../needOptions';
import { sanitizePassionIds } from '../../lib/passionConfig';
import { getProfileCompletionPercent, getPriorityMissingFields } from '../../lib/profileCompletion';

function mapRole(role: UserProfile['role']): ProfileRole {
  return role === 'admin' ? 'admin' : 'member';
}

function slotLocation(slot: Partial<CompanyActivitySlot> | undefined, p: UserProfile): Location | undefined {
  const city = slot?.city ?? p.city;
  const state = slot?.state ?? p.state;
  const neighborhood = slot?.neighborhood ?? p.neighborhood;
  const country = slot?.country ?? p.country;
  const latitude = p.latitude;
  const longitude = p.longitude;
  if (!city && !state && !neighborhood && !country && !latitude && !longitude) return undefined;
  return { city, state, neighborhood, country, latitude, longitude };
}

function mapCompanyFromSlot(slot: CompanyActivitySlot, p: UserProfile): Company {
  return {
    id: slot.id,
    name: slot.companyName?.trim() || p.companyName?.trim() || '—',
    sectorId: (slot.activityCategory ?? p.activityCategory)?.trim() || undefined,
    website: slot.website?.trim() || p.website?.trim() || undefined,
    positionCategory: (slot.positionCategory ?? p.positionCategory)?.trim() || undefined,
    createdYear: slot.creationYear,
    employeeCount: (slot.employeeCount as any) || p.employeeCount || undefined,
    location: slotLocation(slot, p),
    companyType: (slot.communityCompanyKind ?? p.communityCompanyKind ?? 'unknown') as any,
    professionalStatus: (slot.communityMemberStatus ?? p.communityMemberStatus ?? 'unknown') as any,
    typicalClientSizes: slot.typicalClientSizes ?? p.typicalClientSizes,
    activityDescription: slot.activityDescription?.trim() || undefined,
  };
}

export function mapLegacyProfileToMember(p: UserProfile): Member {
  const slots = Array.isArray(p.companyActivities) ? p.companyActivities : [];
  const companies = slots.map((s) => mapCompanyFromSlot(s, p));
  const primaryCompany = companies[0];
  const loc = slotLocation(slots[0], p);
  const langs: Language[] = (Array.isArray(p.workingLanguageCodes) ? p.workingLanguageCodes : [])
    .map((x) => String(x).trim())
    .filter((x): x is Language => x === 'fr' || x === 'es' || x === 'en');

  const missing = getPriorityMissingFields(p).map((x) => x.key);

  return {
    id: p.uid,
    role: mapRole(p.role),
    fullName: p.fullName?.trim() || '—',
    email: p.email?.trim() || undefined,
    whatsapp: p.whatsapp?.trim() || undefined,
    linkedin: p.linkedin?.trim() || undefined,
    photoUrl: p.photoURL?.trim() || undefined,
    languages: langs,
    location: loc,
    primaryCompany,
    companies,
    highlightedNeedIds: sanitizeHighlightedNeeds(p.highlightedNeeds),
    hobbyIds: sanitizePassionIds(p.passionIds),
    keywords: normalizedTargetKeywords(p),
    contactPreferenceCta: p.contactPreferenceCta?.trim() || undefined,
    communityGoal: p.networkGoal?.trim() || undefined,
    helpNewcomers: p.helpNewcomers?.trim() || undefined,
    visibility: {
      emailPublic: Boolean(p.isEmailPublic),
      whatsappPublic: Boolean(p.isWhatsappPublic),
    },
    openness: {
      openToMentoring: Boolean(p.openToMentoring),
      openToTalks: Boolean(p.openToTalks),
      openToEvents: Boolean(p.openToEvents),
    },
    createdAtMs: typeof (p as any)?.createdAt?.toMillis === 'function' ? (p as any).createdAt.toMillis() : undefined,
    lastSeenMs: typeof p.lastSeen === 'number' ? p.lastSeen : undefined,
    validated: p.isValidated !== false,
    completion: {
      percent: getProfileCompletionPercent(p),
      missingTopKeys: missing,
    },
  };
}

