import React, { useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Eye, Handshake, Layers, Share2 } from 'lucide-react';
import { useVitrineStats } from '@/hooks/useVitrineStats';
import { useFirebaseAuthUser } from '@/hooks/useFirebaseAuthUser';
import { useLanguage } from '@/i18n/LanguageProvider';
import { getStatsVitrineCopy, translateNeedChartRows } from '@/i18n/statsVitrine';
import type { Language } from '@/types';
import { activityCategoryLabel } from '@/constants';
import { StatsHero, type StatsHeroModel } from '@/components/StatsHero';
import { NetworkGrowthSection } from '@/components/stats/NetworkGrowthSection';
import { NetworkEffectSection } from '@/components/stats/NetworkEffectSection';
import { ActiveOpportunitiesSection } from '@/components/stats/ActiveOpportunitiesSection';
import { NeedsBarChart } from '@/components/charts/NeedsBarChart';
import { RecentMembersActivity } from '@/components/stats/RecentMembersActivity';
import { RecentRequestsFeed } from '@/components/stats/RecentRequestsFeed';
import { SegmentedJoinCTA } from '@/components/stats/SegmentedJoinCTA';
import { SharedAffinitiesSection } from '@/components/stats/SharedAffinitiesSection';
import { StatsPrimaryButton, StatsSecondaryButton } from '@/components/stats/ui';
import { chartTheme, getChartColor } from '@/lib/chartTheme';
import { StatsCard, StatsSectionHeader, StatsSectionShell } from '@/components/stats/ui';
import francoLogoUrl from '../../favicon.svg?url';
import './stats-page.css';

export type StatsVitrineVariant = 'app' | 'share';

export type StatsVitrineContentProps = {
  variant: StatsVitrineVariant;
  /** URL complète `/stats/share?lang=…` — affiche le bouton Partager si `variant === 'app'`. */
  sharePageUrl?: string;
};

function formatMonthYear(d: Date, lang: Language) {
  return d.toLocaleDateString(lang === 'es' ? 'es-MX' : lang === 'en' ? 'en-US' : 'fr-FR', {
    month: 'long',
    year: 'numeric',
  });
}

