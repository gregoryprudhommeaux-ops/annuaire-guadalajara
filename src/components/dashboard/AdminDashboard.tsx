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
type AffinityExploreKey = 'detail' | 'matrix';

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
  const [affinityExplore, setAffinityExplore] = useState<AffinityExploreKey>('detail');
  const [affinityShortlist, setAffinityShortlist] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    try {
      const raw = localStorage.getItem('adminAffinityShortlist:v1');
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) setAffinityShortlist(new Set(parsed.map((x) => String(x))));
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('adminAffinityShortlist:v1', JSON.stringify(Array.from(affinityShortlist)));
    } catch {
      // ignore
    }
  }, [affinityShortlist]);
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

  const pickedMemberIds = useMemo(() => {
    return new Set((pickedCrossMembers.rows ?? []).map((m: any) => String(m.id)));
  }, [pickedCrossMembers.rows]);

  const shortlistCountInPick = useMemo(() => {
    let n = 0;
    pickedMemberIds.forEach((id) => {
      if (affinityShortlist.has(id)) n += 1;
    });
    return n;
  }, [pickedMemberIds, affinityShortlist]);

  const toggleShortlist = (id: string) => {
    setAffinityShortlist((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // ignore (non-secure context / permissions)
    }
  };

  const memberCompleteness = (m: any): { label: string; tone: 'good' | 'warn' } => {
    const nameOk = Boolean(String(m.nom ?? '').trim());
    const sectorOk = Boolean(String(m.secteur ?? '').trim());
    const photoOk = Boolean(String(m.photo ?? '').trim());
    const descOk = String(m.description ?? '').trim().length >= 30;
    const ok = nameOk && sectorOk && photoOk && descOk;
    return { label: ok ? 'Profil complet' : 'Profil à compléter', tone: ok ? 'good' : 'warn' };
  };

  const matchReason = (m: any): string => {
    if (!pickedCross) return '';
    const passionLabel = `${getPassionEmoji(pickedCross.passionId)} ${getPassionLabel(
      pickedCross.passionId,
      lang === 'es' ? 'es' : lang === 'en' ? 'en' : 'fr'
    )}`;
    if (pickedCross.dimension === 'sector') return `${passionLabel} + secteur “${pickedCross.dimValue}”`;
    if (pickedCross.dimension === 'poste') return `${passionLabel} + fonction “${pickedCross.dimValue}”`;
    return `${passionLabel} + industrie “${pickedCross.dimValue}”`;
  };

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

  const affinityTop3 = useMemo(() => affinityRows.slice(0, 3), [affinityRows]);
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

  const missingFieldRows = useMemo(() => {
    const profiles = stats.profilesForDashboard ?? [];
    const counts = {
      photo: 0,
      description: 0,
      sector: 0,
      company: 0,
      city: 0,
    };
    for (const p of profiles as any[]) {
      if (!String(p.photo ?? '').trim()) counts.photo += 1;
      if (String(p.description ?? '').trim().length < 30) counts.description += 1;
      if (!String(p.secteur ?? '').trim()) counts.sector += 1;
      if (!String(p.entreprise ?? '').trim()) counts.company += 1;
      if (!String(p.city ?? '').trim()) counts.city += 1;
    }
    const rows = [
      { field: 'Photo', missing: counts.photo },
      { field: 'Description', missing: counts.description },
      { field: 'Secteur', missing: counts.sector },
      { field: 'Société', missing: counts.company },
      { field: 'Ville', missing: counts.city },
    ].sort((a, b) => b.missing - a.missing);
    return rows;
  }, [stats.profilesForDashboard]);

  const sectorCoverageRows = useMemo(() => {
    const rows = Object.entries(stats.profilesBySector ?? {})
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
    return rows.slice(0, 10);
  }, [stats.profilesBySector]);

  const cityCoverageRows = useMemo(() => {
    const rows = Object.entries(stats.profilesByCity ?? {})
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
    return rows.slice(0, 10);
  }, [stats.profilesByCity]);

  const gapInsights = useMemo(() => {
    const sectors = Object.entries(stats.profilesBySector ?? {})
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => a.value - b.value);
    const cities = Object.entries(stats.profilesByCity ?? {})
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => a.value - b.value);
    return {
      weakSectors: sectors.filter((s) => s.value <= 1).slice(0, 5),
      weakCities: cities.filter((c) => c.value <= 1).slice(0, 5),
    };
  }, [stats.profilesBySector, stats.profilesByCity]);

  const attentionConversion = useMemo(() => {
    const profiles = stats.profilesForDashboard ?? [];
    const byId = new Map<string, any>(profiles.map((p: any) => [String(p.id), p]));
    const topViewed = (stats.topViewedProfiles ?? []).map((r) => ({
      id: r.id,
      name: r.name,
      views: r.clickCount,
      clicks: byId.get(String(r.id))?.contactClicks ?? 0,
    }));
    const topContacted = (stats.topContactedProfiles ?? []).map((r) => ({
      id: r.id,
      name: r.name,
      clicks: r.clickCount,
      views: (stats.profileViewsByUid ?? {})[String(r.id)] ?? 0,
    }));
    return { topViewed, topContacted };
  }, [stats.profilesForDashboard, stats.topViewedProfiles, stats.topContactedProfiles, stats.profileViewsByUid]);

  const relationshipPotential = useMemo(() => {
    const profiles = (stats.profilesForDashboard ?? []) as any[];
    const passionToMembers = new Map<string, Set<string>>();
    const memberToPassions = new Map<string, string[]>();
    const passionToSectors = new Map<string, Set<string>>();

    for (const p of profiles) {
      const id = String(p.id);
      const sector = String(p.secteur ?? '').trim() || '—';
      const passions = sanitizePassionIds(p.passionIds);
      memberToPassions.set(id, passions);
      for (const pid of passions) {
        if (!passionToMembers.has(pid)) passionToMembers.set(pid, new Set());
        passionToMembers.get(pid)!.add(id);
        if (!passionToSectors.has(pid)) passionToSectors.set(pid, new Set());
        passionToSectors.get(pid)!.add(sector);
      }
    }

    const memberScores = profiles
      .map((p) => {
        const id = String(p.id);
        const passions = memberToPassions.get(id) ?? [];
        const overlap = new Set<string>();
        passions.forEach((pid) => {
          passionToMembers.get(pid)?.forEach((otherId) => {
            if (otherId !== id) overlap.add(otherId);
          });
        });
        return { id, nom: p.nom, entreprise: p.entreprise, secteur: p.secteur, city: p.city, score: overlap.size };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);

    const topOverlapPassions = Array.from(passionToSectors.entries())
      .map(([pid, sectors]) => ({ pid, sectors: sectors.size }))
      .sort((a, b) => b.sectors - a.sectors)
      .slice(0, 6)
      .map((r) => ({
        label: `${getPassionEmoji(r.pid)} ${getPassionLabel(r.pid, lang === 'es' ? 'es' : lang === 'en' ? 'en' : 'fr')}`,
        sectors: r.sectors,
      }));

    return { memberScores, topOverlapPassions };
  }, [stats.profilesForDashboard, lang]);

  function activationSuggestion(row: { members: number; passionId: string; sector: string }, rankIndex: number): string {
    // Keep it deterministic and sparse; avoid repeating "dîner" everywhere.
    if (row.members >= 6) return 'Afterwork transversal (gros potentiel)';
    if (row.members >= 4) return 'Rencontres ciblées (petit groupe)';
    if (row.members >= 2) return rankIndex === 0 ? 'Mise en relation éditoriale' : 'Intro 1:1 (test rapide)';
    return 'Signal faible — à surveiller';
  }

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
            </div>

            <div className="admin-stack">
              <article className="admin-chart-card admin-chart-card--compact">
                <p className="admin-chart-card__title">Complétion des profils</p>
                <p className="admin-chart-card__subtitle">Vue “strict” (nom, secteur, description, photo)</p>
                <div className="admin-chart-card__body">
                  <div className="admin-chart-frame">
                    <MiniErrorBoundary label="ProfileCompletionGauge">
                      <ProfileCompletionGauge
                        totalMembers={stats.totalProfiles}
                        completedProfiles={stats.completedProfilesStrict}
                        embedded
                        showHeader={false}
                      />
                    </MiniErrorBoundary>
                  </div>
                </div>
              </article>
            </div>
          </div>

          <div className="admin-analytics-wide">
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

          <div className="admin-analytics-secondary">
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

          <div className="admin-decision-grid">
            <article className="admin-chart-card admin-chart-card--compact">
              <p className="admin-chart-card__title">Champs profil manquants</p>
              <p className="admin-chart-card__subtitle">Priorise les efforts de complétion.</p>
              <div className="admin-chart-card__body">
                <div className="admin-chart-frame admin-chart-frame--sm">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={missingFieldRows} layout="vertical" margin={{ top: 6, right: 12, bottom: 6, left: 84 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                      <YAxis
                        type="category"
                        dataKey="field"
                        tick={{ fontSize: 11, fill: '#475569' }}
                        width={84}
                      />
                      <Tooltip contentStyle={{ fontSize: 12 }} />
                      <Bar dataKey="missing" name="Manquants" fill="#f59e0b" radius={[6, 6, 6, 6]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </article>

            <article className="admin-chart-card admin-chart-card--compact">
              <p className="admin-chart-card__title">Attention vs conversion</p>
              <p className="admin-chart-card__subtitle">Distingue visibilité et engagement.</p>
              <div className="admin-chart-card__body">
                <div className="admin-split">
                  <div className="admin-mini-table">
                    <p className="admin-mini-table__title">Top vues</p>
                    <ul className="admin-mini-table__rows">
                      {attentionConversion.topViewed.length === 0 ? (
                        <li className="admin-mini-table__row">—</li>
                      ) : (
                        attentionConversion.topViewed.map((r) => (
                          <li key={r.id} className="admin-mini-table__row">
                            <span className="admin-mini-table__name">{r.name}</span>
                            <span className="admin-mini-table__metric">{r.views} vues</span>
                          </li>
                        ))
                      )}
                    </ul>
                  </div>
                  <div className="admin-mini-table">
                    <p className="admin-mini-table__title">Top contacts</p>
                    <ul className="admin-mini-table__rows">
                      {attentionConversion.topContacted.length === 0 ? (
                        <li className="admin-mini-table__row">—</li>
                      ) : (
                        attentionConversion.topContacted.map((r) => (
                          <li key={r.id} className="admin-mini-table__row">
                            <span className="admin-mini-table__name">{r.name}</span>
                            <span className="admin-mini-table__metric">{r.clicks} clics</span>
                          </li>
                        ))
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            </article>

            <article className="admin-chart-card admin-chart-card--compact">
              <p className="admin-chart-card__title">Couverture secteurs / villes</p>
              <p className="admin-chart-card__subtitle">Identifier forces & zones faibles.</p>
              <div className="admin-chart-card__body">
                <div className="admin-chart-frame admin-chart-frame--sm">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={sectorCoverageRows} margin={{ top: 6, right: 10, bottom: 30, left: 6 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={xTickCardAngled as any} interval={0} height={52} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                      <Tooltip contentStyle={{ fontSize: 12 }} />
                      <Bar dataKey="value" name="Membres" fill="#1d4ed8" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="admin-gaps">
                  <p className="admin-gaps__title">Gaps (≤ 1 membre)</p>
                  <ul className="admin-gaps__list">
                    {gapInsights.weakSectors.slice(0, 3).map((s) => (
                      <li key={`s-${s.name}`}>{s.name}</li>
                    ))}
                    {gapInsights.weakCities.slice(0, 2).map((c) => (
                      <li key={`c-${c.name}`}>{c.name}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </article>

            <article className="admin-chart-card admin-chart-card--compact">
              <p className="admin-chart-card__title">Potentiel d’opportunité</p>
              <p className="admin-chart-card__subtitle">Qui / quoi peut créer le plus de connexions.</p>
              <div className="admin-chart-card__body">
                <div className="admin-split">
                  <div className="admin-mini-table">
                    <p className="admin-mini-table__title">Membres à fort potentiel</p>
                    <ul className="admin-mini-table__rows">
                      {relationshipPotential.memberScores.length === 0 ? (
                        <li className="admin-mini-table__row">—</li>
                      ) : (
                        relationshipPotential.memberScores.map((m) => (
                          <li key={m.id} className="admin-mini-table__row">
                            <span className="admin-mini-table__name">{String(m.nom ?? '').trim()}</span>
                            <span className="admin-mini-table__metric">{m.score} matchs</span>
                          </li>
                        ))
                      )}
                    </ul>
                  </div>
                  <div className="admin-mini-table">
                    <p className="admin-mini-table__title">Passions transverses</p>
                    <ul className="admin-mini-table__rows">
                      {relationshipPotential.topOverlapPassions.length === 0 ? (
                        <li className="admin-mini-table__row">—</li>
                      ) : (
                        relationshipPotential.topOverlapPassions.map((p) => (
                          <li key={p.label} className="admin-mini-table__row">
                            <span className="admin-mini-table__name">{p.label}</span>
                            <span className="admin-mini-table__metric">{p.sectors} secteurs</span>
                          </li>
                        ))
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            </article>
          </div>

          {/* E. Deep-dive */}
          <div className="admin-bottom-section">
            <article className="admin-chart-card admin-chart-card--affinity">
              <p className="admin-chart-card__title">Affinités relationnelles du réseau</p>
              <p className="admin-chart-card__subtitle">
                Repère les terrains d’intérêt commun les plus utiles pour animer la communauté et accélérer les mises en relation.
              </p>

              <div className="admin-chart-card__body">
                {/* LAYER A — Executive summary */}
                <div className="admin-affinity-summary">
                  {affinityInsights ? (
                    <div className="admin-affinity-summary-grid">
                      <div className="admin-mini-kpi">
                        <p className="admin-mini-kpi__label">Passion la plus fédératrice</p>
                        <p className="admin-mini-kpi__value">{affinityInsights.topPassionLabel}</p>
                        <p className="admin-mini-kpi__meta">{affinityInsights.topPassionScore} occurrences (approx.)</p>
                      </div>
                      <div className="admin-mini-kpi">
                        <p className="admin-mini-kpi__label">Secteur le plus affinitaire</p>
                        <p className="admin-mini-kpi__value">{affinityInsights.topSector}</p>
                        <p className="admin-mini-kpi__meta">{affinityInsights.topSectorScore} occurrences (approx.)</p>
                      </div>
                      <div className="admin-mini-kpi">
                        <p className="admin-mini-kpi__label">Croisement le plus fort</p>
                        <p className="admin-mini-kpi__value">
                          {affinityInsights.strongest.passionLabel} × {affinityInsights.strongest.sector}
                        </p>
                        <p className="admin-mini-kpi__meta">{affinityInsights.strongest.members} membre(s)</p>
                      </div>
                      <div className="admin-mini-kpi">
                        <p className="admin-mini-kpi__label">Format recommandé</p>
                        <p className="admin-mini-kpi__value">
                          {activationSuggestion(affinityInsights.strongest, 0)}
                        </p>
                        <p className="admin-mini-kpi__meta">Suggestion indicative (données actuelles)</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-600">Pas encore assez de données pour résumer les affinités.</p>
                  )}
                </div>

                {/* LAYER B — Top 3 activable affinities */}
                <div className="admin-affinity-top3">
                  <div className="admin-affinity-top3-grid">
                    {affinityTop3.length === 0 ? (
                      <p className="text-sm text-slate-600">—</p>
                    ) : (
                      affinityTop3.map((r, idx) => (
                        <div key={`${r.passionId}||${r.sector}`} className="admin-affinity-card">
                          <p className="admin-affinity-card__title">
                            <span className="truncate">{r.passionLabel}</span>
                            <span className="admin-affinity-sep">×</span>
                            <span className="truncate">{r.sector}</span>
                          </p>
                          <p className="admin-affinity-card__meta">{r.members} membre(s)</p>
                          <p className="admin-affinity-card__suggestion">{activationSuggestion(r, idx)}</p>
                          <div className="admin-affinity-card__actions">
                            <button
                              type="button"
                              className="admin-affinity-action"
                              onClick={() => setPickedCross({ passionId: r.passionId, dimValue: r.sector, dimension: 'sector' })}
                            >
                              Voir les membres
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* LAYER C — Secondary exploration (lower priority, collapsed by default) */}
                <details className="admin-affinity-explore">
                  <summary className="admin-affinity-explore__summary">
                    Exploration (détail & matrice)
                  </summary>

                  <div className="admin-affinity-explore__body">
                    <div className="admin-affinity-subtabs" role="tablist" aria-label="Exploration affinités">
                      <button
                        type="button"
                        role="tab"
                        aria-selected={affinityExplore === 'detail'}
                        className={affinityExplore === 'detail' ? 'admin-affinity-subtab is-active' : 'admin-affinity-subtab'}
                        onClick={() => setAffinityExplore('detail')}
                      >
                        Détail
                      </button>
                      <button
                        type="button"
                        role="tab"
                        aria-selected={affinityExplore === 'matrix'}
                        className={affinityExplore === 'matrix' ? 'admin-affinity-subtab is-active' : 'admin-affinity-subtab'}
                        onClick={() => setAffinityExplore('matrix')}
                      >
                        Matrice
                      </button>
                    </div>

                    {affinityExplore === 'detail' ? (
                      <div className="admin-affinity-detail">
                        <div className="admin-table-wrap">
                          <table className="admin-table">
                            <thead>
                              <tr>
                                <th>Passion</th>
                                <th>Secteur</th>
                                <th>Membres</th>
                                <th>Action possible</th>
                              </tr>
                            </thead>
                            <tbody>
                              {affinityRows.length === 0 ? (
                                <tr>
                                  <td colSpan={4}>—</td>
                                </tr>
                              ) : (
                                affinityRows.slice(0, 12).map((r, idx) => (
                                  <tr key={`${r.passionId}||${r.sector}`}>
                                    <td>{r.passionLabel}</td>
                                    <td>{r.sector}</td>
                                    <td className="tabular-nums">{r.members}</td>
                                    <td>
                                      <button
                                        type="button"
                                        className="admin-affinity-link"
                                        onClick={() =>
                                          setPickedCross({ passionId: r.passionId, dimValue: r.sector, dimension: 'sector' })
                                        }
                                      >
                                        Explorer
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

                    {affinityExplore === 'matrix' ? (
                      <div className="admin-affinity-matrix">
                        <div className="admin-matrix-toolbar">
                          <p className="admin-matrix-caption">
                            Vue exploratoire — utile pour voir la distribution globale des signaux.
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
                      </div>
                    ) : null}
                  </div>
                </details>
              </div>
            </article>
          </div>

          {pickedCross ? (
            <div className="fixed inset-0 z-[410] flex items-stretch justify-end bg-stone-900/30">
              <div className="absolute inset-0" onClick={() => setPickedCross(null)} aria-hidden />
              <div className="relative h-full w-full max-w-[560px] border-l border-stone-200 bg-white shadow-2xl">
                <div className="flex h-full flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 px-4 pt-4">
                    <h3 className="text-base font-semibold text-stone-900">{pickedCrossMembers.title}</h3>
                    <p className="mt-1 text-xs text-stone-500">{pickedCrossMembers.rows.length} membre(s) · shortlist: {shortlistCountInPick}</p>
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-2 px-4 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        const lines = pickedCrossMembers.rows.map((m: any) =>
                          [m.nom, m.entreprise, m.secteur].filter(Boolean).join(' — ')
                        );
                        void copyText(lines.join('\n'));
                      }}
                      className="shrink-0 rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50"
                      title="Copier la liste des membres"
                    >
                      Copier liste
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const names = pickedCrossMembers.rows.map((m: any) => String(m.nom ?? '').trim()).filter(Boolean);
                        const msg =
                          `Bonjour,\n\nJe vous contacte via l’annuaire (admin) car votre profil semble pertinent pour: ${pickedCrossMembers.title}.\n` +
                          `Seriez-vous ouvert(e) à une introduction / échange rapide ?\n\nMerci,\n`;
                        void copyText(msg);
                      }}
                      className="shrink-0 rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50"
                      title="Copier un texte d'intro"
                    >
                      Copier intro
                    </button>
                    <button
                      type="button"
                      onClick={() => setPickedCross(null)}
                      className="shrink-0 rounded-lg bg-stone-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-stone-800"
                    >
                      Fermer
                    </button>
                  </div>
                </div>

                <div className="mt-3 flex-1 overflow-hidden px-4 pb-4">
                  <aside className="rounded-xl border border-stone-200 bg-stone-50 p-3">
                    <p className="text-xs font-extrabold uppercase tracking-wide text-stone-600">Prochaines actions</p>
                    <ul className="mt-2 grid gap-2 text-sm text-stone-800">
                      <li>
                        <strong>Intro</strong>: sélectionner 2–3 profils et envoyer une introduction courte.
                      </li>
                      <li>
                        <strong>Shortlist</strong>: marquer 5–8 profils, puis “Copier liste” pour partager en interne.
                      </li>
                      <li>
                        <strong>Invite</strong>: si un secteur/passion est sous-représenté, inviter 1–2 profils “référence”.
                      </li>
                      <li>
                        <strong>Follow-up</strong>: relancer les profils shortlistés après 7 jours.
                      </li>
                    </ul>
                    <div className="mt-3">
                      <button
                        type="button"
                        onClick={() => {
                          const ids = Array.from(affinityShortlist).filter((id) => pickedMemberIds.has(id));
                          const lines = pickedCrossMembers.rows
                            .filter((m: any) => ids.includes(String(m.id)))
                            .map((m: any) => [m.nom, m.entreprise].filter(Boolean).join(' — '));
                          void copyText(lines.join('\n'));
                        }}
                        className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50"
                      >
                        Copier shortlist (sur cette sélection)
                      </button>
                    </div>
                  </aside>
                </div>

                <div className="flex-1 overflow-auto px-4 pb-4">
                  <ul className="divide-y divide-stone-100 rounded-xl border border-stone-200 bg-white">
                    {pickedCrossMembers.rows.map((m: any) => {
                      const id = String(m.id);
                      const isShortlisted = affinityShortlist.has(id);
                      const ctx = [m.entreprise, m.secteur, (m as any).city].filter(Boolean).join(' · ');
                      const c = memberCompleteness(m);
                      return (
                        <li key={id} className="px-3 py-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-stone-900">{m.nom}</p>
                              <p className="truncate text-xs text-stone-500">{ctx || '—'}</p>
                              <p className="mt-2 text-xs font-semibold text-stone-700">{matchReason(m)}</p>
                              <div className="mt-2 flex flex-wrap gap-2">
                                <span
                                  className={
                                    c.tone === 'good'
                                      ? 'rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-extrabold text-emerald-800'
                                      : 'rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-extrabold text-amber-900'
                                  }
                                >
                                  {c.label}
                                </span>
                                {(m as any).city ? (
                                  <span className="rounded-full bg-slate-50 px-2 py-0.5 text-[11px] font-extrabold text-slate-700">
                                    {(m as any).city}
                                  </span>
                                ) : null}
                              </div>
                            </div>

                            <div className="flex shrink-0 flex-col items-end gap-2">
                              <a
                                href={`/membres/${encodeURIComponent(id)}`}
                                className="rounded-md bg-blue-700 px-2.5 py-1 text-xs font-semibold text-white"
                              >
                                Voir le profil
                              </a>
                              <button
                                type="button"
                                onClick={() => toggleShortlist(id)}
                                className={
                                  isShortlisted
                                    ? 'rounded-md bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800'
                                    : 'rounded-md bg-stone-100 px-2.5 py-1 text-xs font-semibold text-stone-700'
                                }
                              >
                                {isShortlisted ? 'Shortlisté' : 'Shortlister'}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const msg =
                                    `Bonjour ${String(m.nom ?? '').trim()},\n\n` +
                                    `Je vous contacte via l’annuaire (admin) car votre profil semble pertinent pour: ${pickedCrossMembers.title}.\n` +
                                    `Seriez-vous ouvert(e) à une introduction / échange rapide ?\n\nMerci,\n`;
                                  void copyText(msg);
                                }}
                                className="rounded-md border border-stone-200 bg-white px-2.5 py-1 text-xs font-semibold text-stone-700 hover:bg-stone-50"
                              >
                                Préparer une intro
                              </button>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
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

