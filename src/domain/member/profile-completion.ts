import type { Language } from '../../types';
import type { UserProfile } from '../../types';
import {
  getProfileCompletionPercent,
  getPriorityMissingFields,
  profileCompletionDefaultLabels,
} from '../../lib/profileCompletion';
import type { Company } from '../company/company.types';
import type { Need } from '../need/need.types';
import { mapLegacyNeedToCanonical } from '../need/need.mappers';
import type {
  CityKey,
  ClientSizeKey,
  CommunityOpennessKey,
  CompanySizeRangeKey,
  CompanyTypeKey,
  HobbyKey,
  LanguageCode,
  LocaleCode,
  ProfessionalStatusKey,
  ProfileRoleKey,
  SectorKey,
} from '../taxonomy/taxonomy.types';
import type { Member } from './member.types';

export type ProfileCompletionScore = {
  percent: number;
  missingTop: { key: string; label: string }[];
};

/**
 * Canonical adapter around the existing scoring rules.
 * SAFE: does not change current scoring; just packages it as a domain object.
 */
export function computeProfileCompletion(
  profile: Partial<UserProfile> | null | undefined,
  lang: Language
): ProfileCompletionScore {
  const percent = getProfileCompletionPercent(profile);
  const labels = profileCompletionDefaultLabels(lang);
  const missingTop = getPriorityMissingFields(profile, labels).map((x) => ({
    key: x.key,
    label: x.label,
  }));
  return { percent, missingTop };
}

// --- Canonical Member completion (weighted rules on domain `Member`) ---

type CompletionRule = {
  key: string;
  weight: number;
  isComplete: (member: Member) => boolean;
};

const MEMBER_COMPLETION_RULES: CompletionRule[] = [
  {
    key: 'fullName',
    weight: 10,
    isComplete: (member) => Boolean(member.identity.fullName?.trim()),
  },
  {
    key: 'email',
    weight: 8,
    isComplete: (member) => Boolean(member.contact.email?.trim()),
  },
  {
    key: 'linkedin',
    weight: 6,
    isComplete: (member) => Boolean(member.contact.linkedinUrl?.trim()),
  },
  {
    key: 'phoneWhatsapp',
    weight: 8,
    isComplete: (member) => Boolean(member.contact.phoneWhatsapp?.trim()),
  },
  {
    key: 'languages',
    weight: 8,
    isComplete: (member) => member.identity.workLanguages.length > 0,
  },
  {
    key: 'bio',
    weight: 10,
    isComplete: (member) => (member.identity.bio?.trim().length ?? 0) >= 15,
  },
  {
    key: 'photo',
    weight: 6,
    isComplete: (member) => Boolean(member.identity.photoUrl?.trim()),
  },
  {
    key: 'companyName',
    weight: 10,
    isComplete: (member) => Boolean(member.company.name?.trim()),
  },
  {
    key: 'sector',
    weight: 8,
    isComplete: (member) => Boolean(member.company.sector),
  },
  {
    key: 'location',
    weight: 6,
    isComplete: (member) => Boolean(member.company.location?.city),
  },
  {
    key: 'activityDescription',
    weight: 8,
    isComplete: (member) =>
      (member.company.activityDescription?.trim().length ?? 0) >= 15,
  },
  {
    key: 'lookingForText',
    weight: 8,
    isComplete: (member) =>
      (member.networkProfile.lookingForText?.trim().length ?? 0) >= 15,
  },
  {
    key: 'helpOfferText',
    weight: 6,
    isComplete: (member) =>
      (member.networkProfile.helpOfferText?.trim().length ?? 0) >= 15,
  },
  {
    key: 'hobbies',
    weight: 4,
    isComplete: (member) => member.networkProfile.hobbies.length >= 1,
  },
  {
    key: 'openness',
    weight: 4,
    isComplete: (member) => member.networkProfile.openness.length >= 1,
  },
];

export type MemberProfileCompletionResult = {
  percent: number;
  completedWeight: number;
  totalWeight: number;
  missingFields: string[];
  isComplete: boolean;
};

export function calculateProfileCompletion(member: Member): MemberProfileCompletionResult {
  const totalWeight = MEMBER_COMPLETION_RULES.reduce((sum, rule) => sum + rule.weight, 0);

  const completedWeight = MEMBER_COMPLETION_RULES.reduce((sum, rule) => {
    return sum + (rule.isComplete(member) ? rule.weight : 0);
  }, 0);

  const percent = Math.round((completedWeight / totalWeight) * 100);

  const missingFields = MEMBER_COMPLETION_RULES.filter((rule) => !rule.isComplete(member)).map(
    (rule) => rule.key
  );

  return {
    percent,
    completedWeight,
    totalWeight,
    missingFields,
    isComplete: percent >= 100,
  };
}

const LANGUAGE_CODE_SET = new Set<LanguageCode>(['fr', 'es', 'en', 'pt', 'de', 'it', 'zh']);

