import type { UserProfile } from '../../types';
import type { Member } from '../member/member.types';
import { mapUserProfileToMember } from '../member/member.mappers';

/** Progressive adapter: Firestore-shaped profile → canonical {@link Member}. Legacy UI can ignore. */
export function toCanonicalMember(profile: UserProfile): Member {
  return mapUserProfileToMember(profile);
}

export function toCanonicalMembers(profiles: readonly UserProfile[]): Member[] {
  return profiles.map((p) => mapUserProfileToMember(p));
}
