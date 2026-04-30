import React, { useCallback, useEffect, useRef, useState, type ElementType } from 'react';
import { Layers, Network, TrendingUp, Users } from 'lucide-react';
import type { Language } from '@/types';
import { getStatsVitrineCopy } from '@/i18n/statsVitrine';
import { useCountUp, usePrefersReducedMotion } from '@/hooks/useCountUp';
import { statsCardClassName } from '@/components/stats/ui';

/** Données hero dérivées de `useVitrineStats` (une seule lecture Firestore). */
export type StatsHeroModel = {
  totalMembers: number;
  prevNewMembers30d: number;
  newMembersLast30d: number;
  calendarNewThisMonth: number;
  calendarNewPrevMonth: number;
  monthOverMonthGrowthPct: number;
  potentialConnections: number;
  distinctSectorsCount: number;
  totalNeedSignals: number;
};

function KpiValueSkeleton() {
  return <div className="h-10 w-24 max-w-full animate-pulse rounded-md bg-slate-200/90" aria-hidden />;
}

function UiBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex max-w-full items-center rounded-full bg-[#01696f]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#01696f]">
      {children}
    </span>
  );
}

function KpiCard({
  icon: Icon,
  label,
  sublabel,
  displaySkeleton,
  badge,
  children,
}: {
  icon: ElementType<{ className?: string; strokeWidth?: number; 'aria-hidden'?: boolean }>;
  label: string;
  sublabel: string;
  displaySkeleton: boolean;
  badge?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className={`${statsCardClassName} relative transition-shadow motion-safe:hover:shadow-md md:p-5`}>
      <div className="absolute right-3 top-3 flex flex-col items-end gap-1 md:right-4 md:top-4" aria-hidden>
        <Icon className="h-6 w-6 text-[#01696f]" strokeWidth={1.75} />
      </div>
      {badge ? <div className="relative z-[1] mb-2 flex flex-wrap justify-end pr-10">{badge}</div> : null}
      <div className="relative min-h-[3rem] pr-8 sm:pr-10">{displaySkeleton ? <KpiValueSkeleton /> : children}</div>
      <p className="mt-2 text-sm font-medium text-gray-800">{label}</p>
      <p className="mt-0.5 text-xs leading-snug text-gray-500">{sublabel}</p>
    </div>
  );
}

function SoftValue({ text, secondary }: { text: string; secondary?: string }) {
  return (
    <div className="pt-0.5">
      <p className="text-lg font-semibold leading-snug text-slate-700">{text}</p>
      {secondary ? <p className="mt-1 text-xs leading-relaxed text-slate-500">{secondary}</p> : null}
    </div>
  );
}

