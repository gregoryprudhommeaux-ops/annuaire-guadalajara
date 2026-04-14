import type { ProfileFieldLabelKey } from './profileFieldLabels';

/** Textes d’aide FR (sous-labels, tooltips) — sous-ensemble des champs. */
export const PROFILE_FIELD_HELP = {
  fullName: 'Comme sur votre fiche publique.',
  email: 'Pour connexion et échanges ; visibilité réglable plus bas.',
  linkedinUrl: 'Lien public (https://…). Optionnel mais utile au réseau.',
  phoneWhatsapp: 'Numéro sans répéter l’indicatif.',
  languages: 'Gardez 2 à 3 langues réellement utilisées en business.',
  arrivalYearInMexico: 'Permet d’estimer votre ancienneté locale.',
  gender: 'Statistique interne uniquement.',
  nationality: 'Non affichée sur la fiche publique.',
  bio: '15 caractères minimum. Présentez-vous : parcours, valeur pour le réseau.',
  profilePhoto: 'Avatar annuaire ; une photo lisible améliore les mises en relation.',
  passions: 'Centres d’intérêt hors cœur de métier : humanisent la fiche et le matching.',
  companyName: 'Raison sociale ou nom commercial principal.',
  sector: 'Secteur principal pour filtres et suggestions.',
  activityDescription: '2 à 4 phrases concrètes sur l’activité sur ce marché.',
  lookingForText: 'Une phrase : ce que vous attendez du réseau.',
  currentNeeds: 'Jusqu’à 3 besoins affichés sur votre fiche publique.',
  helpOfferText: 'Sur quoi vous pouvez aider concrètement d’autres membres.',
  preferredContactText: 'Canal le plus simple pour un premier échange.',
  keywords: '4 à 8 termes séparés par des virgules (zones, expertises…).',
  openness: 'Aide à proposer des mises en relation pertinentes.',
  hostDelegations: 'Réservé à l’équipe d’administration, non affiché publiquement.',
} as const satisfies Partial<Record<ProfileFieldLabelKey, string>>;

export type ProfileFieldHelpKey = keyof typeof PROFILE_FIELD_HELP;

export function profileFieldHelpFr(key: ProfileFieldHelpKey): string {
  return PROFILE_FIELD_HELP[key];
}
