import type { Language } from '@/types';
import type { MemberExtended, MemberNeed, NeedCategory } from '@/lib/communityMemberExtended';
import { NEED_CATEGORY_VALUES } from '@/lib/communityMemberExtended';

export type NeedBarDatum = { need: NeedCategory; count: number };

export type HeatmapDatum = {
  sector: string;
  data: { need: NeedCategory; value: number }[];
};

export type LinePoint = { x: string; y: number };
export type LineSerie = { id: string; data: LinePoint[] };

export const NEED_TYPES: NeedCategory[] = [...NEED_CATEGORY_VALUES];

export function computeTopNeeds(needs: MemberNeed[]): NeedBarDatum[] {
  const map = new Map<NeedCategory, number>();
  needs.forEach((n) => {
    map.set(n.need, (map.get(n.need) ?? 0) + 1);
  });
  return Array.from(map.entries())
    .map(([need, count]) => ({ need, count }))
    .sort((a, b) => b.count - a.count);
}

export function computeHeatmap(needs: MemberNeed[]): HeatmapDatum[] {
  const sectors = Array.from(new Set(needs.map((n) => n.sector)));
  return sectors.map((sector) => {
    const subset = needs.filter((n) => n.sector === sector);
    const map = new Map<NeedCategory, number>();
    subset.forEach((n) => map.set(n.need, (map.get(n.need) ?? 0) + 1));
    return {
      sector,
      data: NEED_TYPES.map((need) => ({
        need,
        value: map.get(need) ?? 0,
      })),
    };
  });
}

/** Séries Nivo heatmap : une ligne = secteur, colonnes = libellés besoins traduits. */
export function heatmapToNivoSeries(
  heatmap: HeatmapDatum[],
  lang: Language,
  t: (key: string) => string
): { id: string; data: { x: string; y: number }[] }[] {
  return heatmap.map((row) => ({
    id: row.sector,
    data: row.data.map((cell) => ({
      x: labelNeed(lang, cell.need, t),
      y: cell.value,
    })),
  }));
}

/** Mois `YYYY-MM` → `YYYY-MM-01` pour échelles temporelles Nivo. */
export function timeseriesWithDayKeys(serie: LineSerie[]): LineSerie[] {
  return serie.map((s) => ({
    ...s,
    data: s.data.map((p) => ({
      x: /^\d{4}-\d{2}$/.test(String(p.x)) ? `${p.x}-01` : p.x,
      y: p.y,
    })),
  }));
}

export function monthKey(dateStr: string): string {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr.slice(0, 7);
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  return `${y}-${m.toString().padStart(2, '0')}`;
}

export function computeNeedsTimeseries(needs: MemberNeed[]): LineSerie[] {
  const map = new Map<string, number>();
  needs.forEach((n) => {
    const key = monthKey(n.createdAt);
    map.set(key, (map.get(key) ?? 0) + 1);
  });
  const points: LinePoint[] = Array.from(map.entries())
    .map(([month, count]) => ({ x: month, y: count }))
    .sort((a, b) => (a.x < b.x ? -1 : a.x > b.x ? 1 : 0));
  return [{ id: 'needs', data: points }];
}

export function labelNeed(
  _lang: Language,
  need: NeedCategory,
  t: (key: string) => string
): string {
  void _lang;
  return t(`need_${need}`);
}

/** Filtre optionnel par secteur du besoin et par taille d’entreprise du membre. */
export function filterNeeds(
  needs: MemberNeed[],
  members: MemberExtended[] | undefined,
  sectorFilter: string,
  sizeFilter: string
): MemberNeed[] {
  let out = needs;
  if (sectorFilter.trim()) {
    out = out.filter((n) => n.sector === sectorFilter);
  }
  if (sizeFilter.trim() && members?.length) {
    const allowed = new Set(
      members.filter((m) => m.companySize === sizeFilter).map((m) => m.id)
    );
    out = out.filter((n) => allowed.has(n.memberId));
  }
  return out;
}
