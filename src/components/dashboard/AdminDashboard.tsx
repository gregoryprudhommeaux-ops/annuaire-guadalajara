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
import { Maximize2 } from 'lucide-react';
import { useAdminStats, type PeriodKey } from '@/hooks/useAdminStats';
import type { Language } from '@/types';
import AdminProfileInsights from '@/components/dashboard/AdminProfileInsights';
import AdminSiteInsights from '@/components/dashboard/AdminSiteInsights';

type TFn = (key: string) => string;

type AdminDashboardProps = {
  lang: Language;
  t: TFn;
};

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex min-h-[44px] w-full min-w-0 items-center justify-between gap-3 rounded-lg border border-stone-200 bg-white px-3 py-2 shadow-sm sm:min-h-[40px] sm:px-4 sm:py-2">
      <p className="min-w-0 flex-1 truncate text-[9px] font-semibold uppercase leading-tight tracking-wide text-stone-500 sm:text-[11px]" title={label}>
        {label}
      </p>
      <p className="shrink-0 text-base font-bold tabular-nums leading-none text-stone-900 sm:text-lg">{value}</p>
    </div>
  );
}

const legendProps = {
  verticalAlign: 'bottom' as const,
  layout: 'horizontal' as const,
  wrapperStyle: {
    fontSize: 10,
    paddingTop: 4,
    width: '100%',
    maxWidth: '100%',
    lineHeight: 1.2,
  },
  iconSize: 8,
};

function compactLabel(label: string, max = 14): string {
  const text = String(label ?? '').trim();
  if (!text) return '';
  if (text.length <= max) return text;
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length > 1) {
    const strong = words.find((w) => w.length >= 4);
    if (strong) return strong.length <= max ? strong : `${strong.slice(0, max - 1)}…`;
  }
  return `${text.slice(0, max - 1)}…`;
}

/** Ticks X Recharts : texte compact + tooltip natif (SVG title) avec libellé complet. */
function AdminXAxisTickCompactAngled({
  x,
  y,
  payload,
  maxChars,
  fontSize,
  fill,
}: {
  x: number;
  y: number;
  payload?: { value?: string | number };
  maxChars: number;
  fontSize: number;
  fill: string;
}) {
  const full = String(payload?.value ?? '');
  const short = compactLabel(full, maxChars);
  return (
    <g transform={`translate(${x},${y})`}>
      <title>{full}</title>
      <text textAnchor="end" dominantBaseline="hanging" fill={fill} fontSize={fontSize} transform="rotate(-20)">
        {short}
      </text>
    </g>
  );
}

function AdminXAxisTickCompactFlat({
  x,
  y,
  payload,
  maxChars,
  fontSize,
  fill,
}: {
  x: number;
  y: number;
  payload?: { value?: string | number };
  maxChars: number;
  fontSize: number;
  fill: string;
}) {
  const full = String(payload?.value ?? '');
  const short = compactLabel(full, maxChars);
  return (
    <g transform={`translate(${x},${y})`}>
      <title>{full}</title>
      <text textAnchor="middle" dominantBaseline="hanging" fill={fill} fontSize={fontSize}>
        {short}
      </text>
    </g>
  );
}

function ChartCard({
  title,
  onExpand,
  expandLabel,
  children,
}: {
  title: string;
  onExpand?: () => void;
  expandLabel: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-0 flex-col rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
      {onExpand ? (
        <button
          type="button"
          onClick={onExpand}
          className="absolute right-2 top-2 z-10 rounded-md p-1.5 text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
          aria-label={expandLabel}
          title={expandLabel}
        >
          <Maximize2 className="h-4 w-4" strokeWidth={2} aria-hidden />
        </button>
      ) : null}
      <h3 className="min-w-0 pr-10 text-sm font-semibold leading-snug text-stone-900">{title}</h3>
      {/* Zone graphique dédiée : overflow hidden pour que rien ne dépasse du cadre */}
      <div className="mt-3 h-72 w-full min-h-0 overflow-hidden">{children}</div>
    </div>
  );
}

type AdminInsightTab = 'overview' | 'profiles' | 'site';

