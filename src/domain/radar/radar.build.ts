import type { Member } from '../member/member.types';
import type { Need } from '../need/need.types';
import { HOBBIES, NEED_CATEGORIES, SECTORS } from '../taxonomy/taxonomy.constants';
import type { HobbyKey, NeedCategoryKey, SectorKey } from '../taxonomy/taxonomy.types';
import type { CountMetric, RadarMetrics } from './radar.types';

function countByKey<T extends string>(items: T[]): Record<string, number> {
  return items.reduce<Record<string, number>>((acc, item) => {
    acc[item] = (acc[item] ?? 0) + 1;
    return acc;
  }, {});
}

function topCounts<T extends string>(
  counts: Record<string, number>,
  labels: { key: T; label: string }[],
  limit = 5
): CountMetric<T>[] {
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([key, count]) => ({
      key: key as T,
      label: labels.find((item) => item.key === key)?.label ?? key,
      count,
    }));
}

export function buildRadarMetrics(members: Member[], needs: Need[]): RadarMetrics {
  const sectorKeys = members.map((member) => member.company.sector);
  const hobbyKeys = members.flatMap((member) => member.networkProfile.hobbies);
  const needKeys = needs.flatMap((need) => need.categories);

  const topSectors = topCounts<SectorKey>(countByKey(sectorKeys), SECTORS, 6);
  const topNeedCategories = topCounts<NeedCategoryKey>(
    countByKey(needKeys),
    NEED_CATEGORIES,
    6
  );
  const topHobbies = topCounts<HobbyKey>(countByKey(hobbyKeys), HOBBIES, 6);

  return {
    totalMembers: members.length,
    totalRequests: needs.length,
    topSectors,
    topNeedCategories,
    topHobbies,
    updatedAt: new Date().toISOString(),
  };
}
