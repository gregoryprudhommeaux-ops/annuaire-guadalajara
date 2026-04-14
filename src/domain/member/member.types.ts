import type { Company } from '../company/company.types';
import type { Need } from '../need/need.types';
import type {
  CommunityOpennessKey,
  HobbyKey,
  LanguageCode,
  LocaleCode,
  SectorKey,
} from '../taxonomy/taxonomy.types';
import type { VisibilitySettings } from './member.visibility';

export type MemberId = string;

export type ProfileRole = 'member' | 'admin';

export type ContactPreference = 'email' | 'whatsapp' | 'linkedin' | 'phone' | 'other';

export type MemberContact = {
  email?: string;
  linkedinUrl?: string;
  countryDialCode?: string;
  phoneWhatsapp?: string;
  preferredContactChannels?: ContactPreference[];
  preferredContactText?: string;
};

export type MemberIdentity = {
  id: string;
  slug: string;
  fullName: string;
  photoUrl?: string;
  bio?: string;
  nationality?: string;
  gender?: string;
  locale?: LocaleCode;
  workLanguages: LanguageCode[];
  arrivalYearInMexico?: number;
};

export type MemberNetworkProfile = {
  tagline?: string;
  lookingForText?: string;
  helpOfferText?: string;
  currentNeeds: Need[];
  keywords: string[];
  hobbies: HobbyKey[];
  openness: CommunityOpennessKey[];
  searchableSectors: SectorKey[];
};

export type Member = {
  id: string;
  slug: string;
  identity: MemberIdentity;
  contact: MemberContact;
  company: Company;
  networkProfile: MemberNetworkProfile;
  visibility: VisibilitySettings;
  publicProfileCompleted: boolean;
  profileCompletionPercent: number;
  createdAt?: string;
  updatedAt?: string;
};
