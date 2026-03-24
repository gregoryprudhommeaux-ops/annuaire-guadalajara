import React, { useMemo, useState } from 'react';
import { ResponsiveBar } from '@nivo/bar';
import { ResponsiveHeatMap } from '@nivo/heatmap';
import { ResponsiveLine } from '@nivo/line';
import type { Language } from '@/types';
import { pickLang } from '@/lib/uiLocale';
import type { CompanyKind, MemberExtended, MemberNeed } from '@/lib/communityMemberExtended';
import { mockMembersExtended, mockNeeds } from '@/lib/communityMemberExtended';
import {
  computeTopNeeds,
  computeHeatmap,
  computeNeedsTimeseries,
  labelNeed,
  timeseriesWithDayKeys,
} from '@/lib/needsDashboardCompute';

type TFn = (key: string) => string;

export type NeedsDashboardProps = {
  needs?: MemberNeed[];
  members?: MemberExtended[];
  lang?: Language;
  /** Traductions annuaire (`t` du `LanguageProvider`) — pas de `useI18n` séparé. */
  t: TFn;
  className?: string;
};

const chartTheme = {
  text: { fill: '#57534e', fontSize: 11 },
  grid: { line: { stroke: '#e7e5e4' } },
  axis: {
    ticks: { text: { fill: '#78716c', fontSize: 10 } },
    legend: { text: { fill: '#44403c', fontSize: 11 } },
  },
};

const SIZE_OPTIONS: CompanyKind[] = ['startup', 'pme', 'corporate', 'independent'];

type AxisTick = {
  x: number;
  y: number;
  value: string | number;
  opacity?: number;
};

function sizeOptionLabel(kind: CompanyKind, lang: Language): string {
  switch (kind) {
    case 'startup':
      return pickLang('Startup', 'Startup', 'Startup', lang);
    case 'pme':
      return pickLang('PME', 'PyME', 'SME', lang);
    case 'corporate':
      return pickLang('Corporate', 'Corporativo', 'Corporate', lang);
    case 'independent':
      return pickLang('Indépendant', 'Independiente', 'Independent', lang);
    default:
      return kind;
  }
}

function compactLabel(label: string, max = 14): string {
  const text = String(label ?? '').trim();
  if (!text) return '';
  if (text.length <= max) return text;
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length > 1) {
    const strong = words.find((w) => w.length >= 4);
    if (strong) return strong.length <= max ? strong : `${strong.slice(0, max - 1)}…`;
  }
  return `${text.slice(0, max - 1)}…`;
}

