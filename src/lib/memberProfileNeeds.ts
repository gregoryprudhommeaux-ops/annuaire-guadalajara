export type MemberProfileNeedCategory =
  | 'partners'
  | 'clients'
  | 'distributors'
  | 'suppliers'
  | 'talent'
  | 'investors'
  | 'experts'
  | 'visibility'
  | 'other';

export type MemberProfileNeedItem = {
  category: MemberProfileNeedCategory;
  label?: string;
  isActive: boolean;
  source: 'profile' | 'request';
  createdAt?: unknown;
};

export type MemberProfileWithNeeds = {
  needs?: MemberProfileNeedItem[];
};

export const NEED_CATEGORY_LABELS_FR: Record<MemberProfileNeedCategory, string> = {
  partners: 'Partenaires commerciaux',
  clients: 'Clients / prospects',
  distributors: 'Distributeurs / importateurs',
  suppliers: 'Fournisseurs',
  talent: 'Talents / recrutement',
  investors: 'Investisseurs / financement',
  experts: 'Experts locaux',
  visibility: 'Visibilité / communication',
  other: 'Autres besoins',
};

export type NeedChartRow = {
  key: string;
  label: string;
  count: number;
};

export function aggregateNeedsFromMembers(
  members: Array<{ needs?: Array<{ category?: string; isActive?: boolean }> }>,
  labels: Record<string, string>,
  opts?: { limit?: number }
): NeedChartRow[] {
  const limit = Math.max(1, Math.min(12, opts?.limit ?? 8));
  const map = new Map<string, number>();

  for (const member of members) {
    for (const need of member.needs ?? []) {
      if (!need?.category || need.isActive === false) continue;
      map.set(need.category, (map.get(need.category) ?? 0) + 1);
    }
  }

  return Array.from(map.entries())
    .map(([key, count]) => ({
      key,
      label: labels[key] ?? key,
      count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

