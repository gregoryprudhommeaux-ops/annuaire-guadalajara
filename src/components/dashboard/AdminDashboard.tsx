import React, { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useAdminStats, type PeriodKey } from '@/hooks/useAdminStats';
import type { Language } from '@/types';

type TFn = (key: string) => string;

type AdminDashboardProps = {
  lang: Language;
  t: TFn;
};

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex min-h-[124px] flex-col justify-between rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-stone-500">{label}</p>
      <p className="text-2xl font-bold leading-none text-stone-900">{value}</p>
    </div>
  );
}

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-stone-900">{title}</h3>
      <div className="mt-4 h-72 w-full">{children}</div>
    </div>
  );
}

export default function AdminDashboard({ lang, t }: AdminDashboardProps) {
  const [period, setPeriod] = useState<PeriodKey>('week');
  const [activeChart, setActiveChart] = useState<
    | null
    | 'type'
    | 'status'
    | 'city'
    | 'sector'
    | 'growth'
    | 'clicks'
  >(null);
  const stats = useAdminStats(period);
  const loadingLabel = lang === 'es' ? 'Cargando…' : lang === 'en' ? 'Loading…' : 'Chargement…';
  const bySectorData = useMemo(
    () => Object.entries(stats.profilesBySector).map(([name, value]) => ({ name, value })),
    [stats.profilesBySector]
  );
  const byCityData = useMemo(
    () => Object.entries(stats.profilesByCity).map(([name, value]) => ({ name, value })),
    [stats.profilesByCity]
  );
  const byStatusData = useMemo(
    () => Object.entries(stats.profilesByStatus).map(([name, value]) => ({ name, value })),
    [stats.profilesByStatus]
  );
  const byTypeData = [
    { name: 'Entreprise', value: stats.profilesByType.entreprise },
    { name: 'Membre', value: stats.profilesByType.membre },
  ];
  const COLORS = ['#1d4ed8', '#16a34a', '#0284c7', '#7c3aed', '#ea580c', '#334155'];
  const chartTick = { fontSize: 10, fill: '#64748b' };
  const modalTick = { fontSize: 12, fill: '#475569' };

  if (stats.loading) {
    return <p className="text-sm text-stone-500">{loadingLabel}</p>;
  }

  if (stats.error) {
    return (
      <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900">
        {stats.error}
      </p>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        {(['today', 'week', 'month', 'all'] as PeriodKey[]).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPeriod(p)}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
              period === p
                ? 'bg-blue-700 text-white'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
            }`}
          >
            {p === 'today' ? 'Aujourd’hui' : p === 'week' ? '7 jours' : p === 'month' ? '30 jours' : 'Tout'}
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={t('members') || 'Membres'} value={stats.totalProfiles} />
        <StatCard label="Nouveaux inscrits (periode)" value={stats.newProfilesInPeriod} />
        <StatCard label="Profils incomplets" value={stats.incompleteProfiles} />
        <StatCard label="Total clics contact" value={stats.totalClicks} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
        <ChartCard title="Repartition profils (type)">
          <div className="mb-2 flex justify-end">
            <button
              type="button"
              onClick={() => setActiveChart('type')}
              className="rounded-md border border-stone-200 px-2 py-1 text-[11px] font-medium text-stone-600 hover:bg-stone-50"
            >
              Agrandir
            </button>
          </div>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={byTypeData} dataKey="value" nameKey="name" outerRadius={100} label>
                {byTypeData.map((entry, index) => (
                  <Cell key={`${entry.name}-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 11 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Profils par statut">
          <div className="mb-2 flex justify-end">
            <button
              type="button"
              onClick={() => setActiveChart('status')}
              className="rounded-md border border-stone-200 px-2 py-1 text-[11px] font-medium text-stone-600 hover:bg-stone-50"
            >
              Agrandir
            </button>
          </div>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={byStatusData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={chartTick} interval={0} angle={-20} textAnchor="end" height={70} />
              <YAxis allowDecimals={false} tick={chartTick} />
              <Tooltip contentStyle={{ fontSize: 11 }} />
              <Bar dataKey="value" fill="#1d4ed8" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Profils par ville">
          <div className="mb-2 flex justify-end">
            <button
              type="button"
              onClick={() => setActiveChart('city')}
              className="rounded-md border border-stone-200 px-2 py-1 text-[11px] font-medium text-stone-600 hover:bg-stone-50"
            >
              Agrandir
            </button>
          </div>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={byCityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={chartTick} interval={0} angle={-20} textAnchor="end" height={70} />
              <YAxis allowDecimals={false} tick={chartTick} />
              <Tooltip contentStyle={{ fontSize: 11 }} />
              <Bar dataKey="value" fill="#0284c7" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Profils par secteur">
          <div className="mb-2 flex justify-end">
            <button
              type="button"
              onClick={() => setActiveChart('sector')}
              className="rounded-md border border-stone-200 px-2 py-1 text-[11px] font-medium text-stone-600 hover:bg-stone-50"
            >
              Agrandir
            </button>
          </div>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={bySectorData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={chartTick} interval={0} angle={-20} textAnchor="end" height={70} />
              <YAxis allowDecimals={false} tick={chartTick} />
              <Tooltip contentStyle={{ fontSize: 11 }} />
              <Bar dataKey="value" fill="#7c3aed" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Croissance profils (30 jours)">
          <div className="mb-2 flex justify-end">
            <button
              type="button"
              onClick={() => setActiveChart('growth')}
              className="rounded-md border border-stone-200 px-2 py-1 text-[11px] font-medium text-stone-600 hover:bg-stone-50"
            >
              Agrandir
            </button>
          </div>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={stats.growthCurve}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={chartTick} />
              <YAxis allowDecimals={false} tick={chartTick} />
              <Tooltip contentStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="count" stroke="#16a34a" strokeWidth={3} dot={{ r: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Clics de contact par canal">
          <div className="mb-2 flex justify-end">
            <button
              type="button"
              onClick={() => setActiveChart('clicks')}
              className="rounded-md border border-stone-200 px-2 py-1 text-[11px] font-medium text-stone-600 hover:bg-stone-50"
            >
              Agrandir
            </button>
          </div>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.clicksByType}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={chartTick} />
              <YAxis allowDecimals={false} tick={chartTick} />
              <Tooltip contentStyle={{ fontSize: 11 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="value" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {activeChart && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-stone-900/60 p-4">
          <div className="w-full max-w-5xl rounded-2xl bg-white p-4 shadow-2xl sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-stone-900">
                {activeChart === 'type' && 'Repartition profils (type)'}
                {activeChart === 'status' && 'Profils par statut'}
                {activeChart === 'city' && 'Profils par ville'}
                {activeChart === 'sector' && 'Profils par secteur'}
                {activeChart === 'growth' && 'Croissance profils (30 jours)'}
                {activeChart === 'clicks' && 'Clics de contact par canal'}
              </h3>
              <button
                type="button"
                onClick={() => setActiveChart(null)}
                className="rounded-md border border-stone-200 px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-50"
              >
                Fermer
              </button>
            </div>
            <div className="h-[65vh] min-h-[420px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <>
                  {activeChart === 'type' && (
                    <PieChart>
                      <Pie data={byTypeData} dataKey="value" nameKey="name" outerRadius={150} label>
                        {byTypeData.map((entry, index) => (
                          <Cell key={`${entry.name}-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ fontSize: 12 }} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                    </PieChart>
                  )}
                  {activeChart === 'status' && (
                    <BarChart data={byStatusData} margin={{ top: 10, right: 16, bottom: 70, left: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={modalTick} interval={0} angle={-20} textAnchor="end" height={80} />
                      <YAxis allowDecimals={false} tick={modalTick} />
                      <Tooltip contentStyle={{ fontSize: 12 }} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="value" fill="#1d4ed8" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  )}
                  {activeChart === 'city' && (
                    <BarChart data={byCityData} margin={{ top: 10, right: 16, bottom: 70, left: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={modalTick} interval={0} angle={-20} textAnchor="end" height={80} />
                      <YAxis allowDecimals={false} tick={modalTick} />
                      <Tooltip contentStyle={{ fontSize: 12 }} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="value" fill="#0284c7" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  )}
                  {activeChart === 'sector' && (
                    <BarChart data={bySectorData} margin={{ top: 10, right: 16, bottom: 70, left: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={modalTick} interval={0} angle={-20} textAnchor="end" height={80} />
                      <YAxis allowDecimals={false} tick={modalTick} />
                      <Tooltip contentStyle={{ fontSize: 12 }} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="value" fill="#7c3aed" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  )}
                  {activeChart === 'growth' && (
                    <LineChart data={stats.growthCurve}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tick={modalTick} />
                      <YAxis allowDecimals={false} tick={modalTick} />
                      <Tooltip contentStyle={{ fontSize: 12 }} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Line type="monotone" dataKey="count" stroke="#16a34a" strokeWidth={3} dot={{ r: 3 }} />
                    </LineChart>
                  )}
                  {activeChart === 'clicks' && (
                    <BarChart data={stats.clicksByType}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={modalTick} />
                      <YAxis allowDecimals={false} tick={modalTick} />
                      <Tooltip contentStyle={{ fontSize: 12 }} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="value" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  )}
                </>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

