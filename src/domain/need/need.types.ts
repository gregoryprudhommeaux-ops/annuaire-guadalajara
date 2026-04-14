import type { Language } from '../../types';
import type { NeedCategoryKey, VisibilityScope } from '../taxonomy/taxonomy.types';

export type NeedId = string; // taxonomy id e.g. NEED_CLIENTS

export type NeedStatus = 'active' | 'paused' | 'fulfilled' | 'archived';

export type Need = {
  id: string;
  memberId: string;
  title: string;
  description?: string;
  categories: NeedCategoryKey[];
  visibility: VisibilityScope;
  status: NeedStatus;
  createdAt?: string;
  updatedAt?: string;
  expiresAt?: string;
  highlighted?: boolean;
};

export type NeedCategory = 'partners_market' | 'support_expertise' | 'info_network' | 'other';

export type HighlightedNeed = {
  id: NeedId;
  label: Record<Language, string>;
};

/** Public network request card (maps `MemberNetworkRequest`). */
export type NetworkRequestId = string;

export type NetworkRequest = {
  id: NetworkRequestId;
  authorId: string;
  authorName: string;
  authorPhotoUrl?: string;
  authorCompany?: string;
  text: string;
  textTranslations?: Partial<Record<Language, string>>;
  sector?: string;
  zone?: string;
  productOrService?: string;
  createdAtMs: number;
  expiresAtMs: number;
};

