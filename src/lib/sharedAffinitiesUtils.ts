import type { VitrinePassionRow } from '@/hooks/useVitrineStats';
import type { Language } from '@/types';

const TEAL = '#01696f';
export const AFFINITY_TEAL = TEAL;
export const AFFINITY_TEAL_SOFT = 'rgb(230 245 245)';

/**
 * Score « fédérateur » : volume × diversité sectorielle (donnée déjà agrégée côté vitrine).
 */
export function affinityFederationScore(p: Pick<VitrinePassionRow, 'memberCount' | 'sectorCount'>): number {
  const m = Math.max(0, p.memberCount);
  const s = Math.max(0, p.sectorCount);
  return m * (1 + s);
}

export function sortPassionsByFederation(rows: VitrinePassionRow[]): VitrinePassionRow[] {
  return [...rows].sort((a, b) => {
    const d = affinityFederationScore(b) - affinityFederationScore(a);
    if (d !== 0) return d;
    const m = b.memberCount - a.memberCount;
    if (m !== 0) return m;
    return a.passionId.localeCompare(b.passionId);
  });
}

/**
 * Membres + secteurs / univers métier (Voyage) avec poids visuel équivalent côté UI.
 */
export function formatAffinityMetrics(
  passionId: string,
  memberCount: number,
  sectorCount: number,
  lang: Language
): { members: string; sectors: string } {
  const m = Math.max(0, memberCount);
  const s = Math.max(0, sectorCount);
  const mem =
    lang === 'en'
      ? `${m} member${m === 1 ? '' : 's'}`
      : lang === 'es'
        ? `${m} miembro${m === 1 ? '' : 's'}`
        : `${m} membre${m > 1 ? 's' : ''}`;

  const useVoyageWording = passionId === 'voyage';
  let sec: string;
  if (useVoyageWording) {
    if (lang === 'en') {
      sec = s === 1 ? '1 industry background' : `${s} industry backgrounds`;
    } else if (lang === 'es') {
      sec = s === 1 ? '1 ámbito profesional' : `${s} ámbitos profesionales`;
    } else {
      sec = s === 1 ? '1 univers métier' : `${s} univers métier`;
    }
  } else {
    if (lang === 'en') {
      sec = s === 1 ? '1 sector' : `${s} sectors`;
    } else if (lang === 'es') {
      sec = s === 1 ? '1 sector' : `${s} sectores`;
    } else {
      sec = s === 1 ? '1 secteur' : `${s} secteurs`;
    }
  }
  return { members: mem, sectors: sec };
}
