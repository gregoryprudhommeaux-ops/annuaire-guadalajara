import React, { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { NeedChartRow } from '@/lib/needs';
import { getChartColor } from '@/lib/chartTheme';
import type { Language } from '@/types';
import { getOpportunitySubline } from '@/lib/activeOpportunitiesEditorial';
import {
  StatsBadge,
  StatsInsightCard,
  StatsPrimaryButton,
  StatsSecondaryButton,
  StatsSectionHeader,
  StatsSectionShell,
  statsListRowClassName,
} from '@/components/stats/ui';

type Copy = {
  eyebrow: string;
  title: string;
  lead: string;
  whyTitle: string;
  whyBody: string;
  whyB1: string;
  whyB2: string;
  conv: string;
  ctaPrimary: string;
  ctaSecondary: string;
  badgeTop: string;
  badgeSecond: string;
  demandes: (n: number) => string;
  empty: string;
};

function tcopy(lang: Language): Copy {
  if (lang === 'en') {
    return {
      eyebrow: 'Active opportunities',
      title: 'What members are looking for right now',
      lead: 'Partners, distributors, experts, suppliers: concrete needs already expressed in the network.',
      whyTitle: 'Why this matters',
      whyBody:
        'These signals show members are not here only to be listed. They are actively seeking connections, on-the-ground relays, and partners who can accelerate their projects.',
      whyB1: 'Needs already expressed by the community',
      whyB2: 'Joining helps you appear at the right moment',
      conv: 'You may be exactly the contact other members are already looking for.',
      ctaPrimary: 'Join the network',
      ctaSecondary: 'View requests',
      badgeTop: 'High demand',
      badgeSecond: 'Strong demand',
      demandes: (n) => `${n} request${n === 1 ? '' : 's'}`,
      empty: 'Need categories will appear here as members express them.',
    };
  }
  if (lang === 'es') {
    return {
      eyebrow: 'Oportunidades activas',
      title: 'Lo que los miembros buscan ahora',
      lead: 'Socios, distribuidores, expertos, proveedores: necesidades concretas ya expresadas en la red.',
      whyTitle: 'Para qué sirve',
      whyBody:
        'Estas señales muestran que los miembros no vienen solo a figurar. Buscan conexiones activas, apoyo local y socios capaces de acelerar sus proyectos.',
      whyB1: 'Necesidades ya expresadas por la comunidad',
      whyB2: 'Inscribirse ayuda a aparecer en el momento adecuado',
      conv: 'Quizá usted es justo el contacto que otros miembros ya buscan.',
      ctaPrimary: 'Unirse a la red',
      ctaSecondary: 'Ver solicitudes',
      badgeTop: 'Muy demandado',
      badgeSecond: 'En fuerte demanda',
      demandes: (n) => `${n} solicitud${n === 1 ? '' : 'es'}`,
      empty: 'Las categorías aparecerán cuando los miembros expresen sus necesidades.',
    };
  }
  return {
    eyebrow: 'Opportunités actives',
    title: 'Ce que les membres recherchent en ce moment',
    lead: 'Partenaires, distributeurs, experts, fournisseurs : des besoins concrets déjà exprimés dans le réseau.',
    whyTitle: 'Pourquoi c’est utile',
    whyBody:
      'Ces signaux montrent que les membres ne viennent pas seulement pour figurer dans un annuaire. Ils cherchent activement des connexions, des relais terrain et des partenaires capables d’accélérer leurs projets.',
    whyB1: 'Des besoins déjà exprimés par la communauté',
    whyB2: 'Une inscription permet d’apparaître au bon moment',
    conv: 'Vous êtes peut-être précisément le contact que d’autres membres recherchent déjà.',
    ctaPrimary: 'Rejoindre le réseau',
    ctaSecondary: 'Voir les demandes',
    badgeTop: 'Très demandé',
    badgeSecond: 'En forte demande',
    demandes: (n) => `${n} demande${n === 1 ? '' : 's'}`,
    empty: 'Les catégories de besoins s’afficheront dès que des membres les expriment sur leurs profils.',
  };
}

type RowProps = {
  row: NeedChartRow;
  max: number;
  rank: number;
  lang: Language;
  c: Copy;
  index: number;
  onCategoryClick?: (key: string) => void;
};

function OpportunityCategoryRow({ row, max, rank, lang, c, index, onCategoryClick }: RowProps) {
  const w = max > 0 ? Math.max(4, (row.count / max) * 100) : 0;
  const sub = getOpportunitySubline(row.key, lang);
  const isTop = rank === 0 && row.count > 0;
  const isSecond = rank === 1 && row.count > 0;
  const barColor = getChartColor(index);

  const inner = (
    <>
      <div className="mb-1.5 flex flex-wrap items-start justify-between gap-2 sm:mb-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-snug text-slate-900">{row.label}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {isTop && <StatsBadge>{c.badgeTop}</StatsBadge>}
          {isSecond && !isTop && <StatsBadge>{c.badgeSecond}</StatsBadge>}
          <span className="tabular-nums text-sm font-bold" style={{ color: barColor }}>
            {c.demandes(row.count)}
          </span>
        </div>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full transition-[width] duration-500 ease-out motion-reduce:transition-none"
          style={{ width: `${w}%`, backgroundColor: barColor }}
        />
      </div>
      <p className="mt-1.5 text-xs leading-relaxed text-slate-500">{sub}</p>
    </>
  );

  const to = `/requests?category=${encodeURIComponent(row.key)}`;
  return (
    <li
      className={`active-opp-row active-opp-row-anim ${statsListRowClassName} transition-colors motion-safe:hover:border-slate-300/90`}
      style={{ animationDelay: `${index * 55}ms` }}
    >
      <Link
        to={to}
        className="block w-full no-underline outline-offset-2 hover:opacity-95"
        onClick={() => onCategoryClick?.(row.key)}
      >
        {inner}
      </Link>
    </li>
  );
}

function RowSkeleton() {
  return (
    <li className={statsListRowClassName}>
      <div className="mb-2 flex justify-between">
        <div className="h-4 w-[40%] animate-pulse rounded bg-slate-200" />
        <div className="h-4 w-12 animate-pulse rounded bg-slate-200" />
      </div>
      <div className="h-2.5 w-full animate-pulse rounded-full bg-slate-200" />
      <div className="mt-2 h-3 w-4/5 animate-pulse rounded bg-slate-100" />
    </li>
  );
}

export function ActiveOpportunitiesSection({
  needs,
  lang,
  loading = false,
  onCategoryClick,
}: {
  needs: NeedChartRow[];
  lang: Language;
  /** Si `true`, affiche des squelettes à la place des lignes. */
  loading?: boolean;
  /** Clic sur une catégorie (sinon navigation vers `/requests?category=…`). */
  onCategoryClick?: (key: string) => void;
}) {
  const c = tcopy(lang);
  const [reveal, setReveal] = useState(false);
  useEffect(() => {
    const t = requestAnimationFrame(() => setReveal(true));
    return () => cancelAnimationFrame(t);
  }, []);

  const { rows, max } = useMemo(() => {
    const r = [...needs].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
    const m = r.length ? Math.max(...r.map((x) => x.count), 1) : 1;
    return { rows: r, max: m };
  }, [needs]);

  const showEmpty = !loading && rows.length === 0;
  const rankByIndex = (i: number) => i; // 0 and 1 are top 2 in sorted

  return (
    <section
      className={`active-opportunities mt-10 print:break-inside-avoid ${reveal ? 'opacity-100' : 'opacity-0'} transition-opacity duration-500 motion-reduce:opacity-100 motion-reduce:duration-0`}
    >
      <StatsSectionShell>
        <div className="border-b border-slate-100 px-4 py-5 sm:px-6 sm:py-6">
          <StatsSectionHeader eyebrow={c.eyebrow} title={c.title} description={c.lead} />
        </div>

        <div className="grid grid-cols-1 gap-6 p-4 sm:p-6 lg:grid-cols-12 lg:items-stretch">
          <div className="min-w-0 lg:col-span-7">
            {loading ? (
              <ul className="space-y-3" aria-busy>
                {Array.from({ length: 5 }, (_, i) => (
                  <RowSkeleton key={i} />
                ))}
              </ul>
            ) : showEmpty ? (
              <p className="text-sm text-slate-500">{c.empty}</p>
            ) : (
              <ul className="space-y-3">
                {rows.map((row, i) => (
                  <OpportunityCategoryRow
                    key={row.key}
                    row={row}
                    max={max}
                    rank={rankByIndex(i)}
                    lang={lang}
                    c={c}
                    index={i}
                    onCategoryClick={onCategoryClick}
                  />
                ))}
              </ul>
            )}
          </div>

          <aside className="min-h-0 border-t border-slate-100 pt-5 sm:pt-6 lg:col-span-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
            <StatsInsightCard className="!shadow-none">
              <h3 className="text-sm font-extrabold text-slate-900">{c.whyTitle}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{c.whyBody}</p>
              <ul className="mt-3 space-y-1.5 text-sm text-slate-700">
                <li className="flex gap-2">
                  <span className="mt-0.5 shrink-0 text-[#01696f]">·</span>
                  <span>{c.whyB1}</span>
                </li>
                <li className="flex gap-2">
                  <span className="mt-0.5 shrink-0 text-[#01696f]">·</span>
                  <span>{c.whyB2}</span>
                </li>
              </ul>
            </StatsInsightCard>
          </aside>
        </div>

        <div className="border-t border-slate-100 px-4 py-5 sm:px-6">
          <p className="text-sm leading-relaxed text-slate-700">{c.conv}</p>
          <div className="mt-4 flex flex-col items-stretch gap-2.5 sm:flex-row sm:justify-start print:flex-row">
            <StatsPrimaryButton to="/inscription" className="w-full sm:w-auto print:w-auto">
              {c.ctaPrimary}
            </StatsPrimaryButton>
            <StatsSecondaryButton to="/requests" className="w-full sm:w-auto print:w-auto">
              {c.ctaSecondary}
            </StatsSecondaryButton>
          </div>
        </div>
      </StatsSectionShell>
    </section>
  );
}
