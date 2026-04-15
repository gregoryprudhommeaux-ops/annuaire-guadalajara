export type CompatibilityMember = {
  id?: string;
  slug?: string;
  fullName?: string;
  companyName?: string;
  sector?: string;
  city?: string;
  currentNeeds?: string[];
  helpOfferText?: string;
  lookingForText?: string;
  passions?: string[];
  openness?: string[];
  keywords?: string[] | string;
};

export type CompatibilityReason =
  | 'Besoin compatible'
  | 'Peut vous aider'
  | 'Même secteur'
  | 'Même ville'
  | 'Passion commune'
  | 'Ouvert au mentorat'
  | 'Mots-clés proches';
