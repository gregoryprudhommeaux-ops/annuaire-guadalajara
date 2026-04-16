import type { ProfileFieldLabelKey } from './profileFieldLabels';

/** Textes d’aide FR (sous-labels) — sous-ensemble des champs. */
export const PROFILE_FIELD_HELP = {
  fullName: 'Comme sur votre fiche publique.',
  email: 'Pour connexion et échanges ; visibilité réglable plus bas.',
  linkedinUrl: 'Lien public (https://…). Optionnel mais utile au réseau.',
  phoneWhatsapp: 'Numéro sans répéter l’indicatif.',
  languages: 'Gardez 2 à 3 langues réellement utilisées en business.',
  arrivalYearInMexico: 'Permet d’estimer votre ancienneté locale.',
  gender: 'Statistique interne uniquement.',
  nationality: 'Non affichée sur la fiche publique.',
  bio: 'Privilégiez une présentation claire, concrète et orientée business. Évitez les textes trop personnels ou trop longs.',
  profilePhoto: 'Avatar annuaire ; une photo lisible améliore les mises en relation.',
  passions: 'Centres d’intérêt hors cœur de métier : humanisent la fiche et le matching.',
  companyName: 'Raison sociale ou nom commercial principal.',
  sector: 'Secteur principal pour filtres et suggestions.',
  country: 'Pays d’implantation ou de résidence.',
  roleInCompany: 'Décrivez votre rôle réel, pas seulement votre titre.',
  activityDescription: '2 à 4 phrases concrètes sur l’activité sur ce marché.',
  lookingForText: 'Expliquez en une phrase ce que vous attendez concrètement du réseau.',
  currentNeeds: 'Jusqu’à 3 besoins affichés sur votre fiche publique.',
  helpOfferText: 'Décrivez de façon concrète comment vous pouvez être utile à d’autres membres.',
  preferredContactText: 'Indiquez le canal de contact le plus simple et le plus naturel pour vous.',
  keywords:
    'Jusqu’à 20 mots-clés, séparés par des virgules. Ils servent à croiser les recommandations avec les besoins des autres membres pour des propositions de contact plus pertinentes.',
  openness: 'Aide à proposer des mises en relation pertinentes.',
  hostDelegations: 'Réservé à l’équipe d’administration.',
} as const satisfies Partial<Record<ProfileFieldLabelKey, string>>;

export type ProfileFieldHelpKey = keyof typeof PROFILE_FIELD_HELP;

export function profileFieldHelpFr(key: ProfileFieldHelpKey): string {
  return PROFILE_FIELD_HELP[key];
}
