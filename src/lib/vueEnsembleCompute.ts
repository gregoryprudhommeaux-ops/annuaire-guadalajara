import type { Language } from '@/types';
import type { CompanySize as ExplorerCompanySize, ExplorerMember } from '@/lib/explorerProfilsCompute';
import type { CompanyKind, MemberExtended, MemberStatus } from '@/lib/communityMemberExtended';
import { pickLang } from '@/lib/uiLocale';

export type BarDatum = { label: string; value: number };

export function countBy<T extends string>(items: { key: T }[]): { key: T; count: number }[] {
  const map = new Map<T, number>();
  items.forEach(({ key }) => {
    map.set(key, (map.get(key) ?? 0) + 1);
  });
  return Array.from(map.entries()).map(([k, v]) => ({ key: k, count: v }));
}

export function computeSectorDistribution(members: MemberExtended[]): BarDatum[] {
  const counts = countBy(members.map((m) => ({ key: (m.sector || 'NA').trim() || 'NA' })));
  return counts.map((c) => ({ label: c.key, value: c.count }));
}

export function computeSizeDistribution(members: MemberExtended[]): BarDatum[] {
  const counts = countBy(members.map((m) => ({ key: m.companySize })));
  return counts.map((c) => ({ label: c.key, value: c.count }));
}

export function computeStatusDistribution(members: MemberExtended[]): BarDatum[] {
  const counts = countBy(members.map((m) => ({ key: m.status })));
  return counts.map((c) => ({ label: c.key, value: c.count }));
}

const SENIORITY_BUCKET_KEYS = ['0-1', '1-3', '3-5', '5+'] as const;

export function computeSeniorityBuckets(members: MemberExtended[]): BarDatum[] {
  const buckets: Record<(typeof SENIORITY_BUCKET_KEYS)[number], number> = {
    '0-1': 0,
    '1-3': 0,
    '3-5': 0,
    '5+': 0,
  };
  members.forEach((m) => {
    const y = m.yearsInGDL ?? 0;
    if (y < 1) buckets['0-1']++;
    else if (y < 3) buckets['1-3']++;
    else if (y < 5) buckets['3-5']++;
    else buckets['5+']++;
  });
  return SENIORITY_BUCKET_KEYS.map((k) => ({ label: k, value: buckets[k] }));
}

export function medianSeniority(members: MemberExtended[]): number {
  if (!members.length) return 0;
  const arr = members.map((m) => m.yearsInGDL ?? 0).sort((a, b) => a - b);
  const mid = Math.floor(arr.length / 2);
  if (arr.length % 2 === 0) {
    return (arr[mid - 1] + arr[mid]) / 2;
  }
  return arr[mid];
}

export function topByValue(data: BarDatum[]): string {
  if (!data.length) return '—';
  return data.reduce((best, d) => (d.value > best.value ? d : best)).label;
}

export function formatCompanyKind(kind: CompanyKind, lang: Language): string {
  switch (kind) {
    case 'startup':
      return pickLang('Startup', 'Startup', 'Startup', lang);
    case 'pme':
      return pickLang('PME', 'PyME', 'SME', lang);
    case 'corporate':
      return pickLang('Grande entreprise', 'Gran empresa', 'Corporate', lang);
    case 'independent':
      return pickLang('Indépendant / freelance', 'Independiente / freelance', 'Independent / freelance', lang);
    case 'association':
      return pickLang('Association', 'Asociación', 'Association', lang);
    case 'nonprofit':
      return pickLang('Non profit', 'Sin fines de lucro', 'Non-profit', lang);
    case 'club':
      return pickLang('Club', 'Club', 'Club', lang);
    default:
      return kind;
  }
}

export function formatMemberStatus(status: MemberStatus, lang: Language): string {
  switch (status) {
    case 'freelance':
      return pickLang('Freelance', 'Freelance', 'Freelance', lang);
    case 'employee':
      return pickLang('Salarié(e)', 'Empleado(a)', 'Employee', lang);
    case 'owner':
      return pickLang('Dirigeant / propriétaire', 'Directivo / propietario', 'Owner / executive', lang);
    case 'volunteer':
      return pickLang('Bénévole', 'Voluntario(a)', 'Volunteer', lang);
    default:
      return status;
  }
}

export function formatSeniorityBucket(bucketKey: string, lang: Language): string {
  switch (bucketKey) {
    case '0-1':
      return pickLang('0–1 an', '0–1 año', '0–1 year', lang);
    case '1-3':
      return pickLang('1–3 ans', '1–3 años', '1–3 years', lang);
    case '3-5':
      return pickLang('3–5 ans', '3–5 años', '3–5 years', lang);
    case '5+':
      return pickLang('5+ ans', '5+ años', '5+ years', lang);
    default:
      return bucketKey;
  }
}

/** Heuristique jusqu’à enrichissement Firestore (champs dédiés). */
export function mapExplorerToMemberExtended(m: ExplorerMember): MemberExtended {
  const companySize: CompanyKind =
    m.companySize === 'freelance'
      ? 'independent'
      : m.companySize === 'corporate'
        ? 'corporate'
        : 'pme';

  const status: MemberStatus = m.companySize === 'freelance' ? 'freelance' : 'owner';

  let h = 0;
  for (let i = 0; i < m.id.length; i++) {
    h = (h * 31 + m.id.charCodeAt(i)) | 0;
  }
  const yearsInGDL = Math.abs(h) % 6;

  return {
    id: m.id,
    sector: m.sector?.trim() || '—',
    companySize,
    yearsInGDL,
    status,
    city: m.city,
    country: m.country,
  };
}

export function mapExplorersToExtended(members: ExplorerMember[]): MemberExtended[] {
  return members.map(mapExplorerToMemberExtended);
}

/** Pour alimenter `ExplorerProfils` à partir du modèle communauté étendu. */
export function memberExtendedToExplorerMember(m: MemberExtended): ExplorerMember {
  const companySize: ExplorerCompanySize =
    m.companySize === 'independent'
      ? 'freelance'
      : m.companySize === 'corporate'
        ? 'corporate'
        : 'pme';

  let h = 0;
  for (let i = 0; i < m.id.length; i++) {
    h = (h * 31 + m.id.charCodeAt(i)) | 0;
  }
  const r = (shift: number) => 1 + (Math.abs(h >> shift) % 5);

  const tags: string[] = [];
  if (m.sector.trim() === 'F&B' || m.sector.includes('F&B')) {
    tags.push('F&B');
  }

  return {
    id: m.id,
    name: `${m.sector} · ${m.city}`,
    sector: m.sector,
    city: m.city,
    country: m.country,
    languages: ['fr', 'es'],
    companySize,
    exportOrientation: r(0),
    eventsAppetite: Math.min(5, r(4) + (m.yearsInGDL > 2 ? 1 : 0)),
    networkingNeeds: m.status === 'owner' ? Math.min(5, r(6) + 1) : r(6),
    digitalMaturity: r(3),
    teamSizeScore: m.companySize === 'startup' ? 2 : r(9),
    exchangeFrequency: r(12),
    tags,
  };
}
