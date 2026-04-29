import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
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
import { Link } from 'react-router-dom';
import { useVitrineStats } from '@/hooks/useVitrineStats';
import { setStatsPagePdfState } from '@/lib/statsPagePdfBridge';
import { useLanguage } from '@/i18n/LanguageProvider';
import type { Language } from '@/types';
import { StatsHero } from '@/components/StatsHero';
import { NetworkGrowthSection } from '@/components/stats/NetworkGrowthSection';
import { ActiveOpportunitiesSection } from '@/components/stats/ActiveOpportunitiesSection';
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
  const [pdfBusy, setPdfBusy] = useState(false);
  const [pdfMode, setPdfMode] = useState(false);

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

  const handlePdf = useCallback(async () => {
    const el = printRef.current;
    if (!el) return;
    // Important: some browsers (notably Safari) may block downloads that happen
    // after an async boundary. We open a blank tab synchronously (user gesture),
    // then navigate it to the generated PDF blob URL when ready.
    const maybePopup = window.open('', '_blank');
    const popupBlocked = !maybePopup;
    if (popupBlocked) {
      // Universal fallback: native print dialog lets the user "Save as PDF".
      // This runs in the click gesture stack, so it isn't blocked by async rules.
      window.print();
      return;
    }
    setPdfBusy(true);
    setPdfMode(true);
    try {
      // Ensure the PDF-safe render has applied before html2canvas clones the DOM.
      await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));
      const scale = 2;
      const canvas = await html2canvas(el, {
        scale,
        useCORS: true,
        backgroundColor: '#ffffff',
        windowWidth: el.scrollWidth,
        windowHeight: el.scrollHeight,
        onclone: (doc) => {
          doc.querySelectorAll('.no-print').forEach((n) => {
            (n as HTMLElement).style.display = 'none';
          });
          // Defensive: html2canvas can crash on SVG `foreignObject` and some filters.
          doc.querySelectorAll('foreignObject').forEach((n) => n.remove());
          doc.querySelectorAll('[filter]').forEach((n) => n.removeAttribute('filter'));
        },
      });

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const margin = 8;
      const header = `FrancoNetwork · Annuaire d'Affaires de Guadalajara · ${monthTitle}`;
      const footer = 'franconetwork.app · Rejoignez le réseau';

      const w = pageW - margin * 2;
      const headerBlock = 10;
      const footerBlock = 8;
      const mmPerPxW = w / canvas.width;
      const imgH_mm = canvas.height * mmPerPxW;
      const usableH = pageH - margin * 2 - headerBlock - footerBlock;
      const headerY = margin + 4;
      const footerY = pageH - margin - 3;
      const drawW = w;
      const drawX = margin;
      const drawY0 = margin + headerBlock;

      let yMm = 0;
      let first = true;
      while (yMm < imgH_mm - 0.0001) {
        if (!first) pdf.addPage();
        first = false;

        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(9);
        pdf.setTextColor(1, 105, 111);
        pdf.text(header, margin, headerY, { maxWidth: w });
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(7.5);
        pdf.setTextColor(100, 116, 139);
        pdf.text(footer, margin, footerY, { maxWidth: w });

        const remaining = imgH_mm - yMm;
        const hDraw = Math.min(usableH, remaining);
        if (hDraw <= 0) break;

        const srcYpx = (yMm / imgH_mm) * canvas.height;
        const srcHpx = (hDraw / imgH_mm) * canvas.height;

        const one = document.createElement('canvas');
        one.width = canvas.width;
        one.height = Math.max(1, Math.floor(srcHpx));
        const ctx = one.getContext('2d');
        if (ctx) {
          ctx.drawImage(canvas, 0, srcYpx, canvas.width, srcHpx, 0, 0, one.width, one.height);
        }
        const part = one.toDataURL('image/jpeg', 0.92);
        pdf.addImage(part, 'JPEG', drawX, drawY0, drawW, hDraw, undefined, 'FAST');
        yMm += hDraw;
      }

      const fname = `FrancoNetwork-Stats-${now.toLocaleDateString(lang === 'es' ? 'es-MX' : lang === 'en' ? 'en-US' : 'fr-FR', { month: 'long', year: 'numeric' })}.pdf`
        .replace(/\s+/g, '-');
      const blob = pdf.output('blob');
      const blobUrl = URL.createObjectURL(blob);

      if (maybePopup && !maybePopup.closed) {
        // Some browsers refuse navigating to a blob URL; fallback to data URI.
        try {
          maybePopup.location.href = blobUrl;
        } catch {
          maybePopup.location.href = pdf.output('datauristring');
        }
      }

      // Best-effort: direct download via <a download>, then fallback to jsPDF's save().
      try {
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = fname;
        a.rel = 'noopener';
        document.body.appendChild(a);
        a.click();
        a.remove();
      } catch {
        pdf.save(fname);
      }
      window.setTimeout(() => URL.revokeObjectURL(blobUrl), 30_000);

      if (popupBlocked) {
        alert(
          lang === 'en'
            ? 'Your browser blocked the PDF popup/download. Please allow popups for this site, then try again.'
            : lang === 'es'
              ? 'Tu navegador bloqueó la descarga/ventana del PDF. Autoriza las ventanas emergentes para este sitio y vuelve a intentar.'
              : 'Votre navigateur a bloqué la fenêtre/téléchargement du PDF. Autorisez les popups pour ce site puis réessayez.'
        );
      }
    } catch (e) {
      console.error(e);
      const msg =
        typeof e === 'object' && e && 'message' in e ? String((e as { message?: unknown }).message) : String(e);
      alert(
        lang === 'en'
          ? `PDF export failed. Please try again.\n\n${msg}`
          : lang === 'es'
            ? `La exportación PDF falló. Inténtalo de nuevo.\n\n${msg}`
            : `L’export PDF a échoué. Réessayez.\n\n${msg}`
      );
    } finally {
      setPdfBusy(false);
      setPdfMode(false);
      if (maybePopup && !maybePopup.closed && maybePopup.location.href === 'about:blank') {
        maybePopup.close();
      }
    }
  }, [lang, monthTitle, now]);

  useEffect(() => {
    if (vitrine.loading || vitrine.error) {
      setStatsPagePdfState(null);
      return;
    }
    setStatsPagePdfState({ print: () => void handlePdf(), busy: pdfBusy });
    return () => {
      setStatsPagePdfState(null);
    };
  }, [vitrine.error, vitrine.loading, handlePdf, pdfBusy]);

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
            pdfMode={pdfMode}
          />

          <RecentMembersActivity lang={lang} />

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