export function StatsHero({ lang, model }: { lang: Language; model: StatsHeroModel }) {
  const t = getStatsVitrineCopy(lang).hero;
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [inView, setInView] = useState(false);
  const [runAnim, setRunAnim] = useState(false);
  const reduceMotion = usePrefersReducedMotion();

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const ob = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) setInView(true);
      },
      { threshold: 0.25, rootMargin: '0px 0px -4% 0px' }
    );
    ob.observe(el);
    return () => ob.disconnect();
  }, []);

  const dataReady = model.totalMembers >= 0;
  const showValueSkeleton = !inView;

  useEffect(() => {
    if (!inView || !dataReady) return;
    if (reduceMotion) {
      setRunAnim(true);
      return;
    }
    const id = requestAnimationFrame(() => setRunAnim(true));
    return () => cancelAnimationFrame(id);
  }, [inView, dataReady, reduceMotion]);

  const animEnabled = inView && dataReady && (reduceMotion || runAnim);

  const {
    totalMembers,
    prevNewMembers30d,
    newMembersLast30d,
    calendarNewThisMonth,
    calendarNewPrevMonth,
    monthOverMonthGrowthPct,
    potentialConnections,
    distinctSectorsCount,
    totalNeedSignals,
  } = model;

  const aMembers = useCountUp(totalMembers, { enabled: animEnabled, duration: 1600 });
  const aPot = useCountUp(Math.round(potentialConnections), { enabled: animEnabled, duration: 1800 });
  const aSectors = useCountUp(distinctSectorsCount, { enabled: animEnabled, duration: 1600 });

  const formatMoMPct = useCallback((pct: number) => {
    const n = Math.round(pct);
    if (n > 0) return `+${n}%`;
    if (n < 0) return `${n}%`;
    return '0%';
  }, []);

  const strongRollingGrowth = prevNewMembers30d > 0 && newMembersLast30d > prevNewMembers30d * 1.05;
  const strongMoM =
    monthOverMonthGrowthPct >= 12 ||
    (calendarNewPrevMonth > 0 && calendarNewThisMonth > calendarNewPrevMonth * 1.15);

  const growthIsPending = calendarNewThisMonth === 0 && calendarNewPrevMonth === 0;
  const growthIsStableEqual =
    !growthIsPending &&
    monthOverMonthGrowthPct === 0 &&
    calendarNewThisMonth > 0 &&
    calendarNewPrevMonth > 0 &&
    calendarNewThisMonth === calendarNewPrevMonth;

  const showBigPotential = totalMembers > 1 && potentialConnections > 0;
  const showSectors = distinctSectorsCount > 0;

  const memberBadge =
    totalNeedSignals >= 3 ? (
      <UiBadge>{t.badgeInDemand}</UiBadge>
    ) : strongRollingGrowth ? (
      <UiBadge>{t.badgeGrowing}</UiBadge>
    ) : null;

  const growthBadge =
    strongMoM && !growthIsPending ? (
      <UiBadge>{t.badgeStrongMomentum}</UiBadge>
    ) : null;

  const loc = lang === 'es' ? 'es-MX' : lang === 'en' ? 'en-US' : 'fr-FR';

  return (
    <div ref={rootRef} className="not-prose stats-hero mb-8">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard
          icon={Users}
          displaySkeleton={showValueSkeleton}
          label={t.membersLabel}
          sublabel={t.membersSub}
          badge={memberBadge}
        >
          {totalMembers === 0 ? (
            <SoftValue text={t.membersZero} secondary={t.badgeSoon} />
          ) : (
            <div className="pr-8 text-4xl font-bold leading-tight tracking-tight text-[#01696f] [font-variant-numeric:lining-nums] sm:pr-10">
              {Math.max(0, Math.round(aMembers)).toLocaleString(loc)}
            </div>
          )}
        </KpiCard>

        <KpiCard
          icon={Network}
          displaySkeleton={showValueSkeleton}
          label={t.connectionsLabel}
          sublabel={t.connectionsSub}
        >
          {showBigPotential ? (
            <div className="pr-8 text-4xl font-bold leading-tight tracking-tight text-[#01696f] [font-variant-numeric:lining-nums] sm:pr-10">
              {Math.max(0, Math.round(aPot)).toLocaleString(loc)}
            </div>
          ) : (
            <SoftValue text={t.badgeSoon} />
          )}
        </KpiCard>

        <KpiCard
          icon={TrendingUp}
          displaySkeleton={showValueSkeleton}
          label={t.growthLabel}
          sublabel={t.growthSub}
          badge={growthBadge}
        >
          {growthIsPending ? (
            <SoftValue text={t.growthPending} secondary={t.badgeSoon} />
          ) : growthIsStableEqual ? (
            <SoftValue text={t.growthStable} />
          ) : (
            <div className="pr-8 text-4xl font-bold leading-tight tracking-tight text-[#01696f] [font-variant-numeric:lining-nums] sm:pr-10">
              {formatMoMPct(monthOverMonthGrowthPct)}
            </div>
          )}
        </KpiCard>

        <KpiCard
          icon={Layers}
          displaySkeleton={showValueSkeleton}
          label={t.sectorsLabel}
          sublabel={t.sectorsSub}
        >
          {showSectors ? (
            <div className="pr-8 text-4xl font-bold leading-tight tracking-tight text-[#01696f] [font-variant-numeric:lining-nums] sm:pr-10">
              {Math.max(0, Math.round(aSectors)).toLocaleString(loc)}
            </div>
          ) : (
            <SoftValue text={t.badgeSoon} secondary={t.sectorsSoft} />
          )}
        </KpiCard>
      </div>
    </div>
  );
}
