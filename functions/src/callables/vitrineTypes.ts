export type VitrineStats = {
  totalMembers: number;
  newMembersLast30d: number;
  prevNewMembers30d: number;
  profileViewsCumul: number;
  contactClicksCumul: number;
  topSectors: Array<{ name: string; value: number }>;
  growthCumulative: Array<{ date: string; count: number }>;
  needs: Array<{ key: string; label: string; count: number }>;
  topPassions: Array<{ passionId: string; memberCount: number; sectorCount: number }>;
  recentMembers: Array<{ uid: string; createdAtMs: number; sector: string; primaryNeed: string }>;
  recentRequests: Array<{ id: string; createdAtMs: number; expiresAtMs: number; title: string }>;
};

export type UiLang = 'fr' | 'en' | 'es';
