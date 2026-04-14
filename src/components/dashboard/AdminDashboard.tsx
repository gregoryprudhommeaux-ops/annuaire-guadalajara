import React, { useEffect, useMemo, useState } from 'react';
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
import AdminEvents from '@/components/dashboard/AdminEvents';
import SectorDonutChart from '@/components/dashboard/SectorDonutChart';
import TimePeriodFilter from '@/components/dashboard/TimePeriodFilter';
import { TimePeriodProvider, useTimePeriod } from '@/contexts/TimePeriodContext';
import ProfileCompletionGauge from '@/components/dashboard/ProfileCompletionGauge';
import MembersMap from '@/components/dashboard/MembersMap';
import ConversionFunnel from '@/components/dashboard/ConversionFunnel';
import ActivityHeatmap from '@/components/dashboard/ActivityHeatmap';
import EngagementLeaderboard from '@/components/dashboard/EngagementLeaderboard';
import InscriptionAreaChart from '@/components/dashboard/InscriptionAreaChart';

type TFn = (key: string) => string;

type AdminDashboardProps = {
  lang: Language;
  t: TFn;
  initialTab?: 'overview' | 'profiles' | 'site' | 'events';
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

type AdminInsightTab = 'overview' | 'profiles' | 'site' | 'events';

export default function AdminDashboard({ lang, t, initialTab }: AdminDashboardProps) {
  return (
    <TimePeriodProvider defaultPeriod="30d">
      <AdminDashboardInner lang={lang} t={t} initialTab={initialTab} />
    </TimePeriodProvider>
  );
}

function AdminDashboardInner({ lang, t, initialTab }: AdminDashboardProps) {
  const [insightTab, setInsightTab] = useState<AdminInsightTab>('overview');
  const { period, setPeriod } = useTimePeriod();
  const [activeChart, setActiveChart] = useState<
    | null
    | 'type'
    | 'status'
    | 'city'
    | 'sector'
    | 'growth'
    | 'clicks'
  >(null);
  const stats = useAdminStats(period as PeriodKey);
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

  useEffect(() => {
    if (!initialTab) return;
    setInsightTab(initialTab);
  }, [initialTab]);

  return (
    <section className="space-y-6">
      <TimePeriodFilter />
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
          <AdminProfileInsights stats={stats} lang={lang} t={t} />
        </>
      ) : null}

      {!stats.loading && !stats.error && insightTab === 'site' ? (
        <>
          <AdminSiteInsights stats={stats} lang={lang} t={t} />
        </>
      ) : null}

      {!stats.loading && !stats.error && insightTab === 'overview' ? (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label={t('members') || 'Membres'} value={stats.totalProfiles} />
            <StatCard label="Nouveaux inscrits" value={stats.newProfilesInPeriod} />
            <ProfileCompletionGauge
              totalMembers={stats.totalProfiles}
              completedProfiles={stats.completedProfilesStrict}
            />
            <StatCard label="Clics contact" value={stats.totalClicks} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-5">
            <div className="xl:col-span-3">
              <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
                <h3 className="text-sm font-semibold text-stone-900">📍 Localisation des membres</h3>
                <p className="mt-1 text-xs text-stone-500">Guadalajara et alentours</p>
                <div className="mt-3">
                  <MembersMap
                    members={stats.profilesForDashboard.map((m) => ({
                      id: m.id,
                      nom: m.nom,
                      entreprise: m.entreprise,
                      secteur: m.secteur,
                      latitude: m.latitude,
                      longitude: m.longitude,
                    }))}
                  />
                </div>
              </div>
            </div>
            <div className="xl:col-span-2">
              <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
                <h3 className="text-sm font-semibold text-stone-900">Répartition par secteur</h3>
                <p className="mt-1 text-xs text-stone-500">Profils (toutes périodes)</p>
                <div className="mt-3">
                  <SectorDonutChart data={bySectorData.map((d) => ({ secteur: d.name, count: d.value }))} />
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-5">
            <div className="xl:col-span-3">
              <InscriptionAreaChart members={stats.profilesCreatedAt} />
            </div>
            <div className="xl:col-span-2">
              <ConversionFunnel
                inscritsOAuth={stats.totalProfiles}
                profilsComplets={stats.completedProfilesStrict}
                membresActifs={stats.activeMembersWithContactClicks}
              />
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-5">
            <div className="xl:col-span-3">
              <ActivityHeatmap members={stats.profilesCreatedAt} />
            </div>
            <div className="xl:col-span-2">
              <EngagementLeaderboard members={stats.profilesForDashboard as any} />
            </div>
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
                        innerRadius="48%"
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

      {insightTab === 'events' ? (
        <AdminEvents lang={lang} t={t} />
      ) : null}
    </section>
  );
}

