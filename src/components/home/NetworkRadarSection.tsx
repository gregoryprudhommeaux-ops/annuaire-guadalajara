import React, { useMemo } from 'react';
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
import { Users, Target, Factory, Zap } from 'lucide-react';
import type { UserProfile, Language, UrgentPost } from '../../types';
import type { User } from 'firebase/auth';
import type { HomeLandingCopy } from '../../copy/homeLanding';
import AiTranslatedFreeText from '../AiTranslatedFreeText';
import { sanitizeHighlightedNeeds, NEED_OPTION_VALUE_SET } from '../../needOptions';
import { sanitizePassionIds } from '../../lib/passionConfig';
const DONUT_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#F97316', '#6B7280'];

type TFn = (key: string) => string;

type Props = {
  lang: Language;
  t: TFn;
  allProfiles: UserProfile[];
  urgentPosts: UrgentPost[];
  viewerProfile: UserProfile | null;
  user: User | null;
  copy: HomeLandingCopy;
  activityCategoryLabel: (cat: string, lang: Language) => string;
  needOptionLabel: (id: string, lang: Language) => string;
  getPassionEmoji: (id: string) => string;
  getPassionLabel: (id: string, lang: Language) => string;
  onNeedClick: (needId: string) => void;
  onPassionClick: (passionId: string) => void;
  onOpportunityClick: (post: UrgentPost) => void;
  onPostOpportunity: () => void;
  onCreateProfile: () => void;
  /** Utilisateur connecté avec fiche annuaire enregistrée (Firestore `users`). */
  registeredWithProfile: boolean;
  /** Ouvre la connexion, ou l’onboarding profil si déjà connecté sans fiche. */
  onUnlockRadar: () => void;
};

function truncateLabel(s: string, max = 30): string {
  const x = s.trim();
  if (x.length <= max) return x;
  return `${x.slice(0, max - 1)}…`;
}

