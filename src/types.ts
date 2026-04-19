import { Timestamp } from 'firebase/firestore';
import { sanitizePassionIds } from './lib/passionConfig';

export type Role = 'user' | 'admin';

/**
 * Genre à fins statistiques uniquement (non affiché sur la fiche publique).
 * Formulation proche des enquêtes européennes (Eurostat / RGPD).
 */
export type GenderStat = 'male' | 'female' | 'other' | 'prefer_not_say';

export const GENDER_STAT_VALUES: readonly GenderStat[] = ['male', 'female', 'other', 'prefer_not_say'];

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

/** Taille d’entreprise pour analytics dashboard (optionnel sur `users`). */
export type CommunityCompanyKind =
  | 'startup'
  | 'pme'
  | 'corporate'
  | 'independent'
  | 'association'
  | 'nonprofit'
  | 'club';

/** Statut pro pour analytics dashboard (optionnel sur `users`). */
export type CommunityMemberStatus = 'freelance' | 'employee' | 'owner' | 'volunteer';

/**
 * Une ligne « entreprise ou activité » (implantation, site, fonction, stats).
 * Plusieurs entrées possibles ; les champs plats du profil restent synchronisés sur la première.
 */
export interface CompanyActivitySlot {
  id: string;
  companyName: string;
  /** Secteur d’activité propre à cette ligne (synchronisé sur `UserProfile.activityCategory` pour la 1ʳᵉ entrée). */
  activityCategory?: string;
  website?: string;
  city?: string;
  state?: string;
  neighborhood?: string;
  country?: string;
  positionCategory?: string;
  creationYear?: number;
  employeeCount?: EmployeeCountRange | number | '';
  arrivalYear?: number;
  communityCompanyKind?: CommunityCompanyKind;
  communityMemberStatus?: CommunityMemberStatus;
  /** Jusqu’à 3 tailles de clients habituels (distinct de `companySize` sur l’entreprise). */
  typicalClientSizes?: ('independant' | 'pme' | 'corporate' | 'mixte')[];
  /** Présentation de l’activité pour cette ligne (recherche par société / fiche). */
  activityDescription?: string;
}

export interface OptimizationSuggestion {
  bioSuggested: string;
  /** Anciennes fiches uniquement (plus généré après suppression du champ libre « ce que je cherche »). */
  lookingForSuggested?: string;
  summary: string[];
  generatedAt: number;
  generatedBy: string;
}

/** Nombre maximal de mots-clés (champ Firestore `targetSectors`, saisis séparés par des virgules). */
export const PROFILE_TARGET_KEYWORDS_MAX = 20;

function cappedTargetKeywordList(parts: string[]): string[] {
  return parts.map((s) => String(s).trim()).filter(Boolean).slice(0, PROFILE_TARGET_KEYWORDS_MAX);
}

/** Parse une valeur de formulaire « mots-clés » (chaîne séparée par des virgules). */
export function parseCommaSeparatedTargetKeywords(raw: string | null | undefined): string[] {
  return cappedTargetKeywordList(String(raw ?? '').split(','));
}

/** Liste de mots-clés / secteurs cibles (tolère d’anciennes valeurs string côté Firestore). */
export function normalizedTargetKeywords(p: UserProfile): string[] {
  const raw = p.targetSectors as unknown;
  if (Array.isArray(raw)) {
    return cappedTargetKeywordList(raw as string[]);
  }
  if (typeof raw === 'string' && raw.trim()) {
    return cappedTargetKeywordList(raw.split(','));
  }
  return [];
}

/**
 * Score 0–1 pour activer les recommandations IA (seuil applicatif : >= 0.8).
 * Aligné sur les champs réellement envoyés au prompt de matching.
 */
