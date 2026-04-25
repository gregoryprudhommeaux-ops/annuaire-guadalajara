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

type Copy = {
  eyebrow: string;
  title: string;
  lead: string;
  whyTitle: string;
  whyBody: string;
  b1: string;
  b2: string;
  b3: string;
  ctaLine: string;
  ctaPrimary: string;
  ctaSecondary: string;
  badge0: string;
  badge1: string;
  insightCount: (n: number) => string;
  insightSectors: (n: number) => string;
  insightTop: (names: string) => string;
  emDash: string;
};

const SUB: Record<Language, [string, string, string, string]> = {
  fr: [
    'Crée des points d’entrée naturels entre secteurs',
    'Favorise les échanges informels entre profils variés',
    'Un terrain commun fréquent dans les rencontres du réseau',
    'Rapproche des profils internationaux et mobiles',
  ],
  en: [
    'Creates natural entry points across sectors',
    'Supports informal exchanges between varied profiles',
    'A frequent common ground in network meetups',
    'Brings together international, mobile profiles',
  ],
  es: [
    'Crea puntos de entrada naturales entre sectores',
    'Favorece el intercambio informal entre perfiles variados',
    'Un terreno común frecuente en los encuentros de la red',
    'Acerca perfiles internacionales y móviles',
  ],
};

function tcopy(lang: Language): Copy {
  if (lang === 'en') {
    return {
      eyebrow: 'Network affinities',
      title: 'Connections also grow outside of meetings',
      lead: 'Shared interests that bring people together across different sectors.',
      whyTitle: 'What these affinities reveal',
      whyBody:
        'The network is not only about business cards. These shared interests create natural entry points between leaders, experts, and entrepreneurs from different fields.',
      b1: 'More natural conversations',
      b2: 'Bridges between sectors',
      b3: 'Trust that builds faster',
      ctaLine: 'The strongest connections often start with common ground.',
      ctaPrimary: 'Join the network',
      ctaSecondary: 'Explore the community',
      badge0: 'Highly unifying',
      badge1: 'Cross-cutting affinity',
      insightCount: (n) => `${n} affinities already visible in the community`,
      insightSectors: (n) => `Up to ${n} sectors around a single interest`,
      insightTop: (names) => `Most unifying interests: ${names}`,
      emDash: '—',
    };
  }
  if (lang === 'es') {
    return {
      eyebrow: 'Afinidades de la red',
      title: 'Las conexiones también nacen fuera de las reuniones',
      lead: 'Intereses comunes que acercan a perfiles de distintos sectores.',
      whyTitle: 'Qué revelan estas afinidades',
      whyBody:
        'La red no se basa solo en las tarjetas. Estos intereses compartidos crean puntos de encuentro naturales entre directivos, expertos y emprendedores de distintos ámbitos.',
      b1: 'Conversaciones más naturales',
      b2: 'Puentes entre sectores',
      b3: 'Una confianza que se construye más rápido',
      ctaLine: 'Las mejores conexiones a menudo empiezan con un terreno común.',
      ctaPrimary: 'Unirse a la red',
      ctaSecondary: 'Descubrir la comunidad',
      badge0: 'Muy unificadora',
      badge1: 'Afinidad transversal',
      insightCount: (n) => `${n} afinidades ya visibles en la comunidad`,
      insightSectors: (n) => `Hasta ${n} sectores alrededor de un mismo interés`,
      insightTop: (names) => `Intereses que más unen: ${names}`,
      emDash: '—',
    };
  }
  return {
    eyebrow: 'Affinités du réseau',
    title: 'Les connexions se créent aussi en dehors des rendez-vous',
    lead: 'Des intérêts communs qui rapprochent des profils issus de secteurs différents.',
    whyTitle: 'Ce que ces affinités révèlent',
    whyBody:
      'Le réseau ne repose pas uniquement sur des cartes de visite. Ces centres d’intérêt communs créent des points d’entrée naturels entre dirigeants, experts et entrepreneurs de secteurs différents.',
    b1: 'Des conversations plus naturelles',
    b2: 'Des passerelles entre secteurs',
    b3: 'Une confiance qui se crée plus vite',
    ctaLine: 'Les meilleures connexions commencent souvent par un terrain commun.',
    ctaPrimary: 'Rejoindre le réseau',
    ctaSecondary: 'Découvrir la communauté',
    badge0: 'Très fédératrice',
    badge1: 'Affinité transversale',
    insightCount: (n) => `${n} affinités déjà visibles dans la communauté`,
    insightSectors: (n) => `Jusqu’à ${n} secteurs réunis autour d’un même intérêt`,
    insightTop: (names) => `Les passions les plus fédératrices : ${names}`,
    emDash: '—',
  };
}

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
  c: Copy;
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
}: {
  passions: VitrinePassionRow[];
  lang: Language;
  loading?: boolean;
}) {
  const c = tcopy(lang);
  const [reveal, setReveal] = useState(false);
  useEffect(() => {
    const t = requestAnimationFrame(() => setReveal(true));
    return () => cancelAnimationFrame(t);
  }, []);

  const sublines = SUB[lang] ?? SUB.fr;
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

        {!loading && (
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
        )}
      </StatsSectionShell>
    </section>
  );
}