export const NeedsDashboard: React.FC<NeedsDashboardProps> = ({
  needs = mockNeeds,
  members = mockMembersExtended,
  lang: langProp,
  t,
  className,
}) => {
  const lang: Language = langProp ?? 'fr';
  const [sectorFilter, setSectorFilter] = useState('');
  const [sizeFilter, setSizeFilter] = useState<CompanyKind | ''>('');

  const filteredNeeds = useMemo(() => {
    let result = needs;
    if (sectorFilter) {
      result = result.filter((n) => n.sector === sectorFilter);
    }
    if (sizeFilter) {
      const memberIds = members.filter((m) => m.companySize === sizeFilter).map((m) => m.id);
      result = result.filter((n) => memberIds.includes(n.memberId));
    }
    return result;
  }, [needs, sectorFilter, sizeFilter, members]);

  const sectors = useMemo(
    () => Array.from(new Set(needs.map((n) => n.sector))).sort(),
    [needs]
  );

  const topNeedsData = useMemo(() => computeTopNeeds(filteredNeeds), [filteredNeeds]);
  const heatmapRaw = useMemo(() => computeHeatmap(filteredNeeds), [filteredNeeds]);
  const timeseries = useMemo(() => {
    const raw = computeNeedsTimeseries(filteredNeeds);
    return timeseriesWithDayKeys(raw);
  }, [filteredNeeds]);

  const hasBar = topNeedsData.some((d) => d.count > 0);
  const hasHeatmap =
    heatmapRaw.length > 0 && heatmapRaw.some((row) => row.data.some((d) => d.value > 0));
  const hasLine = (timeseries[0]?.data?.length ?? 0) > 0;

  const topNeedsBarData = useMemo(
    () =>
      topNeedsData.map((d) => {
        const full = labelNeed(lang, d.need, t);
        return { need: compactLabel(full, 18), needFull: full, count: d.count };
      }),
    [topNeedsData, lang, t]
  );

  const needCompactToFullBar = useMemo(() => {
    const m = new Map<string, string>();
    topNeedsBarData.forEach((r) => m.set(r.need, r.needFull));
    return m;
  }, [topNeedsBarData]);

  const { heatmapNivoData, heatmapXToFull } = useMemo(() => {
    const xToFull = new Map<string, string>();
    const data = heatmapRaw.map((row) => ({
      id: row.sector,
      data: row.data.map((d) => {
        const full = labelNeed(lang, d.need, t);
        const x = compactLabel(full, 14);
        xToFull.set(x, full);
        return { x, y: d.value };
      }),
    }));
    return { heatmapNivoData: data, heatmapXToFull: xToFull };
  }, [heatmapRaw, lang, t]);

  return (
    <div className={`mt-6 flex w-full flex-col gap-4 ${className ?? ''}`}>
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 md:text-2xl">{t('needsTitle')}</h2>
          <p className="mt-1 max-w-xl text-sm text-slate-600">{t('needsSubtitle')}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <select
            value={sectorFilter}
            onChange={(e) => setSectorFilter(e.target.value)}
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-700 md:text-sm"
          >
            <option value="">{t('filterNeedSector')}</option>
            {sectors.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <select
            value={sizeFilter}
            onChange={(e) => setSizeFilter(e.target.value as CompanyKind | '')}
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-700 md:text-sm"
          >
            <option value="">{t('filterNeedSize')}</option>
            {SIZE_OPTIONS.map((k) => (
              <option key={k} value={k}>
                {sizeOptionLabel(k, lang)}
              </option>
            ))}
          </select>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <section className="flex flex-col rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5">
          <h3 className="mb-2.5 text-sm font-semibold text-slate-900 sm:mb-3">{t('cardTopNeeds')}</h3>
          {!hasBar ? (
            <div className="flex h-56 items-center justify-center text-sm text-slate-500 sm:h-64">—</div>
          ) : (
            <div className="h-56 w-full min-w-0 sm:h-64">
              <div className="h-56 sm:hidden">
                <ResponsiveBar
                  theme={{
                    ...chartTheme,
                    axis: {
                      ...chartTheme.axis,
                      ticks: { text: { fill: '#6b7280', fontSize: 9 } },
                    },
                  }}
                  data={topNeedsBarData}
                  keys={['count']}
                  indexBy="need"
                  margin={{ top: 10, right: 12, bottom: 28, left: 90 }}
                  padding={0.35}
                  layout="horizontal"
                  valueScale={{ type: 'linear', min: 0, max: 1 }}
                  colors={{ scheme: 'set2' }}
                  axisTop={null}
                  axisRight={null}
                  axisBottom={{
                    tickSize: 3,
                    tickPadding: 4,
                    tickValues: [0, 1],
                    format: (v) => (Number(v) >= 1 ? '1' : '0'),
                  }}
                  axisLeft={{
                    tickSize: 0,
                    tickPadding: 6,
                    format: (v) => compactLabel(String(v ?? ''), 12),
                  }}
                  gridXValues={[0, 1]}
                  enableLabel={false}
                  motionConfig="gentle"
                  role="application"
                />
              </div>
              <div className="hidden h-full sm:block">
                <ResponsiveBar
                  theme={chartTheme}
                  data={topNeedsBarData}
                  keys={['count']}
                  indexBy="need"
                  margin={{ top: 10, right: 10, bottom: 60, left: 40 }}
                  padding={0.3}
                  layout="vertical"
                  valueScale={{ type: 'linear', min: 0, max: 1 }}
                  colors={{ scheme: 'set2' }}
                  axisTop={null}
                  axisRight={null}
                  axisBottom={{
                    tickSize: 3,
                    tickPadding: 4,
                    tickRotation: 0,
                    renderTick: (tick: AxisTick) => {
                      const compact = String(tick.value ?? '');
                      const full = needCompactToFullBar.get(compact) ?? compact;
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
                    tickPadding: 4,
                    tickValues: [0, 1],
                    format: (v) => (Number(v) >= 1 ? '1' : '0'),
                  }}
                  gridYValues={[0, 1]}
                  enableLabel={false}
                  motionConfig="gentle"
                  role="application"
                />
              </div>
            </div>
          )}
        </section>

        <section className="flex flex-col rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5">
          <h3 className="mb-2.5 text-sm font-semibold text-slate-900 sm:mb-3">{t('cardNeedsHeatmap')}</h3>
          {!hasHeatmap ? (
            <div className="flex h-56 items-center justify-center text-sm text-slate-500 sm:h-64">—</div>
          ) : (
            <div className="h-56 w-full min-w-0 sm:h-64">
              <ResponsiveHeatMap
                data={heatmapNivoData}
                margin={{ top: 20, right: 10, bottom: 40, left: 70 }}
                valueFormat=">-.0f"
                axisTop={null}
                axisRight={null}
                axisBottom={{
                  tickSize: 3,
                  tickPadding: 4,
                  tickRotation: 0,
                  renderTick: (tick: AxisTick) => {
                    const compact = String(tick.value ?? '');
                    const full = heatmapXToFull.get(compact) ?? compact;
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
                  tickPadding: 4,
                }}
                colors={{
                  type: 'sequential',
                  scheme: 'blues',
                }}
                emptyColor="#f5f5f5"
                legends={[]}
                theme={chartTheme}
                motionConfig="gentle"
                role="application"
              />
            </div>
          )}
        </section>

        <section className="flex flex-col rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5">
          <h3 className="mb-2.5 text-sm font-semibold text-slate-900 sm:mb-3">{t('cardNeedsTimeseries')}</h3>
          {!hasLine ? (
            <div className="flex h-56 items-center justify-center text-sm text-slate-500 sm:h-64">—</div>
          ) : (
            <div className="h-56 w-full min-w-0 sm:h-64">
              <ResponsiveLine
                data={timeseries}
                margin={{ top: 20, right: 20, bottom: 40, left: 50 }}
                xScale={{
                  type: 'time',
                  format: '%Y-%m-%d',
                  precision: 'day',
                  useUTC: false,
                }}
                xFormat="time:%Y-%m"
                yScale={{ type: 'linear', min: 0, stacked: false }}
                axisBottom={{
                  format: '%Y-%m',
                  tickValues: 'every 1 month',
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: -40,
                }}
                axisLeft={{
                  tickSize: 5,
                  tickPadding: 5,
                }}
                useMesh
                enablePoints
                pointSize={8}
                pointColor={{ theme: 'background' }}
                pointBorderWidth={2}
                pointBorderColor={{ from: 'serieColor' }}
                enableGridX={false}
                enableGridY
                colors={{ scheme: 'category10' }}
                theme={chartTheme}
                motionConfig="gentle"
                role="application"
              />
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default NeedsDashboard;
