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
import { useTimePeriod } from '@/contexts/TimePeriodContext';
import ProfileCompletionGauge from '@/components/dashboard/ProfileCompletionGauge';
import InscriptionAreaChart from '@/components/dashboard/InscriptionAreaChart';
import { getPassionEmoji, getPassionLabel, sanitizePassionIds } from '@/lib/passionConfig';
import PassionsCrossHeatmap, { type CrossPick } from '@/components/dashboard/PassionsCrossHeatmap';
import TopActiveMembersTable from '@/components/dashboard/TopActiveMembersTable';

type TFn = (key: string) => string;

type AdminDashboardProps = {
  lang: Language;
  t: TFn;
  initialTab?: 'overview' | 'profiles' | 'site' | 'events';
  /** Injected from `AdminPage` for STEP 1 priority zone. */
  priorityLeft?: React.ReactNode;
  priorityRight?: React.ReactNode;
};

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex w-full min-w-0 items-baseline justify-between gap-3 rounded-lg border border-stone-200 bg-white px-3 py-2 shadow-sm">
      <p
        className="min-w-0 flex-1 truncate text-[10px] font-semibold leading-tight tracking-wide text-stone-500 sm:text-[11px]"
        title={label}
      >
        {label}
      </p>
      <p className="shrink-0 text-base font-bold tabular-nums leading-none text-stone-900 sm:text-lg">
        {value}
      </p>
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
type AffinityViewKey = 'top' | 'matrix' | 'insights' | 'table';

export default function AdminDashboard({ lang, t, initialTab }: AdminDashboardProps) {
  return <AdminDashboardInner lang={lang} t={t} initialTab={initialTab} />;
}

class MiniErrorBoundary extends React.Component<
  { children: React.ReactNode; label: string },
  { hasError: boolean; msg: string }
> {
  // See note in `src/App.tsx` SectionErrorBoundary.
  declare props: { children: React.ReactNode; label: string };
  declare setState: (s: Partial<{ hasError: boolean; msg: string }>) => void;
  state: { hasError: boolean; msg: string } = { hasError: false, msg: '' };
  static getDerivedStateFromError() {
    return { hasError: true, msg: '' };
  }
  componentDidCatch(error: unknown) {
    const msg = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
    console.error(`[AdminDashboard] ${this.props.label} crashed:`, error);
    this.setState({ msg });
  }
  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
        <p className="font-semibold">Widget en erreur: {this.props.label}</p>
        {this.state.msg ? <p className="mt-1 text-xs text-rose-800">{this.state.msg}</p> : null}
      </div>
    );
  }
}