function coerceWorkLanguages(raw?: string[]): LanguageCode[] {
  if (!raw?.length) return [];
  const out: LanguageCode[] = [];
  const seen = new Set<string>();
  for (const x of raw) {
    const c = String(x).trim() as LanguageCode;
    if (!LANGUAGE_CODE_SET.has(c) || seen.has(c)) continue;
    seen.add(c);
    out.push(c);
  }
  return out;
}

function nonEmpty(s?: string): string | undefined {
  const t = s?.trim();
  return t ? t : undefined;
}

export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export type LegacyProfileInput = {
  id?: string;
  slug?: string;
  fullName?: string;
  email?: string;
  linkedinUrl?: string;
  phoneWhatsapp?: string;
  countryDialCode?: string;
  workLanguages?: string[];
  arrivalYearInMexico?: number;
  nationality?: string;
  gender?: string;
  bio?: string;
  photoUrl?: string;
  emailPublic?: boolean;
  phonePublic?: boolean;
  companyName?: string;
  website?: string;
  sector?: SectorKey;
  city?: CityKey;
  district?: string;
  state?: string;
  country?: string;
  roleInCompany?: ProfileRoleKey;
  foundedYear?: number;
  employeeRange?: CompanySizeRangeKey;
  companyType?: CompanyTypeKey;
  professionalStatus?: ProfessionalStatusKey;
  typicalClientSizes?: ClientSizeKey[];
  activityDescription?: string;
  lookingForText?: string;
  helpOfferText?: string;
  contactPreferenceText?: string;
  keywords?: string[];
  hobbies?: HobbyKey[];
  openness?: CommunityOpennessKey[];
  needs?: Array<{ id?: string; text?: string; categories?: string[] }>;
};

/**
 * Maps a flat “draft API” payload into a canonical {@link Member}.
 * For Firestore {@link UserProfile}, use {@link mapUserProfileToMember} in `member.mappers.ts`.
 */
export function mapLegacyProfileToMember(input: LegacyProfileInput): Member {
  const memberId = input.id ?? crypto.randomUUID();
  const slug = input.slug?.trim() || slugify(input.fullName?.trim() || 'profil');

  const company: Company = {
    id: `company_${memberId}`,
    name: (input.companyName ?? '').trim(),
    website: nonEmpty(input.website),
    sector: input.sector ?? 'other',
    location: {
      city: input.city ?? 'other',
      district: nonEmpty(input.district),
      state: nonEmpty(input.state) ?? 'Jalisco',
      country: nonEmpty(input.country) ?? 'Mexico',
    },
    roleInCompany: input.roleInCompany,
    foundedYear: input.foundedYear,
    employeeRange: input.employeeRange,
    companyType: input.companyType,
    professionalStatus: input.professionalStatus,
    typicalClientSizes:
      input.typicalClientSizes && input.typicalClientSizes.length > 0 ? input.typicalClientSizes : undefined,
    activityDescription: nonEmpty(input.activityDescription),
  };

  const currentNeeds: Need[] = (input.needs ?? []).map((need) =>
    mapLegacyNeedToCanonical({
      id: need.id,
      memberId,
      text: need.text,
      categories: need.categories,
    })
  );

  const gender = nonEmpty(input.gender);

  const member: Member = {
    id: memberId,
    slug,
    identity: {
      id: memberId,
      slug,
      fullName: (input.fullName ?? '').trim(),
      photoUrl: nonEmpty(input.photoUrl),
      bio: nonEmpty(input.bio),
      nationality: nonEmpty(input.nationality),
      gender,
      locale: 'fr' satisfies LocaleCode,
      workLanguages: coerceWorkLanguages(input.workLanguages),
      arrivalYearInMexico: input.arrivalYearInMexico,
    },
    contact: {
      email: nonEmpty(input.email),
      linkedinUrl: nonEmpty(input.linkedinUrl),
      countryDialCode: nonEmpty(input.countryDialCode) ?? '+52',
      phoneWhatsapp: nonEmpty(input.phoneWhatsapp),
      preferredContactChannels: [],
      preferredContactText: nonEmpty(input.contactPreferenceText),
    },
    company,
    networkProfile: {
      tagline: undefined,
      lookingForText: nonEmpty(input.lookingForText),
      helpOfferText: nonEmpty(input.helpOfferText),
      currentNeeds,
      keywords: input.keywords?.length ? [...input.keywords] : [],
      hobbies: input.hobbies?.length ? [...input.hobbies] : [],
      openness: input.openness?.length ? [...input.openness] : [],
      searchableSectors: [company.sector],
    },
    visibility: {
      contact: {
        emailPublic: Boolean(input.emailPublic),
        phonePublic: Boolean(input.phonePublic),
      },
      internalOnly: gender ? { gender } : {},
    },
    publicProfileCompleted: false,
    profileCompletionPercent: 0,
  };

  const completion = calculateProfileCompletion(member);

  return {
    ...member,
    publicProfileCompleted: completion.percent >= 80,
    profileCompletionPercent: completion.percent,
  };
}
