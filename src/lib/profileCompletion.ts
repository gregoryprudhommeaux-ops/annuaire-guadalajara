import type { Language, UserProfile } from '../types';
import { normalizedTargetKeywords } from '../types';
import { effectiveMemberBio, firstSlotActivityDescription } from './companyActivities';
import { sanitizePassionIds } from './passionConfig';
import { sanitizeHighlightedNeeds } from '../needOptions';
import { pickLang } from './uiLocale';
import { PUBLICATION_BIO_MIN_LEN } from './profilePublicationRules';

/** Profil (ou brouillon) passé aux helpers de complétude. */
export type ProfileCompletionInput = Partial<UserProfile> | null | undefined;

/** Champs pris en compte pour le score de complétude (checklist membre / fiche). */
export type ProfileCompletionKey =
  | 'fullName'
  | 'email'
  | 'workLanguages'
  | 'memberBio'
  | 'activityDescription'
  | 'companyName'
  | 'networkGoal'
  | 'helpNewcomers'
  | 'preferredContact'
  | 'linkedinUrl'
  | 'passions'
  | 'highlightedNeeds'
  | 'keywords';

export type CompletionItem = {
  key: ProfileCompletionKey;
  label: string;
  done: boolean;
  weight: number;
};

const hasText = (value?: string | null, min = 1) =>
  typeof value === 'string' && value.trim().length >= min;

const hasArray = (value?: string[] | null, min = 1) =>
  Array.isArray(value) && value.filter(Boolean).length >= min;

/** Libellés par défaut (FR / ES / EN) pour affichage checklist. */
export function profileCompletionDefaultLabels(lang: Language): Record<ProfileCompletionKey, string> {
  return {
    fullName: pickLang('Nom complet', 'Nombre completo', 'Full name', lang),
    email: pickLang('E-mail', 'Correo', 'Email', lang),
    workLanguages: pickLang('Langues de travail', 'Idiomas de trabajo', 'Working languages', lang),
    memberBio: pickLang('Bio (personne)', 'Bio (persona)', 'Bio', lang),
    activityDescription: pickLang(
      'Description de l’activité',
      'Descripción de la actividad',
      'Activity description',
      lang
    ),
    companyName: pickLang('Société / activité', 'Empresa / actividad', 'Company / activity', lang),
    networkGoal: pickLang(
      'Ce que je cherche via le réseau',
      'Lo que busco en la red',
      'What I’m looking for from the network',
      lang
    ),
    helpNewcomers: pickLang('Je peux aider sur…', 'Puedo ayudar en…', 'I can help with…', lang),
    preferredContact: pickLang(
      'Canal de contact privilégié',
      'Canal de contacto preferido',
      'Preferred contact channel',
      lang
    ),
    linkedinUrl: pickLang('Lien LinkedIn', 'Enlace de LinkedIn', 'LinkedIn link', lang),
    passions: pickLang('Passions', 'Pasiones', 'Interests', lang),
    highlightedNeeds: pickLang('Besoins mis en avant', 'Necesidades destacadas', 'Highlighted needs', lang),
    keywords: pickLang('Mots-clés', 'Palabras clave', 'Keywords', lang),
  };
}

/**
 * Checklist pondérée alignée sur les champs réels `UserProfile`
 * (bio membre + description d’activité, pas l’ancien `bio` seul).
 */
export function getProfileCompletionItems(
  profile: Partial<UserProfile> | null | undefined,
  labels?: Partial<Record<ProfileCompletionKey, string>>
): CompletionItem[] {
  const p = profile ?? {};
  const defs = labels ?? {};
  const mb = effectiveMemberBio(p);
  const act = firstSlotActivityDescription(p);

  return [
    {
      key: 'fullName',
      label: defs.fullName ?? 'Nom complet',
      done: hasText(p.fullName, 2),
      weight: 9,
    },
    {
      key: 'email',
      label: defs.email ?? 'E-mail',
      done: hasText(p.email, 5),
      weight: 8,
    },
    {
      key: 'workLanguages',
      label: defs.workLanguages ?? 'Langues de travail',
      done: hasArray(p.workingLanguageCodes, 1),
      weight: 7,
    },
    {
      key: 'memberBio',
      label: defs.memberBio ?? 'Bio',
      done: mb.trim().length >= PUBLICATION_BIO_MIN_LEN,
      weight: 11,
    },
    {
      key: 'activityDescription',
      label: defs.activityDescription ?? 'Description de l’activité',
      done: act.trim().length >= PUBLICATION_BIO_MIN_LEN,
      weight: 11,
    },
    {
      key: 'companyName',
      label: defs.companyName ?? 'Société',
      done: hasText(p.companyName, 2),
      weight: 8,
    },
    {
      key: 'networkGoal',
      label: defs.networkGoal ?? 'Ce que je cherche',
      done: hasText(p.networkGoal, 8),
      weight: 7,
    },
    {
      key: 'helpNewcomers',
      label: defs.helpNewcomers ?? 'Je peux aider sur',
      done: hasText(p.helpNewcomers, 8),
      weight: 6,
    },
    {
      key: 'preferredContact',
      label: defs.preferredContact ?? 'Canal de contact',
      done: hasText(p.contactPreferenceCta, 3),
      weight: 4,
    },
    {
      key: 'linkedinUrl',
      label: defs.linkedinUrl ?? 'Lien LinkedIn',
      done: hasText(p.linkedin, 10),
      weight: 7,
    },
    {
      key: 'passions',
      label: defs.passions ?? 'Passions',
      done: sanitizePassionIds(p.passionIds).length >= 1,
      weight: 9,
    },
    {
      key: 'highlightedNeeds',
      label: defs.highlightedNeeds ?? 'Besoins mis en avant',
      done: sanitizeHighlightedNeeds(p.highlightedNeeds).length >= 1,
      weight: 5,
    },
    {
      key: 'keywords',
      label: defs.keywords ?? 'Mots-clés',
      done: normalizedTargetKeywords(p as UserProfile).length >= 1,
      weight: 8,
    },
  ];
}

export function getProfileCompletionPercent(profile: Partial<UserProfile> | null | undefined): number {
  const items = getProfileCompletionItems(profile);
  const total = items.reduce((sum, item) => sum + item.weight, 0);
  const completed = items.reduce((sum, item) => sum + (item.done ? item.weight : 0), 0);
  if (total <= 0) return 0;
  return Math.round((completed / total) * 100);
}

export function getPriorityMissingFields(
  profile: Partial<UserProfile> | null | undefined,
  labels?: Partial<Record<ProfileCompletionKey, string>>
): CompletionItem[] {
  return getProfileCompletionItems(profile, labels).filter((item) => !item.done).slice(0, 3);
}

/** `id` DOM des champs du formulaire profil (scroll / focus depuis la carte complétude). */
export const PROFILE_COMPLETION_FOCUS_IDS: Record<ProfileCompletionKey, string> = {
  fullName: 'profile-completion-fullName',
  email: 'profile-completion-email',
  workLanguages: 'profile-completion-workLanguages',
  memberBio: 'profile-member-bio',
  activityDescription: 'profile-completion-activityDescription',
  companyName: 'profile-completion-companyName',
  networkGoal: 'networkGoal',
  helpNewcomers: 'helpNewcomers',
  preferredContact: 'contactPreferenceCta',
  linkedinUrl: 'linkedin-input',
  passions: 'profile-completion-passions',
  highlightedNeeds: 'profile-completion-highlightedNeeds',
  keywords: 'targetSectors-needs',
};
