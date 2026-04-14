export type RadarMetrics = {
  totalMembers: number;
  newMembersLast7d: number;
  structuredNeedsTotal: number;
  distinctSectors: number;
  topNeeds: { id: string; count: number }[];
  topPassions: { id: string; count: number }[];
  sectors: { id: string; count: number }[];
};

