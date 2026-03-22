import type { UserProfile } from '@/types';
import type { MemberNeed } from '@/lib/communityMemberExtended';

export type MemberForFun = {
  id: string;
  sector: string;
  city: string;
  country: string;
  yearsInGDL: number;
  hobbies: string[];
  languages: string[];
};

export type NeedForFun = {
  memberId: string;
  need: string;
};

function profileCreatedAtMs(p: UserProfile): number {
  const ts = p.createdAt as { toMillis?: () => number } | undefined;
  if (ts && typeof ts.toMillis === 'function') {
    try {
      return ts.toMillis();
    } catch {
      return 0;
    }
  }
  return 0;
}

/** Lundi 00:00:00 (heure locale). */
export function startOfCurrentWeekLocal(now = new Date()): Date {
  const x = new Date(now);
  const day = x.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + diff);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function filterProfilesJoinedSince(
  profiles: UserProfile[],
  since: Date
): UserProfile[] {
  const t = since.getTime();
  return profiles.filter((p) => profileCreatedAtMs(p) >= t);
}

export function filterNeedsSince(needs: MemberNeed[], since: Date): MemberNeed[] {
  const t = since.getTime();
  return needs.filter((n) => {
    const raw = n.createdAt.trim();
    const iso = raw.includes('T') ? raw : `${raw}T12:00:00.000Z`;
    const ms = Date.parse(iso);
    return !Number.isNaN(ms) && ms >= t;
  });
}

export function memberNeedsToNeedForFun(needs: MemberNeed[]): NeedForFun[] {
  return needs.map((n) => ({ memberId: n.memberId, need: n.need }));
}
