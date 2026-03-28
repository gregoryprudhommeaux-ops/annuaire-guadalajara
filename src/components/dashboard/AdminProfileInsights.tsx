import React, { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
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

export default function AdminProfileInsights({
  stats,
  lang,
  t,
}: {
  stats: AdminStats;
  lang: Language;
  t: TFn;
}) {
  const chartTick = { fontSize: 10, fill: '#64748b' };

  const regData = useMemo(
    () =>
      stats.registrationsByDay.map((d) => ({
        date: d.date.slice(5),
        count: d.count,
      })),
    [stats.registrationsByDay]
  );

  const periodHint =
    lang === 'en'
      ? 'According to the period selected above.'
      : lang === 'es'
        ? 'Según el periodo seleccionado arriba.'
        : 'Selon la période sélectionnée ci-dessus.';

  return (
    <div className="space-y-6">
      <p className="text-sm leading-relaxed text-stone-600">{t('adminProfileInsightsIntro')}</p>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatBox label={t('adminStatAvgCompletion')} value={`${stats.avgProfileCompletionPct}%`} sub={t('adminStatProfileScoreHint')} />
        <StatBox label={t('adminStatMedianCompletion')} value={`${stats.medianProfileCompletionPct}%`} />
        <StatBox label={t('adminStatValidated')} value={stats.validatedProfiles} />
        <StatBox label={t('adminStatPendingReview')} value={stats.pendingReviewProfiles} />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatBox label={t('adminStatNewRegistrations')} value={stats.newProfilesInPeriod} sub={periodHint} />
        <StatBox label={t('adminStatProfilesUpdated')} value={stats.profilesUpdatedInPeriod} sub={periodHint} />
        <StatBox label={t('adminStatNeverEdited')} value={stats.profilesNeverUpdated} sub={t('adminStatNeverEditedHint')} />
        <StatBox label={t('adminStatContactFilled')} value={`${stats.completionRate}%`} sub={t('adminStatContactFilledHint')} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-stone-900">{t('adminChartCompletionBuckets')}</h3>
          <p className="mt-1 text-xs text-stone-500">{t('adminChartCompletionBucketsHint')}</p>
          <div className="mt-3 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.completionHistogram} margin={{ top: 8, right: 8, bottom: 8, left: 4 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" tick={chartTick} />
                <YAxis allowDecimals={false} tick={chartTick} width={28} />
                <Tooltip contentStyle={{ fontSize: 11 }} />
                <Bar dataKey="count" fill="#4f46e5" name={t('adminLegendProfiles')} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-stone-900">{t('adminChartRegistrationsByDay')}</h3>
          <p className="mt-1 text-xs text-stone-500">{periodHint}</p>
          <div className="mt-3 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={regData} margin={{ top: 8, right: 8, bottom: 8, left: 4 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={chartTick} />
                <YAxis allowDecimals={false} tick={chartTick} width={28} />
                <Tooltip contentStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="count" stroke="#059669" strokeWidth={2} dot={{ r: 2 }} name={t('adminLegendRegistrations')} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
