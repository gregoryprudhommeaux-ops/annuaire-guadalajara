import type { HobbyKey, NeedCategoryKey, SectorKey } from '../taxonomy/taxonomy.types';

export type CountMetric<T extends string> = {
  key: T;
  label: string;
  count: number;
};

export type RadarMetrics = {
  totalMembers: number;
  totalRequests: number;
  topSectors: CountMetric<SectorKey>[];
  topNeedCategories: CountMetric<NeedCategoryKey>[];
  topHobbies: CountMetric<HobbyKey>[];
  updatedAt: string;
};
