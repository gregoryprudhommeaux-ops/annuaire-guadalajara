import { Timestamp } from 'firebase/firestore';
import { sanitizePassionIds } from './lib/passionConfig';

export type Role = 'user' | 'admin';

/** Fourchettes pour le champ « Nombre d'employés » (liste déroulante) */
export const EMPLOYEE_COUNT_RANGES = [
  '1-5',
  '5-15',
  '15-30',
  '30-50',
  '50-100',
  '100-300',
  '300+',
  '1000+',
] as const;

export type EmployeeCountRange = (typeof EMPLOYEE_COUNT_RANGES)[number];

export interface OptimizationSuggestion {
  bioSuggested: string;
  /** Anciennes fiches uniquement (plus généré après suppression du champ libre « ce que je cherche »). */
  lookingForSuggested?: string;
  summary: string[];
  generatedAt: number;
  generatedBy: string;
}

/** Liste de mots-clés / secteurs cibles (tolère d’anciennes valeurs string côté Firestore). */
export function normalizedTargetKeywords(p: UserProfile): string[] {
  const raw = p.targetSectors as unknown;
  if (Array.isArray(raw)) {
    return raw.map((s) => String(s).trim()).filter(Boolean);
  }
  if (typeof raw === 'string' && raw.trim()) {
    return raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

/**
 * Score 0–1 pour activer les recommandations IA (seuil applicatif : >= 0.8).
 * Aligné sur les champs réellement envoyés au prompt de matching.
 */
export function getProfileAiRecommendationReadiness(p: UserProfile): number {
  const keywords =
    normalizedTargetKeywords(p).length > 0 || sanitizePassionIds(p.passionIds).length > 0;
  const typedNeeds = (p.highlightedNeeds?.filter(Boolean).length ?? 0) >= 1;
  const checks = [
    !!(p.fullName?.trim()),
    !!(p.companyName?.trim()),
    !!(p.email?.trim()),
    !!(p.activityCategory?.trim()),
    !!(p.bio?.trim() && p.bio.trim().length >= 15),
    typedNeeds,
    keywords,
    !!(p.positionCategory?.trim()),
    !!p.companySize,
  ];
  const ok = checks.filter(Boolean).length;
  return ok / checks.length;
}

export interface UserProfile {
  uid: string;
  fullName: string;
  companyName: string;
  creationYear?: number;
  city?: string;
  state?: string;
  neighborhood?: string;
  activityCategory?: string;
  /** Fonction dans l'entreprise (liste déroulante), pas le titre de poste */
  positionCategory?: string;
  email: string;
  website?: string;
  whatsapp?: string;
  /** Jusqu’à 3 passions « hors business » (ids stables, voir `passionConfig.ts`) */
  passionIds?: string[];
  arrivalYear?: number;
  /** Fourchette (string) ou ancien nombre saisi à la main */
  employeeCount?: EmployeeCountRange | number;
  isEmailPublic?: boolean;
  isWhatsappPublic?: boolean;
  linkedin?: string;
  photoURL?: string;
  role: Role;
  createdAt: Timestamp;
  isValidated?: boolean;
  bio?: string;
  /** Jusqu’à 3 codes NEED_* (voir `NEED_OPTIONS`) mis en avant sur le profil */
  highlightedNeeds?: string[];
  lookingFor?: string;
  /** Mots-clés libres (industrie, zone, domaine…), saisis séparés par virgules côté UI */
  targetSectors?: string[];
  companySize?: 'solo' | '2-10' | '11-50' | '50+';
  lastSeen?: number;
  pitchVideoUrl?: string;
  accountType?: 'local' | 'foreign';
  country?: string;
  optimizationSuggestion?: OptimizationSuggestion;
}

export interface MatchSuggestion {
  profileId: string;
  type: string;
  score: number;
  reason: string;
  hook: string;
}

export interface Recommendation {
  id: string;
  profileId: string;
  authorId: string;
  authorName: string;
  authorPhoto: string;
  text: string;
  createdAt: number;
}

export interface NeedComment {
  id: string;
  needId: string;
  authorId: string;
  authorName: string;
  authorPhoto: string;
  text: string;
  createdAt: number;
}

export interface UrgentPost {
  id: string;
  authorId: string;
  authorName: string;
  authorCompany: string;
  authorPhoto: string;
  text: string;
  sector: string;
  createdAt: number;
  expiresAt: number;
}

export type Language = 'fr' | 'es';

export interface Translations {
  [key: string]: {
    fr: string;
    es: string;
  };
}
