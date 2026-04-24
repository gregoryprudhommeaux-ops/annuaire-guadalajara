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
} from 'recharts';
import { Users, Target, Factory, Maximize2, MessageCircle } from 'lucide-react';
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
import { NeedsBarChart } from '../charts/NeedsBarChart';
const DONUT_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#F97316', '#6B7280'];
const NEED_BAR_COLORS = ['#1d4ed8', '#4338ca', '#0f766e', '#b45309', '#be123c', '#334155', '#7c3aed', '#0284c7'];

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
  /** Quand le radar n’est pas verrouillé (membre avec fiche) : ex. aller sur /profile/edit pour « Compléter mon profil ». */
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

  const activeMembers30d = useMemo(() => {
    const since = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const withLastSeen = profilesForStats.filter((p) => typeof (p as any)?.lastSeen === 'number');
    if (withLastSeen.length === 0) return totalMembersCount;
    return withLastSeen.filter((p) => Number((p as any).lastSeen) >= since).length;
  }, [profilesForStats, totalMembersCount]);

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

  const shareNeedsText = useMemo(() => {
    const top = needsBarData.slice(0, 6);
    const list = top.map((d) => `- ${d.label} (${d.count})`).join('\n');
    const origin =
      typeof window !== 'undefined' && window.location?.origin ? window.location.origin : '';
    const url = origin || 'https://';
    return (
      `${t('radarShareNeedsIntro')}\n` +
      (list ? `${list}\n\n` : '\n') +
      `${t('radarShareNeedsOutro')}\n` +
      url
    );
  }, [needsBarData, t]);

  const onShareNeedsWhatsApp = useCallback(() => {
    const text = shareNeedsText.trim();
    const href = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(href, '_blank', 'noopener,noreferrer');
  }, [shareNeedsText]);

  const needsData = useMemo(() => {
    return needsBarData.map((d) => ({
      key: d.id,
      label: d.label,
      count: d.count,
    }));
  }, [needsBarData]);

  const topNeedsForAction = useMemo(() => needsBarData.slice(0, 3), [needsBarData]);

  const actionHintForNeedRank = useCallback(
    (rank: number): string => {
      if (rank === 0) return t('radarActionHint0');
      if (rank === 1) return t('radarActionHint1');
      return t('radarActionHint2');
    },
    [t]
  );

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
    (props: { x: number | string; y: number | string; payload?: { value?: string } }) => {
      const { x, y, payload } = props;
      const full = String(payload?.value ?? '');
      const lines = splitNeedLabelLines(full, 4, 34);
      const lh = 10;
      const fs = 10;
      const startDy = lines.length <= 1 ? 0 : -((lines.length - 1) * lh) / 2;
      const xNum = typeof x === 'number' ? x : Number(x);
      const yNum = typeof y === 'number' ? y : Number(y);
      return (
        <g transform={`translate(${xNum},${yNum})`}>
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
    (props: { x: number | string; y: number | string; payload?: { value?: string } }) => {
      const { x, y, payload } = props;
      const full = String(payload?.value ?? '');
      const lines = splitNeedLabelLines(full, 5, 44);
      const lh = 13;
      const fs = 12;
      const startDy = lines.length <= 1 ? 0 : -((lines.length - 1) * lh) / 2;
      const xNum = typeof x === 'number' ? x : Number(x);
      const yNum = typeof y === 'number' ? y : Number(y);
      return (
        <g transform={`translate(${xNum},${yNum})`}>
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

  const expandChartLabel = t('chartExpandLarge');

  const kpiStats = useMemo(
    () =>
      [
        {
          label: t('radarKpiActiveMembers'),
          value: activeMembers30d,
          detail: t('radarKpiActiveMembersDetail'),
        },
        {
          label: t('radarKpiNeedsExpressed'),
          value: structuredNeedsTotal,
          detail: t('radarKpiNeedsDetail'),
        },
        {
          label: t('radarKpiSectorsRepresented'),
          value: sectorCount,
          detail: t('radarKpiSectorsDetail'),
        },
        {
          label: t('radarKpiNewThisWeek'),
          value: newMembersLast7d,
          detail: t('radarKpiNewDetail'),
        },
      ] as const,
    [
      t,
      activeMembers30d,
      structuredNeedsTotal,
      sectorCount,
      newMembersLast7d,
    ]
  );

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 md:px-6 lg:px-8">
      <div className="space-y-6 md:space-y-8">
        {/* Hero */}
        <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-teal-50/40 p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            {!radarLocked ? (
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                {t('radarLive')}
              </div>
            ) : null}

            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              {t('radarPageHeroTitle')}
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">{t('radarPageHeroLead')}</p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => document.getElementById('radar-opportunities')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-800"
            >
              {t('radarCtaHighPotential')}
            </button>
            <button
              type="button"
              onClick={() => (radarLocked ? onUnlockRadar() : onCreateProfile())}
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              {t('radarCtaCompleteProfileShort')}
            </button>
          </div>
        </div>
        </section>

        <div className="relative">
          <div
            className={
              radarLocked
                ? 'pointer-events-none select-none blur-lg saturate-50 transition-[filter]'
                : undefined
            }
            aria-hidden={radarLocked}
          >
            {/* KPI */}
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {kpiStats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                <div className="mt-3 flex items-end gap-2">
                  <span className="text-3xl font-semibold tracking-tight text-slate-900">
                    {stat.value}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-500">{stat.detail}</p>
              </div>
            ))}
            </section>

            {/* Main zone — opportunités (pleine largeur) */}
            <section id="radar-opportunities" className="scroll-mt-6">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold tracking-tight text-slate-900">
                      {t('radarOpportunitiesHeading')}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{t('radarOpportunitiesSub')}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveRadarChart('needs')}
                    className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                    title={expandChartLabel}
                  >
                    {t('radarSeeAll')}
                  </button>
                </div>

                <NeedsBarChart data={needsData} compact={false} />
              </div>
            </section>

            {/* Actions rapides + tendances secteurs : 50 / 50, même hauteur */}
            <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="flex min-h-0">
                <div className="flex w-full flex-1 flex-col rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
                  <h3 className="text-base font-semibold text-slate-900">{t('radarWhereToActTitle')}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{t('radarWhereToActLead')}</p>

                  <div className="mt-5 flex flex-1 flex-col space-y-3">
                    {topNeedsForAction.length === 0 ? (
                      <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <p className="text-sm text-slate-600">—</p>
                      </div>
                    ) : (
                      topNeedsForAction.map((row, idx) => (
                        <div key={row.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-slate-900">{row.label}</p>
                              <p className="mt-1 text-sm text-slate-500">{actionHintForNeedRank(idx)}</p>
                            </div>
                            <div className="flex shrink-0 flex-col items-end gap-2">
                              <span className="rounded-full bg-slate-50 px-2 py-0.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
                                {row.count}
                              </span>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => onNeedClick(row.id)}
                                  className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                                >
                                  {t('radarView')}
                                </button>
                                <button
                                  type="button"
                                  onClick={onShareNeedsWhatsApp}
                                  className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800"
                                  title={t('radarShareWhatsAppTitle')}
                                >
                                  {t('radarShare')}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="flex min-h-0">
                <div className="relative flex w-full flex-1 flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <button
                    type="button"
                    onClick={() => setActiveRadarChart('sectors')}
                    className="absolute right-3 top-3 z-10 rounded-md p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 sm:right-4 sm:top-4"
                    aria-label={expandChartLabel}
                    title={expandChartLabel}
                  >
                    <Maximize2 className="h-4 w-4" strokeWidth={2} aria-hidden />
                  </button>
                  <h3 className="mb-1 pr-10 text-base font-semibold leading-snug text-slate-900 break-words">
                    {t('radarSectorsPresenceTitle')}
                  </h3>
                  <p className="mb-4 text-sm leading-6 text-slate-600">{t('radarSectorsPresenceLead')}</p>
                  {sectorPieData.length === 0 ? (
                    <p className="text-sm text-slate-500">{t('chartSectorsEmpty')}</p>
                  ) : (
                    <div className="flex min-h-0 flex-1 flex-col items-stretch gap-6 md:flex-row md:items-center">
                      <div className="relative mx-auto h-[200px] w-[200px] shrink-0 md:mx-0">
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
                                <Cell
                                  key={idx}
                                  fill={DONUT_COLORS[idx % DONUT_COLORS.length]}
                                  stroke="#fff"
                                  strokeWidth={1}
                                />
                              ))}
                            </Pie>
                            <Tooltip
                              formatter={(value: number, _n, item) => {
                                const payload = item?.payload as { name?: string; value?: number };
                                const v = Number(value);
                                const pct = sectorTotalMembers
                                  ? Math.round((v / sectorTotalMembers) * 100)
                                  : 0;
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
                  )}
                </div>
              </div>
            </section>

            {/* Secondary zone */}
            <section>
              {/* PERSONALIZED OPPORTUNITIES (placeholder UI) */}
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
                <h3 className="text-base font-semibold text-slate-900">{t('radarNetworkNeedsYouTitle')}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{t('radarNetworkNeedsYouLead')}</p>
                <div className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-white p-4 text-sm text-slate-600">
                  {t('radarNetworkNeedsYouPlaceholder')}
                </div>
              </div>
            </section>

            {/* Relational zone */}
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-base font-semibold text-slate-900">{t('radarIcebreakerTitle')}</h3>
              {passionEntries.length === 0 ? (
                <p className="mt-2 text-sm text-slate-500">{t('chartPassionsEmpty')}</p>
              ) : (
                <div className="mt-4 flex flex-wrap gap-2">
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
            </section>

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
              <div className="flex items-center gap-2">
                {activeRadarChart === 'needs' && !radarLocked && needsBarData.length > 0 ? (
                  <button
                    type="button"
                    onClick={onShareNeedsWhatsApp}
                    className="inline-flex items-center gap-2 rounded-md border border-stone-200 bg-white px-3 py-1.5 text-sm font-semibold text-stone-700 hover:bg-stone-50"
                    title={t('radarShareWhatsAppTitle')}
                  >
                    <MessageCircle className="h-4 w-4" strokeWidth={2} aria-hidden />
                    {t('radarShare')}
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => setActiveRadarChart(null)}
                  className="rounded-md border border-stone-200 px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-50"
                >
                  {t('footerLegalClose')}
                </button>
              </div>
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
                    />
                    <Tooltip
                      formatter={(v: number) => [v, t('chartNeedsTitle')]}
                      labelFormatter={(_, payload) => {
                        const p = payload?.[0]?.payload as { label?: string };
                        return p?.label ?? '';
                      }}
                      contentStyle={{ borderRadius: 8, border: '1px solid rgb(226 232 240)', fontSize: 12 }}
                    />
                    <Bar dataKey="count" radius={[0, 6, 6, 0]} maxBarSize={28} isAnimationActive={false}>
                      {needsBarData.map((_, i) => (
                        <Cell key={i} fill={NEED_BAR_COLORS[i % NEED_BAR_COLORS.length]} fillOpacity={0.95} />
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
    </main>
  );
}