export default function AdminDashboard({ lang, t }: AdminDashboardProps) {
  const [insightTab, setInsightTab] = useState<AdminInsightTab>('overview');
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
  const xTickCardAngled = (props: { x: number; y: number; payload?: { value?: string | number } }) => (
    <AdminXAxisTickCompactAngled {...props} maxChars={14} fontSize={10} fill="#64748b" />
  );
  const xTickCardFlat = (props: { x: number; y: number; payload?: { value?: string | number } }) => (
    <AdminXAxisTickCompactFlat {...props} maxChars={14} fontSize={10} fill="#64748b" />
  );
  const xTickModalAngled = (props: { x: number; y: number; payload?: { value?: string | number } }) => (
    <AdminXAxisTickCompactAngled {...props} maxChars={18} fontSize={12} fill="#475569" />
  );
  const xTickModalFlat = (props: { x: number; y: number; payload?: { value?: string | number } }) => (
    <AdminXAxisTickCompactFlat {...props} maxChars={18} fontSize={12} fill="#475569" />
  );
  const expandChartLabel =
    lang === 'en'
      ? 'Open chart in large view'
      : lang === 'es'
        ? 'Ampliar el gráfico'
        : 'Agrandir le graphique';

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap gap-2 border-b border-stone-200 pb-3">
        {(
          [
            ['overview', t('adminTabOverview')],
            ['profiles', t('adminTabProfiles')],
            ['site', t('adminTabSite')],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setInsightTab(key)}
            className={`rounded-lg px-3 py-2 text-xs font-semibold transition-colors sm:text-sm ${
              insightTab === key
                ? 'bg-stone-900 text-white'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {stats.loading ? <p className="text-sm text-stone-500">{loadingLabel}</p> : null}
      {!stats.loading && stats.error ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900">
          {stats.error}
        </p>
      ) : null}

      {!stats.loading && !stats.error && insightTab === 'profiles' ? (
        <>
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
          <AdminProfileInsights stats={stats} lang={lang} t={t} />
        </>
      ) : null}

      {!stats.loading && !stats.error && insightTab === 'site' ? (
        <>
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
          <AdminSiteInsights stats={stats} lang={lang} t={t} />
        </>
      ) : null}

      {!stats.loading && !stats.error && insightTab === 'overview' ? (
        <>
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

      <div className="grid w-full grid-cols-4 gap-2 sm:gap-3">
        <StatCard label={t('members') || 'Membres'} value={stats.totalProfiles} />
        <StatCard label="Nouveaux inscrits (periode)" value={stats.newProfilesInPeriod} />
        <StatCard label="Profils incomplets" value={stats.incompleteProfiles} />
        <StatCard label="Total clics contact" value={stats.totalClicks} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
        <ChartCard
          title="Repartition profils (type)"
          expandLabel={expandChartLabel}
          onExpand={() => setActiveChart('type')}
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 4, right: 8, bottom: 32, left: 8 }}>
              <Pie
                data={byTypeData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="42%"
                innerRadius={0}
                outerRadius="62%"
                paddingAngle={2}
                label={{ fontSize: 10, fill: '#475569' }}
              >
                {byTypeData.map((entry, index) => (
                  <Cell key={`${entry.name}-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 11 }} />
              <Legend {...legendProps} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Profils par statut"
          expandLabel={expandChartLabel}
          onExpand={() => setActiveChart('status')}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={byStatusData} margin={{ top: 8, right: 8, bottom: 64, left: 4 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                tick={xTickCardAngled}
                interval={0}
                angle={-20}
                textAnchor="end"
                height={56}
              />
              <YAxis allowDecimals={false} tick={chartTick} width={28} />
              <Tooltip contentStyle={{ fontSize: 11 }} />
              <Bar dataKey="value" fill="#1d4ed8" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Profils par ville"
          expandLabel={expandChartLabel}
          onExpand={() => setActiveChart('city')}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={byCityData} margin={{ top: 8, right: 8, bottom: 64, left: 4 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                tick={xTickCardAngled}
                interval={0}
                angle={-20}
                textAnchor="end"
                height={56}
              />
              <YAxis allowDecimals={false} tick={chartTick} width={28} />
              <Tooltip contentStyle={{ fontSize: 11 }} />
              <Bar dataKey="value" fill="#0284c7" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Profils par secteur"
          expandLabel={expandChartLabel}
          onExpand={() => setActiveChart('sector')}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={bySectorData} margin={{ top: 8, right: 8, bottom: 64, left: 4 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                tick={xTickCardAngled}
                interval={0}
                angle={-20}
                textAnchor="end"
                height={56}
              />
              <YAxis allowDecimals={false} tick={chartTick} width={28} />
              <Tooltip contentStyle={{ fontSize: 11 }} />
              <Bar dataKey="value" fill="#7c3aed" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Croissance profils (30 jours)"
          expandLabel={expandChartLabel}
          onExpand={() => setActiveChart('growth')}
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={stats.growthCurve} margin={{ top: 8, right: 8, bottom: 8, left: 4 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={chartTick} height={28} />
              <YAxis allowDecimals={false} tick={chartTick} width={28} />
              <Tooltip contentStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="count" stroke="#16a34a" strokeWidth={2} dot={{ r: 2 }} name="Profils cumulés" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Clics de contact par canal"
          expandLabel={expandChartLabel}
          onExpand={() => setActiveChart('clicks')}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.clicksByType} margin={{ top: 8, right: 8, bottom: 36, left: 4 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={xTickCardFlat} height={28} />
              <YAxis allowDecimals={false} tick={chartTick} width={28} />
              <Tooltip contentStyle={{ fontSize: 11 }} />
              <Legend {...legendProps} />
              <Bar dataKey="value" name="Clics" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
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
            <div className="h-[65vh] min-h-[420px] w-full overflow-hidden">
              <ResponsiveContainer width="100%" height="100%">
                <>
                  {activeChart === 'type' && (
                    <PieChart margin={{ top: 8, right: 16, bottom: 40, left: 16 }}>
                      <Pie
                        data={byTypeData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="44%"
                        outerRadius="68%"
                        label={{ fontSize: 11, fill: '#475569' }}
                      >
                        {byTypeData.map((entry, index) => (
                          <Cell key={`${entry.name}-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ fontSize: 12 }} />
                      <Legend
                        verticalAlign="bottom"
                        layout="horizontal"
                        wrapperStyle={{ fontSize: 12, width: '100%', paddingTop: 8 }}
                        iconSize={10}
                      />
                    </PieChart>
                  )}
                  {activeChart === 'status' && (
                    <BarChart data={byStatusData} margin={{ top: 10, right: 16, bottom: 72, left: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="name"
                        tick={xTickModalAngled}
                        interval={0}
                        angle={-20}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis allowDecimals={false} tick={modalTick} />
                      <Tooltip contentStyle={{ fontSize: 12 }} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="value" fill="#1d4ed8" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  )}
                  {activeChart === 'city' && (
                    <BarChart data={byCityData} margin={{ top: 10, right: 16, bottom: 72, left: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="name"
                        tick={xTickModalAngled}
                        interval={0}
                        angle={-20}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis allowDecimals={false} tick={modalTick} />
                      <Tooltip contentStyle={{ fontSize: 12 }} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="value" fill="#0284c7" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  )}
                  {activeChart === 'sector' && (
                    <BarChart data={bySectorData} margin={{ top: 10, right: 16, bottom: 72, left: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="name"
                        tick={xTickModalAngled}
                        interval={0}
                        angle={-20}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis allowDecimals={false} tick={modalTick} />
                      <Tooltip contentStyle={{ fontSize: 12 }} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="value" fill="#7c3aed" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  )}
                  {activeChart === 'growth' && (
                    <LineChart data={stats.growthCurve} margin={{ top: 12, right: 16, bottom: 16, left: 12 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tick={modalTick} />
                      <YAxis allowDecimals={false} tick={modalTick} />
                      <Tooltip contentStyle={{ fontSize: 12 }} />
                      <Legend
                        verticalAlign="bottom"
                        wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                        iconSize={10}
                      />
                      <Line
                        type="monotone"
                        dataKey="count"
                        name="Profils cumulés"
                        stroke="#16a34a"
                        strokeWidth={3}
                        dot={{ r: 3 }}
                      />
                    </LineChart>
                  )}
                  {activeChart === 'clicks' && (
                    <BarChart data={stats.clicksByType} margin={{ top: 12, right: 16, bottom: 40, left: 12 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={xTickModalFlat} />
                      <YAxis allowDecimals={false} tick={modalTick} />
                      <Tooltip contentStyle={{ fontSize: 12 }} />
                      <Legend
                        verticalAlign="bottom"
                        layout="horizontal"
                        wrapperStyle={{ fontSize: 12, width: '100%', paddingTop: 8 }}
                        iconSize={10}
                      />
                      <Bar dataKey="value" name="Clics" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  )}
                </>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
        </>
      ) : null}
    </section>
  );
}

