import React, { useCallback, useMemo, useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LabelList,
  Legend,
} from 'recharts';
import { Users, Target, Factory, Maximize2 } from 'lucide-react';
import type { UserProfile, Language } from '../../types';
import type { User } from 'firebase/auth';
import type { HomeLandingCopy } from '../../copy/homeLanding';
import AiTranslatedFreeText from '../AiTranslatedFreeText';
import { sanitizeHighlightedNeeds, NEED_OPTION_VALUE_SET } from '../../needOptions';
import { sanitizePassionIds } from '../../lib/passionConfig';
import { cn } from '../../cn';
import { cardPad } from '../../lib/pageLayout';
import { profileDistinctActivityCategories } from '../../lib/companyActivities';
import { formatT } from '../../i18n/formatT';
const DONUT_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#F97316', '#6B7280'];

type TFn = (key: string) => string;

type Props = {
  lang: Language;
  t: TFn;
  allProfiles: UserProfile[];
  viewerProfile: UserProfile | null;
  user: User | null;
  copy: HomeLandingCopy;
  activityCategoryLabel: (cat: string, lang: Language) => string;
  needOptionLabel: (id: string, lang: Language) => string;
  getPassionEmoji: (id: string) => string;
  getPassionLabel: (id: string, lang: Language) => string;
  onNeedClick: (needId: string) => void;
  onPassionClick: (passionId: string) => void;
  onCreateProfile: () => void;
  /** Utilisateur connecté avec fiche annuaire enregistrée (Firestore `users`). */
  registeredWithProfile: boolean;
  /** Ouvre la connexion, ou l’onboarding profil si déjà connecté sans fiche. */
  onUnlockRadar: () => void;
};

/** Découpe les libellés de besoins (souvent « a / b / c ») pour affichage multi-ligne sur l’axe Y. */
function splitNeedLabelLines(s: string, maxLines = 4, maxSegLen = 36): string[] {
  const t = s.trim();
  if (!t) return [''];

  const bySlash = t.split(/\s*\/\s*/).map((p) => p.trim()).filter(Boolean);
  if (bySlash.length >= 2) {
    const lines = bySlash.slice(0, maxLines).map((line) =>
      line.length > maxSegLen ? `${line.slice(0, maxSegLen - 1)}…` : line
    );
    if (bySlash.length > maxLines) {
      const last = lines[maxLines - 1];
      lines[maxLines - 1] = last.endsWith('…')
        ? last
        : `${last.slice(0, Math.max(0, maxSegLen - 2))}…`;
    }
    return lines;
  }

  const words = t.split(/\s+/);
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    if (lines.length >= maxLines) break;
    const next = cur ? `${cur} ${w}` : w;
    if (next.length <= maxSegLen) {
      cur = next;
    } else {
      if (cur) lines.push(cur);
      if (lines.length >= maxLines) break;
      cur = w.length > maxSegLen ? `${w.slice(0, maxSegLen - 1)}…` : w;
    }
  }
  if (lines.length < maxLines && cur) lines.push(cur);
  return lines.slice(0, maxLines);
}

