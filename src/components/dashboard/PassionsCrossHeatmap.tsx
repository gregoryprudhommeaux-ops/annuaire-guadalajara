import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ResponsiveHeatMap } from '@nivo/heatmap';
import type { Language } from '@/types';
import { getPassionEmoji, getPassionLabel, sanitizePassionIds } from '@/lib/passionConfig';

export type CrossMember = {
  id: string;
  secteur?: string;
  city?: string;
  status?: string;
  positionCategory?: string;
  activityCategory?: string;
  passionIds?: string[];
};

type DimensionKey = 'sector' | 'poste' | 'industrie';
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
  embedded = false,
}: {
  members: CrossMember[];
  lang: Language;
  onPickCell?: (pick: CrossPick) => void;
  /** Quand rendu dans une carte parente (ex. /admin), on évite la “double carte”. */
  embedded?: boolean;
}) {
  const [dimension, setDimension] = useState<DimensionKey>('sector');
  const locale = normalizeLang(lang);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [wrapWidth, setWrapWidth] = useState<number>(0);

  const dimLabel = dimension === 'sector' ? 'Secteur' : dimension === 'poste' ? 'Poste' : 'Industrie';

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries?.[0]?.contentRect?.width ?? 0;
      setWrapWidth(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

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
          : dimension === 'poste'
            ? String(m.positionCategory ?? m.status ?? '').trim()
            : String(m.activityCategory ?? '').trim();
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

  const isNarrow = wrapWidth > 0 ? wrapWidth < 520 : false;
  const rootClassName = embedded
    ? 'w-full min-w-0'
    : 'rounded-xl border border-stone-200 bg-white p-4 shadow-sm';

  return (
    <section ref={wrapRef} className={rootClassName}>
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
          <option value="poste">Poste</option>
          <option value="industrie">Industrie</option>
        </select>
      </div>

      {!computed.hasAny ? (
        <div className="mt-3 rounded-lg border border-stone-200 bg-stone-50 px-3 py-10 text-center text-sm text-stone-600">
          Pas assez de données passions pour afficher la heatmap.
        </div>
      ) : (
        <div className={embedded ? 'mt-3 w-full min-w-0' : 'mt-3 w-full min-w-0'}>
          <div
            className={
              embedded
                ? 'w-full min-w-0 overflow-x-auto overflow-y-visible'
                : 'h-[340px] w-full min-w-0 overflow-x-auto overflow-y-visible'
            }
            style={
              embedded
                ? ({ height: '100%', WebkitOverflowScrolling: 'touch' as any } as any)
                : ({ WebkitOverflowScrolling: 'touch' as any } as any)
            }
          >
            <div className={isNarrow ? 'min-w-[680px] h-full' : 'h-full'}>
              <ResponsiveHeatMap
                data={computed.data as any}
                margin={{ top: 16, right: 12, bottom: 44, left: isNarrow ? 110 : 140 }}
                tooltip={({ cell }: any) => {
                  const xCompact = String(cell?.data?.x ?? '');
                  const yCompact = String(cell?.serieId ?? '');
                  const dimValue = computed.xToFull.get(xCompact) ?? xCompact;
                  const passionLabel = computed.yToFull.get(yCompact) ?? yCompact;
                  const value = cell?.data?.y ?? 0;
                  return (
                    <div
                      style={{
                        transform: 'translateY(14px)',
                        background: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: 12,
                        padding: '8px 10px',
                        boxShadow: '0 10px 28px -18px rgba(15, 23, 42, 0.18), 0 1px 2px rgba(16, 24, 40, 0.06)',
                        maxWidth: 320,
                        pointerEvents: 'none',
                      }}
                    >
                      <div style={{ fontSize: 12, fontWeight: 800, color: '#0f172a' }}>
                        {passionLabel} · {dimValue}: {value}
                      </div>
                    </div>
                  );
                }}
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
          </div>
        </div>
      )}
    </section>
  );
}