function AdminDashboardInner({ lang, t, initialTab, priorityLeft, priorityRight }: AdminDashboardProps) {
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
  const [pickedCross, setPickedCross] = useState<CrossPick | null>(null);
  const [crossDimension, setCrossDimension] = useState<'sector' | 'poste' | 'industrie'>('sector');
  const [affinityView, setAffinityView] = useState<AffinityViewKey>('top');
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

  const pickedCrossMembers = useMemo(() => {
    if (!pickedCross) return { title: '', rows: [] as typeof stats.profilesForDashboard };
    const locale = lang === 'es' ? 'es' : lang === 'en' ? 'en' : 'fr';
    const passionLabel = `${getPassionEmoji(pickedCross.passionId)} ${getPassionLabel(pickedCross.passionId, locale)}`;
    const dimLabel =
      pickedCross.dimension === 'sector' ? 'Secteur' : pickedCross.dimension === 'status' ? 'Statut' : 'Ville';
    const title = `${passionLabel} × ${dimLabel}: ${pickedCross.dimValue}`;
    const rows = (stats.profilesForDashboard ?? []).filter((m) => {
      const hasPassion = sanitizePassionIds((m as any).passionIds).includes(pickedCross.passionId);
      if (!hasPassion) return false;
      const dimValue =
        pickedCross.dimension === 'sector'
          ? String(m.secteur ?? '').trim() || '—'
          : pickedCross.dimension === 'status'
            ? String((m as any).status ?? '').trim() || '—'
            : String((m as any).city ?? '').trim() || '—';
      return dimValue === pickedCross.dimValue;
    });
    return { title, rows };
  }, [pickedCross, stats.profilesForDashboard, lang]);

  const affinityRows = useMemo(() => {
    const locale = lang === 'es' ? 'es' : lang === 'en' ? 'en' : 'fr';
    const map = new Map<
      string,
      { passionId: string; sector: string; count: number; memberIds: Set<string> }
    >();
    for (const m of stats.profilesForDashboard ?? []) {
      const sector = String(m.secteur ?? '').trim() || '—';
      const passionIds = sanitizePassionIds((m as any).passionIds);
      if (!sector || passionIds.length === 0) continue;
      for (const pid of passionIds) {
        const key = `${pid}||${sector}`;
        const entry = map.get(key) ?? { passionId: pid, sector, count: 0, memberIds: new Set<string>() };
        entry.count += 1;
        entry.memberIds.add(String(m.id));
        map.set(key, entry);
      }
    }
    const rows = Array.from(map.values())
      .map((r) => {
        const passionLabel = `${getPassionEmoji(r.passionId)} ${getPassionLabel(r.passionId, locale)}`;
        const members = r.memberIds.size;
        const actionType = members >= 4 ? 'événement' : members >= 2 ? 'dîner' : 'intro';
        return { ...r, members, passionLabel, actionType };
      })
      .sort((a, b) => b.members - a.members || b.count - a.count);
    return rows;
  }, [stats.profilesForDashboard, lang]);

  const affinityTop = useMemo(() => affinityRows.slice(0, 10), [affinityRows]);
  const affinityInsights = useMemo(() => {
    if (affinityRows.length === 0) return null;
    const byPassion = new Map<string, number>();
    const bySector = new Map<string, number>();
    for (const r of affinityRows) {
      byPassion.set(r.passionId, (byPassion.get(r.passionId) ?? 0) + r.members);
      bySector.set(r.sector, (bySector.get(r.sector) ?? 0) + r.members);
    }
    const topPassionId = Array.from(byPassion.entries()).sort((a, b) => b[1] - a[1])[0]?.[0];
    const topSector = Array.from(bySector.entries()).sort((a, b) => b[1] - a[1])[0]?.[0];
    const strongest = affinityRows[0];
    const locale = lang === 'es' ? 'es' : lang === 'en' ? 'en' : 'fr';
    const passionLabel = topPassionId
      ? `${getPassionEmoji(topPassionId)} ${getPassionLabel(topPassionId, locale)}`
      : '—';
    return {
      topPassionLabel: passionLabel,
      topPassionScore: topPassionId ? byPassion.get(topPassionId) ?? 0 : 0,
      topSector: topSector ?? '—',
      topSectorScore: topSector ? bySector.get(topSector) ?? 0 : 0,
      strongest,
    };
  }, [affinityRows, lang]);

  // STEP 1 (today): focus on a clean decision-oriented overview. Keep other tabs intact for later.
  useEffect(() => {
    if (insightTab !== 'overview') setInsightTab('overview');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section>
      {stats.loading ? <p className="text-sm text-slate-500">{loadingLabel}</p> : null}
      {!stats.loading && stats.error ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900">
          {stats.error}
        </p>
      ) : null}

      {!stats.loading && !stats.error && insightTab === 'overview' ? (
        <>
          {/* B. Strategic KPI band */}
          <div className="admin-kpi-grid">
            <div className="admin-kpi-card">
              <p className="admin-kpi-card__label">{t('members') || 'Membres'}</p>
              <p className="admin-kpi-card__value">{stats.totalProfiles}</p>
            </div>
            <div className="admin-kpi-card">
              <p className="admin-kpi-card__label">Nouveaux inscrits</p>
              <p className="admin-kpi-card__value">{stats.newProfilesInPeriod}</p>
            </div>
            <div className="admin-kpi-card">
              <p className="admin-kpi-card__label">Clics contact</p>
              <p className="admin-kpi-card__value">{stats.totalClicks}</p>
            </div>
            <div className="admin-kpi-card">
              <p className="admin-kpi-card__label">Profils complets</p>
              <p className="admin-kpi-card__value">{stats.completedProfilesStrict}</p>
            </div>
            <div className="admin-kpi-card">
              <p className="admin-kpi-card__label">En attente</p>
              <p className="admin-kpi-card__value">{stats.pendingReviewProfiles}</p>
            </div>
            <div className="admin-kpi-card">
              <p className="admin-kpi-card__label">Vues profils</p>
              <p className="admin-kpi-card__value">{stats.totalProfileViewEvents}</p>
            </div>
          </div>

          {/* C. Priority action zone */}
          <div className="admin-priority-grid">
            <div className="min-w-0">{priorityLeft ?? null}</div>
            <div className="min-w-0">{priorityRight ?? null}</div>
          </div>

          {/* D. Analytics grid */}
          <div className="admin-analytics-grid">
            <div className="admin-stack">
              <article className="admin-chart-card admin-chart-card--compact">
                <p className="admin-chart-card__title">Évolution des inscriptions</p>
                <p className="admin-chart-card__subtitle">Courbe basée sur les profils créés</p>
                <div className="admin-chart-card__body">
                  <div className="admin-chart-frame">
                    <MiniErrorBoundary label="InscriptionAreaChart">
                      <InscriptionAreaChart members={stats.profilesCreatedAt} height={320} />
                    </MiniErrorBoundary>
                  </div>
                </div>
              </article>

              <article className="admin-chart-card admin-chart-card--compact admin-chart-card--donut">
                <p className="admin-chart-card__title">Répartition par secteur</p>
                <p className="admin-chart-card__subtitle">Lecture rapide par univers d’activité</p>
                <div className="admin-chart-card__body">
                  <div className="admin-chart-frame admin-chart-frame--sm">
                    <SectorDonutChart
                      data={bySectorData.map((d) => ({ secteur: d.name, count: d.value }))}
                      height={280}
                    />
                  </div>
                </div>
              </article>
            </div>

            <div className="admin-stack">
              <article className="admin-chart-card admin-chart-card--compact">
                <p className="admin-chart-card__title">Complétion des profils</p>
                <p className="admin-chart-card__subtitle">Vue “strict” (nom, secteur, description, photo)</p>
                <div className="admin-chart-card__body">
                  <div className="admin-chart-frame admin-chart-frame--sm">
                    <MiniErrorBoundary label="ProfileCompletionGauge">
                      <ProfileCompletionGauge
                        totalMembers={stats.totalProfiles}
                        completedProfiles={stats.completedProfilesStrict}
                      />
                    </MiniErrorBoundary>
                  </div>
                </div>
              </article>

              <article className="admin-chart-card admin-chart-card--table">
                <p className="admin-chart-card__title">Membres les plus actifs</p>
                <p className="admin-chart-card__subtitle">Basé sur les clics de contact</p>
                <div className="admin-chart-card__body">
                  <div className="admin-table-wrap">
                    <MiniErrorBoundary label="TopActiveMembersTable">
                      <TopActiveMembersTable members={stats.profilesForDashboard as any} lang={lang} />
                    </MiniErrorBoundary>
                  </div>
                </div>
              </article>
            </div>
          </div>

          {/* E. Deep-dive */}
          <div className="admin-bottom-section">
            <article className="admin-chart-card admin-chart-card--affinity">
              <p className="admin-chart-card__title">Affinités relationnelles du réseau</p>
              <p className="admin-chart-card__subtitle">
                Identifie les centres d’intérêt transverses qui facilitent les connexions, les dîners thématiques et les formats d’événements ciblés.
              </p>

              <div className="admin-affinity-tabs" role="tablist" aria-label="Vues affinités">
                <button
                  type="button"
                  role="tab"
                  aria-selected={affinityView === 'top'}
                  className={affinityView === 'top' ? 'admin-affinity-tab is-active' : 'admin-affinity-tab'}
                  onClick={() => setAffinityView('top')}
                >
                  Top affinités
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={affinityView === 'matrix'}
                  className={affinityView === 'matrix' ? 'admin-affinity-tab is-active' : 'admin-affinity-tab'}
                  onClick={() => setAffinityView('matrix')}
                >
                  Matrice
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={affinityView === 'insights'}
                  className={affinityView === 'insights' ? 'admin-affinity-tab is-active' : 'admin-affinity-tab'}
                  onClick={() => setAffinityView('insights')}
                >
                  Insights
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={affinityView === 'table'}
                  className={affinityView === 'table' ? 'admin-affinity-tab is-active' : 'admin-affinity-tab'}
                  onClick={() => setAffinityView('table')}
                >
                  Tableau
                </button>
              </div>

              <div className="admin-chart-card__body">
                {affinityView === 'top' ? (
                  <div className="admin-affinity-top">
                    <p className="admin-affinity-hint">Les combinaisons les plus prometteuses pour animer la communauté.</p>
                    <div className="admin-affinity-ranked">
                      {affinityTop.length === 0 ? (
                        <p className="text-sm text-slate-600">Pas encore assez de données pour classer les affinités.</p>
                      ) : (
                        affinityTop.map((r, idx) => (
                          <div key={`${r.passionId}||${r.sector}`} className="admin-affinity-row">
                            <div className="admin-affinity-row__main">
                              <p className="admin-affinity-row__title">
                                <span className="admin-affinity-rank">{idx + 1}</span>
                                <span className="truncate">{r.passionLabel}</span>
                                <span className="admin-affinity-sep">×</span>
                                <span className="truncate">{r.sector}</span>
                              </p>
                              <p className="admin-affinity-row__meta">
                                {r.members} membre(s) · usage suggéré : <strong>{r.actionType}</strong>
                              </p>
                            </div>
                            <button
                              type="button"
                              className="admin-affinity-cta"
                              onClick={() => setPickedCross({ passionId: r.passionId, dimValue: r.sector, dimension: 'sector' })}
                            >
                              Voir membres
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ) : null}

                {affinityView === 'matrix' ? (
                  <>
                    <div className="admin-matrix-toolbar">
                      <p className="admin-matrix-caption">
                        Cliquez une case pour identifier les membres associés à une combinaison d’intérêt.
                      </p>
                      <label>
                        <span className="sr-only">Vue de la matrice</span>
                        <select
                          className="admin-matrix-filter"
                          value={crossDimension}
                          onChange={(e) => setCrossDimension(e.target.value as any)}
                        >
                          <option value="sector">Vue : secteur</option>
                          <option value="poste">Vue : fonction</option>
                          <option value="industrie">Vue : industrie</option>
                        </select>
                      </label>
                    </div>
                    <div className="admin-chart-frame">
                      <MiniErrorBoundary label="PassionsCrossHeatmap">
                        <PassionsCrossHeatmap
                          members={stats.profilesForDashboard.map((m) => ({
                            id: m.id,
                            secteur: m.secteur,
                            positionCategory: (m as any).positionCategory,
                            activityCategory: (m as any).activityCategory,
                            passionIds: (m as any).passionIds,
                          }))}
                          lang={lang}
                          embedded
                          showHeader={false}
                          dimension={crossDimension as any}
                          onDimensionChange={(next) => setCrossDimension(next as any)}
                          onPickCell={(pick) => setPickedCross(pick)}
                        />
                      </MiniErrorBoundary>
                    </div>
                    <div className="admin-insight">
                      <strong>Lecture rapide :</strong> la matrice sert à explorer la distribution des signaux. Pour une lecture immédiate et actionnable, utilisez “Top affinités”.
                    </div>
                  </>
                ) : null}

                {affinityView === 'insights' ? (
                  <div className="admin-affinity-insights">
                    {affinityInsights ? (
                      <div className="admin-insight-grid">
                        <div className="admin-insight-card">
                          <p className="admin-insight-card__label">Passion la plus fédératrice</p>
                          <p className="admin-insight-card__value">{affinityInsights.topPassionLabel}</p>
                          <p className="admin-insight-card__meta">{affinityInsights.topPassionScore} occurrences (approx.)</p>
                        </div>
                        <div className="admin-insight-card">
                          <p className="admin-insight-card__label">Secteur le plus affinitaire</p>
                          <p className="admin-insight-card__value">{affinityInsights.topSector}</p>
                          <p className="admin-insight-card__meta">{affinityInsights.topSectorScore} occurrences (approx.)</p>
                        </div>
                        <div className="admin-insight-card">
                          <p className="admin-insight-card__label">Croisement le plus fort</p>
                          <p className="admin-insight-card__value">
                            {affinityInsights.strongest.passionLabel} × {affinityInsights.strongest.sector}
                          </p>
                          <p className="admin-insight-card__meta">
                            {affinityInsights.strongest.members} membre(s) · idée : <strong>{affinityInsights.strongest.actionType}</strong>
                          </p>
                        </div>
                        <div className="admin-insight-card">
                          <p className="admin-insight-card__label">Activation suggérée</p>
                          <p className="admin-insight-card__value">Dîner thématique ciblé</p>
                          <p className="admin-insight-card__meta">Test rapide: inviter 8–12 membres du top croisement.</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-600">Pas encore assez de données pour produire des insights fiables.</p>
                    )}
                  </div>
                ) : null}

                {affinityView === 'table' ? (
                  <div className="admin-affinity-table">
                    <div className="admin-table-wrap">
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>Passion</th>
                            <th>Secteur</th>
                            <th>Membres</th>
                            <th>Usage suggéré</th>
                          </tr>
                        </thead>
                        <tbody>
                          {affinityRows.length === 0 ? (
                            <tr>
                              <td colSpan={4}>—</td>
                            </tr>
                          ) : (
                            affinityRows.slice(0, 20).map((r) => (
                              <tr key={`${r.passionId}||${r.sector}`}>
                                <td>{r.passionLabel}</td>
                                <td>{r.sector}</td>
                                <td className="tabular-nums">{r.members}</td>
                                <td>
                                  <button
                                    type="button"
                                    className="admin-affinity-link"
                                    onClick={() => setPickedCross({ passionId: r.passionId, dimValue: r.sector, dimension: 'sector' })}
                                  >
                                    {r.actionType} · voir
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : null}
              </div>
            </article>
          </div>

          {pickedCross ? (
            <div className="fixed inset-0 z-[410] flex items-center justify-center bg-stone-900/50 p-4">
              <div className="w-full max-w-2xl rounded-2xl border border-stone-200 bg-white p-4 shadow-2xl sm:p-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-base font-semibold text-stone-900">{pickedCrossMembers.title}</h3>
                    <p className="mt-1 text-xs text-stone-500">{pickedCrossMembers.rows.length} membre(s)</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPickedCross(null)}
                    className="shrink-0 rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50"
                  >
                    Fermer
                  </button>
                </div>

                <div className="mt-4 max-h-[60vh] overflow-auto rounded-lg border border-stone-200">
                  <ul className="divide-y divide-stone-100">
                    {pickedCrossMembers.rows.map((m) => (
                      <li key={m.id} className="flex items-center justify-between gap-3 px-3 py-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-stone-900">{m.nom}</p>
                          <p className="truncate text-xs text-stone-500">
                            {[m.entreprise, m.secteur, (m as any).status, (m as any).city].filter(Boolean).join(' · ')}
                          </p>
                        </div>
                        <a
                          href={`/membres/${encodeURIComponent(m.id)}`}
                          className="shrink-0 rounded-md bg-blue-700 px-2.5 py-1 text-xs font-semibold text-white"
                        >
                          Voir
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ) : null}

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
    </section>
  );
}