export default function NetworkRadarSection({
  lang,
  t,
  allProfiles,
  urgentPosts,
  viewerProfile,
  user,
  copy,
  activityCategoryLabel,
  needOptionLabel,
  getPassionEmoji,
  getPassionLabel,
  onNeedClick,
  onPassionClick,
  onOpportunityClick,
  onPostOpportunity,
  onCreateProfile,
  registeredWithProfile,
  onUnlockRadar,
}: Props) {
  const radarLocked = !registeredWithProfile;
  const profilesForStats = useMemo(() => {
    return allProfiles.filter((p) => {
      if (viewerProfile?.role !== 'admin' && p.isValidated === false) return false;
      return true;
    });
  }, [allProfiles, viewerProfile?.role]);

  const activeMembersCount = useMemo(() => {
    return profilesForStats.filter((p) => Date.now() - (p.lastSeen ?? 0) < 2592000000).length;
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
      const c = (p.activityCategory || '').trim();
      if (c) s.add(c);
    });
    return s.size;
  }, [profilesForStats]);

  const opportunitiesCount = urgentPosts.length;

  const sectorPieData = useMemo(() => {
    const map = new Map<string, number>();
    profilesForStats.forEach((p) => {
      const c = (p.activityCategory || '').trim();
      if (!c) return;
      map.set(c, (map.get(c) || 0) + 1);
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
        label: truncateLabel(needOptionLabel(id, lang), 30),
        fullLabel: needOptionLabel(id, lang),
      }));
  }, [profilesForStats, lang, needOptionLabel]);

  const maxNeedCount = needsBarData.reduce((m, d) => Math.max(m, d.count), 0) || 1;

  const passionEntries = useMemo(() => {
    const counts: Record<string, number> = {};
    profilesForStats.forEach((p) => {
      sanitizePassionIds(p.passionIds).forEach((id) => {
        counts[id] = (counts[id] || 0) + 1;
      });
    });
    return (Object.entries(counts) as [string, number][]).sort((a, b) => b[1] - a[1]);
  }, [profilesForStats]);

  const recentOpportunities = urgentPosts.slice(0, 3);

  return (
    <div className="min-w-0 space-y-4 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] p-4 sm:p-5 md:space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold tracking-tight text-[#1F2937] break-words hyphens-auto sm:text-xl">
            <span className="mr-1.5" aria-hidden>
              📡
            </span>
            {t('radarTitle')}
          </h2>
          <p className="mt-1 text-[13px] leading-snug text-[#6B7280] break-words hyphens-auto">
            {t('radarSubtitle')}
          </p>
        </div>
        {!radarLocked && (
          <div className="flex shrink-0 items-center gap-2 self-start sm:self-center">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span className="max-w-[min(100%,12rem)] text-right text-[11px] font-medium leading-snug text-[#6B7280] break-words sm:max-w-none sm:text-left">
              {t('radarLive')}
            </span>
          </div>
        )}
      </div>

      <div className="relative min-h-[240px]">
        <div
          className={
            radarLocked
              ? 'pointer-events-none select-none blur-md saturate-50 transition-[filter]'
              : undefined
          }
          aria-hidden={radarLocked}
        >
      {/* KPI bar */}
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-[#E5E7EB] bg-[#E5E7EB] shadow-sm md:grid-cols-4">
        {(
          [
            { icon: Users, value: activeMembersCount, labelKey: 'kpiMembers' },
            { icon: Target, value: structuredNeedsTotal, labelKey: 'kpiNeeds' },
            { icon: Factory, value: sectorCount, labelKey: 'kpiSectors' },
            { icon: Zap, value: opportunitiesCount, labelKey: 'kpiOpportunities' },
          ] as const
        ).map(({ icon: Icon, value, labelKey }) => (
          <div
            key={labelKey}
            className="flex min-w-0 flex-col items-center justify-center bg-white px-2 py-4 text-center md:px-3 md:py-5"
          >
            <Icon className="h-6 w-6 shrink-0 text-[#6B7280]" strokeWidth={1.75} aria-hidden />
            <p className="mt-2 text-[32px] font-semibold leading-none text-[#1F2937]">{value}</p>
            <p className="mt-1 max-w-full hyphens-auto text-[10px] font-normal uppercase leading-tight tracking-wide text-[#6B7280] break-words sm:text-xs">
              {t(labelKey)}
            </p>
          </div>
        ))}
      </div>

      {/* Charts grid */}
      <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2">
        {/* Donut — Secteurs */}
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-sm sm:p-6">
          <h3 className="mb-4 text-[15px] font-semibold leading-snug text-[#1F2937] break-words">
            {t('chartSectorsTitle')}
          </h3>
          {sectorPieData.length === 0 ? (
            <p className="text-[13px] text-[#6B7280]">{t('chartSectorsEmpty')}</p>
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
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center pr-1 pt-1">
                    <div className="text-center">
                      <p className="text-2xl font-semibold text-[#1F2937]">{sectorTotalMembers}</p>
                      <p className="text-[11px] font-medium uppercase tracking-wide text-[#6B7280]">
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
                      <span className="min-w-0 flex-1 truncate text-[#374151]">
                        {row.name} · {row.value}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              {sectorPieData.length === 1 && (
                <p className="mt-4 text-center text-[12px] text-[#6B7280]">{t('chartSectorsEmpty')}</p>
              )}
            </>
          )}
        </div>

        {/* Bar — Top besoins */}
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-sm sm:p-6">
          <h3 className="mb-4 text-[15px] font-semibold leading-snug text-[#1F2937] break-words">
            {t('chartNeedsTitle')}
          </h3>
          {needsBarData.length === 0 ? (
            <p className="text-[13px] text-[#6B7280]">{t('typedNeedsRadarEmpty')}</p>
          ) : (
            <div
              className="min-w-0 w-full overflow-x-auto"
              style={{ height: Math.min(320, 40 + needsBarData.length * 50) }}
            >
              <div className="h-full min-w-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={needsBarData}
                    margin={{ top: 4, right: 36, left: 4, bottom: 4 }}
                  barCategoryGap={12}
                >
                  <XAxis type="number" hide domain={[0, maxNeedCount]} />
                  <YAxis
                    type="category"
                    dataKey="label"
                    width={108}
                    tick={{ fill: '#374151', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    reversed
                  />
                  <Tooltip
                    formatter={(v: number) => [v, t('chartNeedsTitle')]}
                    labelFormatter={(_, payload) => {
                      const p = payload?.[0]?.payload as { fullLabel?: string };
                      return p?.fullLabel ?? '';
                    }}
                    contentStyle={{
                      borderRadius: 8,
                      border: '1px solid #E5E7EB',
                      fontSize: 13,
                    }}
                  />
                  <Bar
                    dataKey="count"
                    radius={[0, 4, 4, 0]}
                    maxBarSize={26}
                    cursor="pointer"
                    onClick={(data: { payload?: { id?: string } }) => {
                      const id = data?.payload?.id;
                      if (id) onNeedClick(id);
                    }}
                  >
                    {needsBarData.map((_, i) => (
                      <Cell key={i} fill="#3B82F6" fillOpacity={Math.max(0.45, 1 - i * 0.12)} />
                    ))}
                    <LabelList dataKey="count" position="right" fill="#6B7280" fontSize={12} fontWeight={600} />
                  </Bar>
                </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Passions */}
      <div className="rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-sm sm:p-6">
        <h3 className="mb-4 text-[15px] font-semibold leading-snug text-[#1F2937] break-words">
          {t('chartPassionsTitle')}
        </h3>
        {passionEntries.length === 0 ? (
          <p className="text-[13px] text-[#6B7280]">{t('chartPassionsEmpty')}</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {passionEntries.map(([id, count]) => (
              <button
                key={id}
                type="button"
                onClick={() => onPassionClick(id)}
                className="inline-flex max-w-full min-w-0 items-center gap-2 rounded-full border border-transparent bg-[#F3F4F6] px-3 py-1.5 text-left text-[13px] text-[#374151] transition-colors hover:bg-[#E5E7EB]"
              >
                <span aria-hidden>{getPassionEmoji(id)}</span>
                <span className="min-w-0 break-words">{getPassionLabel(id, lang)}</span>
                <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-white px-1 text-[11px] font-semibold text-[#6B7280] ring-1 ring-[#E5E7EB]">
                  {count}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Opportunités récentes */}
      <div className="rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-sm sm:p-6">
        <h3 className="mb-4 text-[15px] font-semibold leading-snug text-[#1F2937] break-words">
          {t('radarRecentOpportunitiesTitle')}
        </h3>
        {recentOpportunities.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-[#E5E7EB] bg-[#FAFAFA] px-4 py-8 text-center">
            <p className="text-[13px] text-[#6B7280]">{t('radarRecentOpportunitiesEmpty')}</p>
            <button
              type="button"
              onClick={user ? onPostOpportunity : onCreateProfile}
              className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
            >
              {copy.opportunitiesPost}
            </button>
            {!user && (
              <span className="text-[11px] text-[#6B7280]">{copy.opportunitiesMembersOnly}</span>
            )}
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {recentOpportunities.map((post) => {
              const canOpen = !!user && !!post.authorId;
              const cardInner = (
                <>
                  <div className="line-clamp-3 break-words text-[13px] font-medium leading-snug text-[#1F2937]">
                    <AiTranslatedFreeText
                      lang={lang}
                      t={t}
                      text={post.text}
                      as="span"
                      omitAiDisclaimer
                      className="font-medium leading-snug"
                    />
                  </div>
                  {user ? (
                    <p className="mt-2 text-[11px] text-[#6B7280]">
                      {post.authorName
                        ? `${post.authorName}${post.authorCompany ? ` · ${post.authorCompany}` : ''}`
                        : '—'}
                    </p>
                  ) : (
                    <p className="mt-2 text-[11px] text-[#6B7280]">{t('opportunityAuthorHiddenGuest')}</p>
                  )}
                  <span className="mt-2 inline-flex w-fit rounded-full bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#6B7280] ring-1 ring-[#E5E7EB]">
                    {activityCategoryLabel(post.sector, lang)}
                  </span>
                </>
              );
              return (
                <li key={post.id}>
                  {canOpen ? (
                    <button
                      type="button"
                      onClick={() => onOpportunityClick(post)}
                      className="flex h-full w-full flex-col rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] p-4 text-left transition-colors hover:border-[#D1D5DB] hover:bg-white"
                    >
                      {cardInner}
                    </button>
                  ) : (
                    <div className="flex h-full w-full cursor-default flex-col rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] p-4 text-left">
                      {cardInner}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
        </div>

        {radarLocked && (
          <div
            className="absolute inset-0 z-10 flex items-start justify-center overflow-y-auto bg-stone-100/40 px-4 py-10 backdrop-blur-[2px] sm:items-center sm:py-12"
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
                className="mt-5 w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 sm:w-auto sm:min-w-[200px]"
              >
                {!user ? t('radarLockedCtaGuest') : t('radarLockedCtaProfile')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
