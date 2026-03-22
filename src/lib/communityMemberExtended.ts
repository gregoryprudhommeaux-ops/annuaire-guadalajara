/**
 * Modèle étendu « profil communauté » et besoins structurés (analytics / futurs écrans).
 * Distinct de `ExplorerMember` / `UserProfile` — à mapper depuis Firestore quand les champs existeront.
 */

export type MemberStatus = 'freelance' | 'employee' | 'owner';

export type CompanyKind = 'startup' | 'pme' | 'corporate' | 'independent';

export type MemberExtended = {
  id: string;
  sector: string;
  companySize: CompanyKind;
  /** Ancienneté affichée (dérivée de l’année d’arrivée au Mexique côté profil, ou valeur de secours). */
  yearsInGDL: number;
  status: MemberStatus;
  city: string;
  country: string;
};

export type NeedCategory =
  | 'sourcing'
  | 'partners'
  | 'recruitment'
  | 'visibility'
  | 'softlanding'
  | 'legal';

/** Valeurs autorisées en base (`member_needs.need`). */
export const NEED_CATEGORY_VALUES: readonly NeedCategory[] = [
  'sourcing',
  'partners',
  'recruitment',
  'visibility',
  'softlanding',
  'legal',
] as const;

export function isNeedCategory(value: string): value is NeedCategory {
  return (NEED_CATEGORY_VALUES as readonly string[]).includes(value);
}

export type MemberNeed = {
  memberId: string;
  sector: string;
  need: NeedCategory;
  /** Date ISO, ex. "2025-10-01" */
  createdAt: string;
};

/** Mock — remplacer par les données backend / agrégations Firestore. */
export const mockMembersExtended: MemberExtended[] = [
  {
    id: '1',
    sector: 'F&B',
    companySize: 'pme',
    yearsInGDL: 3,
    status: 'owner',
    city: 'Guadalajara',
    country: 'Mexique',
  },
  {
    id: '2',
    sector: 'Services B2B',
    companySize: 'startup',
    yearsInGDL: 1,
    status: 'freelance',
    city: 'Zapopan',
    country: 'Mexique',
  },
  {
    id: '3',
    sector: 'Tech',
    companySize: 'corporate',
    yearsInGDL: 5,
    status: 'employee',
    city: 'Guadalajara',
    country: 'Mexique',
  },
];

export const mockNeeds: MemberNeed[] = [
  {
    memberId: '1',
    sector: 'F&B',
    need: 'sourcing',
    createdAt: '2025-01-15',
  },
  {
    memberId: '1',
    sector: 'F&B',
    need: 'visibility',
    createdAt: '2025-02-10',
  },
  {
    memberId: '2',
    sector: 'Services B2B',
    need: 'partners',
    createdAt: '2025-02-20',
  },
  {
    memberId: '3',
    sector: 'Tech',
    need: 'recruitment',
    createdAt: '2025-03-05',
  },
];
