import type { UserProfile, CompanyActivitySlot, EmployeeCountRange } from '../../types';
import { normalizedTargetKeywords } from '../../types';
import type { Company } from '../company/company.types';
import { mapLegacyHighlightedNeedIdToNeed } from '../need/need.mappers';
import type {
  CityKey,
  ClientSizeKey,
  CommunityOpennessKey,
  CompanySizeRangeKey,
  CompanyTypeKey,
  HobbyKey,
  LanguageCode,
  ProfessionalStatusKey,
  ProfileRoleKey,
  SectorKey,
} from '../taxonomy/taxonomy.types';
import type { ContactPreference, Member, MemberContact, MemberIdentity } from './member.types';
import { sanitizeHighlightedNeeds } from '../../needOptions';
import { sanitizePassionIds } from '../../lib/passionConfig';
import { calculateProfileCompletion } from './member.completion';

const LANGUAGE_CODE_SET = new Set<LanguageCode>(['fr', 'es', 'en', 'pt', 'de', 'it', 'zh']);

const LEGACY_PASSION_ID_TO_HOBBY: Record<string, HobbyKey> = {
  golf: 'golf',
  peche: 'fishing',
  padel: 'padel',
  petanque: 'petanque',
  randonnee: 'hiking',
  surf: 'surf',
  tennis: 'tennis',
  cyclisme: 'cycling',
  yoga: 'yoga',
  natation: 'swimming',
  plongee: 'diving',
  escalade: 'climbing',
  camping: 'camping',
  voyage: 'travel',
  moto: 'motorcycle',
  cuisine: 'cooking',
  vins: 'wine',
  gastronomie: 'gastronomy',
  mixologie: 'mixology',
  patisserie: 'pastry',
  musique: 'music',
  cinema: 'cinema',
  litterature: 'literature',
  art: 'art',
  photographie: 'photography',
  theatre: 'theater',
  startups: 'startups',
  ia: 'artificial_intelligence',
  investissement: 'investment',
  crypto: 'crypto_web3',
  ecommerce: 'ecommerce',
};

function slugFromProfile(p: UserProfile): string {
  const raw = p.fullName?.trim().toLowerCase() || '';
  const slug = raw
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 96);
  return slug || p.uid;
}

function millisToIso(ms: number | undefined): string | undefined {
  if (ms == null || !Number.isFinite(ms)) return undefined;
  return new Date(ms).toISOString();
}

function memberBioText(p: UserProfile): string | undefined {
  const mb = p.memberBio?.trim();
  if (mb) return mb;
  const slots = Array.isArray(p.companyActivities) ? p.companyActivities : [];
  const first = slots[0]?.activityDescription?.trim();
  return first || p.bio?.trim() || undefined;
}

