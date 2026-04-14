import type { UserProfile, MemberNetworkRequest } from '../../types';
import { sanitizeHighlightedNeeds, NEED_OPTION_VALUE_SET } from '../../needOptions';
import { sanitizePassionIds } from '../../lib/passionConfig';
import { profileDistinctActivityCategories } from '../../lib/companyActivities';
import { mapLegacyHighlightedNeedIdToCategoryKey } from '../need/need.mappers';
import {
  mapLegacyActivityCategoryToSectorKey,
  mapLegacyPassionIdToHobbyKey,
} from '../member/member.mappers';
import { HOBBIES, NEED_CATEGORIES, SECTORS } from '../taxonomy/taxonomy.catalog.fr';
import type { HobbyKey, NeedCategoryKey, SectorKey } from '../taxonomy/taxonomy.types';
import type { CountMetric, RadarMetrics } from './radar.types';

export type RadarAggregationOptions = {
  nowMs?: number;
  includeUnvalidated?: boolean;
  /** When provided, fills {@link RadarMetrics.totalRequests}. */
  networkRequests?: MemberNetworkRequest[];
};

function sectorLabel(key: SectorKey): string {
  return SECTORS.find((s) => s.key === key)?.label ?? key;
}

function needCategoryLabel(key: NeedCategoryKey): string {
  return NEED_CATEGORIES.find((n) => n.key === key)?.label ?? key;
}

function hobbyLabel(key: HobbyKey): string {
  return HOBBIES.find((h) => h.key === key)?.label ?? key;
}

function toSortedCountMetrics<T extends string>(
  counts: Map<T, number>,
  labelFor: (key: T) => string,
  limit: number
): CountMetric<T>[] {
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([key, count]) => ({ key, label: labelFor(key), count }));
}

export function aggregateRadarMetrics(
  profiles: UserProfile[],
  opts: RadarAggregationOptions = {}
): RadarMetrics {
  const nowMs = opts.nowMs ?? Date.now();
  const includeUnvalidated = opts.includeUnvalidated ?? false;

  const profilesForStats = includeUnvalidated
    ? profiles
    : profiles.filter((p) => p.isValidated !== false);

  const totalMembers = profilesForStats.length;
  const totalRequests = opts.networkRequests?.length ?? 0;

  const sectorCounts = new Map<SectorKey, number>();
  profilesForStats.forEach((p) => {
    const cats = profileDistinctActivityCategories(p);
    cats.forEach((raw) => {
      const key = mapLegacyActivityCategoryToSectorKey(raw);
      sectorCounts.set(key, (sectorCounts.get(key) ?? 0) + 1);
    });
  });

  const needCategoryCounts = new Map<NeedCategoryKey, number>();
  profilesForStats.forEach((p) => {
    sanitizeHighlightedNeeds(p.highlightedNeeds).forEach((id) => {
      if (!NEED_OPTION_VALUE_SET.has(id)) return;
      const key = mapLegacyHighlightedNeedIdToCategoryKey(id);
      needCategoryCounts.set(key, (needCategoryCounts.get(key) ?? 0) + 1);
    });
  });

  const hobbyCounts = new Map<HobbyKey, number>();
  profilesForStats.forEach((p) => {
    sanitizePassionIds(p.passionIds).forEach((id) => {
      const key = mapLegacyPassionIdToHobbyKey(id);
      if (!key) return;
      hobbyCounts.set(key, (hobbyCounts.get(key) ?? 0) + 1);
    });
  });

  return {
    totalMembers,
    totalRequests,
    topSectors: toSortedCountMetrics(sectorCounts, sectorLabel, 8),
    topNeedCategories: toSortedCountMetrics(needCategoryCounts, needCategoryLabel, 8),
    topHobbies: toSortedCountMetrics(hobbyCounts, hobbyLabel, 12),
    updatedAt: new Date(nowMs).toISOString(),
  };
}
