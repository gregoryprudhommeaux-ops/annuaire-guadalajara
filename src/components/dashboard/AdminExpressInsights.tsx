import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { Language } from '@/types';
import { useTimePeriod } from '@/contexts/TimePeriodContext';
import type { PeriodKey } from '@/hooks/useAdminStats';
import { useExpressDashboard } from '@/hooks/useExpressDashboard';
import { pickLang } from '@/lib/uiLocale';
import { cn } from '@/lib/cn';
import {
  downloadExpressCsv,
  filterExpressRowsByPeriod,
} from '@/lib/expressCsvExport';

type TFn = (key: string, params?: Record<string, string | number>) => string;

const CHART_COLORS = ['#01696f', '#0f766e', '#c4a35a', '#334155', '#b45309', '#0369a1', '#7c2d12', '#57534e'];

function Kpi({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="admin-kpi-card">
      <p className="admin-kpi-card__label">{label}</p>
      <p className="admin-kpi-card__value">{value}</p>
      {hint ? <p className="admin-kpi-card__trend">{hint}</p> : null}
    </div>
  );
}

function QuoteGrid({
  title,
  lead,
  items,
  empty,
}: {
  title: string;
  lead: string;
  items: Array<{ id: string; name: string; city: string; text: string }>;
  empty: string;
}) {
  return (
    <article className="admin-card">
      <h3 className="admin-card__title">{title}</h3>
      <p className="admin-card__text">{lead}</p>
      <div className="admin-card__body">
        {items.length === 0 ? (
          <p className="text-sm text-[var(--fn-muted)]">{empty}</p>
        ) : (
          <div className="express-quote-grid">
            {items.map((q) => (
              <Link key={q.id} to={`/profil/${encodeURIComponent(q.id)}`} className="express-quote-card">
                <p className="express-quote-card__text">“{q.text}”</p>
                <p className="express-quote-card__meta">
                  {q.name}
                  {q.city ? ` · ${q.city}` : ''}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

const EXPORT_PERIODS: Array<{ key: PeriodKey; labelKey: string }> = [
  { key: 'today', labelKey: 'adminTimePeriodToday' },
  { key: '7d', labelKey: 'adminTimePeriod7d' },
  { key: '30d', labelKey: 'adminTimePeriod30d' },
  { key: '90d', labelKey: 'adminTimePeriod90d' },
  { key: 'all', labelKey: 'adminTimePeriodAll' },
];

export default function AdminExpressInsights({ lang, t }: { lang: Language; t: TFn }) {
  const { period } = useTimePeriod();
  const data = useExpressDashboard(period as PeriodKey, lang);
  const [exportPeriod, setExportPeriod] = useState<PeriodKey>(period as PeriodKey);
  const tick = { fontSize: 10, fill: '#78716c' };

  useEffect(() => {
    setExportPeriod(period as PeriodKey);
  }, [period]);

  const exportRows = useMemo(
    () => filterExpressRowsByPeriod(data.allRows, exportPeriod),
    [data.allRows, exportPeriod]
  );

  const statusHint = useMemo(() => {
    if (data.rows.length === 0) return '—';
    return `${data.pendingCount} ${t('adminExpressPendingHint')}`;
  }, [data.pendingCount, data.rows.length, t]);

  const handleDownloadCsv = () => {
    if (exportRows.length === 0) return;
    downloadExpressCsv(exportRows, exportPeriod);
  };

  if (data.loading) {
    return <p className="text-sm text-[var(--fn-muted)]">{t('loading')}</p>;
  }
  if (data.error) {
    return (
      <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900">
        {data.error}
      </p>
    );
  }

  if (data.totalAllTime === 0) {
    return (
      <article className="admin-card">
        <p className="admin-card__eyebrow">EXPRESS</p>
        <h2 className="admin-card__title">{t('adminExpressEmptyTitle')}</h2>
        <p className="admin-card__text">{t('adminExpressEmptyLead')}</p>
        <div className="admin-card__body">
          <a href="/express" className="admin-pill" style={{ textDecoration: 'none', minHeight: 32 }}>
            {t('adminExpressOpenForm')}
          </a>
        </div>
      </article>
    );
  }

  return (
    <div className="express-dashboard space-y-5">
      <div className="admin-card" style={{ borderColor: 'rgba(1, 105, 111, 0.28)', background: 'rgba(230, 245, 245, 0.45)' }}>
        <p className="admin-card__eyebrow">EXPRESS</p>
        <h2 className="admin-card__title">{t('adminExpressTitle')}</h2>
        <p className="admin-card__text">{t('adminExpressLead')}</p>
      </div>

      <article className="admin-card express-export-card">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="admin-card__title">{t('adminExpressCsvTitle')}</h3>
            <p className="admin-card__text">{t('adminExpressCsvLead')}</p>
          </div>
          <button
            type="button"
            className="admin-pill is-active"
            style={{ minHeight: 36 }}
            disabled={exportRows.length === 0}
            onClick={handleDownloadCsv}
            title={
              exportRows.length === 0
                ? t('adminExpressCsvEmpty')
                : t('adminExpressCsvDownload', { count: exportRows.length })
            }
          >
            {t('adminExpressCsvDownload', { count: exportRows.length })}
          </button>
        </div>
        <div className="admin-card__body">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--fn-muted)]">
            {t('adminExpressCsvPeriodLabel')}
          </p>
          <div className="admin-period__pills" role="group" aria-label={t('adminExpressCsvPeriodLabel')}>
            {EXPORT_PERIODS.map((p) => (
              <button
                key={p.key}
                type="button"
                className={cn('admin-pill', p.key === exportPeriod && 'is-active')}
                onClick={() => setExportPeriod(p.key)}
              >
                {t(p.labelKey)}
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs text-[var(--fn-muted)]">{t('adminExpressCsvSheetsHint')}</p>
        </div>
      </article>

      <div className="admin-kpi-grid" id="admin-express-kpi">
        <Kpi
          label={t('adminExpressKpiTotal')}
          value={data.rows.length}
          hint={
            period === 'all'
              ? t('adminExpressAllTime')
              : t('adminExpressInPeriod', { total: data.totalAllTime })
          }
        />
        <Kpi
          label={t('adminExpressKpiLookingFor')}
          value={`${data.lookingForFillPct}%`}
          hint={t('adminExpressFillHint')}
        />
        <Kpi
          label={t('adminExpressKpiGap')}
          value={`${data.communityGapFillPct}%`}
          hint={t('adminExpressFillHint')}
        />
        <Kpi label={t('adminExpressKpiWhatsapp')} value={data.withWhatsapp} hint={statusHint} />
      </div>

      <div className="admin-analytics-grid">
        <article className="admin-chart-card">
          <h3 className="admin-chart-card__title">{t('adminExpressChartSignups')}</h3>
          <p className="admin-chart-card__subtitle">{t('adminExpressChartSignupsHint')}</p>
          <div className="admin-chart-card__body" style={{ height: 260 }}>
            {data.byDay.length === 0 ? (
              <p className="text-sm text-[var(--fn-muted)]">{t('adminExpressNoChartData')}</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.byDay} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
                  <defs>
                    <linearGradient id="expressSignupFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#01696f" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#01696f" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                  <XAxis dataKey="date" tick={tick} minTickGap={24} />
                  <YAxis allowDecimals={false} tick={tick} width={28} />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="count"
                    name={t('adminExpressLegendSignups')}
                    stroke="#01696f"
                    fill="url(#expressSignupFill)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </article>

        <article className="admin-chart-card">
          <h3 className="admin-chart-card__title">{t('adminExpressChartValidation')}</h3>
          <p className="admin-chart-card__subtitle">{t('adminExpressChartValidationHint')}</p>
          <div className="admin-chart-card__body" style={{ height: 260 }}>
            {data.byValidation.length === 0 ? (
              <p className="text-sm text-[var(--fn-muted)]">{t('adminExpressNoChartData')}</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.byValidation}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={52}
                    outerRadius={88}
                    paddingAngle={2}
                  >
                    {data.byValidation.map((entry, i) => (
                      <Cell key={entry.name} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </article>

        <article className="admin-chart-card">
          <h3 className="admin-chart-card__title">{t('adminExpressChartCities')}</h3>
          <p className="admin-chart-card__subtitle">{t('adminExpressChartCitiesHint')}</p>
          <div className="admin-chart-card__body" style={{ height: 260 }}>
            {data.byCity.length === 0 ? (
              <p className="text-sm text-[var(--fn-muted)]">{t('adminExpressNoChartData')}</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.byCity} layout="vertical" margin={{ top: 8, right: 12, bottom: 8, left: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                  <XAxis type="number" allowDecimals={false} tick={tick} />
                  <YAxis type="category" dataKey="name" width={90} tick={tick} />
                  <Tooltip />
                  <Bar dataKey="value" name={t('adminExpressLegendMembers')} fill="#01696f" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </article>

        <article className="admin-chart-card">
          <h3 className="admin-chart-card__title">{t('adminExpressChartNationality')}</h3>
          <p className="admin-chart-card__subtitle">{t('adminExpressChartNationalityHint')}</p>
          <div className="admin-chart-card__body" style={{ height: 260 }}>
            {data.byNationality.length === 0 ? (
              <p className="text-sm text-[var(--fn-muted)]">{t('adminExpressNoChartData')}</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.byNationality} margin={{ top: 8, right: 8, bottom: 28, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                  <XAxis dataKey="name" tick={tick} interval={0} angle={-20} textAnchor="end" height={48} />
                  <YAxis allowDecimals={false} tick={tick} width={28} />
                  <Tooltip />
                  <Bar dataKey="value" name={t('adminExpressLegendMembers')} radius={[6, 6, 0, 0]}>
                    {data.byNationality.map((entry, i) => (
                      <Cell key={entry.name} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </article>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <QuoteGrid
          title={t('adminExpressQuotesLookingTitle')}
          lead={t('adminExpressQuotesLookingLead')}
          items={data.lookingForQuotes}
          empty={t('adminExpressQuotesEmpty')}
        />
        <QuoteGrid
          title={t('adminExpressQuotesGapTitle')}
          lead={t('adminExpressQuotesGapLead')}
          items={data.communityGapQuotes}
          empty={t('adminExpressQuotesEmpty')}
        />
      </div>

      <article className="admin-card admin-chart-card--table">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="admin-card__title">{t('adminExpressTableTitle')}</h3>
            <p className="admin-card__text">{t('adminExpressTableLead')}</p>
          </div>
          <a href="/express" className="admin-pill" style={{ textDecoration: 'none', minHeight: 32 }}>
            {t('adminExpressOpenForm')}
          </a>
        </div>
        <div className="admin-card__body admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t('adminExpressColName')}</th>
                <th>{t('adminExpressColCity')}</th>
                <th>{t('adminExpressColLooking')}</th>
                <th>{t('adminExpressColGap')}</th>
                <th>{t('adminExpressColStatus')}</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.slice(0, 40).map((r) => {
                const status =
                  r.isValidated === true
                    ? t('adminExpressStatusValidated')
                    : r.isValidated === false || r.needsAdminReview
                      ? t('adminExpressStatusPending')
                      : '—';
                return (
                  <tr key={r.id}>
                    <td>
                      <Link to={`/profil/${encodeURIComponent(r.id)}`} className="font-semibold text-[var(--fn-fg)]">
                        {r.fullName}
                      </Link>
                      {r.companyName && r.companyName !== 'N/A' ? (
                        <div className="text-xs text-[var(--fn-muted)]">{r.companyName}</div>
                      ) : null}
                    </td>
                    <td>
                      {r.city || '—'}
                      {r.nationality ? (
                        <div className="text-xs text-[var(--fn-muted)]">{r.nationality}</div>
                      ) : null}
                    </td>
                    <td className="express-table-clip">{r.lookingFor || '—'}</td>
                    <td className="express-table-clip">{r.communityGap || '—'}</td>
                    <td>{status}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {data.rows.length > 40 ? (
            <p className="mt-3 text-xs text-[var(--fn-muted)]">
              {pickLang(
                `Affichage des 40 plus récents sur ${data.rows.length}.`,
                `Mostrando los 40 más recientes de ${data.rows.length}.`,
                `Showing the 40 most recent of ${data.rows.length}.`,
                lang
              )}
            </p>
          ) : null}
        </div>
      </article>
    </div>
  );
}
