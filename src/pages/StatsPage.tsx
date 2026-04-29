import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { Eye, Handshake, Network, TrendingUp, Users } from 'lucide-react';
import { httpsCallable } from 'firebase/functions';
import { Link } from 'react-router-dom';
import { useVitrineStats } from '@/hooks/useVitrineStats';
import { setStatsPagePdfState } from '@/lib/statsPagePdfBridge';
import { useLanguage } from '@/i18n/LanguageProvider';
import type { Language } from '@/types';
import { StatsHero } from '@/components/StatsHero';
import { NetworkGrowthSection } from '@/components/stats/NetworkGrowthSection';
import { ActiveOpportunitiesSection } from '@/components/stats/ActiveOpportunitiesSection';
import { NeedsBarChart } from '@/components/charts/NeedsBarChart';
import { RecentMembersActivity } from '@/components/stats/RecentMembersActivity';
import { RecentRequestsFeed } from '@/components/stats/RecentRequestsFeed';
import { SegmentedJoinCTA } from '@/components/stats/SegmentedJoinCTA';
import { SharedAffinitiesSection } from '@/components/stats/SharedAffinitiesSection';
import {
  STATS_CHART_BAR_COLORS,
  StatsCard,
  StatsSectionHeader,
  StatsSectionShell,
} from '@/components/stats/ui';
import { functions } from '@/firebase';
import francoLogoUrl from '../../favicon.svg?url';
import './stats-page.css';

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

function TrendPill({ text, tone }: { text: string; tone: 'up' | 'down' | 'flat' }) {
  const cls =
    tone === 'up' ? 'text-[#0a5c61]' : tone === 'down' ? 'text-rose-700' : 'text-slate-500';
  return <p className={`mt-1 text-xs font-semibold ${cls}`}>{text}</p>;
}

