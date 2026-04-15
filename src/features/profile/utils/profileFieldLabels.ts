/**
 * Libellés FR courts pour /profile/edit (référence unique, sens conservé).
 * Les clés décrivent l’intention UX ; le mapping vers `UserProfile` peut différer.
 */
export const PROFILE_FIELD_LABELS = {
  fullName: 'Nom complet',
  email: 'Email',
  linkedinUrl: 'Lien LinkedIn',
  countryDialCode: 'Indicatif',
  phoneWhatsapp: 'Téléphone / WhatsApp',
  languages: 'Langues de travail',
  arrivalYearInMexico: 'Arrivée au Mexique',
  gender: 'Genre',
  nationality: 'Nationalité',
  bio: 'Bio membre',
  profilePhoto: 'Photo de profil',
  passions: 'Passions',

  companyName: 'Nom de la société',
  companyWebsite: 'Site web',
  sector: 'Secteur',
  city: 'Ville',
  district: 'Quartier',
  state: 'État',
  country: 'Pays',
  roleInCompany: 'Fonction',
  foundedYear: 'Année de création',
  employeeRange: 'Employés',
  companyType: 'Type d’entreprise',
  professionalStatus: 'Statut',
  typicalClientSizes: 'Clients habituels',
  activityDescription: 'Description de l’activité',

  lookingForText: 'Je recherche',
  currentNeeds: 'Besoins actuels',
  helpOfferText: 'Je peux aider sur',
  preferredContactText: 'Canal de contact préféré',
  keywords: 'Mots-clés',
  openness: 'Ouvert à',
  hostDelegations: 'Accueil de délégations',
} as const;

export type ProfileFieldLabelKey = keyof typeof PROFILE_FIELD_LABELS;

export function profileFieldLabelFr(key: ProfileFieldLabelKey): string {
  return PROFILE_FIELD_LABELS[key];
}
