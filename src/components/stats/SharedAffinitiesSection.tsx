import React, { useEffect, useState } from 'react';
import {
  Heart,
  Map as MapIcon,
  Mountain,
  Music,
  Plane,
  UtensilsCrossed,
  Wine,
} from 'lucide-react';
import type { VitrinePassionRow } from '@/hooks/useVitrineStats';
import { getPassionLabel } from '@/lib/passionConfig';
import { formatAffinityMetrics, sortPassionsByFederation } from '@/lib/sharedAffinitiesUtils';
import {
  StatsBadge,
  StatsInsightCard,
  StatsPrimaryButton,
  StatsSecondaryButton,
  StatsSectionHeader,
  StatsSectionShell,
  statsCardClassName,
} from '@/components/stats/ui';
import type { Language } from '@/types';
import { getStatsVitrineCopy } from '@/i18n/statsVitrine';

function iconForPassionId(id: string): React.ComponentType<{ className?: string }> {
  const low = id.toLowerCase();
  if (low === 'vins') return Wine;
  if (low === 'cuisine' || low === 'patisserie' || low === 'gastronomie') return UtensilsCrossed;
  if (low === 'voyage') return Plane;
  if (low === 'randonnee' || low === 'surf' || low === 'escalade' || low === 'camping') {
    return Mountain;
  }
  if (low === 'musique' || low === 'theatre' || low === 'cinema') return Music;
  if (low === 'petanque' || low === 'golf' || low === 'foot' || low === 'tennis') {
    return MapIcon;
  }
  return Heart;
}

type CardProps = {
  row: VitrinePassionRow;
  rank: number;
  subline: string;
  lang: Language;
  c: ReturnType<typeof getStatsVitrineCopy>['sharedAffinities'];
  index: number;
};

function AffinityCard({ row, rank, subline, lang, c, index }: CardProps) {
  const label = getPassionLabel(row.passionId, lang);
  const { members, sectors } = formatAffinityMetrics(
    row.passionId,
    row.memberCount,
    row.sectorCount,
    lang
  );
  const Icon = iconForPassionId(row.passionId);
  const showBadge0 = rank === 0 && row.memberCount > 0;
  const showBadge1 = rank === 1 && row.memberCount > 0;

  return (
    <li
      className={`shared-aff-row shared-aff-row-anim group ${statsCardClassName} print:break-inside-avoid transition motion-safe:hover:border-slate-300/90`}
      style={{ animationDelay: `${50 + index * 45}ms` }}
    >
      <div className="flex gap-3">
        <div
          className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#e6f5f5]/60 text-[#01696f] motion-safe:group-hover:text-[#0a4f54]"
          aria-hidden
        >
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <p className="text-sm font-extrabold text-slate-900">{label}</p>
            {showBadge0 && <StatsBadge>{c.badge0}</StatsBadge>}
            {showBadge1 && <StatsBadge>{c.badge1}</StatsBadge>}
          </div>
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm text-slate-800">
            <span className="font-semibold tabular-nums">{members}</span>
            <span className="text-slate-300" aria-hidden>
              {c.emDash}
            </span>
            <span className="font-semibold text-slate-800 tabular-nums">{sectors}</span>
          </div>
          <p className="mt-1.5 text-xs leading-relaxed text-slate-500">{subline}</p>
        </div>
      </div>
    </li>
  );
}

function RowSkeleton() {
  return (
    <li className={statsCardClassName} aria-hidden>
      <div className="flex gap-3">
        <div className="h-9 w-9 shrink-0 rounded-lg bg-slate-200 motion-reduce:animate-none animate-pulse" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="h-3.5 w-1/3 rounded bg-slate-200 motion-reduce:animate-none animate-pulse" />
          <div className="h-3 w-1/2 rounded bg-slate-100 motion-reduce:animate-none animate-pulse" />
        </div>
      </div>
    </li>
  );
}

