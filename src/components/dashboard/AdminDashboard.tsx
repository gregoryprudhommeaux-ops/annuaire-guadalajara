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
import { useTimePeriod } from '@/contexts/TimePeriodContext';
import { getPassionEmoji, getPassionLabel, sanitizePassionIds } from '@/lib/passionConfig';
import { formatPersonName } from '@/shared/utils/formatPersonName';
import PassionsCrossHeatmap, { type CrossPick } from '@/components/dashboard/PassionsCrossHeatmap';
import { pickLang } from '@/lib/uiLocale';
import { Link } from 'react-router-dom';
import { NeedsBarChart } from '@/components/charts/NeedsBarChart';
import { aggregateNeedsFromMembers } from '@/lib/needs';
import { NEED_CATEGORY_LABELS } from '@/lib/needLabels';
import { NEED_OPTION_VALUE_SET, sanitizeHighlightedNeeds } from '@/needOptions';
import {
  getAdminDashboardCopy,
  adminActivationSuggestion,
  adminAffinityViewMembers,
} from '@/lib/adminDashboardLocale';
import { FRANCO_ADMIN_KEY_AFFINITY, FRANCO_ADMIN_KEY_SCROLL } from '@/lib/adminClientBridge';

type TFn = (key: string, params?: Record<string, string | number>) => string;

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
    <div className="flex w-full min-w-0 items-baseline justify-between gap-3 rounded-[var(--fn-radius-md)] border border-[var(--fn-border)] bg-[var(--fn-surface)] px-3 py-2 shadow-[var(--fn-shadow-sm)]">
      <p
        className="min-w-0 flex-1 truncate text-[10px] font-semibold leading-tight tracking-wide text-[var(--fn-muted)] sm:text-[11px]"
        title={label}
      >
        {label}
      </p>
      <p className="shrink-0 text-base font-bold tabular-nums leading-none text-[var(--fn-fg)] sm:text-lg">
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
  x: number | string;
  y: number | string;
  payload?: { value?: string | number };
  maxChars: number;
  fontSize: number;
  fill: string;
}) {
  const full = String(payload?.value ?? '');
  const short = compactLabel(full, maxChars);
  const xNum = typeof x === 'number' ? x : Number(x);
  const yNum = typeof y === 'number' ? y : Number(y);
  return (
    <g transform={`translate(${xNum},${yNum})`}>
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
  x: number | string;
  y: number | string;
  payload?: { value?: string | number };
  maxChars: number;
  fontSize: number;
  fill: string;
}) {
  const full = String(payload?.value ?? '');
  const short = compactLabel(full, maxChars);
  const xNum = typeof x === 'number' ? x : Number(x);
  const yNum = typeof y === 'number' ? y : Number(y);
  return (
    <g transform={`translate(${xNum},${yNum})`}>
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
    <div className="relative flex min-h-0 flex-col rounded-[var(--fn-radius-lg)] border border-[var(--fn-border)] bg-[var(--fn-surface)] p-4 shadow-[var(--fn-shadow-sm)]">
      {onExpand ? (
        <button
          type="button"
          onClick={onExpand}
          className="absolute right-2 top-2 z-10 rounded-[var(--fn-radius-sm)] p-1.5 text-[var(--fn-muted)] transition-colors hover:bg-[var(--fn-surface-2)] hover:text-[var(--fn-fg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--fn-ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--fn-surface)]"
          aria-label={expandLabel}
          title={expandLabel}
        >
          <Maximize2 className="h-4 w-4" strokeWidth={2} aria-hidden />
        </button>
      ) : null}
      <h3 className="min-w-0 pr-10 text-sm font-semibold leading-snug text-[var(--fn-fg)]">{title}</h3>
      {/* Zone graphique dédiée : overflow hidden pour que rien ne dépasse du cadre */}
      <div className="mt-3 h-72 w-full min-h-0 overflow-hidden">{children}</div>
    </div>
  );
}

type AdminInsightTab = 'overview' | 'profiles' | 'site' | 'events';
type AffinityExploreKey = 'detail' | 'matrix';

export default function AdminDashboard(props: AdminDashboardProps) {
  return <AdminDashboardInner {...props} />;
}

