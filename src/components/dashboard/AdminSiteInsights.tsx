import React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { AdminStats } from '@/hooks/useAdminStats';
import type { Language } from '@/types';

type TFn = (key: string) => string;

function StatBox({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-500">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums text-stone-900">{value}</p>
      {sub ? <p className="mt-1 text-xs text-stone-500">{sub}</p> : null}
    </div>
  );
}

export default function AdminSiteInsights({
  stats,
  lang,
  t,
}: {
  stats: AdminStats;
  lang: Language;
  t: TFn;
}) {
  const chartTick = { fontSize: 10, fill: '#64748b' };

  const spaData = stats.spaRouteTopPaths.map((r) => ({
    path: r.path.length > 28 ? `${r.path.slice(0, 26)}…` : r.path,
    fullPath: r.path,
    count: r.count,
  }));

  const periodHint =
    lang === 'en'
      ? 'Events in the selected period (Firestore).'
      : lang === 'es'
        ? 'Eventos en el periodo seleccionado (Firestore).'
        : 'Événements sur la période sélectionnée (Firestore).';

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-amber-100 bg-amber-50/80 px-4 py-3 text-sm leading-relaxed text-amber-950">
        {t('adminSiteInsightsDisclaimer')}
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatBox label={t('adminStatSpaViews')} value={stats.totalSpaRouteEvents} sub={periodHint} />
        <StatBox label={t('adminStatProfileViews')} value={stats.totalProfileViewEvents} sub={t('adminStatProfileViewsHint')} />
        <StatBox label={t('adminStatContactClicks')} value={stats.totalClicks} />
        <StatBox label={t('adminStatSearchEvents')} value={stats.searchEvents + stats.filterEvents} sub={t('adminStatSearchFilterHint')} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-stone-900">{t('adminChartTopRoutes')}</h3>
          <p className="mt-1 text-xs text-stone-500">{t('adminChartTopRoutesHint')}</p>
          <div className="mt-3 h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={spaData} layout="vertical" margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" allowDecimals={false} tick={chartTick} />
                <YAxis type="category" dataKey="path" width={100} tick={{ fontSize: 9, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{ fontSize: 11 }}
                  formatter={(value: number, _n, item) => {
                    const full = (item?.payload as { fullPath?: string })?.fullPath;
                    return [value, full ? `${t('adminLegendViews')} — ${full}` : t('adminLegendViews')];
                  }}
                />
                <Bar dataKey="count" fill="#0ea5e9" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-stone-900">{t('adminChartEventTypes')}</h3>
          <p className="mt-1 text-xs text-stone-500">{periodHint}</p>
          <div className="mt-3 h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.eventCountsByType} margin={{ top: 8, right: 8, bottom: 56, left: 4 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 8, fill: '#64748b' }} angle={-25} textAnchor="end" height={52} interval={0} />
                <YAxis allowDecimals={false} tick={chartTick} width={28} />
                <Tooltip contentStyle={{ fontSize: 11 }} />
                <Bar dataKey="value" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
