import type { UserProfile } from '../../types';
import type { Need } from '../need/need.types';
import { buildRadarMetrics } from '../radar/radar.build';
import { toCanonicalMembers } from './fromUserProfile';

/**
 * Builds canonical {@link RadarMetrics} from legacy profiles by mapping each row to {@link Member}
 * and flattening `networkProfile.currentNeeds`. Optional `supplementalNeeds` for rows not on members.
 */
export function buildRadarMetricsFromUserProfiles(
  profiles: readonly UserProfile[],
  supplementalNeeds: readonly Need[] = []
) {
  const members = toCanonicalMembers(profiles);
  const embeddedNeeds = members.flatMap((m) => m.networkProfile.currentNeeds);
  return buildRadarMetrics(members, [...embeddedNeeds, ...supplementalNeeds]);
}