export function SharedAffinitiesSection({
  passions,
  lang,
  loading = false,
  hideFooterCta = false,
}: {
  passions: VitrinePassionRow[];
  lang: Language;
  loading?: boolean;
  hideFooterCta?: boolean;
}) {
  const c = getStatsVitrineCopy(lang).sharedAffinities;
  const [reveal, setReveal] = useState(false);
  useEffect(() => {
    const t = requestAnimationFrame(() => setReveal(true));
    return () => cancelAnimationFrame(t);
  }, []);

  const sublines = c.cardSubLines;
  const sorted = React.useMemo(() => sortPassionsByFederation(passions), [passions]);

  if (!loading && (!passions || passions.length === 0)) return null;

  const maxSectors = passions.length ? Math.max(0, ...passions.map((p) => p.sectorCount)) : 0;
  const top3 = sorted.slice(0, 3);
  const top3Names = top3.map((p) => getPassionLabel(p.passionId, lang)).join(', ');

  return (
    <section
      className={`shared-affinities mt-10 print:break-inside-avoid ${reveal ? 'opacity-100' : 'opacity-0'} transition-opacity duration-500 motion-reduce:opacity-100 motion-reduce:duration-0`}
    >
      <StatsSectionShell>
        <div className="border-b border-slate-100 px-4 py-5 sm:px-6 sm:py-6">
          <StatsSectionHeader eyebrow={c.eyebrow} title={c.title} description={c.lead} />
        </div>

        <div className="grid grid-cols-1 gap-6 p-4 sm:p-6 lg:grid-cols-12">
          <div className="min-w-0 lg:col-span-7">
            {loading ? (
              <ul className="space-y-2" aria-busy="true">
                {Array.from({ length: 4 }, (_, i) => (
                  <RowSkeleton key={i} />
                ))}
              </ul>
            ) : (
              <ul className="space-y-2 sm:space-y-3">
                {sorted.map((p, i) => (
                  <AffinityCard
                    key={p.passionId}
                    row={p}
                    rank={i}
                    subline={sublines[i % sublines.length] ?? sublines[0]!}
                    lang={lang}
                    c={c}
                    index={i}
                  />
                ))}
              </ul>
            )}
          </div>
          <aside className="flex min-h-0 flex-col border-t border-slate-100 pt-5 sm:pt-0 lg:col-span-5 lg:border-l lg:border-t-0 lg:pl-6">
            <StatsInsightCard className="h-full !shadow-none">
              <h3 className="text-sm font-extrabold text-slate-900">{c.whyTitle}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{c.whyBody}</p>
              <ul className="mt-3 space-y-1.5 text-sm text-slate-700">
                <li className="flex gap-2">
                  <span className="mt-0.5 shrink-0 text-[#01696f]" aria-hidden>
                    ·
                  </span>
                  {c.b1}
                </li>
                <li className="flex gap-2">
                  <span className="mt-0.5 shrink-0 text-[#01696f]" aria-hidden>
                    ·
                  </span>
                  {c.b2}
                </li>
                <li className="flex gap-2">
                  <span className="mt-0.5 shrink-0 text-[#01696f]" aria-hidden>
                    ·
                  </span>
                  {c.b3}
                </li>
              </ul>
              <div className="mt-5 rounded-xl border border-white/15 bg-[#01696f] px-4 py-4 shadow-sm sm:px-5 sm:py-5">
                <p className="text-center text-sm font-semibold leading-relaxed text-white text-pretty sm:text-[15px]">
                  {c.eventsHighlight}
                </p>
              </div>
            </StatsInsightCard>
          </aside>
        </div>

        {!loading && passions.length > 0 && (
          <div className="flex flex-col gap-2 border-t border-slate-100 px-4 py-5 sm:flex-row sm:flex-wrap sm:gap-3 sm:px-6 sm:py-6">
            <p className="text-xs font-medium text-slate-600 sm:max-w-[32%] sm:flex-1">
              {c.insightCount(sorted.length)}
            </p>
            {maxSectors > 0 && (
              <p className="text-xs font-medium text-slate-600 sm:max-w-[32%] sm:flex-1">
                {c.insightSectors(maxSectors)}
              </p>
            )}
            {top3Names && (
              <p className="text-xs font-medium text-slate-600 sm:max-w-[32%] sm:flex-1">{c.insightTop(top3Names)}</p>
            )}
          </div>
        )}

        {!loading && !hideFooterCta ? (
          <div className="border-t border-slate-100 px-4 py-5 sm:px-6 sm:py-6">
            <p className="text-sm text-slate-800">{c.ctaLine}</p>
            <div className="mt-4 flex flex-col items-stretch gap-2.5 sm:flex-row sm:justify-start print:flex-row">
              <StatsPrimaryButton to="/inscription" className="w-full sm:w-auto print:w-auto">
                {c.ctaPrimary}
              </StatsPrimaryButton>
              <StatsSecondaryButton to="/network" className="w-full sm:w-auto print:w-auto">
                {c.ctaSecondary}
              </StatsSecondaryButton>
            </div>
          </div>
        ) : null}
      </StatsSectionShell>
    </section>
  );
}
