import { employeeCountToSelectDefault, isEmployeeCountRange } from '../constants';
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
    typicalClientSize: (o.typicalClientSize as CompanyActivitySlot['typicalClientSize']) || undefined,
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
    typicalClientSize: p.typicalClientSize,
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
    return raw.map((entry, i) => slotFromFirestoreEntry(entry, `${LEGACY_PRIMARY_ID}-${i}`));
  }
  return [legacyProfileToCompanySlot(p)];
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
    return {
      id: s.id,
      companyName: s.companyName.trim(),
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
      typicalClientSize: s.typicalClientSize,
    };
  });
}