class MiniErrorBoundary extends React.Component<
  { children: React.ReactNode; label: string; t: TFn },
  { hasError: boolean; msg: string }
> {
  // See note in `src/App.tsx` SectionErrorBoundary.
  declare props: { children: React.ReactNode; label: string; t: TFn };
  declare setState: React.Component<
    { children: React.ReactNode; label: string; t: TFn },
    { hasError: boolean; msg: string }
  >['setState'];
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
        <p className="font-semibold">{this.props.t('adminWidgetError', { label: this.props.label })}</p>
        {this.state.msg ? <p className="mt-1 text-xs text-rose-800">{this.state.msg}</p> : null}
      </div>
    );
  }
}

function AdminDashboardInner({ lang, t, initialTab, priorityLeft, priorityRight }: AdminDashboardProps) {
  const ad = useMemo(() => getAdminDashboardCopy(lang), [lang]);
  const [insightTab, setInsightTab] = useState<AdminInsightTab>('overview');
  const { period, setPeriod } = useTimePeriod();
  const canComparePeriod = period !== 'all';
  const formatDelta = (cur: number, prev: number) => {
    if (!canComparePeriod) return '—';
    const d = cur - prev;
    if (d === 0) return '0';
    const sign = d > 0 ? '▲' : '▼';
    return `${sign} ${Math.abs(d)}`;
  };
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
  const loadingLabel = t('loading');
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

  /** CTA dépuis `/admin/internal` (file d’attente + scroll une fois le tableau rendu). */
  useEffect(() => {
    if (stats.loading || stats.error) return;
    let id: string | null = null;
    try {
      id = window.sessionStorage.getItem(FRANCO_ADMIN_KEY_SCROLL);
      if (id) window.sessionStorage.removeItem(FRANCO_ADMIN_KEY_SCROLL);
    } catch {
      // ignore
    }
    if (id) {
      const elId = id;
      const run = () => document.getElementById(elId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      requestAnimationFrame(() => requestAnimationFrame(run));
    }
  }, [stats.loading, stats.error]);

  useEffect(() => {
    if (stats.loading || stats.error) return;
    let raw: string | null = null;
    try {
      raw = window.sessionStorage.getItem(FRANCO_ADMIN_KEY_AFFINITY);
      if (raw) window.sessionStorage.removeItem(FRANCO_ADMIN_KEY_AFFINITY);
    } catch {
      // ignore
    }
    if (!raw) return;
    try {
      const cross = JSON.parse(raw) as CrossPick;
      setPickedCross(cross);
      const run = () =>
        document.getElementById('admin-section-affinities')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      requestAnimationFrame(() => requestAnimationFrame(run));
    } catch {
      // ignore
    }
  }, [stats.loading, stats.error]);

  const bySectorData = useMemo(
    () =>
      Object.entries(stats.profilesBySector)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value),
    [stats.profilesBySector]
  );

  const needsData = useMemo(() => {
    const highlightedToCategory = (id: string): string | null => {
      const key = String(id ?? '').trim().toUpperCase();
      if (!key) return null;
      if (key === 'NEED_PARTNERS') return 'partners';
      if (key === 'NEED_CLIENTS') return 'clients';
      if (key === 'NEED_DISTRIB') return 'distributors';
      if (key === 'NEED_SUPPLIERS') return 'suppliers';
      if (key === 'NEED_INVESTORS') return 'investors';
      if (key === 'NEED_HR') return 'talent';
      if (key === 'NEED_VISIBILITY') return 'visibility';
      if (key === 'NEED_MENTOR' || key === 'NEED_ECOSYSTEM' || key === 'NEED_RESEARCH') return 'experts';
      return 'other';
    };

    const members = (stats.profilesForDashboard ?? [])
      .map((p: any) => {
        const ids = sanitizeHighlightedNeeds(p?.highlightedNeeds).filter((id) =>
          NEED_OPTION_VALUE_SET.has(id)
        );
      const needs = ids
        .map((id) => highlightedToCategory(id))
        .filter((c): c is string => Boolean(c))
        .map((category) => ({ category, isActive: true }));
        return { needs };
      })
      .filter((m) => (m.needs?.length ?? 0) > 0);

    return aggregateNeedsFromMembers(members, NEED_CATEGORY_LABELS, { limit: 8 });
  }, [stats.profilesForDashboard]);

  const topNeedsPills = useMemo(
    () =>
      [...needsData]
        .filter((d) => d.count > 0)
        .sort((a, b) => b.count - a.count)
        .slice(0, 3),
    [needsData]
  );

  const byCityData = useMemo(
    () => Object.entries(stats.profilesByCity).map(([name, value]) => ({ name, value })),
    [stats.profilesByCity]
  );
  const byStatusData = useMemo(
    () => Object.entries(stats.profilesByStatus).map(([name, value]) => ({ name, value })),
    [stats.profilesByStatus]
  );
  const byTypeData = useMemo(
    () => [
      { name: ad.profileTypeCompany, value: stats.profilesByType.entreprise },
      { name: ad.profileTypeMember, value: stats.profilesByType.membre },
    ],
    [ad.profileTypeCompany, ad.profileTypeMember, stats.profilesByType.entreprise, stats.profilesByType.membre]
  );
  const COLORS = ['#1d4ed8', '#16a34a', '#0284c7', '#7c3aed', '#ea580c', '#334155'];
  const SECTOR_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6'];
  const sectorColorByName = useMemo(() => {
    const map = new Map<string, string>();
    bySectorData.forEach((s, idx) => {
      map.set(String(s.name), SECTOR_COLORS[idx % SECTOR_COLORS.length]);
    });
    return map;
  }, [bySectorData]);
  const modalTick = { fontSize: 12, fill: '#475569' };
  const xTickModalAngled = (props: { x: number | string; y: number | string; payload?: { value?: string | number } }) => (
    <AdminXAxisTickCompactAngled {...props} maxChars={18} fontSize={12} fill="#475569" />
  );
  const xTickModalFlat = (props: { x: number | string; y: number | string; payload?: { value?: string | number } }) => (
    <AdminXAxisTickCompactFlat {...props} maxChars={18} fontSize={12} fill="#475569" />
  );
  const expandChartLabel = t('chartExpandLarge');

  useEffect(() => {
    if (!initialTab) return;
    setInsightTab(initialTab);
  }, [initialTab]);

  const pickedCrossMembers = useMemo(() => {
    if (!pickedCross) return { title: '', rows: [] as typeof stats.profilesForDashboard };
    const locale = lang === 'es' ? 'es' : lang === 'en' ? 'en' : 'fr';
    const passionLabel = `${getPassionEmoji(pickedCross.passionId)} ${getPassionLabel(pickedCross.passionId, locale)}`;
    const dimLabel =
      pickedCross.dimension === 'sector'
        ? ad.dimSector
        : pickedCross.dimension === 'poste'
          ? ad.dimPoste
          : ad.dimIndustrie;
    const title = `${passionLabel} × ${dimLabel}: ${pickedCross.dimValue}`;
    const rows = (stats.profilesForDashboard ?? []).filter((m) => {
      const hasPassion = sanitizePassionIds((m as any).passionIds).includes(pickedCross.passionId);
      if (!hasPassion) return false;
      const dimValue =
        pickedCross.dimension === 'sector'
          ? String(m.secteur ?? '').trim() || '—'
          : pickedCross.dimension === 'poste'
            ? String((m as any).positionCategory ?? '').trim() || '—'
            : String((m as any).activityCategory ?? '').trim() || '—';
      return dimValue === pickedCross.dimValue;
    });
    return { title, rows };
  }, [pickedCross, stats.profilesForDashboard, lang, ad.dimSector, ad.dimPoste, ad.dimIndustrie]);

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
    return {
      label: ok
        ? pickLang('Profil complet', 'Perfil completo', 'Complete profile', lang)
        : pickLang('Profil à compléter', 'Perfil por completar', 'Profile incomplete', lang),
      tone: ok ? 'good' : 'warn',
    };
  };

  const matchReason = (m: any): string => {
    if (!pickedCross) return '';
    const passionLabel = `${getPassionEmoji(pickedCross.passionId)} ${getPassionLabel(
      pickedCross.passionId,
      lang === 'es' ? 'es' : lang === 'en' ? 'en' : 'fr'
    )}`;
    const q = (s: string) => `"${s}"`;
    if (pickedCross.dimension === 'sector') return `${passionLabel} + ${ad.dimSector} ${q(pickedCross.dimValue)}`;
    if (pickedCross.dimension === 'poste') return `${passionLabel} + ${ad.dimPoste} ${q(pickedCross.dimValue)}`;
    return `${passionLabel} + ${ad.dimIndustrie} ${q(pickedCross.dimValue)}`;
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
        return { ...r, members, passionLabel };
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

  const coverageGapMatrixRows = useMemo(() => {
    const sectors = Object.entries(stats.profilesBySector ?? {}).map(([label, value]) => ({
      label,
      kind: 'sector' as const,
      value,
    }));
    const cities = Object.entries(stats.profilesByCity ?? {}).map(([label, value]) => ({
      label,
      kind: 'city' as const,
      value,
    }));
    return [...sectors, ...cities]
      .filter((r) => r.value <= 2)
      .sort((a, b) => a.value - b.value || a.label.localeCompare(b.label))
      .slice(0, 10);
  }, [stats.profilesBySector, stats.profilesByCity]);

  // STEP 1 (today): focus on a clean decision-oriented overview. Keep other tabs intact for later.
  useEffect(() => {
    if (insightTab !== 'overview') setInsightTab('overview');
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
          <div className="admin-kpi-grid" id="admin-section-kpi">
            <div className="admin-kpi-card">
              <p className="admin-kpi-card__label">{t('members')}</p>
              <p className="admin-kpi-card__value">{stats.totalProfiles}</p>
              <p className="admin-kpi-card__trend" title={pickLang('Nouveaux inscrits vs fenêtre précédente', 'Altas vs ventana', 'New signups vs previous window', lang)}>
                {pickLang('Nouveaux (période)', 'Altas (periodo)', 'New (period)', lang)} : {stats.newProfilesInPeriod}
                {canComparePeriod ? (
                  <span className="admin-kpi-card__trend-delta"> · {formatDelta(stats.newProfilesInPeriod, stats.newProfilesPreviousPeriod)}</span>
                ) : null}
              </p>
            </div>
            <div className="admin-kpi-card">
              <p className="admin-kpi-card__label">{ad.kpiNewSignups}</p>
              <p className="admin-kpi-card__value">{stats.newProfilesInPeriod}</p>
              <p className="admin-kpi-card__trend">
                {canComparePeriod ? (
                  <>
                    {pickLang('vs période précédente', 'vs anterior', 'vs previous period', lang)}:{' '}
                    <span className="font-semibold tabular-nums">{formatDelta(stats.newProfilesInPeriod, stats.newProfilesPreviousPeriod)}</span>
                  </>
                ) : (
                  '—'
                )}
              </p>
            </div>
            <div className="admin-kpi-card">
              <p className="admin-kpi-card__label">{ad.kpiContactClicks}</p>
              <p className="admin-kpi-card__value">{stats.totalClicks}</p>
              <p className="admin-kpi-card__trend">
                {canComparePeriod ? (
                  <>
                    Δ {pickLang('contacts', 'contactos', 'contacts', lang)}:{' '}
                    <span className="font-semibold tabular-nums">
                      {formatDelta(stats.totalClicks, stats.totalContactClickEventsPrevious)}
                    </span>
                  </>
                ) : (
                  '—'
                )}
              </p>
            </div>
            <div className="admin-kpi-card">
              <p className="admin-kpi-card__label">{ad.kpiProfileViews}</p>
              <p className="admin-kpi-card__value">{stats.totalProfileViewEvents}</p>
              <p className="admin-kpi-card__trend">
                {canComparePeriod ? (
                  <>
                    Δ {pickLang('vues', 'vistas', 'views', lang)}:{' '}
                    <span className="font-semibold tabular-nums">
                      {formatDelta(stats.totalProfileViewEvents, stats.totalProfileViewEventsPrevious)}
                    </span>
                  </>
                ) : (
                  '—'
                )}
              </p>
            </div>
            <div className="admin-kpi-card">
              <p className="admin-kpi-card__label">
                {pickLang('Taux de conversion Vue → contact', 'Conversión ver → contacto', 'View → contact rate', lang)}
              </p>
              <p className="admin-kpi-card__value">
                {stats.totalProfileViewEvents > 0
                  ? `${Math.round((stats.totalClicks / stats.totalProfileViewEvents) * 1000) / 10}%`
                  : '—'}
              </p>
              <p className="admin-kpi-card__trend">
                {pickLang('contactClicks / vues (période)', 'clics / vistas', 'clicks / views (period)', lang)}
              </p>
            </div>
            <div className="admin-kpi-card">
              <p className="admin-kpi-card__label">
                {pickLang('Taux de complétion moyen', 'Completitud media', 'Avg. completion', lang)}
              </p>
              <p className="admin-kpi-card__value">{String(stats.avgProfileCompletionPct).replace('.', ',')}%</p>
              <div
                className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200"
                title={pickLang('Basé sur la grille d’exigence “publication + IA”', 'Basado en criterios', 'Based on profile readiness', lang)}
              >
                <div
                  className="h-full rounded-full bg-emerald-700"
                  style={{ width: `${Math.min(100, Math.max(0, stats.avgProfileCompletionPct))}%` }}
                />
              </div>
            </div>
            <div className="admin-kpi-card">
              <p className="admin-kpi-card__label">{ad.kpiCompleteProfiles}</p>
              <p className="admin-kpi-card__value">{stats.completedProfilesStrict}</p>
            </div>
            <div className="admin-kpi-card">
              <p className="admin-kpi-card__label">{ad.kpiPending}</p>
              <p className="admin-kpi-card__value">{stats.pendingReviewProfiles}</p>
            </div>
            <div className="admin-kpi-card">
              <p className="admin-kpi-card__label">
                {pickLang('Taux de retour (30 j)', 'Retorno (30 d)', 'Return rate (30d)', lang)}
              </p>
              <p className="admin-kpi-card__value">
                {stats.totalProfiles > 0
                  ? `${Math.round((stats.returningMembersLast30d / stats.totalProfiles) * 1000) / 10}%`
                  : '—'}
              </p>
              <p className="admin-kpi-card__trend">
                {stats.returningMembersLast30d}{' '}
                / {stats.totalProfiles} {pickLang('membres (lastSeen)', 'miembros', 'members', lang)}
              </p>
            </div>
          </div>

          {/* C. Priority action zone */}
          <div className="admin-priority-grid" id="admin-section-priority">
            <div className="min-w-0">{priorityLeft ?? null}</div>
            <div className="min-w-0">{priorityRight ?? null}</div>
          </div>

          <div className="admin-analytics-secondary">
            <div className="min-w-0">
              <article className="admin-chart-card admin-chart-card--compact admin-chart-card--needs-opportunity">
                <p className="admin-chart-card__title">{ad.needsBarTitle}</p>
                <p className="admin-chart-card__subtitle">{ad.needsBarSubtitle}</p>
                <div className="admin-chart-card__body">
                  <div className="admin-chart-frame admin-chart-frame--needs-embed">
                    <NeedsBarChart
                      data={needsData}
                      compact
                      embedded
                      limit={8}
                    />
                  </div>
                  {topNeedsPills.length > 0 ? (
                    <div className="admin-gaps">
                      <p className="admin-gaps__title">{ad.needsTopPillsTitle}</p>
                      <ul className="admin-gaps__list">
                        {topNeedsPills.map((row) => (
                          <li key={row.key}>{row.label}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              </article>
            </div>

            <article className="admin-chart-card admin-chart-card--compact admin-chart-card--sector-coverage">
              <p className="admin-chart-card__title">{ad.chartCoverageTitle}</p>
              <p className="admin-chart-card__subtitle">{ad.chartCoverageSubtitle}</p>
              <div className="admin-chart-card__body">
                <div className="admin-chart-frame admin-chart-frame--sm admin-chart-frame--center">
                  <ResponsiveContainer width="100%" height="100%" minHeight={300}>
                    <BarChart
                      data={sectorCoverageRows}
                      margin={{ top: 10, right: 10, bottom: 6, left: 4 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="name"
                        type="category"
                        interval={0}
                        tick={{ fontSize: 10, fill: '#64748b' }}
                        tickLine={false}
                        axisLine={{ stroke: '#e2e8f0' }}
                        height={78}
                        angle={-32}
                        textAnchor="end"
                        tickMargin={4}
                        tickFormatter={(v) => compactLabel(String(v ?? ''), 14)}
                      />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} width={32} />
                      <Tooltip contentStyle={{ fontSize: 12 }} />
                      <Bar dataKey="value" name={t('members')} radius={[6, 6, 0, 0]}>
                        {sectorCoverageRows.map((row, idx) => (
                          <Cell key={`${row.name}-${idx}`} fill={sectorColorByName.get(row.name) ?? '#1d4ed8'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="admin-gaps">
                  <p className="admin-gaps__title">{ad.gapsTitle}</p>
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
          </div>

          <div className="admin-decision-grid">
            <article className="admin-chart-card admin-chart-card--compact" id="admin-section-missing-fields">
              <p className="admin-chart-card__title">{ad.chartMissingFieldsTitle}</p>
              <p className="admin-chart-card__subtitle">{ad.chartMissingFieldsSubtitle}</p>
              <div className="admin-chart-card__body">
                <div className="admin-chart-frame admin-chart-frame--decision-bar admin-chart-frame--center">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={missingFieldRows}
                      layout="vertical"
                      margin={{ top: 4, right: 10, bottom: 4, left: 4 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                      <YAxis
                        type="category"
                        dataKey="field"
                        tick={{ fontSize: 11, fill: '#475569' }}
                        width={92}
                      />
                      <Tooltip contentStyle={{ fontSize: 12 }} />
                      <Bar dataKey="missing" name={ad.barNameMissing} fill="#d97706" radius={[0, 6, 6, 0]} barSize={14} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </article>

            <article className="admin-chart-card admin-chart-card--compact admin-decision-span-2" id="admin-section-gaps">
              <p className="admin-chart-card__title">{ad.gapMatrixTitle}</p>
              <p className="admin-chart-card__subtitle">{ad.gapMatrixSubtitle}</p>
              <div className="admin-chart-card__body">
                {coverageGapMatrixRows.length === 0 ? (
                  <p className="admin-decision-empty">{ad.gapMatrixEmpty}</p>
                ) : (
                  <div className="admin-gap-table-wrap">
                    <table className="admin-gap-table">
                      <thead>
                        <tr>
                          <th scope="col">{ad.gapTableLabel}</th>
                          <th scope="col">{ad.gapTableType}</th>
                          <th scope="col" className="admin-gap-table__num">
                            {ad.gapTableMembers}
                          </th>
                          <th scope="col">{ad.gapTableLevel}</th>
                          <th scope="col">{pickLang('Relance', 'Recordatorio', 'Nudge', lang)}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {coverageGapMatrixRows.map((row) => {
                          const level = row.value <= 1 ? 'fragile' : 'faible';
                          const subject = encodeURIComponent(
                            `FrancoNetwork — ${row.kind === 'sector' ? 'Secteur' : 'Ville'} : ${row.label}`
                          );
                          const body = encodeURIComponent(
                            [
                              'Bonjour,',
                              '',
                              `Petit rappel réseau : la zone « ${row.label} » est très peu représentée (${row.value} membre(s) repéré(s)).`,
                              'Si tu connais un profil pertinent, invite-le à postuler ici : https://franconetwork.app/inscription',
                              '',
                              'Merci,',
                            ].join('\n')
                          );
                          const href = `mailto:contact@franconetwork.app?subject=${subject}&body=${body}`;
                          return (
                            <tr key={`${row.kind}-${row.label}`}>
                              <td className="admin-gap-table__label">{row.label}</td>
                              <td>{row.kind === 'sector' ? ad.gapKindSector : ad.gapKindCity}</td>
                              <td className="admin-gap-table__num tabular-nums">{row.value}</td>
                              <td>
                                <span className={`admin-gap-pill admin-gap-pill--${level}`}>
                                  {row.value <= 1 ? ad.gapLevelVeryThin : ad.gapLevelThin}
                                </span>
                              </td>
                              <td>
                                <a className="text-sm font-semibold text-slate-900 underline" href={href}>
                                  {pickLang('Envoyer une relance', 'Enviar recordatorio', 'Send a nudge email', lang)}
                                </a>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </article>
          </div>

          {/* E. Deep-dive */}
          <div className="admin-bottom-section">
            <article className="admin-chart-card admin-chart-card--affinity" id="admin-section-affinities">
              <p className="admin-chart-card__title">{ad.affinityMainTitle}</p>
              <p className="admin-chart-card__subtitle">{ad.affinityMainSubtitle}</p>

              <div className="admin-chart-card__body">
                {/* LAYER A — Executive summary */}
                <div className="admin-affinity-summary">
                  {affinityInsights ? (
                    <div className="admin-affinity-summary-grid">
                      <div className="admin-mini-kpi">
                        <p className="admin-mini-kpi__label">{ad.affinityKpiTopPassion}</p>
                        <p className="admin-mini-kpi__value">{affinityInsights.topPassionLabel}</p>
                        <p className="admin-mini-kpi__meta">{ad.affinityOccurrences(affinityInsights.topPassionScore)}</p>
                      </div>
                      <div className="admin-mini-kpi">
                        <p className="admin-mini-kpi__label">{ad.affinityKpiTopSector}</p>
                        <p className="admin-mini-kpi__value">{affinityInsights.topSector}</p>
                        <p className="admin-mini-kpi__meta">{ad.affinityOccurrences(affinityInsights.topSectorScore)}</p>
                      </div>
                      <div className="admin-mini-kpi">
                        <p className="admin-mini-kpi__label">{ad.affinityKpiStrongestCross}</p>
                        <p className="admin-mini-kpi__value">
                          {affinityInsights.strongest.passionLabel} × {affinityInsights.strongest.sector}
                        </p>
                        <p className="admin-mini-kpi__meta">{ad.affinityMemberCount(affinityInsights.strongest.members)}</p>
                      </div>
                      <div className="admin-mini-kpi">
                        <p className="admin-mini-kpi__label">{ad.affinityKpiPriorityIntro}</p>
                        <p className="admin-mini-kpi__value">{ad.affinityKpiPriorityIntroValue}</p>
                        <p className="admin-mini-kpi__meta">{ad.affinityKpiPriorityIntroMeta}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-600">{ad.affinityEmptySummary}</p>
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
                          <p className="admin-affinity-card__meta">{ad.affinityMemberCount(r.members)}</p>
                          <p className="admin-affinity-card__suggestion">{adminActivationSuggestion(r, idx, lang)}</p>
                          <div className="admin-affinity-card__actions">
                            <button
                              type="button"
                              className="admin-affinity-action"
                              onClick={() => setPickedCross({ passionId: r.passionId, dimValue: r.sector, dimension: 'sector' })}
                            >
                              {adminAffinityViewMembers(lang)}
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* LAYER C — Secondary exploration (lower priority, collapsed by default) */}
                <details className="admin-affinity-explore">
                  <summary className="admin-affinity-explore__summary">{ad.affinityExploreSummary}</summary>

                  <div className="admin-affinity-explore__body">
                    <div className="admin-affinity-subtabs" role="tablist" aria-label={ad.affinityExploreAria}>
                      <button
                        type="button"
                        role="tab"
                        aria-selected={affinityExplore === 'detail'}
                        className={affinityExplore === 'detail' ? 'admin-affinity-subtab is-active' : 'admin-affinity-subtab'}
                        onClick={() => setAffinityExplore('detail')}
                      >
                        {ad.affinityTabDetail}
                      </button>
                      <button
                        type="button"
                        role="tab"
                        aria-selected={affinityExplore === 'matrix'}
                        className={affinityExplore === 'matrix' ? 'admin-affinity-subtab is-active' : 'admin-affinity-subtab'}
                        onClick={() => setAffinityExplore('matrix')}
                      >
                        {ad.affinityTabMatrix}
                      </button>
                    </div>

                    {affinityExplore === 'detail' ? (
                      <div className="admin-affinity-detail">
                        <div className="admin-table-wrap">
                          <table className="admin-table">
                            <thead>
                              <tr>
                                <th>{ad.affinityTablePassion}</th>
                                <th>{ad.affinityTableSector}</th>
                                <th>{ad.affinityTableMembers}</th>
                                <th>{ad.affinityTableAction}</th>
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
                                        {ad.affinityExploreBtn}
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
                          <p className="admin-matrix-caption">{ad.matrixCaption}</p>
                          <label>
                            <span className="sr-only">{ad.matrixFilterAria}</span>
                            <select
                              className="admin-matrix-filter"
                              value={crossDimension}
                              onChange={(e) => setCrossDimension(e.target.value as any)}
                            >
                              <option value="sector">{ad.matrixViewSector}</option>
                              <option value="poste">{ad.matrixViewRole}</option>
                              <option value="industrie">{ad.matrixViewIndustry}</option>
                            </select>
                          </label>
                        </div>
                        <div className="admin-chart-frame">
                          <MiniErrorBoundary label="PassionsCrossHeatmap" t={t}>
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
                    <p className="mt-1 text-xs text-stone-500">
                      {ad.drawerMembersShortlist(pickedCrossMembers.rows.length, shortlistCountInPick)}
                    </p>
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
                      title={ad.drawerCopyListTitle}
                    >
                      {ad.drawerCopyList}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        void copyText(ad.introEmailBulk(pickedCrossMembers.title));
                      }}
                      className="shrink-0 rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50"
                      title={ad.drawerCopyIntroTitle}
                    >
                      {ad.drawerCopyIntro}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPickedCross(null)}
                      className="shrink-0 rounded-lg bg-stone-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-stone-800"
                    >
                      {ad.drawerClose}
                    </button>
                  </div>
                </div>

                <div className="mt-3 flex-1 overflow-hidden px-4 pb-4">
                  <aside className="rounded-xl border border-stone-200 bg-stone-50 p-3">
                    <p className="text-xs font-extrabold uppercase tracking-wide text-stone-600">{ad.nextActionsTitle}</p>
                    <ul className="mt-2 grid gap-2 text-sm text-stone-800">
                      <li>
                        <strong>{ad.strongIntro}</strong>
                        {ad.nextActionsIntro}
                      </li>
                      <li>
                        <strong>{ad.strongShortlist}</strong>
                        {ad.nextActionsShortlist}
                      </li>
                      <li>
                        <strong>{ad.strongInvite}</strong>
                        {ad.nextActionsInvite}
                      </li>
                      <li>
                        <strong>{ad.strongFollowup}</strong>
                        {ad.nextActionsFollowup}
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
                        {ad.nextActionsCopyShortlist}
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
                                {ad.drawerViewProfile}
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
                                {isShortlisted ? ad.shortlistToggleOn : ad.shortlistToggleOff}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  void copyText(
                                    ad.introEmailSingle(String(m.nom ?? '').trim(), pickedCrossMembers.title)
                                  );
                                }}
                                className="rounded-md border border-stone-200 bg-white px-2.5 py-1 text-xs font-semibold text-stone-700 hover:bg-stone-50"
                              >
                                {ad.prepareIntro}
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
                {activeChart === 'type' && ad.modalChartType}
                {activeChart === 'status' && ad.modalChartStatus}
                {activeChart === 'city' && ad.modalChartCity}
                {activeChart === 'sector' && ad.modalChartSector}
                {activeChart === 'growth' && ad.modalChartGrowth}
                {activeChart === 'clicks' && ad.modalChartClicks}
              </h3>
              <button
                type="button"
                onClick={() => setActiveChart(null)}
                className="rounded-md border border-stone-200 px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-50"
              >
                {ad.drawerClose}
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
                        name={ad.lineCumulativeProfiles}
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
                      <Bar dataKey="value" name={ad.barClicksName} fill="#0ea5e9" radius={[6, 6, 0, 0]} />
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

