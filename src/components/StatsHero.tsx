import React, { useCallback, useEffect, useRef, useState, type ElementType } from 'react';
import { BarChart2, Globe, TrendingUp, Users } from 'lucide-react';
import type { Language } from '@/types';
import { useCountUp, usePrefersReducedMotion } from '@/hooks/useCountUp';
import { useStatsHeroKpis } from '@/hooks/useStatsHeroKpis';

type HeroCopy = {
  mLabel: string;
  mSubl: string;
  oLabel: string;
  oSubl: string;
  gLabel: string;
  gSubl: string;
  sLabel: string;
  sSubl: string;
};

function copy(lang: Language): HeroCopy {
  if (lang === 'en') {
    return {
      mLabel: 'Members in the network',
      mSubl: 'A community growing every week',
      oLabel: 'Active opportunities',
      oSubl: 'Real opportunities, right now',
      gLabel: 'Growth this month',
      gSubl: "Jalisco's strongest momentum",
      sLabel: 'Sectors represented',
      sSubl: 'From agri-food to tech',
    };
  }
  if (lang === 'es') {
    return {
      mLabel: 'Personas en la red',
      mSubl: 'Una comunidad que crece cada semana',
      oLabel: 'Oportunidades activas',
      oSubl: 'Oportunidades reales, right now',
      gLabel: 'Crecimiento este mes',
      gSubl: 'El dinamismo más fuerte de Jalisco',
      sLabel: 'Sectores representados',
      sSubl: 'Del agro a la tech',
    };
  }
  return {
    mLabel: 'Membres dans le réseau',
    mSubl: 'Une communauté qui grandit chaque semaine',
    oLabel: 'Opportunités actives',
    oSubl: 'Des opportunités concrètes, right now',
    gLabel: 'Croissance ce mois',
    gSubl: 'La dynamique la plus forte de Jalisco',
    sLabel: 'Secteurs représentés',
    sSubl: "De l'agroalimentaire à la tech",
  };
}

function KpiValueSkeleton() {
  return <div className="h-10 w-24 max-w-full animate-pulse rounded-md bg-slate-200/90" aria-hidden />;
}

function KpiCard({
  icon: Icon,
  value,
  label,
  sublabel,
  displaySkeleton,
  isError,
}: {
  icon: ElementType<{ className?: string; strokeWidth?: number; 'aria-hidden'?: boolean }>;
  value: React.ReactNode;
  label: string;
  sublabel: string;
  displaySkeleton: boolean;
  isError: boolean;
}) {
  return (
    <div className="relative rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md md:p-5">
      <div className="absolute right-3 top-3 text-[#01696f] md:right-4 md:top-4" aria-hidden>
        <Icon className="h-6 w-6" strokeWidth={1.75} />
      </div>
      {displaySkeleton ? (
        <div className="pt-1">
          <KpiValueSkeleton />
        </div>
      ) : isError ? (
        <p className="pt-0.5 text-4xl font-bold leading-tight text-rose-500">—</p>
      ) : (
        <div className="pr-8 text-4xl font-bold leading-tight tracking-tight text-[#01696f] [font-variant-numeric:lining-nums] sm:pr-10">
          {value}
        </div>
      )}
      <p className="mt-2 text-sm font-medium text-gray-700">{label}</p>
      <p className="mt-0.5 text-xs text-gray-400">{sublabel}</p>
    </div>
  );
}

export function StatsHero({ lang }: { lang: Language }) {
  const t = copy(lang);
  const hero = useStatsHeroKpis();
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
      { threshold: 0.3, rootMargin: '0px 0px -4% 0px' }
    );
    ob.observe(el);
    return () => ob.disconnect();
  }, []);

  const dataReady = hero.status === 'ready' && hero.data;
  const hasError = hero.status === 'error';
  const showValueSkeleton =
    (hero.status === 'loading' || (Boolean(dataReady) && !inView)) && !hasError;

  useEffect(() => {
    if (!inView || !dataReady) return;
    if (reduceMotion) {
      setRunAnim(true);
      return;
    }
    const id = requestAnimationFrame(() => setRunAnim(true));
    return () => cancelAnimationFrame(id);
  }, [inView, dataReady, reduceMotion]);

  const animEnabled = inView && Boolean(dataReady) && (reduceMotion || runAnim);

  const d = hero.status === 'ready' ? hero.data : null;
  const m = d?.members ?? 0;
  const o = d?.openOpportunities ?? 0;
  const g = d?.monthOverMonthGrowthPct ?? 0;
  const sc = d?.distinctSectors ?? 0;

  const aM = useCountUp(m, { enabled: animEnabled, duration: 1800 });
  const aO = useCountUp(o, { enabled: animEnabled, duration: 1800 });
  const aG = useCountUp(g, { enabled: animEnabled, duration: 1800 });
  const aSc = useCountUp(sc, { enabled: animEnabled, duration: 1800 });

  const fmtGrowth = useCallback((v: number) => {
    const n = Math.round(v);
    if (n > 0) return `+${n}%`;
    if (n < 0) return `${n}%`;
    return '0%';
  }, []);

  return (
    <div ref={rootRef} className="not-prose stats-hero mb-8">
      {hasError && (
        <p className="mb-3 text-center text-sm text-amber-800" role="status">
          {lang === 'en'
            ? 'KPIs could not be fully loaded. Refresh or try again later.'
            : lang === 'es'
              ? 'No se pudieron cargar todos los indicadores.'
              : 'Chargement des indicateurs partiel. Réessayez plus tard.'}
        </p>
      )}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard
          icon={Users}
          displaySkeleton={showValueSkeleton}
          isError={hasError}
          label={t.mLabel}
          sublabel={t.mSubl}
          value={Math.max(0, Math.round(aM))}
        />
        <KpiCard
          icon={TrendingUp}
          displaySkeleton={showValueSkeleton}
          isError={hasError}
          label={t.oLabel}
          sublabel={t.oSubl}
          value={Math.max(0, Math.round(aO))}
        />
        <KpiCard
          icon={BarChart2}
          displaySkeleton={showValueSkeleton}
          isError={hasError}
          label={t.gLabel}
          sublabel={t.gSubl}
          value={fmtGrowth(aG)}
        />
        <KpiCard
          icon={Globe}
          displaySkeleton={showValueSkeleton}
          isError={hasError}
          label={t.sLabel}
          sublabel={t.sSubl}
          value={Math.max(0, Math.round(aSc))}
        />
      </div>
    </div>
  );
}
