import React, { useCallback, useMemo, useRef, useState } from 'react';
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
import { getPassionEmoji, getPassionLabel } from '@/lib/passionConfig';
import { useLanguage } from '@/i18n/LanguageProvider';
import { LanguageSwitch } from '@/components/layout/LanguageSwitch';
import type { Language } from '@/types';
import { StatsHero } from '@/components/StatsHero';
import { NetworkGrowthSection } from '@/components/stats/NetworkGrowthSection';
import { ActiveOpportunitiesSection } from '@/components/stats/ActiveOpportunitiesSection';
import { RecentMembersActivity } from '@/components/stats/RecentMembersActivity';
import { RecentRequestsFeed } from '@/components/stats/RecentRequestsFeed';
import { SegmentedJoinCTA } from '@/components/stats/SegmentedJoinCTA';
import francoLogoUrl from '../../favicon.svg?url';
import './stats-page.css';

const BRAND = '#1a3a2a';

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
    tone === 'up' ? 'text-emerald-700' : tone === 'down' ? 'text-rose-700' : 'text-slate-500';
  return <p className={`mt-1 text-xs font-semibold ${cls}`}>{text}</p>;
}

export default function StatsPage() {
  const { lang, setLang } = useLanguage();
  const vitrine = useVitrineStats();
  const printRef = useRef<HTMLDivElement | null>(null);
  const [pdfBusy, setPdfBusy] = useState(false);

  const now = useMemo(() => new Date(), []);
  const monthTitle = useMemo(() => formatMonthYear(now, lang), [now, lang]);
  const dataDateLabel = useMemo(() => formatShortDate(now, lang), [now, lang]);

  const locale = lang === 'es' ? 'es' : lang === 'en' ? 'en' : 'fr';

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
        ? 'Configure `public_vitrine` to publish view totals'
        : lang === 'es'
          ? 'Publica totales vía `public_vitrine`'
          : 'Publiez des totaux via `public_vitrine` (recommandé)';

  const contactTrend =
    vitrine.contactClicksCumul > 0
      ? lang === 'en'
        ? 'Sum of contact actions stored on member docs'
        : lang === 'es'
          ? 'Suma de acciones en documentos de miembros'
          : 'Somme des actions (docs membres) — pas d’e-mails exposés'
      : lang === 'en'
        ? 'Add safe counters to profiles or use `public_vitrine`'
        : 'Ajoutez des compteurs sûrs sur les fiches (ou `public_vitrine`)';

  const potentialTrend =
    lang === 'en'
      ? 'Grows with network size (combinatorics)'
      : lang === 'es'
        ? 'Crece con el tamaño de la red'
        : 'Augmente avec le nombre de décideurs';

  const handlePdf = useCallback(async () => {
    const el = printRef.current;
    if (!el) return;
    setPdfBusy(true);
    try {
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
        pdf.setTextColor(26, 58, 42);
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

      const fname = `FrancoNetwork-Stats-${now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}.pdf`
        .replace(/\s+/g, '-');
      pdf.save(fname);
    } catch (e) {
      console.error(e);
    } finally {
      setPdfBusy(false);
    }
  }, [monthTitle, now]);

  const topSectorsChart = useMemo(
    () => vitrine.topSectors.map((s) => ({ name: s.name, value: s.value })),
    [vitrine.topSectors]
  );
  const sectorColor = (idx: number) =>
    ['#1a3a2a', '#166534', '#0f766e', '#1d4ed8', '#b45309', '#be123c', '#7c3aed', '#334155'][idx % 8];

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
    <div className="relative min-w-0 bg-slate-50">
      <Helmet>
        <title>{`FrancoNetwork · Vitrine réseau · ${monthTitle}`}</title>
        <meta
          name="description"
          content="FrancoNetwork — statistiques agrégées (sans données sensibles) sur le réseau d’affaires francophone de Guadalajara."
        />
      </Helmet>

      <div className="no-print pointer-events-auto fixed right-4 top-4 z-[300] flex items-center gap-2">
        <div className="rounded-xl border border-slate-200 bg-white/90 px-2 py-1 shadow-sm backdrop-blur">
          <LanguageSwitch value={lang} onChange={setLang} />
        </div>
        <button
          type="button"
          onClick={() => void handlePdf()}
          disabled={pdfBusy}
          className="rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-sm disabled:opacity-60"
          style={{ background: BRAND }}
        >
          {pdfBusy
            ? lang === 'en'
              ? 'Preparing…'
              : lang === 'es'
                ? 'Preparando…'
                : 'Préparation…'
            : lang === 'en'
              ? 'Download PDF'
              : lang === 'es'
                ? 'Descargar PDF'
                : 'Télécharger en PDF'}
        </button>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-10">
        <div
          ref={printRef}
          className="stats-print-root overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10"
        >
          <header className="stats-pdf-header">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">FrancoNetwork</p>
            <h1 className="mt-1 text-3xl font-extrabold text-slate-900 sm:text-4xl">
              {lang === 'en'
                ? 'The Francophone business network in Guadalajara'
                : lang === 'es'
                  ? 'La red de negocios francófona en Guadalajara'
                  : 'Le réseau francophone d’affaires de Guadalajara'}
            </h1>
            <p className="mt-2 text-slate-600">
              {lang === 'en'
                ? `Community snapshot — ${monthTitle}`
                : lang === 'es'
                  ? `Comunidad en cifras — ${monthTitle}`
                  : `Découvrez la communauté en chiffres — ${monthTitle}`}
            </p>
          </header>

          <StatsHero lang={lang} />

          <section className="mt-8">
            <h2 className="text-lg font-extrabold text-slate-900">
              {lang === 'en' ? 'The network in numbers' : 'Le réseau en chiffres'}
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
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
            <p className="mt-2 text-xs text-slate-500">
              {lang === 'en'
                ? 'Aggregated metrics only — no emails or UIDs in this page.'
                : 'Agrégats uniquement — aucun e-mail / UID sur cette page.'}
            </p>
          </section>

          <section className="mt-10">
            <h2 className="text-xl font-extrabold text-slate-900">
              {lang === 'en'
                ? 'More than business: what connects us'
                : 'Des professionnels qui partagent plus que les affaires'}
            </h2>
            <p className="mt-1 text-slate-600">
              {lang === 'en' ? 'Cross-cutting interests across the network' : 'Ce qui unit notre communauté au-delà du business'}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {vitrine.topPassions.map((p) => {
                const textLabel = `${getPassionEmoji(p.passionId)} ${getPassionLabel(p.passionId, locale)} · ${p.memberCount} ${
                  lang === 'en' ? 'members' : 'membres'
                } · ${p.sectorCount} ${
                  lang === 'en' ? 'sectors' : lang === 'es' ? 'sectores' : 'secteurs'
                }`;
                return (
                  <span
                    key={p.passionId}
                    className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-800"
                  >
                    {textLabel}
                  </span>
                );
              })}
            </div>
          </section>

          <section className="mt-10">
            <h2 className="text-xl font-extrabold text-slate-900">
              {lang === 'en' ? '8 activity sectors — multi-sector by design' : '8 secteurs d’activité · Un réseau multi-sectoriel'}
            </h2>
            <p className="mt-1 text-slate-600">
              {lang === 'en' ? 'Top sectors represented in the directory' : 'Principaux secteurs représentés dans l’annuaire'}
            </p>
            <div className="mt-4 h-72 w-full min-w-0 max-w-full">
              <ResponsiveContainer>
                <BarChart data={topSectorsChart} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 6 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={140}
                    tick={{ fontSize: 11, fill: '#0f172a' }}
                  />
                  <Tooltip />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={16}>
                    {topSectorsChart.map((_, idx) => (
                      <Cell key={`${idx}`} fill={sectorColor(idx)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <NetworkGrowthSection
            growthCumulative={vitrine.growthCumulative}
            totalMembers={vitrine.totalMembers}
            newMembersLast30d={vitrine.newMembersLast30d}
            lang={lang}
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

          {vitrine.source === 'firestore' ? (
            <p className="mt-3 text-center text-[11px] text-slate-400">Source: public_vitrine + profils (agrégats)</p>
          ) : (
            <p className="mt-3 text-center text-[11px] text-slate-400">Source: profils (agrégats) — vues/contacts si compteurs présents</p>
          )}
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
    <div
      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
      style={{ boxShadow: '0 1px 2px rgba(15, 23, 42, 0.06)' }}
    >
      <div className="flex items-center justify-between gap-2" style={{ color: BRAND }}>
        {icon}
        <p className="text-2xl font-extrabold tabular-nums text-slate-900">{value.toLocaleString('fr-FR')}</p>
      </div>
      <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      {trend}
    </div>
  );
}
