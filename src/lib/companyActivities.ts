import { employeeCountToSelectDefault, isEmployeeCountRange } from '../constants';
import {
  sanitizeTypicalClientSizes,
  typicalClientSizesFromProfile,
  TYPICAL_CLIENT_SIZE_VALUES,
  type TypicalClientSize,
} from './contactPreferences';
import type {
  CommunityCompanyKind,
  CommunityMemberStatus,
  CompanyActivitySlot,
  EmployeeCountRange,
  UserProfile,
} from '../types';

const LEGACY_PRIMARY_ID = 'legacy-primary';

function randomSlotId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `ca-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function newCompanyActivitySlotId(): string {
  return randomSlotId();
}

export function emptyCompanyActivitySlot(): CompanyActivitySlot {
  return {
    id: newCompanyActivitySlotId(),
    companyName: '',
    website: '',
    city: '',
    state: 'Jalisco',
    neighborhood: '',
    country: '',
    positionCategory: '',
    employeeCount: '',
  };
}

function asNumber(v: unknown): number | undefined {
  if (v === null || v === undefined || v === '') return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function slotFromFirestoreEntry(raw: unknown, fallbackId: string): CompanyActivitySlot {
  const o = raw as Record<string, unknown>;
  const id = typeof o.id === 'string' && o.id.trim() ? o.id.trim() : fallbackId;
  const ec = o.employeeCount;
  let employeeCount: EmployeeCountRange | number | '' | undefined;
  if (ec === null || ec === undefined || ec === '') employeeCount = '';
  else if (typeof ec === 'string' && isEmployeeCountRange(ec)) employeeCount = ec;
  else if (typeof ec === 'number' && Number.isFinite(ec)) employeeCount = ec;
  else if (typeof ec === 'string') employeeCount = '';
  else employeeCount = '';

  return {
    id,
    companyName: String(o.companyName ?? ''),
    activityCategory: String(o.activityCategory ?? '').trim() || undefined,
    website: String(o.website ?? ''),
    city: String(o.city ?? ''),
    state: String(o.state ?? 'Jalisco'),
    neighborhood: String(o.neighborhood ?? ''),
    country: String(o.country ?? ''),
    positionCategory: String(o.positionCategory ?? ''),
    creationYear: asNumber(o.creationYear),
    employeeCount,
    arrivalYear: asNumber(o.arrivalYear),
    communityCompanyKind: (o.communityCompanyKind as CommunityCompanyKind) || undefined,
    communityMemberStatus: (o.communityMemberStatus as CommunityMemberStatus) || undefined,
    typicalClientSizes: (() => {
      const fromArr = sanitizeTypicalClientSizes(o.typicalClientSizes);
      if (fromArr.length) return fromArr;
      const leg = o.typicalClientSize;
      if (typeof leg === 'string' && (TYPICAL_CLIENT_SIZE_VALUES as readonly string[]).includes(leg)) {
        return [leg as TypicalClientSize];
      }
      return [];
    })(),
    activityDescription: String(o.activityDescription ?? '').trim() || undefined,
  };
}

/** Une entrée « société / activité » dérivée des champs plats historiques (une seule fiche). */
export function legacyProfileToCompanySlot(p: UserProfile): CompanyActivitySlot {
  const ec = p.employeeCount;
  let employeeCount: EmployeeCountRange | number | '' | undefined = '';
  if (ec === null || ec === undefined) employeeCount = '';
  else if (typeof ec === 'string' && isEmployeeCountRange(ec)) employeeCount = ec;
  else if (typeof ec === 'number' && Number.isFinite(ec)) employeeCount = ec;
  else employeeCount = '';

  return {
    id: LEGACY_PRIMARY_ID,
    companyName: p.companyName ?? '',
    activityCategory: p.activityCategory?.trim() || undefined,
    website: p.website ?? '',
    city: p.city ?? '',
    state: p.state ?? 'Jalisco',
    neighborhood: p.neighborhood ?? '',
    country: p.country ?? '',
    positionCategory: p.positionCategory ?? '',
    creationYear: p.creationYear,
    employeeCount,
    arrivalYear: p.arrivalYear,
    communityCompanyKind: p.communityCompanyKind,
    communityMemberStatus: p.communityMemberStatus,
    typicalClientSizes: typicalClientSizesFromProfile(p),
  };
}

/**
 * Liste des activités affichées / éditées : `companyActivities` si présent, sinon une ligne
 * reconstruite depuis les champs classiques du profil.
 */
export function normalizeProfileCompanyActivities(p: UserProfile | null | undefined): CompanyActivitySlot[] {
  if (!p) return [emptyCompanyActivitySlot()];
  const raw = p.companyActivities as unknown;
  if (Array.isArray(raw) && raw.length > 0) {
    const slots = raw.map((entry, i) => slotFromFirestoreEntry(entry, `${LEGACY_PRIMARY_ID}-${i}`));
    const fromRoot = typicalClientSizesFromProfile(p);
    if (
      fromRoot.length > 0 &&
      (!slots[0].typicalClientSizes || slots[0].typicalClientSizes.length === 0)
    ) {
      return [{ ...slots[0], typicalClientSizes: fromRoot }, ...slots.slice(1)];
    }
    return slots;
  }
  return [legacyProfileToCompanySlot(p)];
}

/**
 * Codes secteur distincts (toutes les entreprises du profil), ordre d’apparition.
 * Compat : si aucun slot n’a de secteur, retombe sur `UserProfile.activityCategory`.
 */
export function profileDistinctActivityCategories(p: UserProfile | null | undefined): string[] {
  if (!p) return [];
  const slots = normalizeProfileCompanyActivities(p);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of slots) {
    const c = (s.activityCategory || '').trim();
    if (!c || seen.has(c)) continue;
    seen.add(c);
    out.push(c);
  }
  if (out.length > 0) return out;
  const legacy = (p.activityCategory || '').trim();
  return legacy ? [legacy] : [];
}

/** Libellés « Société A | Société B » pour en-têtes et cartes. */
export function companyActivityNamesJoined(p: UserProfile | null | undefined, sep = ' | '): string {
  if (!p) return '';
  const slots = normalizeProfileCompanyActivities(p);
  const names = slots.map((s) => s.companyName.trim()).filter(Boolean);
  if (names.length > 0) return names.join(sep);
  return p.companyName?.trim() || '';
}

/** Premier bloc (champs plats attendus par l’annuaire / règles de publication). */
export function denormalizeFirstCompanySlot(slot: CompanyActivitySlot): Partial<UserProfile> {
  const ec = slot.employeeCount;
  let employeeCount: UserProfile['employeeCount'];
  if (ec === '' || ec === undefined || ec === null) employeeCount = undefined;
  else if (typeof ec === 'string' && isEmployeeCountRange(ec)) employeeCount = ec;
  else if (typeof ec === 'number' && Number.isFinite(ec)) employeeCount = ec;
  else employeeCount = undefined;

  return {
    companyName: slot.companyName.trim(),
    activityCategory: slot.activityCategory?.trim() || undefined,
    website: slot.website?.trim() || undefined,
    city: slot.city?.trim() || undefined,
    state: slot.state?.trim() || 'Jalisco',
    neighborhood: slot.neighborhood?.trim() || undefined,
    country: slot.country?.trim() || undefined,
    positionCategory: slot.positionCategory?.trim() || undefined,
    creationYear: slot.creationYear,
    employeeCount,
    arrivalYear: slot.arrivalYear,
  };
}

export function employeeCountFromSlotField(
  ec: CompanyActivitySlot['employeeCount']
): EmployeeCountRange | undefined {
  if (ec === '' || ec === undefined || ec === null) return undefined;
  if (typeof ec === 'string' && isEmployeeCountRange(ec)) return ec;
  if (typeof ec === 'number' && Number.isFinite(ec)) {
    const mapped = employeeCountToSelectDefault(ec);
    return mapped ? (mapped as EmployeeCountRange) : undefined;
  }
  return undefined;
}

export function slotsToFirestoreList(slots: CompanyActivitySlot[]): CompanyActivitySlot[] {
  return slots.map((s) => {
    const ec = employeeCountFromSlotField(s.employeeCount);
    const activityDescription = String(s.activityDescription ?? '').trim();
    const tcs = sanitizeTypicalClientSizes(s.typicalClientSizes);
    return {
      id: s.id,
      companyName: s.companyName.trim(),
      activityCategory: s.activityCategory?.trim() || '',
      website: s.website?.trim() || '',
      city: s.city?.trim() || '',
      state: s.state?.trim() || 'Jalisco',
      neighborhood: s.neighborhood?.trim() || '',
      country: s.country?.trim() || '',
      positionCategory: s.positionCategory?.trim() || '',
      creationYear: s.creationYear,
      employeeCount: ec,
      arrivalYear: s.arrivalYear,
      communityCompanyKind: s.communityCompanyKind,
      communityMemberStatus: s.communityMemberStatus,
      ...(tcs.length ? { typicalClientSizes: tcs } : {}),
      ...(activityDescription ? { activityDescription } : {}),
    };
  });
}

/** Bio affichée côté personne (recherche membres) — préfère `memberBio`, sinon ancien `bio`. */
export function effectiveMemberBio(p: Partial<UserProfile> | null | undefined): string {
  if (!p) return '';
  const m = String(p.memberBio ?? '').trim();
  if (m) return m;
  return String(p.bio ?? '').trim();
}

/** Description d’activité du premier bloc société (publication / aperçu carte société). */
export function firstSlotActivityDescription(p: Partial<UserProfile> | null | undefined): string {
  if (!p) return '';
  const slots = normalizeProfileCompanyActivities(p as UserProfile);
  const fromSlot = String(slots[0]?.activityDescription ?? '').trim();
  if (fromSlot) return fromSlot;
  if (!String(p.memberBio ?? '').trim()) return String(p.bio ?? '').trim();
  return '';
}

/** Toutes les descriptions d’activité (recherche plein texte « société »). */
export function allActivityDescriptionTexts(p: UserProfile | null | undefined): string[] {
  if (!p) return [];
  const slots = normalizeProfileCompanyActivities(p);
  const texts = slots.map((s) => String(s.activityDescription ?? '').trim()).filter(Boolean);
  if (texts.length > 0) return texts;
  if (!String(p.memberBio ?? '').trim()) {
    const leg = String(p.bio ?? '').trim();
    return leg ? [leg] : [];
  }
  return [];
}

/** Texte affiché pour une ligne société sur la fiche (pas de repli sur l’ancien `bio` : évite le doublon avec la bio membre). */
export function displayActivityDescriptionForSlot(slot: CompanyActivitySlot): string {
  return String(slot.activityDescription ?? '').trim();
}

/** Affichage public : champs racine du profil, sinon 1ʳᵉ ligne `companyActivities`. */
export function effectiveTypicalClientSizesForProfile(p: UserProfile): TypicalClientSize[] {
  const fromRoot = typicalClientSizesFromProfile(p);
  if (fromRoot.length > 0) return fromRoot;
  const slots = normalizeProfileCompanyActivities(p);
  return sanitizeTypicalClientSizes(slots[0]?.typicalClientSizes);
}
