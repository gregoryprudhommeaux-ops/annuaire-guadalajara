import React, { useMemo, useState } from 'react';
import { ResponsiveHeatMap } from '@nivo/heatmap';
import type { Language } from '@/types';
import { getPassionEmoji, getPassionLabel, sanitizePassionIds } from '@/lib/passionConfig';

export type CrossMember = {
  id: string;
  secteur?: string;
  city?: string;
  status?: string;
  passionIds?: string[];
};

type DimensionKey = 'sector' | 'status' | 'city';
export type CrossPick = { passionId: string; dimValue: string; dimension: DimensionKey };

function normalizeLang(lang: Language): 'fr' | 'es' | 'en' {
  return lang === 'es' ? 'es' : lang === 'en' ? 'en' : 'fr';
}

function compactLabel(label: string, max = 14): string {
  const text = String(label ?? '').trim();
  if (!text) return '—';
  if (text.length <= max) return text;
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length > 1) {
    const strong = words.find((w) => w.length >= 4);
    if (strong) return strong.length <= max ? strong : `${strong.slice(0, max - 1)}…`;
  }
  return `${text.slice(0, max - 1)}…`;
}

const chartTheme = {
  text: { fill: '#57534e', fontSize: 11 },
  grid: { line: { stroke: '#e7e5e4' } },
  axis: {
    ticks: { text: { fill: '#78716c', fontSize: 10 } },
    legend: { text: { fill: '#44403c', fontSize: 11 } },
  },
};

type AxisTick = {
  x: number;
  y: number;
  value: string | number;
  opacity?: number;
};

export default function PassionsCrossHeatmap({
  members,
  lang,
  onPickCell,
}: {
  members: CrossMember[];
  lang: Language;
  onPickCell?: (pick: CrossPick) => void;
}) {
  const [dimension, setDimension] = useState<DimensionKey>('sector');
  const locale = normalizeLang(lang);

  const dimLabel = dimension === 'sector' ? 'Secteur' : dimension === 'status' ? 'Statut' : 'Ville';

  const computed = useMemo(() => {
    const passionTotals = new Map<string, number>();
    const dimTotals = new Map<string, number>();
    const matrix = new Map<string, Map<string, number>>(); // passionId -> dimVal -> count

    (members ?? []).forEach((m) => {
      const ids = sanitizePassionIds(m.passionIds);
      if (ids.length === 0) return;

      const rawDim =
        dimension === 'sector'
          ? String(m.secteur ?? '').trim()
          : dimension === 'status'
            ? String(m.status ?? '').trim()
            : String(m.city ?? '').trim();
      const dimVal = rawDim || '—';

      ids.forEach((pid) => {
        passionTotals.set(pid, (passionTotals.get(pid) ?? 0) + 1);
        dimTotals.set(dimVal, (dimTotals.get(dimVal) ?? 0) + 1);
        if (!matrix.has(pid)) matrix.set(pid, new Map());
        const row = matrix.get(pid)!;
        row.set(dimVal, (row.get(dimVal) ?? 0) + 1);
      });
    });

    const topPassions = Array.from(passionTotals.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([id]) => id);

    const topDims = Array.from(dimTotals.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([v]) => v);

    const xToFull = new Map<string, string>();
    const yToFull = new Map<string, string>();
    const yToPassionId = new Map<string, string>();

    const data = topPassions.map((pid) => {
      const yFull = `${getPassionEmoji(pid)} ${getPassionLabel(pid, locale)}`;
      const y = compactLabel(yFull, 16);
      yToFull.set(y, yFull);
      yToPassionId.set(y, pid);

      const rowMap = matrix.get(pid) ?? new Map<string, number>();
      const row = {
        id: y,
        data: topDims.map((d) => {
          const x = compactLabel(d, 12);
          xToFull.set(x, d);
          return { x, y: rowMap.get(d) ?? 0 };
        }),
      };
      return row;
    });

    const hasAny = data.length > 0 && data.some((r) => r.data.some((c) => c.y > 0));
    return { data, hasAny, xToFull, yToFull, yToPassionId };
  }, [members, dimension, locale]);

  return (
    <section className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-stone-900">Croisement passions × {dimLabel}</h3>
          <p className="mt-1 text-xs text-stone-500">Top 10 passions et top 10 valeurs</p>
        </div>
        <select
          value={dimension}
          onChange={(e) => setDimension(e.target.value as DimensionKey)}
          className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-700 sm:w-auto"
        >
          <option value="sector">Secteur</option>
          <option value="status">Statut</option>
          <option value="city">Ville</option>
        </select>
      </div>

      {!computed.hasAny ? (
        <div className="mt-3 rounded-lg border border-stone-200 bg-stone-50 px-3 py-10 text-center text-sm text-stone-600">
          Pas assez de données passions pour afficher la heatmap.
        </div>
      ) : (
        <div className="mt-3 h-[340px] w-full min-w-0">
          <ResponsiveHeatMap
            data={computed.data as any}
            margin={{ top: 16, right: 12, bottom: 44, left: 140 }}
            valueFormat=">-.0f"
            onClick={(cell: any) => {
              const xCompact = String(cell?.data?.x ?? '');
              const yCompact = String(cell?.serieId ?? cell?.data?.id ?? cell?.id ?? '');
              const passionId = computed.yToPassionId.get(yCompact) ?? '';
              const dimValue = computed.xToFull.get(xCompact) ?? xCompact;
              if (!onPickCell || !passionId) return;
              onPickCell({ passionId, dimValue, dimension });
            }}
            axisTop={null}
            axisRight={null}
            axisBottom={{
              tickSize: 3,
              tickPadding: 4,
              tickRotation: 0,
              renderTick: (tick: AxisTick) => {
                const compact = String(tick.value ?? '');
                const full = computed.xToFull.get(compact) ?? compact;
                return (
                  <g transform={`translate(${tick.x},${tick.y})`} opacity={tick.opacity ?? 1}>
                    <title>{full}</title>
                    <line y2="3" stroke="#9ca3af" />
                    <text
                      textAnchor="middle"
                      dominantBaseline="hanging"
                      style={{ fill: '#78716c', fontSize: 10, pointerEvents: 'none' }}
                    >
                      {compact}
                    </text>
                  </g>
                );
              },
            }}
            axisLeft={{
              tickSize: 3,
              tickPadding: 6,
              renderTick: (tick: AxisTick) => {
                const compact = String(tick.value ?? '');
                const full = computed.yToFull.get(compact) ?? compact;
                return (
                  <g transform={`translate(${tick.x},${tick.y})`} opacity={tick.opacity ?? 1}>
                    <title>{full}</title>
                    <text
                      textAnchor="end"
                      dominantBaseline="middle"
                      style={{ fill: '#78716c', fontSize: 10, pointerEvents: 'none' }}
                      x={-6}
                      y={0}
                    >
                      {compact}
                    </text>
                  </g>
                );
              },
            }}
            colors={{ type: 'sequential', scheme: 'blues' }}
            emptyColor="#f5f5f5"
            legends={[]}
            theme={chartTheme as any}
            motionConfig="gentle"
            role="application"
          />
        </div>
      )}
    </section>
  );
}

