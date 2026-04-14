import type { Language } from '../../types';
import type { Company, Location } from '../company/company.types';

export type MemberId = string;

export type ProfileRole = 'member' | 'admin';

export type VisibilitySettings = {
  emailPublic: boolean;
  whatsappPublic: boolean;
};

export type CommunityOpenness = {
  openToMentoring: boolean;
  openToTalks: boolean;
  openToEvents: boolean;
};

export type ProfileCompletion = {
  percent: number;
  missingTopKeys: string[];
};

export type Member = {
  id: MemberId;
  role: ProfileRole;
  fullName: string;
  email?: string; // may be absent depending on visibility projection
  whatsapp?: string; // may be absent depending on visibility projection
  linkedin?: string;
  photoUrl?: string;
  languages: Language[];
  location?: Location;
  primaryCompany?: Company;
  companies?: Company[];
  highlightedNeedIds: string[];
  hobbyIds: string[];
  keywords: string[];
  contactPreferenceCta?: string;
  communityGoal?: string;
  helpNewcomers?: string;
  visibility: VisibilitySettings;
  openness: CommunityOpenness;
  createdAtMs?: number;
  lastSeenMs?: number;
  validated?: boolean;
  completion?: ProfileCompletion;
};

