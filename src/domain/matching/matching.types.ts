import type { Member } from '../member/member.types';

export type MatchReasonCode =
  | 'shared_sector'
  | 'shared_need'
  | 'shared_hobby'
  | 'shared_location'
  | 'complementary_keywords'
  | 'unknown';

export type MatchScore = {
  score: number; // 0..1
  reasons: { code: MatchReasonCode; weight: number; detail?: string }[];
};

export type MatchCandidate = {
  member: Member;
  score: MatchScore;
};

