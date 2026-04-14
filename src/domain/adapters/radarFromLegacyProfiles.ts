import type { UserProfile } from '../../types';
import { aggregateRadarMetrics, type RadarAggregationOptions } from '../radar/radar.aggregations';

/**
 * Wraps {@link aggregateRadarMetrics} with the same “validated only unless admin” rule
 * as the homepage radar (`NetworkRadarSection` filters). Safe to call alongside legacy UI;
 * does not replace in-page calculations until you opt in.
 */
export function radarMetricsFromLegacyProfiles(
  profiles: UserProfile[],
  opts: RadarAggregationOptions & { viewerIsAdmin?: boolean } = {}
): ReturnType<typeof aggregateRadarMetrics> {
  const { viewerIsAdmin, includeUnvalidated, ...rest } = opts;
  const resolvedInclude =
    viewerIsAdmin === true ? true : (includeUnvalidated ?? false);
  return aggregateRadarMetrics(profiles, { ...rest, includeUnvalidated: resolvedInclude });
}

export type { RadarAggregationOptions };
