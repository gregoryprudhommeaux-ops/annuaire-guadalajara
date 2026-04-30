import React from 'react';
import { Plus, Sparkles, TrendingUp } from 'lucide-react';
import type { Language } from '@/types';
import { getStatsVitrineCopy } from '@/i18n/statsVitrine';
import {
  StatsCard,
  StatsInsightCard,
  StatsSectionShell,
} from '@/components/stats/ui';

/** Taille de réseau utilisée uniquement pour l’exemple de projection pédagogique. */
export const NETWORK_EFFECT_PROJECTION_MEMBERS = 50;

function pairsCompleteGraph(n: number): number {
  return n > 1 ? (n * (n - 1)) / 2 : 0;
}

function localeNum(lang: Language, n: number) {
  return Math.round(n).toLocaleString(lang === 'es' ? 'es-MX' : lang === 'en' ? 'en-US' : 'fr-FR');
}

function TypeBadge({
  tone,
  children,
}: {
  tone: 'measured' | 'projection' | 'marginal';
  children: React.ReactNode;
}) {
  const cls =
    tone === 'measured'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
      : tone === 'projection'
        ? 'border-amber-200 bg-amber-50 text-amber-950'
        : 'border-[#01696f]/25 bg-[#01696f]/8 text-[#014f54]';
  return (
    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${cls}`}>
      {children}
    </span>
  );
}

export function NetworkEffectSection({
  lang,
  totalMembers,
  potentialConnections,
}: {
  lang: Language;
  totalMembers: number;
  potentialConnections: number;
}) {
  const c = getStatsVitrineCopy(lang).networkEffect;
  const projN = NETWORK_EFFECT_PROJECTION_MEMBERS;
  const projPairs = pairsCompleteGraph(projN);
  const marginalOneMore = totalMembers >= 1 ? totalMembers : 0;

  const pairsFmt = localeNum(lang, potentialConnections);
  const projFmt = localeNum(lang, projPairs);
  const marginalFmt = localeNum(lang, marginalOneMore);

  return (
    <section className="network-effect-section mt-10 print:break-inside-avoid">
      <StatsSectionShell>
        <div className="border-b border-slate-100 px-4 py-5 sm:px-6 sm:py-6">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#01696f]">{c.eyebrow}</p>
          <h2 className="mt-2 text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">{c.title}</h2>
          <div className="mt-3 max-w-xl border-t border-slate-200" aria-hidden />
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-slate-600 sm:text-[15px]">{c.intro}</p>
        </div>

        <div className="grid gap-4 p-4 sm:grid-cols-3 sm:p-6">
          <StatsCard className="flex flex-col border-emerald-100/80 bg-gradient-to-b from-white to-emerald-50/40">
            <div className="flex items-start justify-between gap-2">
              <TypeBadge tone="measured">{c.badgeMeasured}</TypeBadge>
              <UsersGlyph />
            </div>
            <p className="mt-4 text-3xl font-extrabold tabular-nums text-slate-900">
              {localeNum(lang, totalMembers)}
            </p>
            <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{c.cardTodayLabel}</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{c.cardTodaySub(pairsFmt)}</p>
          </StatsCard>

          <StatsCard className="flex flex-col border-amber-100 bg-gradient-to-b from-white to-amber-50/35">
            <div className="flex items-start justify-between gap-2">
              <TypeBadge tone="projection">{c.badgeProjection}</TypeBadge>
              <TrendingUp className="h-5 w-5 shrink-0 text-amber-700" aria-hidden />
            </div>
            <p className="mt-4 text-3xl font-extrabold tabular-nums text-amber-950">{localeNum(lang, projN)}</p>
            <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-600">{c.cardTomorrowLabel}</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{c.cardTomorrowSub(projFmt)}</p>
          </StatsCard>

          <StatsCard className="flex flex-col border-[#01696f]/15 bg-gradient-to-b from-white to-[#e6f5f5]/40">
            <div className="flex items-start justify-between gap-2">
              <TypeBadge tone="marginal">{c.badgeMarginal}</TypeBadge>
              <Plus className="h-5 w-5 shrink-0 text-[#01696f]" strokeWidth={2.25} aria-hidden />
            </div>
            <p className="mt-4 text-3xl font-extrabold tabular-nums text-[#01696f]">{c.cardPlusOneDisplay}</p>
            <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{c.cardPlusOneLabel}</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              {totalMembers >= 1 ? c.cardPlusOneSub(marginalFmt) : c.cardPlusOneSubZero}
            </p>
          </StatsCard>
        </div>

        <div className="px-4 pb-4 sm:px-6 sm:pb-6">
          <StatsInsightCard className="border border-white/15 bg-[#01696f] py-6 shadow-md sm:p-8">
            <div className="flex flex-col items-center gap-3 text-center">
              <Sparkles className="h-5 w-5 shrink-0 text-white/95" aria-hidden />
              <h3 className="text-sm font-extrabold text-white sm:text-[15px]">{c.profileHeading}</h3>
              <p className="max-w-3xl text-sm leading-relaxed text-white/90">{c.profileBody}</p>
            </div>
          </StatsInsightCard>
        </div>

        <div className="border-t border-slate-100 px-4 py-5 sm:px-6">
          <p className="text-center text-sm font-medium leading-relaxed text-slate-800 sm:text-[15px]">{c.closing}</p>
        </div>
      </StatsSectionShell>
    </section>
  );
}

function UsersGlyph() {
  return (
    <svg className="h-5 w-5 text-emerald-800" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M16 11a4 4 0 1 0-8 0 4 4 0 0 0 8 0z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <path d="M4 20a7 7 0 0 1 16 0" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}
