import type { UserProfile } from '../../types';
import { sanitizeHighlightedNeeds, NEED_OPTION_VALUE_SET } from '../../needOptions';
import { sanitizePassionIds } from '../../lib/passionConfig';
import { profileDistinctActivityCategories } from '../../lib/companyActivities';
import type { RadarMetrics } from './radar.types';

export type RadarAggregationOptions = {
  nowMs?: number;
  includeUnvalidated?: boolean;
};

function profileCreatedAtMs(p: UserProfile): number | null {
  const d = (p as any)?.createdAt?.toDate?.() as Date | undefined;
  const ms = d instanceof Date ? d.getTime() : NaN;
  return Number.isFinite(ms) ? ms : null;
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

  const since = nowMs - 7 * 24 * 60 * 60 * 1000;
  const newMembersLast7d = profilesForStats.filter((p) => {
    const ms = profileCreatedAtMs(p);
    return typeof ms === 'number' && ms >= since;
  }).length;

  const structuredNeedsTotal = profilesForStats.reduce((acc, p) => {
    const ids = sanitizeHighlightedNeeds(p.highlightedNeeds).filter((id) =>
      NEED_OPTION_VALUE_SET.has(id)
    );
    return acc + ids.length;
  }, 0);

  const sectorCounts = new Map<string, number>();
  const sectorSet = new Set<string>();
  profilesForStats.forEach((p) => {
    const cats = profileDistinctActivityCategories(p);
    cats.forEach((c) => {
      sectorSet.add(c);
      sectorCounts.set(c, (sectorCounts.get(c) || 0) + 1);
    });
  });

  const distinctSectors = sectorSet.size;

  const needsCounts: Record<string, number> = {};
  profilesForStats.forEach((p) => {
    (p.highlightedNeeds || []).forEach((id) => {
      if (!NEED_OPTION_VALUE_SET.has(id)) return;
      needsCounts[id] = (needsCounts[id] || 0) + 1;
    });
  });

  const passionsCounts: Record<string, number> = {};
  profilesForStats.forEach((p) => {
    sanitizePassionIds(p.passionIds).forEach((id) => {
      passionsCounts[id] = (passionsCounts[id] || 0) + 1;
    });
  });

  const topNeeds = Object.entries(needsCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([id, count]) => ({ id, count }));

  const topPassions = Object.entries(passionsCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([id, count]) => ({ id, count }));

  const sectors = [...sectorCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([id, count]) => ({ id, count }));

  return {
    totalMembers,
    newMembersLast7d,
    structuredNeedsTotal,
    distinctSectors,
    topNeeds,
    topPassions,
    sectors,
  };
}