function formatShortDate(d: Date, lang: Language) {
  return d.toLocaleDateString(lang === 'es' ? 'es-MX' : lang === 'en' ? 'en-US' : 'fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function localeNum(lang: Language, n: number) {
  return n.toLocaleString(lang === 'es' ? 'es-MX' : lang === 'en' ? 'en-US' : 'fr-FR');
}

export function StatsVitrineContent({ variant, sharePageUrl }: StatsVitrineContentProps) {
  const { lang } = useLanguage();
  const firebaseUser = useFirebaseAuthUser();
  const vitrine = useVitrineStats();
  const tc = getStatsVitrineCopy(lang);
  const shareStripMidCtas = variant === 'share';

  const now = useMemo(() => new Date(), []);
  const monthTitle = useMemo(() => formatMonthYear(now, lang), [now, lang]);
  const dataDateLabel = useMemo(() => formatShortDate(now, lang), [now, lang]);

  const needsTranslated = useMemo(
    () => translateNeedChartRows(lang, vitrine.needs),
    [lang, vitrine.needs]
  );

  const totalNeedSignals = useMemo(
    () => needsTranslated.reduce((acc, row) => acc + row.count, 0),
    [needsTranslated]
  );

  const heroModel: StatsHeroModel = useMemo(
    () => ({
      totalMembers: vitrine.totalMembers,
      newMembersLast30d: vitrine.newMembersLast30d,
      prevNewMembers30d: vitrine.prevNewMembers30d,
      calendarNewThisMonth: vitrine.calendarNewThisMonth,
      calendarNewPrevMonth: vitrine.calendarNewPrevMonth,
      monthOverMonthGrowthPct: vitrine.monthOverMonthGrowthPct,
      potentialConnections: vitrine.potentialConnections,
      distinctSectorsCount: vitrine.distinctSectorsCount,
      totalNeedSignals,
    }),
    [vitrine, totalNeedSignals]
  );

  const topSectorsChart = useMemo(
    () =>
      vitrine.topSectors.map((s) => ({
        name: activityCategoryLabel(s.name, lang),
        value: s.value,
      })),
    [vitrine.topSectors, lang]
  );
  const sectorColor = (idx: number) => getChartColor(idx);

  const headTitle =
    variant === 'share'
      ? `${tc.sharePage.documentTitle} · ${monthTitle}`
      : `${tc.metaTitleSuffix} · ${monthTitle}`;
  const metaDescription =
    variant === 'share' ? tc.sharePage.metaDescription : tc.metaDescription;

  const shareOgUrl = useMemo(() => {
    if (variant !== 'share' || typeof window === 'undefined') return '';
    try {
      return new URL(window.location.href).toString();
    } catch {
      return '';
    }
  }, [variant, lang]);

  const shareOgImage = useMemo(() => {
    if (variant !== 'share' || typeof window === 'undefined') return '';
    return `${window.location.origin}/apple-touch-icon.png`;
  }, [variant]);

  const profileManageHref = firebaseUser ? '/profile/edit' : '/';

  if (vitrine.loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10 text-sm text-slate-600">
        {tc.loading}
      </div>
    );
  }
  if (vitrine.error) {
    return <div className="mx-auto max-w-5xl px-4 py-10 text-sm text-red-700">{vitrine.error}</div>;
  }

  return (
    <div className={shareStripMidCtas ? 'relative min-w-0' : 'relative min-w-0 bg-[#f4f6f7]'}>
      <Helmet>
        <title>{headTitle}</title>
        <meta name="description" content={metaDescription} />
        {shareStripMidCtas ? (
          <>
            <meta property="og:title" content={headTitle} />
            <meta property="og:description" content={metaDescription} />
            <meta property="og:type" content="website" />
            {shareOgUrl ? <meta property="og:url" content={shareOgUrl} /> : null}
            {shareOgImage ? <meta property="og:image" content={shareOgImage} /> : null}
            <meta name="twitter:card" content="summary_large_image" />
          </>
        ) : null}
      </Helmet>

      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="stats-ds stats-print-root overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
          {variant === 'app' ? (
            <header className="border-b border-slate-200 pb-4 mb-2">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#01696f]">
                    {tc.headerBrand}
                  </p>
                  <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                    {tc.headerTitle}
                  </h1>
                  <p className="mt-2 max-w-3xl text-slate-600 sm:text-[15px] leading-relaxed">
                    {tc.headerLeadPrefix} {monthTitle}
                  </p>
                  <p className="mt-2 max-w-3xl text-slate-600 sm:text-[15px] leading-relaxed">
                    {tc.headerBridge}
                  </p>
                </div>
                {sharePageUrl ? (
                  <a
                    href={sharePageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={tc.sharePage.shareLinkAria}
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-[#01696f] shadow-sm transition motion-safe:hover:border-slate-300 motion-safe:hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#01696f]"
                  >
                    <Share2 className="h-4 w-4 shrink-0" aria-hidden />
                    {tc.sharePage.shareLinkLabel}
                  </a>
                ) : null}
              </div>
            </header>
          ) : (
            <header className="border-b border-slate-200 pb-4 mb-2">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#01696f]">
                {tc.headerBrand}
              </p>
              <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                {tc.sharePage.documentTitle}
              </h1>
              <p className="mt-2 max-w-3xl text-sm text-slate-600 sm:text-[15px] leading-relaxed">
                {tc.headerLeadPrefix} {monthTitle}
              </p>
              <p className="mt-2 max-w-3xl text-slate-600 sm:text-[15px] leading-relaxed">
                {tc.headerBridge}
              </p>
            </header>
          )}

          <StatsHero lang={lang} model={heroModel} />

          <NetworkGrowthSection
            growthCumulative={vitrine.growthCumulative}
            totalMembers={vitrine.totalMembers}
            newMembersLast30d={vitrine.newMembersLast30d}
            lang={lang}
            hideFooterCta={shareStripMidCtas}
          />

          <NetworkEffectSection
            lang={lang}
            totalMembers={vitrine.totalMembers}
            potentialConnections={vitrine.potentialConnections}
          />

          <SharedAffinitiesSection
            passions={vitrine.topPassions}
            lang={lang}
            hideFooterCta={shareStripMidCtas}
          />

          <section className="mt-10 print:break-inside-avoid">
            <StatsSectionShell>
              <div className="border-b border-slate-100 px-4 py-5 sm:px-6 sm:py-6">
                <StatsSectionHeader
                  eyebrow={tc.sectorsEyebrow}
                  title={tc.sectorsTitle(vitrine.distinctSectorsCount)}
                  description={tc.sectorsDescription}
                />
              </div>
              <div className="h-72 w-full min-w-0 max-w-full px-2 pb-4 pt-2 sm:px-4 sm:pb-5">
                <ResponsiveContainer>
                  <BarChart
                    data={topSectorsChart}
                    layout="vertical"
                    margin={{ top: 4, right: 16, bottom: 4, left: 6 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      horizontal={false}
                      stroke={chartTheme.base.axis}
                    />
                    <XAxis
                      type="number"
                      allowDecimals={false}
                      tick={{ fontSize: 11, fill: chartTheme.base.labelMuted }}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={140}
                      tick={{ fontSize: 11, fill: chartTheme.base.label }}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 8,
                        border: `1px solid ${chartTheme.base.axis}`,
                        fontSize: 12,
                        backgroundColor: chartTheme.base.tooltipBg,
                        color: chartTheme.base.tooltipText,
                      }}
                      labelStyle={{ color: chartTheme.base.tooltipText, fontWeight: 700 }}
                    />
                    <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={16}>
                      {topSectorsChart.map((_, idx) => (
                        <Cell key={`${idx}`} fill={sectorColor(idx)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </StatsSectionShell>
          </section>

          <section className="mt-10 print:break-inside-avoid">
            <StatsSectionHeader
              eyebrow={tc.indicatorsEyebrow}
              title={tc.indicatorsTitle}
              description={tc.indicatorsDescription}
            />
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <SupportMetricCard
                icon={<Layers className="h-5 w-5 shrink-0 text-[#01696f]" aria-hidden />}
                label={tc.sectorCardLabel}
                lang={lang}
                primary={
                  vitrine.distinctSectorsCount > 0
                    ? { kind: 'number', value: vitrine.distinctSectorsCount }
                    : { kind: 'soft', title: tc.sectorPendingTitle, subtitle: tc.sectorPendingSub }
                }
                footnote={tc.sectorFootnoteUniqueLabels}
              />
              <SupportMetricCard
                icon={<Eye className="h-5 w-5 shrink-0 text-[#01696f]" aria-hidden />}
                label={tc.viewsLabel}
                lang={lang}
                primary={{
                  kind: 'number',
                  value: vitrine.profileViewsCumul > 0 ? vitrine.profileViewsCumul : 0,
                }}
                footnote={
                  vitrine.profileViewsCumul > 0 ? tc.viewsFootnotePublished : tc.viewsFootnotePending
                }
              />
              <SupportMetricCard
                icon={<Handshake className="h-5 w-5 shrink-0 text-[#01696f]" aria-hidden />}
                label={tc.contactsLabel}
                lang={lang}
                primary={{
                  kind: 'number',
                  value: vitrine.contactClicksCumul > 0 ? vitrine.contactClicksCumul : 0,
                }}
                footnote={
                  vitrine.contactClicksCumul > 0 ? tc.contactsFootnotePublished : tc.contactsFootnotePending
                }
              />
            </div>
          </section>

          <RecentMembersActivity lang={lang} />

          <div className="mt-10 print:break-inside-avoid">
            <NeedsBarChart
              data={needsTranslated}
              title={tc.needsChartTitle}
              subtitle={tc.needsChartSubtitle}
              tooltipMembersLabel={tc.needsChartMembersTooltip}
              emptyMessage={tc.needsChartEmpty}
              compact
              limit={8}
            />
          </div>

          <ActiveOpportunitiesSection
            needs={needsTranslated}
            lang={lang}
            hideBottomCta={shareStripMidCtas}
          />

          <RecentRequestsFeed lang={lang} hideBottomCta={shareStripMidCtas} />

          {variant === 'app' ? (
            <SegmentedJoinCTA lang={lang} />
          ) : (
            <section className="mt-10 border-t border-slate-200 pt-8 print:break-inside-avoid">
              <p className="max-w-3xl text-sm leading-relaxed text-slate-700 sm:text-[15px]">
                {tc.sharePage.closingBenefits}
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <StatsPrimaryButton to="/inscription" className="w-full justify-center sm:w-auto">
                  {tc.sharePage.ctaCreateProfile}
                </StatsPrimaryButton>
                <StatsSecondaryButton to={profileManageHref} className="w-full justify-center sm:w-auto">
                  {tc.sharePage.ctaUpdateProfile}
                </StatsSecondaryButton>
              </div>
            </section>
          )}

          <div className="mt-10 flex flex-col items-start gap-4 border-t border-slate-200 pt-8 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <img src={francoLogoUrl} alt="FrancoNetwork" className="h-9 w-9" width={36} height={36} />
              <div>
                <p className="text-sm font-semibold text-slate-900">FrancoNetwork</p>
                <p className="text-sm text-slate-600">{tc.footerTagline}</p>
                <p className="text-xs text-slate-500">
                  franconetwork.app · {tc.footerSignupHint}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {tc.footerDataAsOf} {dataDateLabel}
                </p>
              </div>
            </div>
          </div>

          <p className="mt-3 text-center text-[11px] text-slate-400">
            {vitrine.source === 'firestore' ? tc.footerSourceFirestore : tc.footerSourceComputed}
          </p>
        </div>
      </div>
    </div>
  );
}

function SupportMetricCard({
  icon,
  label,
  lang,
  primary,
  footnote,
}: {
  icon: React.ReactNode;
  label: string;
  lang: Language;
  primary: { kind: 'number'; value: number } | { kind: 'soft'; title: string; subtitle: string };
  footnote: string;
}) {
  return (
    <StatsCard className="flex flex-col p-4 sm:p-5">
      <div className="flex items-start justify-between gap-2">
        {icon}
        {primary.kind === 'number' ? (
          <p className="text-2xl font-extrabold tabular-nums text-slate-900">{localeNum(lang, primary.value)}</p>
        ) : (
          <div className="max-w-[12rem] text-right">
            <p className="text-sm font-semibold leading-snug text-slate-800">{primary.title}</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">{primary.subtitle}</p>
          </div>
        )}
      </div>
      <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">{footnote}</p>
    </StatsCard>
  );
}