export function getProfileAiRecommendationReadiness(p: UserProfile): number {
  const memberPresentation = (p.memberBio ?? '').trim() || (p.bio ?? '').trim();
  const rawSlots = p.companyActivities as unknown;
  let firstActivityDesc = '';
  if (Array.isArray(rawSlots) && rawSlots.length > 0) {
    firstActivityDesc = String(
      (rawSlots[0] as { activityDescription?: string })?.activityDescription ?? ''
    ).trim();
  }
  if (!firstActivityDesc && !String(p.memberBio ?? '').trim()) {
    firstActivityDesc = String(p.bio ?? '').trim();
  }
  const passionsOk = sanitizePassionIds(p.passionIds).length >= 1;
  const checks = [
    !!(p.fullName?.trim()),
    !!(p.companyName?.trim()),
    !!(p.email?.trim()),
    !!(p.activityCategory?.trim()),
    !!(memberPresentation.length >= 15 && firstActivityDesc.length >= 15),
    passionsOk,
    !!(p.positionCategory?.trim()),
    !!(p.city?.trim()),
    !!(p.state?.trim()),
    !!(p.country?.trim()),
    !!p.communityCompanyKind,
    !!p.communityMemberStatus,
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
  /** Jusqu’à 10 passions « hors business » (ids stables, voir `passionConfig.ts`) */
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
  /** Revue admin en attente (accès membre déjà autorisé). */
  needsAdminReview?: boolean;
  /**
   * @deprecated Ancien texte unique. Les nouveaux profils utilisent `memberBio` et `activityDescription` par entreprise.
   */
  bio?: string;
  /** @deprecated Voir `memberBioTranslations`. */
  bioTranslations?: Partial<Record<Language, string>>;
  /** Présentation personnelle (mise en avant recherche membres). */
  memberBio?: string;
  /** Pré-traductions de la bio membre (clé = langue UI). */
  memberBioTranslations?: Partial<Record<Language, string>>;
  /** Jusqu’à 3 codes NEED_* (voir `NEED_OPTIONS`) mis en avant sur le profil */
  highlightedNeeds?: string[];
  lookingFor?: string;
  /** Mots-clés libres (industrie, zone, domaine…), saisis séparés par virgules côté UI */
  targetSectors?: string[];
  /** Aide concrète proposée aux nouveaux arrivants (texte libre). */
  helpNewcomers?: string;
  /** Objectif réseau en une phrase (ce que le membre cherche via la communauté). */
  networkGoal?: string;
  /** @deprecated Retiré du formulaire ; effacé au prochain enregistrement. Peut subsister sur d’anciens documents. */
  contactPreferenceCta?: string;
  contactPreferenceCtaTranslations?: Partial<Record<Language, string>>;
  /** Jusqu’à 3 codes langue (FR, ES, EN, …) — voir `WORKING_LANGUAGE_OPTIONS` */
  workingLanguageCodes?: string[];
  /** Jusqu’à 3 tailles de clients habituels (distinct de `companySize`). */
  typicalClientSizes?: ('independant' | 'pme' | 'corporate' | 'mixte')[];
  /** @deprecated Ancien champ unique ; migré vers `typicalClientSizes`. */
  typicalClientSize?: 'independant' | 'pme' | 'corporate' | 'mixte';
  openToMentoring?: boolean;
  openToTalks?: boolean;
  openToEvents?: boolean;
  companySize?: 'solo' | '2-10' | '11-50' | '50+';
  lastSeen?: number;
  pitchVideoUrl?: string;
  accountType?: 'local' | 'foreign';
  country?: string;
  optimizationSuggestion?: OptimizationSuggestion;
  /** @deprecated Plus saisi en UI ; retiré à l’enregistrement. L’ancienneté dashboard vient de `arrivalYear`. */
  communityYearsInGdl?: number;
  /** Remplace l’inférence depuis `companySize` pour les graphiques « taille ». */
  communityCompanyKind?: CommunityCompanyKind;
  /** Remplace l’inférence freelance / owner pour les graphiques « statut ». */
  communityMemberStatus?: CommunityMemberStatus;
  /** Plusieurs sociétés / activités ; la première est aussi recopiée dans les champs plats ci-dessus. */
  companyActivities?: CompanyActivitySlot[];
  /** Coordonnées (optionnel) pour affichage carte dashboard. */
  latitude?: number;
  longitude?: number;
  geocodedAt?: unknown;
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

/** Demande réseau publique (secteur, zone, etc.) — suppression par auteur ou admin uniquement. */
export interface MemberNetworkRequest {
  id: string;
  authorId: string;
  authorName: string;
  authorPhoto: string;
  /** Libellé société au moment de la publication */
  authorCompany?: string;
  text: string;
  /** Pré-traductions du texte (clé = langue UI) pour limiter les appels IA en lecture. */
  textTranslations?: Partial<Record<Language, string>>;
  sector?: string;
  zone?: string;
  productOrService?: string;
  createdAt: number;
  expiresAt: number;
}

export type Language = 'fr' | 'es' | 'en';

export interface Translations {
  [key: string]: {
    fr: string;
    es: string;
    /** Optionnel : sinon `EN_STRINGS` / repli FR côté `LanguageProvider`. */
    en?: string;
  };
}

export type EventParticipationStatus = 'invited' | 'present' | 'declined';
export type EventStatusSource = 'admin' | 'guest';

export interface AdminEvent {
  id: string;
  slug: string;
  title: string;
  introText?: string;
  address?: string;
  startsAt: Timestamp;
  capacity?: number;
  status?: 'draft' | 'published' | 'closed';
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdByUid?: string;
}

export type EventRespondentAttendance = 'yes' | 'no' | 'maybe';

/** Réponse au formulaire public /e/:slug (sans compte Firebase). */
export interface EventRespondent {
  id: string;
  eventId: string;
  firstName: string;
  lastName: string;
  email: string;
  whatsapp: string;
  jobTitle: string;
  companyName: string;
  comments: string;
  /** Présence prévue (pour prioriser l’orga). */
  attendance: EventRespondentAttendance;
  createdAt: Timestamp;
}

export interface AdminEventParticipation {
  id: string;
  eventId: string;
  /** UID du compte (si membre existant). */
  uid?: string;
  /** Email obligatoire (clé fonctionnelle anti-doublons). */
  email: string;
  fullName?: string;
  companyName?: string;
  status: EventParticipationStatus;
  statusSource: EventStatusSource;
  declineReason?: string;
  adminNote?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