function mapWorkLanguages(p: UserProfile): LanguageCode[] {
  const raw = Array.isArray(p.workingLanguageCodes) ? p.workingLanguageCodes : [];
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

function mapPassionIdsToHobbies(p: UserProfile): HobbyKey[] {
  const ids = sanitizePassionIds(p.passionIds);
  const out: HobbyKey[] = [];
  const seen = new Set<string>();
  for (const id of ids) {
    const key = LEGACY_PASSION_ID_TO_HOBBY[id];
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(key);
  }
  return out;
}

function mapOpennessKeys(p: UserProfile): CommunityOpennessKey[] {
  const o: CommunityOpennessKey[] = [];
  if (p.openToMentoring) o.push('mentorship');
  if (p.openToTalks) o.push('speaking');
  if (p.openToEvents) o.push('event_cocreation');
  return o;
}

function inferPreferredContactChannels(text?: string): ContactPreference[] | undefined {
  const t = text?.trim().toLowerCase();
  if (!t) return undefined;
  const out: ContactPreference[] = [];
  if (t.includes('whatsapp') || t.includes('whats')) out.push('whatsapp');
  if (t.includes('linkedin')) out.push('linkedin');
  if (t.includes('mail') || t.includes('email') || t.includes('courriel')) out.push('email');
  if (t.includes('tél') || t.includes('tel') || t.includes('phone')) out.push('phone');
  return out.length ? out : ['other'];
}

function memberContactFromProfile(p: UserProfile): MemberContact {
  const cta = p.contactPreferenceCta?.trim();
  return {
    email: p.email?.trim() || undefined,
    linkedinUrl: p.linkedin?.trim() || undefined,
    phoneWhatsapp: p.whatsapp?.trim() || undefined,
    preferredContactText: cta || undefined,
    preferredContactChannels: inferPreferredContactChannels(cta),
  };
}

function normalizeCityToken(raw: string): string {
  return raw
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}

function mapCityKey(city?: string): CityKey {
  const t = normalizeCityToken(String(city ?? ''));
  if (!t) return 'other';
  if (t.includes('guadalajara')) return 'guadalajara';
  if (t.includes('zapopan')) return 'zapopan';
  if (t.includes('tlaquepaque')) return 'tlaquepaque';
  if (t.includes('tonala') || t.includes('tonalá')) return 'tonala';
  if (t.includes('tlajomulco')) return 'tlajomulco';
  if (t.includes('el salto')) return 'el_salto';
  return 'other';
}

function mapSectorKeyFromActivityCategory(raw?: string): SectorKey {
  const t = normalizeCityToken(String(raw ?? ''));
  if (!t) return 'other';

  const rules: Array<{ test: RegExp; key: SectorKey }> = [
    { test: /(conseil|consult)/, key: 'consulting_services' },
    { test: /(tech|informat|logiciel|saas|digital|cyber)/, key: 'technology_it' },
    { test: /(sant[eé]|medical|clinic|pharma)/, key: 'health_wellbeing' },
    { test: /(finance|banque|assurance|fintech)/, key: 'banking_finance' },
    { test: /(immo|immobilier|promoteur|construction|batiment|bâtiment)/, key: 'construction_real_estate' },
    { test: /(industr|manufactur|usine|production)/, key: 'industry_manufacturing' },
    { test: /(logist|transport|supply|entrepot|entrepôt)/, key: 'automotive_transport' },
    { test: /(commerce|distribution|retail|vente)/, key: 'commerce_distribution' },
    { test: /(hotel|restaur|gastro|horeca)/, key: 'hospitality_restaurant' },
    { test: /(touris)/, key: 'tourism' },
    { test: /(culture|loisir|media|art)/, key: 'culture_leisure' },
    { test: /(education|formation|ecole|école|univers)/, key: 'education_training' },
    { test: /(energie|énergie|environnement|cleantech)/, key: 'energy_environment' },
    { test: /(agro|agric)/, key: 'agriculture_agro' },
    { test: /(design|artisan)/, key: 'craft_design' },
  ];

  for (const r of rules) {
    if (r.test.test(t)) return r.key;
  }
  return 'other';
}

function mapProfileRoleKeyFromPositionCategory(raw?: string): ProfileRoleKey | undefined {
  const t = normalizeCityToken(String(raw ?? ''));
  if (!t) return undefined;

  const rules: Array<{ test: RegExp; key: ProfileRoleKey }> = [
    { test: /(dg|directeur general|directeur général|ceo|president|président)/, key: 'general_management' },
    { test: /(strateg|corporate|m&a)/, key: 'strategy_corporate' },
    { test: /(vente|commercial|business dev|sales)/, key: 'sales_business_dev' },
    { test: /(market|communication|brand)/, key: 'marketing_communication' },
    { test: /(customer success|relation client|service client)/, key: 'customer_success' },
    { test: /(produit|product|r&d|rd\b|recherche)/, key: 'product_rd' },
    { test: /(operation|production|usine)/, key: 'production_operations' },
    { test: /(qualit|hse|securit|sécurit)/, key: 'quality_hse' },
    { test: /(ingenieur|ingénieur|maintenance|technique)/, key: 'engineering_maintenance' },
    { test: /(logist|supply|achat|approvisionnement|procurement)/, key: 'logistics_supply_chain' },
    { test: /(achat|sourcing)/, key: 'procurement_sourcing' },
    { test: /(finance|compta|controle|contrôle)/, key: 'finance_accounting_control' },
    { test: /(rh\b|ressource humaine|talent|recrut)/, key: 'human_resources' },
    { test: /(it\b|digital|si\b|cyber|data)/, key: 'it_digital_si' },
    { test: /(jurid|legal|compliance|risque)/, key: 'legal_compliance_risk' },
  ];

  for (const r of rules) {
    if (r.test.test(t)) return r.key;
  }
  return undefined;
}

function mapCompanyTypeKey(raw?: string): CompanyTypeKey | undefined {
  const t = normalizeCityToken(String(raw ?? ''));
  if (!t) return undefined;
  if (/(startup|scale)/.test(t)) return 'startup';
  if (/(pme|sme|pequena|pequeña)/.test(t)) return 'sme';
  if (/(corporate|grande|enterprise|cotation)/.test(t)) return 'corporate';
  if (/(independ|freelance|consultant)/.test(t)) return 'independent';
  if (/(association)/.test(t)) return 'association';
  if (/(non profit|nonprofit|ong|osf)/.test(t)) return 'non_profit';
  if (/(club)/.test(t)) return 'club';
  return undefined;
}

function mapProfessionalStatusKey(raw?: string): ProfessionalStatusKey | undefined {
  const t = normalizeCityToken(String(raw ?? ''));
  if (!t) return undefined;
  if (/(freelance|independ)/.test(t)) return 'freelance';
  if (/(salari|employ)/.test(t)) return 'employee';
  if (/(founder|fondateur|dirigeant|ceo|president|président|executive)/.test(t)) return 'founder_executive';
  if (/(benevol|bénévol|volunteer)/.test(t)) return 'volunteer';
  return undefined;
}

function mapEmployeeRangeKey(raw?: EmployeeCountRange | number | ''): CompanySizeRangeKey | undefined {
  if (raw === '' || raw === undefined || raw === null) return undefined;
  const s = String(raw).trim();
  if (!s) return undefined;

  const map: Record<string, CompanySizeRangeKey> = {
    '1-5': '1_5',
    '5-15': '5_15',
    '15-30': '15_30',
    '30-50': '30_50',
    '50-100': '50_100',
    '100-300': '100_300',
    '300+': '300_plus',
    '1000+': '1000_plus',
  };
  if (map[s]) return map[s];

  const n = Number(s);
  if (!Number.isFinite(n)) return undefined;
  if (n <= 5) return '1_5';
  if (n <= 15) return '5_15';
  if (n <= 30) return '15_30';
  if (n <= 50) return '30_50';
  if (n <= 100) return '50_100';
  if (n <= 300) return '100_300';
  if (n <= 1000) return '300_plus';
  return '1000_plus';
}

function mapClientSizeKeys(raw?: ('independant' | 'pme' | 'corporate' | 'mixte')[]): ClientSizeKey[] | undefined {
  if (!raw || raw.length === 0) return undefined;
  const out: ClientSizeKey[] = [];
  const seen = new Set<string>();
  for (const x of raw) {
    const key =
      x === 'independant'
        ? 'independent_micro'
        : x === 'pme'
          ? 'sme'
          : x === 'corporate'
            ? 'corporate_enterprise'
            : x === 'mixte'
              ? 'sme'
              : undefined;
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(key);
  }
  return out.length ? out : undefined;
}

function mapCompanyFromSlot(slot: CompanyActivitySlot, p: UserProfile): Company | undefined {
  const name = slot.companyName?.trim() || p.companyName?.trim();
  if (!name) return undefined;

  const city = mapCityKey(slot.city ?? p.city);
  const country = String(slot.country ?? p.country ?? 'Mexico').trim() || 'Mexico';

  const sector = mapSectorKeyFromActivityCategory(slot.activityCategory ?? p.activityCategory);
  const roleInCompany = mapProfileRoleKeyFromPositionCategory(slot.positionCategory ?? p.positionCategory);
  const companyType = mapCompanyTypeKey(slot.communityCompanyKind ?? p.communityCompanyKind);
  const professionalStatus = mapProfessionalStatusKey(slot.communityMemberStatus ?? p.communityMemberStatus);

  return {
    id: slot.id,
    name,
    website: slot.website?.trim() || p.website?.trim() || undefined,
    sector,
    location: {
      city,
      district: slot.neighborhood?.trim() || undefined,
      state: (slot.state ?? p.state)?.trim() || undefined,
      country,
    },
    roleInCompany,
    foundedYear: typeof slot.creationYear === 'number' ? slot.creationYear : undefined,
    employeeRange: mapEmployeeRangeKey(slot.employeeCount ?? p.employeeCount),
    companyType,
    professionalStatus,
    typicalClientSizes: mapClientSizeKeys(slot.typicalClientSizes ?? p.typicalClientSizes),
    activityDescription: slot.activityDescription?.trim() || undefined,
  };
}

function fallbackCompanyFromProfile(p: UserProfile): Company {
  const slots = Array.isArray(p.companyActivities) ? p.companyActivities : [];
  const slot0 = slots[0];
  const name = p.companyName?.trim() || '—';
  const city = mapCityKey(slot0?.city ?? p.city);
  const country = String(slot0?.country ?? p.country ?? 'Mexico').trim() || 'Mexico';

  return {
    id: slot0?.id ?? `fallback-${p.uid}`,
    name,
    website: p.website?.trim() || undefined,
    sector: mapSectorKeyFromActivityCategory(slot0?.activityCategory ?? p.activityCategory),
    location: {
      city,
      district: slot0?.neighborhood?.trim() || p.neighborhood?.trim() || undefined,
      state: (slot0?.state ?? p.state)?.trim() || undefined,
      country,
    },
    roleInCompany: mapProfileRoleKeyFromPositionCategory(slot0?.positionCategory ?? p.positionCategory),
    foundedYear: typeof p.creationYear === 'number' ? p.creationYear : undefined,
    employeeRange: mapEmployeeRangeKey(slot0?.employeeCount ?? p.employeeCount),
    companyType: mapCompanyTypeKey(slot0?.communityCompanyKind ?? p.communityCompanyKind),
    professionalStatus: mapProfessionalStatusKey(slot0?.communityMemberStatus ?? p.communityMemberStatus),
    typicalClientSizes: mapClientSizeKeys(slot0?.typicalClientSizes ?? p.typicalClientSizes),
    activityDescription: slot0?.activityDescription?.trim() || undefined,
  };
}

function searchableSectorsFromCompanies(companies: Company[], fallback: SectorKey): SectorKey[] {
  const keys = companies.map((c) => c.sector).filter(Boolean);
  const uniq = Array.from(new Set(keys));
  return uniq.length ? uniq : [fallback];
}

function identityFromProfile(p: UserProfile): MemberIdentity {
  return {
    id: p.uid,
    slug: slugFromProfile(p),
    fullName: p.fullName?.trim() || '—',
    photoUrl: p.photoURL?.trim() || undefined,
    bio: memberBioText(p),
    workLanguages: mapWorkLanguages(p),
    arrivalYearInMexico: typeof p.arrivalYear === 'number' ? p.arrivalYear : undefined,
  };
}

export function mapLegacyProfileToMember(p: UserProfile): Member {
  const slots = Array.isArray(p.companyActivities) ? p.companyActivities : [];
  const companies = slots.map((s) => mapCompanyFromSlot(s, p)).filter((c): c is Company => Boolean(c));
  const company = companies[0] ?? fallbackCompanyFromProfile(p);
  const searchableSectors = searchableSectorsFromCompanies(companies, company.sector);

  const createdAtMs =
    typeof (p as { createdAt?: { toMillis?: () => number } }).createdAt?.toMillis === 'function'
      ? (p as { createdAt: { toMillis: () => number } }).createdAt.toMillis()
      : undefined;

  const identity = identityFromProfile(p);
  const needIds = sanitizeHighlightedNeeds(p.highlightedNeeds);
  const currentNeeds = needIds.map((id) => mapLegacyHighlightedNeedIdToNeed(p.uid, id));

  const member: Member = {
    id: p.uid,
    slug: identity.slug,
    identity,
    contact: memberContactFromProfile(p),
    company,
    networkProfile: {
      lookingForText: p.networkGoal?.trim() || undefined,
      helpOfferText: p.helpNewcomers?.trim() || undefined,
      currentNeeds,
      keywords: normalizedTargetKeywords(p),
      hobbies: mapPassionIdsToHobbies(p),
      openness: mapOpennessKeys(p),
      searchableSectors,
    },
    visibility: {
      contact: {
        emailPublic: Boolean(p.isEmailPublic),
        phonePublic: Boolean(p.isWhatsappPublic),
      },
      internalOnly: {},
    },
    publicProfileCompleted: false,
    profileCompletionPercent: 0,
    createdAt: millisToIso(createdAtMs),
    updatedAt: millisToIso(typeof p.lastSeen === 'number' ? p.lastSeen : undefined),
  };

  const completion = calculateProfileCompletion(member);
  return {
    ...member,
    publicProfileCompleted: completion.isComplete,
    profileCompletionPercent: completion.percent,
  };
}
