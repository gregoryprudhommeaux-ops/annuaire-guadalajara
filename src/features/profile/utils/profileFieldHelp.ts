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
  profilePhoto:
    'URL HTTPS d’image déjà publique (pas d’upload). Sinon, initiales automatiques — fiable et homogène.',
  passions: 'Centres d’intérêt hors cœur de métier : humanisent la fiche et le matching.',
  companyName: 'Raison sociale ou nom commercial principal.',
  sector: 'Secteur principal pour filtres et suggestions.',
  country: 'Pays d’implantation ou de résidence.',
  roleInCompany: 'Décrivez votre rôle réel, pas seulement votre titre.',
  activityDescription: '2 à 4 phrases concrètes sur l’activité sur ce marché.',
  lookingForText:
    'Décrivez en une phrase le type d’opportunité, de contact ou de soutien que vous cherchez réellement dans le réseau.',
  currentNeeds:
    'Choisissez jusqu’à 3 besoins prioritaires : ce sont eux qui déclenchent les mises en relation les plus pertinentes.',
  helpOfferText:
    'Expliquez concrètement ce que vous pouvez apporter à d’autres membres : expertise, réseau, accès marché, partenaires, financement, conseil.',
  keywords:
    'Ajoutez des mots-clés précis pour être trouvé plus facilement et apparaître dans les bons matchs (jusqu’à 20, séparés par des virgules).',
  openness: 'Aide à proposer des mises en relation pertinentes.',
} as const satisfies Partial<Record<ProfileFieldLabelKey, string>>;

export type ProfileFieldHelpKey = keyof typeof PROFILE_FIELD_HELP;

export function profileFieldHelpFr(key: ProfileFieldHelpKey): string {
  return PROFILE_FIELD_HELP[key];
}
