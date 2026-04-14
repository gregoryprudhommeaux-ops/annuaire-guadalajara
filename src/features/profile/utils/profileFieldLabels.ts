/**
 * Libellés FR des champs fiche profil (référence unique pour formulaires, exports, IA).
 * Les clés décrivent l’intention UX ; le mapping vers `UserProfile` peut différer
 * (ex. `sector` → `activityCategory`, `district` → `neighborhood`).
 */
/** Libellés courts FR (formulaire profil) — sens conservé, charge cognitive réduite. */
export const PROFILE_FIELD_LABELS = {
  fullName: 'Nom affiché',
  email: 'E-mail',
  linkedinUrl: 'LinkedIn',
  countryDialCode: 'Indicatif',
  phoneWhatsapp: 'Mobile / WhatsApp',
  languages: 'Langues pro',
  arrivalYearInMexico: 'Arrivée au Mexique',
  gender: 'Genre',
  nationality: 'Nationalité',
  bio: 'Bio membre',
  profilePhoto: 'Photo',
  passions: 'Passions',

  companyName: 'Société',
  companyWebsite: 'Site web',
  sector: 'Secteur',
  city: 'Ville',
  district: 'Quartier',
  state: 'État',
  country: 'Pays',
  roleInCompany: 'Fonction',
  foundedYear: 'Création',
  employeeRange: 'Effectif',
  companyType: 'Type d’entreprise',
  professionalStatus: 'Statut pro',
  typicalClientSizes: 'Taille clients',
  activityDescription: 'Activité',

  lookingForText: 'Objectif réseau',
  currentNeeds: 'Besoins (≤3)',
  helpOfferText: 'Aide proposée',
  preferredContactText: '1er contact',
  keywords: 'Mots-clés',
  openness: 'Ouvertures',
  hostDelegations: 'Délégations',
} as const;

export type ProfileFieldLabelKey = keyof typeof PROFILE_FIELD_LABELS;

export function profileFieldLabelFr(key: ProfileFieldLabelKey): string {
  return PROFILE_FIELD_LABELS[key];
}
