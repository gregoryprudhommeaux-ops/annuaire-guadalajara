import type { Language } from '../../types';

export type TaxonomyId = string;

export type TriLabel = Record<Language, string>;

export type SectorId = string;

export type Sector = {
  id: SectorId;
  label: TriLabel;
};

export type HobbyId = string;

export type Hobby = {
  id: HobbyId;
  label: TriLabel;
  categoryId: string;
  categoryEmoji?: string;
};

export type NeedId = string; // e.g. NEED_CLIENTS

export type NeedCategoryId = string;

export type NeedCategory = {
  id: NeedCategoryId;
  label: TriLabel;
};

export type Need = {
  id: NeedId;
  label: TriLabel;
  categoryId: NeedCategoryId;
};