export default function NetworkRadarSection({
  lang,
  t,
  allProfiles,
  viewerProfile,
  user,
  copy,
  activityCategoryLabel,
  needOptionLabel,
  getPassionEmoji,
  getPassionLabel,
  onNeedClick,
  onPassionClick,
  onCreateProfile,
  registeredWithProfile,
  onUnlockRadar,
}: Props) {
  const [activeRadarChart, setActiveRadarChart] = useState<null | 'sectors' | 'needs'>(null);
  const radarLocked = !registeredWithProfile;
  const profilesForStats = useMemo(() => {
    return allProfiles.filter((p) => {
      if (viewerProfile?.role !== 'admin' && p.isValidated === false) return false;
      return true;
    });
  }, [allProfiles, viewerProfile?.role]);

  const totalMembersCount = profilesForStats.length;

  const newMembersLast7d = useMemo(() => {
    const since = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return profilesForStats.filter((p) => {
      const d = (p as any)?.createdAt?.toDate?.() as Date | undefined;
      const ms = d instanceof Date ? d.getTime() : NaN;
      return Number.isFinite(ms) && ms >= since;
    }).length;
  }, [profilesForStats]);

  const structuredNeedsTotal = useMemo(() => {
    let n = 0;
    profilesForStats.forEach((p) => {
      n += sanitizeHighlightedNeeds(p.highlightedNeeds).filter((id) => NEED_OPTION_VALUE_SET.has(id)).length;
    });
    return n;
  }, [profilesForStats]);

  const sectorCount = useMemo(() => {
    const s = new Set<string>();
    profilesForStats.forEach((p) => {
      profileDistinctActivityCategories(p).forEach((c) => s.add(c));
    });
    return s.size;
  }, [profilesForStats]);

  // Opportunités retirées du produit.
  const sectorPieData = useMemo(() => {
    const map = new Map<string, number>();
    profilesForStats.forEach((p) => {
      const cats = profileDistinctActivityCategories(p);
      (cats.length > 0 ? cats : []).forEach((c) => {
        map.set(c, (map.get(c) || 0) + 1);
      });
    });
    return [...map.entries()]
      .map(([name, value]) => ({
        name: activityCategoryLabel(name, lang),
        raw: name,
        value,
      }))
      .sort((a, b) => b.value - a.value);
  }, [profilesForStats, lang, activityCategoryLabel]);

  const sectorTotalMembers = useMemo(
    () => sectorPieData.reduce((acc, d) => acc + d.value, 0),
    [sectorPieData]
  );

  const needsBarData = useMemo(() => {
    const acc: Record<string, number> = {};
    profilesForStats.forEach((p) => {
      (p.highlightedNeeds || []).forEach((id) => {
        if (!NEED_OPTION_VALUE_SET.has(id)) return;
        acc[id] = (acc[id] || 0) + 1;
      });
    });
    return (Object.entries(acc) as [string, number][])
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([id, count]) => ({
        id,
        count,
        label: needOptionLabel(id, lang),
      }));
  }, [profilesForStats, lang, needOptionLabel]);

  const maxNeedCount = needsBarData.reduce((m, d) => Math.max(m, d.count), 0) || 1;

  const needsBarRowHeight = useMemo(() => {
    const lineH = 10;
    const pad = 14;
    let maxLines = 1;
    needsBarData.forEach((d) => {
      maxLines = Math.max(maxLines, splitNeedLabelLines(d.label, 4, 34).length);
    });
    return Math.max(44, maxLines * lineH + pad);
  }, [needsBarData]);

  const renderNeedsYAxisTickSmall = useCallback(
    (props: { x: number; y: number; payload?: { value?: string } }) => {
      const { x, y, payload } = props;
      const full = String(payload?.value ?? '');
      const lines = splitNeedLabelLines(full, 4, 34);
      const lh = 10;
      const fs = 10;
      const startDy = lines.length <= 1 ? 0 : -((lines.length - 1) * lh) / 2;
      return (
        <g transform={`translate(${x},${y})`}>
          <title>{full}</title>
          <text
            textAnchor="end"
            className="fill-slate-700"
            fontSize={fs}
            dominantBaseline="middle"
          >
            {lines.map((line, i) => (
              <tspan key={i} x={0} dy={i === 0 ? startDy : lh}>
                {line}
              </tspan>
            ))}
          </text>
        </g>
      );
    },
    []
  );

  const renderNeedsYAxisTickLarge = useCallback(
    (props: { x: number; y: number; payload?: { value?: string } }) => {
      const { x, y, payload } = props;
      const full = String(payload?.value ?? '');
      const lines = splitNeedLabelLines(full, 5, 44);
      const lh = 13;
      const fs = 12;
      const startDy = lines.length <= 1 ? 0 : -((lines.length - 1) * lh) / 2;
      return (
        <g transform={`translate(${x},${y})`}>
          <title>{full}</title>
          <text
            textAnchor="end"
            className="fill-slate-700"
            fontSize={fs}
            dominantBaseline="middle"
          >
            {lines.map((line, i) => (
              <tspan key={i} x={0} dy={i === 0 ? startDy : lh}>
                {line}
              </tspan>
            ))}
          </text>
        </g>
      );
    },
    []
  );

  const passionEntries = useMemo(() => {
    const counts: Record<string, number> = {};
    profilesForStats.forEach((p) => {
      sanitizePassionIds(p.passionIds).forEach((id) => {
        counts[id] = (counts[id] || 0) + 1;
      });
    });
    return (Object.entries(counts) as [string, number][]).sort((a, b) => b[1] - a[1]);
  }, [profilesForStats]);

  // Opportunités supprimées du produit : KPI reste à 0.

  const expandChartLabel =
    lang === 'en'
      ? 'Open chart in large view'
      : lang === 'es'
        ? 'Ampliar el gráfico'
        : 'Agrandir le graphique';

  return (
    <div className={cn('min-w-0 space-y-4 rounded-xl border border-slate-200 bg-slate-50 md:space-y-4', cardPad)}>
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold tracking-tight text-slate-800 break-words hyphens-auto sm:text-xl">
            <span className="mr-1.5" aria-hidden>
              📡
            </span>
            {t('radarTitle')}
          </h2>
          <p className="mt-1 text-[13px] leading-snug text-slate-500 break-words hyphens-auto">
            {t('radarSubtitle')}
          </p>
        </div>
        {!radarLocked && (
          <div className="flex shrink-0 items-center gap-2 self-start sm:self-center">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span className="max-w-[min(100%,12rem)] text-right text-[11px] font-medium leading-snug text-slate-500 break-words sm:max-w-none sm:text-left">
              {t('radarLive')}
            </span>
          </div>
        )}
      </div>

      <div className="relative min-h-[240px]">
        <div
          className={
            radarLocked
              ? 'pointer-events-none select-none blur-lg saturate-50 transition-[filter]'
              : undefined
          }
          aria-hidden={radarLocked}
        >
      {/* KPI bar */}
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-slate-200 bg-slate-200 shadow-sm md:grid-cols-3">
        {(
          [
            {
              icon: Users,
              value: totalMembersCount,
              labelKey: 'kpiMembers',
              subLabel: formatT(t, 'radarMembersThisWeek', { count: newMembersLast7d }),
            },
            { icon: Target, value: structuredNeedsTotal, labelKey: 'kpiNeeds' },
            { icon: Factory, value: sectorCount, labelKey: 'kpiSectors' },
          ] as const
        ).map(({ icon: Icon, value, labelKey, subLabel }) => (
          <div
            key={labelKey}
            className="flex min-w-0 flex-col items-center justify-center bg-white px-2 py-4 text-center md:px-3 md:py-5"
          >
            <Icon className="h-6 w-6 shrink-0 text-slate-500" strokeWidth={1.75} aria-hidden />
            <p className="mt-2 text-[32px] font-semibold leading-none text-slate-800">{value}</p>
            <p className="mt-1 max-w-full hyphens-auto text-[10px] font-normal uppercase leading-tight tracking-wide text-slate-500 break-words sm:text-xs">
              {t(labelKey)}
            </p>
            {subLabel ? (
              <p className="mt-1 text-[11px] font-medium leading-tight text-slate-400">{subLabel}</p>
            ) : null}
          </div>
        ))}
      </div>

      {/* Charts grid */}
      <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2">
        {/* Donut — Secteurs */}
        <div className={cn('relative rounded-xl border border-slate-200 bg-white shadow-sm', cardPad)}>
          <button
            type="button"
            onClick={() => setActiveRadarChart('sectors')}
            className="absolute right-3 top-3 z-10 rounded-md p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 sm:right-4 sm:top-4"
            aria-label={expandChartLabel}
            title={expandChartLabel}
          >
            <Maximize2 className="h-4 w-4" strokeWidth={2} aria-hidden />
          </button>
          <h3 className="mb-4 pr-10 text-[15px] font-semibold leading-snug text-slate-800 break-words">
            {t('chartSectorsTitle')}
          </h3>
          {sectorPieData.length === 0 ? (
            <p className="text-[13px] text-slate-500">{t('chartSectorsEmpty')}</p>
          ) : (
            <>
              <div className="flex flex-col items-stretch gap-6 md:flex-row md:items-center">
                <div className="relative mx-auto h-[200px] w-[200px] shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={sectorPieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={92}
                        paddingAngle={sectorPieData.length > 1 ? 2 : 0}
                      >
                        {sectorPieData.map((_, idx) => (
                          <Cell key={idx} fill={DONUT_COLORS[idx % DONUT_COLORS.length]} stroke="#fff" strokeWidth={1} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number, _n, item) => {
                          const payload = item?.payload as { name?: string; value?: number };
                          const v = Number(value);
                          const pct = sectorTotalMembers ? Math.round((v / sectorTotalMembers) * 100) : 0;
                          return [`${v} (${pct}%)`, payload?.name ?? ''];
                        }}
                        contentStyle={{ fontSize: 11 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center pr-1 pt-1">
                    <div className="text-center">
                      <p className="text-2xl font-semibold text-slate-800">{sectorTotalMembers}</p>
                      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                        {t('chartCenter')}
                      </p>
                    </div>
                  </div>
                </div>
                <ul className="min-w-0 flex-1 space-y-2 text-[13px]">
                  {sectorPieData.slice(0, 8).map((row, idx) => (
                    <li key={row.raw} className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: DONUT_COLORS[idx % DONUT_COLORS.length] }}
                        aria-hidden
                      />
                      <span className="min-w-0 flex-1 truncate text-slate-700">
                        {row.name} · {row.value}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              {sectorPieData.length === 1 && (
                <p className="mt-4 text-center text-[12px] text-slate-500">{t('chartSectorsEmpty')}</p>
              )}
            </>
          )}
        </div>

        {/* Bar — Top besoins */}
        <div className={cn('relative rounded-xl border border-slate-200 bg-white shadow-sm', cardPad)}>
          <button
            type="button"
            onClick={() => setActiveRadarChart('needs')}
            className="absolute right-3 top-3 z-10 rounded-md p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 sm:right-4 sm:top-4"
            aria-label={expandChartLabel}
            title={expandChartLabel}
          >
            <Maximize2 className="h-4 w-4" strokeWidth={2} aria-hidden />
          </button>
          <h3 className="mb-4 pr-10 text-[15px] font-semibold leading-snug text-slate-800 break-words">
            {t('chartNeedsTitle')}
          </h3>
          {needsBarData.length === 0 ? (
            <p className="text-[13px] text-slate-500">{t('typedNeedsRadarEmpty')}</p>
          ) : (
            <div
              className="min-w-0 w-full overflow-x-auto"
              style={{ height: Math.min(380, 28 + needsBarData.length * needsBarRowHeight) }}
            >
              <div className="h-full w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%" debounce={150}>
                  <BarChart
                    layout="vertical"
                    data={needsBarData}
                    margin={{ top: 6, right: 40, left: 10, bottom: 6 }}
                  barCategoryGap={10}
                >
                  <XAxis type="number" hide domain={[0, maxNeedCount]} />
                  <YAxis
                    type="category"
                    dataKey="label"
                    width={192}
                    tick={renderNeedsYAxisTickSmall}
                    axisLine={false}
                    tickLine={false}
                    reversed
                  />
                  <Tooltip
                    formatter={(v: number) => [v, t('chartNeedsTitle')]}
                    labelFormatter={(_, payload) => {
                      const p = payload?.[0]?.payload as { label?: string };
                      return p?.label ?? '';
                    }}
                    contentStyle={{
                      borderRadius: 8,
                      border: '1px solid rgb(226 232 240)',
                      fontSize: 11,
                    }}
                  />
                  <Bar
                    dataKey="count"
                    radius={[0, 4, 4, 0]}
                    maxBarSize={26}
                    isAnimationActive={false}
                    cursor="pointer"
                    onClick={(data: { payload?: { id?: string } }) => {
                      const id = data?.payload?.id;
                      if (id) onNeedClick(id);
                    }}
                  >
                    {needsBarData.map((_, i) => (
                      <Cell key={i} fill="#3B82F6" fillOpacity={Math.max(0.45, 1 - i * 0.12)} />
                    ))}
                    <LabelList dataKey="count" position="right" fill="#64748b" fontSize={10} fontWeight={600} />
                  </Bar>
                </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Passions */}
      <div className={cn('rounded-xl border border-slate-200 bg-white shadow-sm', cardPad)}>
        <h3 className="mb-4 text-[15px] font-semibold leading-snug text-slate-800 break-words">
          {t('chartPassionsTitle')}
        </h3>
        {passionEntries.length === 0 ? (
          <p className="text-[13px] text-slate-500">{t('chartPassionsEmpty')}</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {passionEntries.map(([id, count]) => (
              <button
                key={id}
                type="button"
                onClick={() => onPassionClick(id)}
                className="inline-flex max-w-full min-w-0 items-center gap-2 rounded-full border border-transparent bg-slate-100 px-3 py-1.5 text-left text-[13px] text-slate-700 transition-colors hover:bg-slate-200"
              >
                <span aria-hidden>{getPassionEmoji(id)}</span>
                <span className="min-w-0 break-words">{getPassionLabel(id, lang)}</span>
                <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-white px-1 text-[11px] font-semibold text-slate-500 ring-1 ring-slate-200">
                  {count}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Opportunités retirées du produit */}
        </div>

        {radarLocked && (
          <div
            className="absolute inset-0 z-10 flex items-start justify-center overflow-y-auto bg-stone-100/55 px-4 py-10 backdrop-blur-md sm:items-center sm:py-12"
            role="dialog"
            aria-modal="true"
            aria-labelledby="radar-locked-title"
          >
            <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white/95 p-6 text-center shadow-lg">
              <p
                id="radar-locked-title"
                className="text-sm font-medium leading-relaxed text-stone-800 sm:text-[15px]"
              >
                {t('radarLockedMessage')}
              </p>
              <button
                type="button"
                onClick={onUnlockRadar}
                className="mt-5 w-full rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-800 sm:w-auto sm:min-w-[200px]"
              >
                {!user ? t('radarLockedCtaGuest') : t('radarLockedCtaProfile')}
              </button>
            </div>
          </div>
        )}
      </div>

      {activeRadarChart && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-stone-900/60 p-4">
          <div className="w-full max-w-5xl rounded-2xl bg-white p-4 shadow-2xl sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-stone-900">
                {activeRadarChart === 'sectors' ? t('chartSectorsTitle') : t('chartNeedsTitle')}
              </h3>
              <button
                type="button"
                onClick={() => setActiveRadarChart(null)}
                className="rounded-md border border-stone-200 px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-50"
              >
                Fermer
              </button>
            </div>
            <div className="h-[65vh] min-h-[420px] w-full">
              {activeRadarChart === 'sectors' ? (
                <div className="flex h-full flex-col gap-4 md:flex-row md:items-center">
                  <div className="h-full min-h-[320px] w-full md:w-1/2">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={sectorPieData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={90}
                          outerRadius={150}
                          paddingAngle={sectorPieData.length > 1 ? 2 : 0}
                          label
                        >
                          {sectorPieData.map((_, idx) => (
                            <Cell key={idx} fill={DONUT_COLORS[idx % DONUT_COLORS.length]} stroke="#fff" strokeWidth={1} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ fontSize: 12 }} />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <ul className="w-full space-y-2 text-sm md:w-1/2">
                    {sectorPieData.map((row, idx) => (
                      <li key={row.raw} className="flex items-center gap-2">
                        <span
                          className="h-3 w-3 shrink-0 rounded-full"
                          style={{ backgroundColor: DONUT_COLORS[idx % DONUT_COLORS.length] }}
                          aria-hidden
                        />
                        <span className="min-w-0 flex-1 truncate text-slate-700">
                          {row.name}
                        </span>
                        <span className="text-xs font-semibold text-slate-500">{row.value}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%" debounce={150}>
                  <BarChart
                    layout="vertical"
                    data={needsBarData}
                    margin={{ top: 8, right: 48, left: 16, bottom: 8 }}
                    barCategoryGap={14}
                  >
                    <XAxis type="number" hide domain={[0, maxNeedCount]} />
                    <YAxis
                      type="category"
                      dataKey="label"
                      width={288}
                      tick={renderNeedsYAxisTickLarge}
                      axisLine={false}
                      tickLine={false}
                      reversed
                    />
                    <Tooltip
                      formatter={(v: number) => [v, t('chartNeedsTitle')]}
                      labelFormatter={(_, payload) => {
                        const p = payload?.[0]?.payload as { label?: string };
                        return p?.label ?? '';
                      }}
                      contentStyle={{ borderRadius: 8, border: '1px solid rgb(226 232 240)', fontSize: 12 }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="count" radius={[0, 6, 6, 0]} maxBarSize={28} isAnimationActive={false}>
                      {needsBarData.map((_, i) => (
                        <Cell key={i} fill="#3B82F6" fillOpacity={Math.max(0.45, 1 - i * 0.12)} />
                      ))}
                      <LabelList dataKey="count" position="right" fill="#64748b" fontSize={12} fontWeight={600} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