export default function StatsPage() {
  const { lang } = useLanguage();
  const vitrine = useVitrineStats();
  const printRef = useRef<HTMLDivElement | null>(null);
  const [exportBusy, setExportBusy] = useState(false);

  const now = useMemo(() => new Date(), []);
  const monthTitle = useMemo(() => formatMonthYear(now, lang), [now, lang]);
  const dataDateLabel = useMemo(() => formatShortDate(now, lang), [now, lang]);

  const newMemberDelta = vitrine.newMembersLast30d - vitrine.prevNewMembers30d;
  const newMemberTone: 'up' | 'down' | 'flat' =
    newMemberDelta > 0 ? 'up' : newMemberDelta < 0 ? 'down' : 'flat';
  const newMemberTrend =
    lang === 'en'
      ? `${newMemberDelta >= 0 ? '+' : ''}${newMemberDelta} vs previous 30 days`
      : lang === 'es'
        ? `${newMemberDelta >= 0 ? '+' : ''}${newMemberDelta} vs 30 días previos`
        : `${newMemberDelta >= 0 ? '+' : ''}${newMemberDelta} vs 30 jours précédents`;

  const totalMemberTrend =
    lang === 'en'
      ? `${newMemberDelta >= 0 ? '+' : ''}${newMemberDelta} members vs previous month window`
      : lang === 'es'
        ? `${newMemberDelta >= 0 ? '+' : ''}${newMemberDelta} miembres vs ventana previa`
        : `${newMemberDelta >= 0 ? '+' : ''}${newMemberDelta} membres vs mois précédent (glissant)`;

  const viewTrend =
    vitrine.profileViewsCumul > 0
      ? lang === 'en'
        ? 'Aggregated counters on profiles'
        : lang === 'es'
          ? 'Contadores agregados en perfiles'
          : 'Agrégats sécurisés (sans journaux bruts)'
      : lang === 'en'
        ? 'No public total yet. Aggregated profile view counts can be published on this page.'
        : lang === 'es'
          ? 'Aún no hay cifra pública. Pueden publicarse visitas agregadas a ficha, sin datos personales.'
          : 'Aucun total public pour l’instant. Des indicateurs agrégés de consultation peuvent être proposés sur l’annuaire.';

  const contactTrend =
    vitrine.contactClicksCumul > 0
      ? lang === 'en'
        ? 'Sum of contact actions stored on member docs'
        : lang === 'es'
          ? 'Suma de acciones en documentos de miembros'
          : 'Somme des actions (fiches Membres) — pas d’e-mails exposés'
      : lang === 'en'
        ? 'No public total yet. Privacy-safe aggregate action counts can be published at profile level.'
        : lang === 'es'
          ? 'Aún no hay cifra pública. Pueden publicarse acciones de contacto agregadas, sin exponer datos sensibles.'
          : 'Aucun indicateur public à ce jour. Des comptages d’actions agrégés peuvent apparaître sur les fiches.';


  const potentialTrend =
    lang === 'en'
      ? 'Grows with network size (combinatorics)'
      : lang === 'es'
        ? 'Crece con el tamaño de la red'
        : 'Augmente avec le nombre de décideurs';

  type ExportStatsToSlidesInput = { lang: Language };
  type ExportStatsToSlidesResult = { ok: boolean; presentationId: string; url: string };

  const handleExportSlides = useCallback(async () => {
    if (exportBusy) return;
    setExportBusy(true);
    try {
      const fn2 = httpsCallable<ExportStatsToSlidesInput, ExportStatsToSlidesResult>(
        functions,
        'exportStatsToSlides'
      );
      const res = await fn2({ lang });
      const url = String(res.data?.url ?? '').trim();
      if (!url) {
        throw new Error('URL Slides manquante.');
      }
      const w = window.open(url, '_blank', 'noopener,noreferrer');
      if (!w) {
        alert(
          lang === 'en'
            ? 'Please allow popups to open the Google Slides export.'
            : lang === 'es'
              ? 'Autoriza las ventanas emergentes para abrir la exportación de Google Slides.'
              : "Autorisez les popups pour ouvrir l’export Google Slides."
        );
      }
    } catch (e) {
      console.error(e);
      const anyE = e as any;
      const code = typeof anyE?.code === 'string' ? anyE.code : '';
      const msg = typeof anyE?.message === 'string' ? anyE.message : e instanceof Error ? e.message : String(e);
      let details = '';
      try {
        if (anyE?.details !== undefined) details = JSON.stringify(anyE.details);
      } catch {
        details = String(anyE?.details ?? '');
      }
      const detail = [code && `code: ${code}`, msg && `message: ${msg}`, details && `details: ${details}`]
        .filter(Boolean)
        .join('\n');
      alert(
        lang === 'en'
          ? `Slides export failed.\n\n${detail}`
          : lang === 'es'
            ? `La exportación Slides falló.\n\n${detail}`
            : `L’export Slides a échoué.\n\n${detail}`
      );
    } finally {
      setExportBusy(false);
    }
  }, [exportBusy, lang]);

  useEffect(() => {
    if (vitrine.loading || vitrine.error) {
      setStatsPagePdfState(null);
      return;
    }
    setStatsPagePdfState({ print: () => void handleExportSlides(), busy: exportBusy });
    return () => {
      setStatsPagePdfState(null);
    };
  }, [vitrine.error, vitrine.loading, handleExportSlides, exportBusy]);

  const topSectorsChart = useMemo(
    () => vitrine.topSectors.map((s) => ({ name: s.name, value: s.value })),
    [vitrine.topSectors]
  );
  const sectorColor = (idx: number) => STATS_CHART_BAR_COLORS[idx % STATS_CHART_BAR_COLORS.length]!;

  if (vitrine.loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10 text-sm text-slate-600">
        {lang === 'en' ? 'Loading…' : lang === 'es' ? 'Cargando…' : 'Chargement…'}
      </div>
    );
  }
  if (vitrine.error) {
    return <div className="mx-auto max-w-5xl px-4 py-10 text-sm text-red-700">{vitrine.error}</div>;
  }

  return (
    <div className="relative min-w-0 bg-[#f4f6f7]">
      <Helmet>
        <title>{`FrancoNetwork · Vitrine réseau · ${monthTitle}`}</title>
        <meta
          name="description"
          content="FrancoNetwork — statistiques agrégées (sans données sensibles) sur le réseau d’affaires francophone de Guadalajara."
        />
      </Helmet>

      <div className="mx-auto max-w-5xl px-4 py-10">
        <div
          ref={printRef}
          className="stats-ds stats-print-root overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10"
        >
          <header className="stats-pdf-header">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#01696f]">FrancoNetwork</p>
            <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              {lang === 'en'
                ? 'The Francophone business network in Guadalajara'
                : lang === 'es'
                  ? 'La red de negocios francófona en Guadalajara'
                  : 'Le réseau francophone d’affaires de Guadalajara'}
            </h1>
            <p className="mt-2 max-w-3xl text-slate-600 sm:text-[15px]">
              {lang === 'en'
                ? `Community snapshot — ${monthTitle}`
                : lang === 'es'
                  ? `Comunidad en cifras — ${monthTitle}`
                  : `Découvrez la communauté en chiffres — ${monthTitle}`}
            </p>
          </header>

          <StatsHero lang={lang} />

          <section className="mt-10 print:break-inside-avoid">
            <StatsSectionHeader
              eyebrow={lang === 'en' ? 'KPI' : lang === 'es' ? 'Indicadores' : 'Indicateurs'}
              title={lang === 'en' ? 'The network in numbers' : lang === 'es' ? 'La red en cifras' : 'Le réseau en chiffres'}
              description={
                lang === 'en'
                  ? 'Key metrics from the public directory, updated regularly.'
                  : lang === 'es'
                    ? 'Indicadores clave del directorio público, actualizados con regularidad.'
                    : 'Indicateurs clés issus de l’annuaire public, actualisés régulièrement.'
              }
            />
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <Kpi
                icon={<Users className="h-5 w-5" />}
                value={vitrine.totalMembers}
                label={lang === 'en' ? 'Active decision-makers' : 'Décideurs actifs'}
                trend={
                  <TrendPill
                    text={totalMemberTrend}
                    tone={newMemberTone}
                  />
                }
              />
              <Kpi
                icon={<TrendingUp className="h-5 w-5" />}
                value={vitrine.newMembersLast30d}
                label={lang === 'en' ? 'New this month (30d rolling)' : 'Nouveaux ce mois'}
                trend={<TrendPill text={newMemberTrend} tone={newMemberTone} />}
              />
              <Kpi
                icon={<Eye className="h-5 w-5" />}
                value={vitrine.profileViewsCumul}
                label={lang === 'en' ? 'Profile views (cumulative)' : 'Consultations de profils'}
                trend={<TrendPill text={viewTrend} tone="flat" />}
              />
              <Kpi
                icon={<Handshake className="h-5 w-5" />}
                value={vitrine.contactClicksCumul}
                label={lang === 'en' ? 'Intros & contact actions' : 'Mises en relation initiées'}
                trend={<TrendPill text={contactTrend} tone="flat" />}
              />
              <Kpi
                icon={<Network className="h-5 w-5" />}
                value={Math.round(vitrine.potentialConnections)}
                label={lang === 'en' ? 'Potential connections' : 'Connexions potentielles'}
                trend={<TrendPill text={potentialTrend} tone="flat" />}
              />
            </div>
          </section>

          <SharedAffinitiesSection passions={vitrine.topPassions} lang={lang} />

          <section className="mt-10 print:break-inside-avoid">
            <StatsSectionShell>
              <div className="border-b border-slate-100 px-4 py-5 sm:px-6 sm:py-6">
                <StatsSectionHeader
                  eyebrow={lang === 'en' ? 'Sectors' : lang === 'es' ? 'Sectores' : 'Secteurs'}
                  title={
                    lang === 'en'
                      ? '8 activity sectors — multi-sector by design'
                      : lang === 'es'
                        ? '8 sectores de actividad — multi-sectorial por diseño'
                        : '8 secteurs d’activité · un réseau multi-sectoriel'
                  }
                  description={
                    lang === 'en'
                      ? 'Top sectors represented in the directory (aggregated).'
                      : lang === 'es'
                        ? 'Sectores principales representados en el directorio (datos agregados).'
                        : 'Principaux secteurs représentés dans l’annuaire (agrégés).'
                  }
                />
              </div>
              <div className="h-72 w-full min-w-0 max-w-full px-2 pb-4 pt-2 sm:px-4 sm:pb-5">
                <ResponsiveContainer>
                  <BarChart data={topSectorsChart} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 6 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={140}
                      tick={{ fontSize: 11, fill: '#0f172a' }}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 8,
                        border: '1px solid #e2e8f0',
                        fontSize: 12,
                      }}
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

          <NetworkGrowthSection
            growthCumulative={vitrine.growthCumulative}
            totalMembers={vitrine.totalMembers}
            newMembersLast30d={vitrine.newMembersLast30d}
            lang={lang}
            pdfMode={false}
          />

          <RecentMembersActivity lang={lang} />

          <div className="mt-10 print:break-inside-avoid">
            <NeedsBarChart
              data={vitrine.needs}
              title={
                lang === 'en'
                  ? 'Most sought opportunities'
                  : lang === 'es'
                    ? 'Oportunidades más buscadas'
                    : 'Opportunités les plus recherchées'
              }
              subtitle={
                lang === 'en'
                  ? 'The most expressed needs in the community right now.'
                  : lang === 'es'
                    ? 'Las necesidades más expresadas actualmente en la comunidad.'
                    : 'Les besoins les plus exprimés actuellement dans la communauté.'
              }
              compact
              limit={8}
            />
          </div>

          <ActiveOpportunitiesSection needs={vitrine.needs} lang={lang} />

          <RecentRequestsFeed lang={lang} />

          <SegmentedJoinCTA lang={lang} />

          <div className="mt-10 flex flex-col items-start gap-4 border-t border-slate-200 pt-8 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <img src={francoLogoUrl} alt="FrancoNetwork" className="h-9 w-9" width={36} height={36} />
              <div>
                <p className="text-sm font-semibold text-slate-900">FrancoNetwork</p>
                <p className="text-sm text-slate-600">
                  {lang === 'en'
                    ? 'Francophone business network · Guadalajara, Jalisco, Mexico'
                    : lang === 'es'
                      ? 'Red de negocios francófona · Guadalajara, Jalisco, México'
                      : 'Réseau francophone d’affaires · Guadalajara, Jalisco, Mexique'}
                </p>
                <p className="text-xs text-slate-500">franconetwork.app · {lang === 'en' ? 'Free signup' : lang === 'es' ? 'Inscripción gratuita' : 'Inscription gratuite'}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {lang === 'en' ? 'Data as of' : lang === 'es' ? 'Datos al' : 'Données au'} {dataDateLabel}
                </p>
              </div>
            </div>
          </div>

          <p className="mt-3 text-center text-[11px] text-slate-400">
            {lang === 'en'
              ? vitrine.source === 'firestore'
                ? 'Source: aggregated directory data, including public showcase totals when published.'
                : 'Source: aggregated directory data (views and contact actions when those metrics are active).'
              : lang === 'es'
                ? vitrine.source === 'firestore'
                  ? 'Fuente: datos agregados del directorio, incluidos totales públicos cuando están publicados.'
                  : 'Fuente: datos agregados (vistas y acciones de contacto cuando esos indicadores existen).'
                : vitrine.source === 'firestore'
                  ? 'Source : données agrégées (annuaire), y compris totaux publics lorsqu’ils sont actifs.'
                  : 'Source : agrégats annuaire (vues et mises en relation si ces indicateurs sont actifs).'}
          </p>
        </div>
      </div>
    </div>
  );
}

function Kpi({
  icon,
  value,
  label,
  trend,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  trend: React.ReactNode;
}) {
  return (
    <StatsCard className="p-4 sm:p-4">
      <div className="flex items-center justify-between gap-2 text-[#01696f]">
        {icon}
        <p className="text-2xl font-extrabold tabular-nums text-slate-900">{value.toLocaleString('fr-FR')}</p>
      </div>
      <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      {trend}
    </StatsCard>
  );
}
