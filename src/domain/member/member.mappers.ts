import type { UserProfile, Language, CompanyActivitySlot, EmployeeCountRange } from '../../types';
import { normalizedTargetKeywords } from '../../types';
import type { Company, Location } from '../company/company.types';
import type {
  ClientSizeKey,
  CompanySizeRangeKey,
  CompanyTypeKey,
  ProfileRoleKey,
  SectorKey,
} from '../taxonomy/taxonomy.types';
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

  // Heuristic mapping from legacy free-text sector labels (FR-heavy) → canonical SectorKey.
  // Unknown values safely fall back to `other` (non-destructive for legacy data).
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

  // Legacy numeric-ish values: best-effort bucket
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

export function mapLegacyProfileToMember(p: UserProfile): Member {
  const slots = Array.isArray(p.companyActivities) ? p.companyActivities : [];
  const companies = slots.map((s) => mapCompanyFromSlot(s, p)).filter((c): c is Company => Boolean(c));
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
