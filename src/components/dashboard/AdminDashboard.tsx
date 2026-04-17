import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
  Scatter,
  ScatterChart,
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
import { formatPersonName } from '@/shared/utils/formatPersonName';
import PassionsCrossHeatmap, { type CrossPick } from '@/components/dashboard/PassionsCrossHeatmap';
import TopActiveMembersTable from '@/components/dashboard/TopActiveMembersTable';
import { pickLang } from '@/lib/uiLocale';
import { NeedsBarChart } from '@/components/charts/NeedsBarChart';
import { aggregateNeedsFromMembers } from '@/lib/needs';
import { NEED_CATEGORY_LABELS } from '@/lib/needLabels';
import { NEED_OPTION_VALUE_SET, sanitizeHighlightedNeeds } from '@/needOptions';

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

/** Décalage déterministe pour éviter les points superposés (pas de Math.random). */
function scatterJitter(id: string): { dx: number; dy: number } {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const u = (h >>> 0) / 0xffffffff;
  const v = (Math.imul(h, 31) >>> 0) / 0xffffffff;
  return { dx: (u - 0.5) * 0.42, dy: (v - 0.5) * 0.42 };
}

function AttentionScatterTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload?: { name: string; views: number; clicks: number } }>;
}) {
  if (!active || !payload?.length) return null;
  const p = payload[0]?.payload;
  if (!p) return null;
  return (
    <div className="admin-scatter-tooltip rounded-lg border border-stone-200 bg-white px-3 py-2 text-left shadow-lg">
      <p className="text-[13px] font-semibold leading-snug text-stone-900">{p.name}</p>
      <p className="mt-1 text-[11px] tabular-nums text-stone-600">
        {p.views} vue{p.views > 1 ? 's' : ''} · {p.clicks} contact{p.clicks > 1 ? 's' : ''}
      </p>
    </div>
  );
}

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

type AdminRecommendedPayload =
  | { type: 'scroll'; id: string }
  | { type: 'affinity'; cross: CrossPick };

type AdminRecommendedItem = {
  key: string;
  priority: number;
  title: string;
  /** Métrique ou signal clé (ligne courte, chiffres). */
  signal: string;
  /** Une ligne de contexte, sans paragraphe. */
  context: string;
  ctaLabel: string;
  /** CTA plein uniquement si l’action est critique (ex. validation, matrice). */
  ctaEmphasis?: boolean;
  payload: AdminRecommendedPayload;
};

function clipAdminRecText(s: string, max: number): string {
  const t = s.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

function missingFieldRecTitle(field: string, lang: Language): string {
  switch (field) {
    case 'Photo':
      return pickLang('Photo manquante', 'Foto faltante', 'Missing photo', lang);
    case 'Description':
      return pickLang('Bio courte', 'Bio corta', 'Short bio', lang);
    case 'Secteur':
      return pickLang('Secteur manquant', 'Sector faltante', 'Missing sector', lang);
    case 'Société':
      return pickLang('Société manquante', 'Empresa faltante', 'Missing company', lang);
    case 'Ville':
      return pickLang('Ville manquante', 'Ciudad faltante', 'Missing city', lang);
    default:
      return pickLang(`${field} manquant`, `${field} faltante`, `${field} missing`, lang);
  }
}

function scrollAdminSectionIntoView(id: string) {
  requestAnimationFrame(() => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

function activationSuggestion(row: { members: number; passionId: string; sector: string }, rankIndex: number): string {
  if (row.members >= 6) return 'Afterwork transversal (gros potentiel)';
  if (row.members >= 4) return 'Rencontres ciblées (petit groupe)';
  if (row.members >= 2) return rankIndex === 0 ? 'Mise en relation pertinente' : 'Introduction ciblée';
  return 'Signal faible — à surveiller';
}

export default function AdminDashboard(props: AdminDashboardProps) {
  return <AdminDashboardInner {...props} />;
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
  const SECTOR_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6'];
  const sectorColorByName = useMemo(() => {
    const map = new Map<string, string>();
    bySectorData.forEach((s, idx) => {
      map.set(String(s.name), SECTOR_COLORS[idx % SECTOR_COLORS.length]);
    });
    return map;
  }, [bySectorData]);
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

  const attentionViewContact = useMemo(() => {
    const profiles = (stats.profilesForDashboard ?? []) as any[];
    const viewsMap = stats.profileViewsByUid ?? {};
    const byId = new Map<string, any>(profiles.map((p: any) => [String(p.id), p]));

    const ids = new Set<string>();
    Object.keys(viewsMap).forEach((id) => ids.add(id));
    profiles.forEach((p) => {
      if ((p.contactClicks ?? 0) > 0) ids.add(String(p.id));
    });

    const rawPoints = Array.from(ids)
      .map((id) => {
        const p = byId.get(id);
        const views = viewsMap[id] ?? 0;
        const clicks = p?.contactClicks ?? 0;
        const name = p
          ? formatPersonName(String(p.nom ?? '').trim())
          : String(viewsMap[id] !== undefined ? 'Membre' : id);
        return { id, name, views, clicks };
      })
      .filter((pt) => pt.views > 0 || pt.clicks > 0);

    const jittered = rawPoints.map((pt) => {
      const { dx, dy } = scatterJitter(pt.id);
      return {
        ...pt,
        x: pt.views + dx,
        y: pt.clicks + dy,
      };
    });

    const useScatter = jittered.length >= 5;

    const viewedNotContacted: typeof profiles = [];
    const viewedAndContacted: typeof profiles = [];
    const lowVisibility: typeof profiles = [];
    for (const p of profiles) {
      const id = String(p.id);
      const v = viewsMap[id] ?? 0;
      const c = p.contactClicks ?? 0;
      if (c >= 1) viewedAndContacted.push(p);
      else if (v >= 1) viewedNotContacted.push(p);
      else lowVisibility.push(p);
    }

    const byScore = (a: any, b: any) => {
      const va = viewsMap[String(a.id)] ?? 0;
      const vb = viewsMap[String(b.id)] ?? 0;
      return vb - va;
    };
    viewedNotContacted.sort(byScore);
    viewedAndContacted.sort((a, b) => (b.contactClicks ?? 0) - (a.contactClicks ?? 0) || byScore(a, b));
    lowVisibility.sort((a, b) => String(a.nom ?? '').localeCompare(String(b.nom ?? '')));

    return {
      scatter: jittered,
      useScatter,
      editorial: {
        highAttentionLowContact: viewedNotContacted.slice(0, 5),
        engaged: viewedAndContacted.slice(0, 5),
        lowVisibility: lowVisibility.slice(0, 5),
        counts: {
          highAttentionLowContact: viewedNotContacted.length,
          engaged: viewedAndContacted.length,
          lowVisibility: lowVisibility.length,
        },
      },
    };
  }, [stats.profilesForDashboard, stats.profileViewsByUid]);

  const coverageGapMatrixRows = useMemo(() => {
    const sectors = Object.entries(stats.profilesBySector ?? {}).map(([label, value]) => ({
      label,
      kind: 'Secteur' as const,
      value,
    }));
    const cities = Object.entries(stats.profilesByCity ?? {}).map(([label, value]) => ({
      label,
      kind: 'Ville' as const,
      value,
    }));
    return [...sectors, ...cities]
      .filter((r) => r.value <= 2)
      .sort((a, b) => a.value - b.value || a.label.localeCompare(b.label))
      .slice(0, 10);
  }, [stats.profilesBySector, stats.profilesByCity]);

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
      .slice(0, 5);

    const locale = lang === 'es' ? 'es' : lang === 'en' ? 'en' : 'fr';
    const topOverlapPassions = Array.from(passionToSectors.entries())
      .map(([pid, sectors]) => ({
        pid,
        sectorCount: sectors.size,
        memberCount: passionToMembers.get(pid)?.size ?? 0,
        label: `${getPassionEmoji(pid)} ${getPassionLabel(pid, locale)}`,
      }))
      .sort((a, b) => b.sectorCount - a.sectorCount || b.memberCount - a.memberCount)
      .slice(0, 5);

    return { memberScores, topOverlapPassions };
  }, [stats.profilesForDashboard, lang]);

  const runRecommendedAction = useCallback((payload: AdminRecommendedPayload) => {
    if (payload.type === 'affinity') {
      setPickedCross(payload.cross);
      return;
    }
    scrollAdminSectionIntoView(payload.id);
  }, []);

  const { primaryRecommended, secondaryRecommended } = useMemo(() => {
    const out: AdminRecommendedItem[] = [];
    const total = stats.totalProfiles;
    const none = { primaryRecommended: [] as AdminRecommendedItem[], secondaryRecommended: [] as AdminRecommendedItem[] };
    if (total <= 0) return none;

    if (stats.pendingReviewProfiles > 0) {
      const n = stats.pendingReviewProfiles;
      out.push({
        key: 'pending-review',
        priority: 12,
        title: pickLang('Validation en attente', 'Validaciones pendientes', 'Pending validation', lang),
        signal: pickLang(`${n} fiche${n > 1 ? 's' : ''}`, `${n} ficha(s)`, `${n} profile(s)`, lang),
        context: pickLang('Revue admin requise.', 'Requiere revisión.', 'Admin review needed.', lang),
        ctaLabel: pickLang('Voir les KPI', 'Ver KPI', 'View KPIs', lang),
        ctaEmphasis: true,
        payload: { type: 'scroll', id: 'admin-section-kpi' },
      });
    }

    const topMissing = missingFieldRows[0];
    if (topMissing && topMissing.missing > 0) {
      const pct = Math.round((topMissing.missing / Math.max(1, total)) * 100);
      if (topMissing.missing >= 4 || pct >= 12) {
        out.push({
          key: `missing-${topMissing.field}`,
          priority: 18,
          title: missingFieldRecTitle(topMissing.field, lang),
          signal: pickLang(
            `${topMissing.missing} profils · ${pct} %`,
            `${topMissing.missing} perfiles · ${pct} %`,
            `${topMissing.missing} profiles · ${pct}%`,
            lang
          ),
          context: pickLang('Part du réseau concernée.', 'Parte de la red.', 'Share of network.', lang),
          ctaLabel: pickLang('Champs à compléter', 'Campos', 'Missing fields', lang),
          payload: { type: 'scroll', id: 'admin-section-missing-fields' },
        });
      }
    }

    if (stats.incompleteProfilesStrict >= 3) {
      const pctStrict = Math.round((stats.incompleteProfilesStrict / total) * 100);
      out.push({
        key: 'strict-completion',
        priority: 22,
        title: pickLang('Complétion stricte', 'Completitud estricta', 'Strict completion', lang),
        signal: pickLang(
          `${stats.incompleteProfilesStrict} profils · ${pctStrict} %`,
          `${stats.incompleteProfilesStrict} perfiles · ${pctStrict} %`,
          `${stats.incompleteProfilesStrict} profiles · ${pctStrict}%`,
          lang
        ),
        context: pickLang(
          'Nom, secteur, bio 30+, photo.',
          'Nombre, sector, bio 30+, foto.',
          'Name, sector, 30+ bio, photo.',
          lang
        ),
        ctaLabel: pickLang('Voir la jauge', 'Ver medidor', 'View gauge', lang),
        payload: { type: 'scroll', id: 'admin-section-completion' },
      });
    }

    const hnc = attentionViewContact.editorial.counts.highAttentionLowContact;
    if (hnc > 0) {
      const sample = attentionViewContact.editorial.highAttentionLowContact[0];
      const sampleName = sample ? formatPersonName(String(sample.nom ?? '').trim()) : '';
      out.push({
        key: 'attention-low-conversion',
        priority: 28,
        title: pickLang('Attention sans contact', 'Vistas sin contacto', 'Views, no contact', lang),
        signal: pickLang(`${hnc} profil${hnc > 1 ? 's' : ''}`, `${hnc} perfil(es)`, `${hnc} profile(s)`, lang),
        context: sampleName
          ? clipAdminRecText(
              pickLang(`Ex. ${sampleName}`, `Ej. ${sampleName}`, `e.g. ${sampleName}`, lang),
              72
            )
          : pickLang('Vues sans clic contact.', 'Vistas sin clic.', 'Views without contact clicks.', lang),
        ctaLabel: pickLang('Graphique attention', 'Gráfico', 'Attention chart', lang),
        payload: { type: 'scroll', id: 'admin-section-attention' },
      });
    }

    const topHub = relationshipPotential.memberScores[0];
    const hubThreshold = total < 35 ? 2 : 4;
    if (topHub && topHub.score >= hubThreshold) {
      const name = formatPersonName(String(topHub.nom ?? '').trim());
      out.push({
        key: 'connect-hub',
        priority: 32,
        title: pickLang('Membre pivot', 'Miembro pivote', 'Connector member', lang),
        signal: pickLang(
          `${topHub.score} liens passion`,
          `${topHub.score} vínculos`,
          `${topHub.score} passion ties`,
          lang
        ),
        context: clipAdminRecText(name, 48),
        ctaLabel: pickLang('Voir connexions', 'Ver vínculos', 'See connections', lang),
        payload: { type: 'scroll', id: 'admin-section-connect' },
      });
    }

    if (coverageGapMatrixRows.length > 0) {
      const g = coverageGapMatrixRows[0];
      out.push({
        key: 'coverage-gaps',
        priority: 38,
        title: pickLang('Gaps de couverture', 'Brechas de cobertura', 'Coverage gaps', lang),
        signal: pickLang(
          `${coverageGapMatrixRows.length} zones ≤ 2`,
          `${coverageGapMatrixRows.length} zonas ≤ 2`,
          `${coverageGapMatrixRows.length} thin zones`,
          lang
        ),
        context: clipAdminRecText(`${g.kind} « ${g.label} »`, 56),
        ctaLabel: pickLang('Carte des écarts', 'Mapa', 'Gap map', lang),
        payload: { type: 'scroll', id: 'admin-section-gaps' },
      });
    }

    const affTop = affinityTop3[0];
    if (affTop && affTop.members >= 2) {
      out.push({
        key: 'affinity-activate',
        priority: 42,
        title: pickLang('Affinité forte', 'Afinidad fuerte', 'Strong affinity', lang),
        signal: pickLang(
          `${affTop.members} membres`,
          `${affTop.members} miembros`,
          `${affTop.members} members`,
          lang
        ),
        context: clipAdminRecText(`${affTop.passionLabel} × ${affTop.sector}`, 58),
        ctaLabel: pickLang('Ouvrir la matrice', 'Abrir matriz', 'Open matrix', lang),
        ctaEmphasis: true,
        payload: {
          type: 'affinity',
          cross: { passionId: affTop.passionId, dimValue: affTop.sector, dimension: 'sector' },
        },
      });
    }

    const topPassion = relationshipPotential.topOverlapPassions[0];
    if (topPassion && topPassion.sectorCount >= 3 && (!affTop || topPassion.pid !== affTop.passionId)) {
      out.push({
        key: 'passion-transverse',
        priority: 46,
        title: pickLang('Passion transversale', 'Pasión transversal', 'Cross-cutting passion', lang),
        signal: pickLang(
          `${topPassion.sectorCount} secteurs`,
          `${topPassion.sectorCount} sectores`,
          `${topPassion.sectorCount} sectors`,
          lang
        ),
        context: clipAdminRecText(topPassion.label, 52),
        ctaLabel: pickLang('Vue passions', 'Vista', 'Passions view', lang),
        payload: { type: 'scroll', id: 'admin-section-passions' },
      });
    }

    const lv = attentionViewContact.editorial.counts.lowVisibility;
    if (lv >= Math.max(6, Math.ceil(total * 0.15))) {
      out.push({
        key: 'visibility-lift',
        priority: 48,
        title: pickLang('Visibilité basse', 'Baja visibilidad', 'Low visibility', lang),
        signal: pickLang(`${lv} profils`, `${lv} perfiles`, `${lv} profiles`, lang),
        context: pickLang('Aucune vue ni contact (période).', 'Sin vistas ni contactos.', 'No views or contacts.', lang),
        ctaLabel: pickLang('Vue attention', 'Vista', 'View chart', lang),
        payload: { type: 'scroll', id: 'admin-section-attention' },
      });
    }

    if (out.length < 4) {
      out.push({
        key: 'active-members-follow',
        priority: 72,
        title: pickLang('Membres engagés', 'Miembros activos', 'Engaged members', lang),
        signal: pickLang('Période en cours', 'Periodo actual', 'Current period', lang),
        context: pickLang('Qui porte le réseau.', 'Quién mueve la red.', 'Who drives the network.', lang),
        ctaLabel: pickLang('Liste active', 'Lista', 'Active list', lang),
        payload: { type: 'scroll', id: 'admin-section-active-members' },
      });
    }

    const seen = new Set<string>();
    const deduped: AdminRecommendedItem[] = [];
    for (const item of [...out].sort((a, b) => a.priority - b.priority)) {
      if (seen.has(item.key)) continue;
      seen.add(item.key);
      deduped.push(item);
    }
    const all = deduped.slice(0, 6);
    return {
      primaryRecommended: all.slice(0, 3),
      secondaryRecommended: all.slice(3),
    };
  }, [
    lang,
    stats.totalProfiles,
    stats.pendingReviewProfiles,
    stats.incompleteProfilesStrict,
    missingFieldRows,
    attentionViewContact,
    relationshipPotential,
    coverageGapMatrixRows,
    affinityTop3,
  ]);

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

          <article className="admin-chart-card admin-recommended-actions" id="admin-section-recommended">
            <div className="admin-recommended-actions__head">
              <div>
                <p className="admin-chart-card__title admin-recommended-actions__title">
                  {pickLang('Actions recommandées', 'Acciones recomendadas', 'Recommended actions', lang)}
                </p>
                <p className="admin-chart-card__subtitle admin-recommended-actions__subtitle">
                  {pickLang(
                    'Signaux forts du tableau de bord, par ordre d’impact.',
                    'Señales claras del panel, por impacto.',
                    'High-impact signals from your dashboard, in order.',
                    lang
                  )}{' '}
                  <button
                    type="button"
                    className="admin-recommended-actions__inline-action"
                    onClick={() => scrollAdminSectionIntoView('admin-section-priority')}
                    title={pickLang(
                      'Aller aux besoins sans réponse et dernières demandes.',
                      'Ir a necesidades sin respuesta y últimas solicitudes.',
                      'Jump to unanswered needs and latest requests.',
                      lang
                    )}
                  >
                    {pickLang('Besoins & demandes', 'Necesidades y solicitudes', 'Needs & requests', lang)}
                  </button>
                </p>
              </div>
            </div>
            <div className="admin-recommended-actions__body">
              {primaryRecommended.length === 0 && secondaryRecommended.length === 0 ? (
                <p className="admin-recommended-actions__empty">
                  {pickLang(
                    'Pas assez de données pour proposer des actions sur cette période.',
                    'Datos insuficientes para acciones en este periodo.',
                    'Not enough data to suggest actions for this period.',
                    lang
                  )}
                </p>
              ) : (
                <>
                  <div className="admin-rec-tier">
                    <p className="admin-rec-tier__label" aria-label={pickLang('Priorité 1', 'Prioridad 1', 'Priority 1', lang)}>
                      {pickLang('P1 — À traiter maintenant', 'P1 — Ahora', 'P1 — Address now', lang)}
                    </p>
                    <ul className="admin-recommended-actions__grid admin-recommended-actions__grid--primary">
                      {primaryRecommended.map((item) => (
                        <li key={item.key} className="admin-rec-card admin-rec-card--primary">
                          <p className="admin-rec-card__title">{item.title}</p>
                          <p className="admin-rec-card__signal">{item.signal}</p>
                          <p className="admin-rec-card__context">{item.context}</p>
                          <button
                            type="button"
                            className={
                              item.ctaEmphasis
                                ? 'admin-rec-card__action admin-rec-card__action--emphasis'
                                : 'admin-rec-card__action'
                            }
                            onClick={() => runRecommendedAction(item.payload)}
                          >
                            {item.ctaLabel}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                  {secondaryRecommended.length > 0 ? (
                    <div className="admin-rec-tier admin-rec-tier--secondary">
                      <p className="admin-rec-tier__label" aria-label={pickLang('Priorité 2', 'Prioridad 2', 'Priority 2', lang)}>
                        {pickLang('P2 — Ensuite', 'P2 — Después', 'P2 — Next', lang)}
                      </p>
                      <ul className="admin-recommended-actions__grid admin-recommended-actions__grid--secondary">
                        {secondaryRecommended.map((item) => (
                          <li key={item.key} className="admin-rec-card admin-rec-card--secondary">
                            <p className="admin-rec-card__title">{item.title}</p>
                            <p className="admin-rec-card__signal">{item.signal}</p>
                            <p className="admin-rec-card__context">{item.context}</p>
                            <button
                              type="button"
                              className={
                                item.ctaEmphasis
                                  ? 'admin-rec-card__action admin-rec-card__action--emphasis'
                                  : 'admin-rec-card__action'
                              }
                              onClick={() => runRecommendedAction(item.payload)}
                            >
                              {item.ctaLabel}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </>
              )}
            </div>
          </article>

          {/* C. Priority action zone */}
          <div className="admin-priority-grid" id="admin-section-priority">
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
                      <InscriptionAreaChart members={stats.profilesCreatedAt} height={280} />
                    </MiniErrorBoundary>
                  </div>
                </div>
              </article>
            </div>

            <div className="admin-stack">
              <article className="admin-chart-card admin-chart-card--compact" id="admin-section-completion">
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
            <article className="admin-chart-card admin-chart-card--table" id="admin-section-active-members">
              <p className="admin-chart-card__title">Membres les plus actifs</p>
              <p className="admin-chart-card__subtitle">
                Basé sur les clics de contact — score d’engagement par membre.
              </p>
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

            <div className="min-w-0">
              <NeedsBarChart
                data={needsData}
                title="Opportunités actuellement recherchées"
                subtitle="Les membres du réseau expriment activement ces besoins"
                compact
              />
            </div>

            <article className="admin-chart-card admin-chart-card--compact">
              <p className="admin-chart-card__title">Couverture secteurs / villes</p>
              <p className="admin-chart-card__subtitle">Identifier forces & zones faibles.</p>
              <div className="admin-chart-card__body">
                <div className="admin-chart-frame admin-chart-frame--sm admin-chart-frame--center">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={sectorCoverageRows} margin={{ top: 6, right: 10, bottom: 30, left: 6 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={xTickCardAngled as any} interval={0} height={52} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                      <Tooltip contentStyle={{ fontSize: 12 }} />
                      <Bar dataKey="value" name="Membres" radius={[6, 6, 0, 0]}>
                        {sectorCoverageRows.map((row, idx) => (
                          <Cell key={`${row.name}-${idx}`} fill={sectorColorByName.get(row.name) ?? '#1d4ed8'} />
                        ))}
                      </Bar>
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
          </div>

          <div className="admin-decision-grid">
            <article className="admin-chart-card admin-chart-card--compact" id="admin-section-missing-fields">
              <p className="admin-chart-card__title">Champs les plus souvent manquants</p>
              <p className="admin-chart-card__subtitle">Où concentrer les relances de complétion.</p>
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
                      <Bar dataKey="missing" name="Manquants" fill="#d97706" radius={[0, 6, 6, 0]} barSize={14} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </article>

            <article className="admin-chart-card admin-chart-card--compact" id="admin-section-attention">
              <p className="admin-chart-card__title">Attention vs conversion</p>
              <p className="admin-chart-card__subtitle">
                {attentionViewContact.useScatter
                  ? 'Chaque point = un membre · axe X = vues profil, axe Y = clics contact.'
                  : 'Vue segmentée (peu de signal sur la période) — priorités lisibles.'}
              </p>
              <div className="admin-chart-card__body">
                {attentionViewContact.scatter.length === 0 ? (
                  <p className="admin-decision-empty">Pas encore de vues ni de contacts sur cette période.</p>
                ) : attentionViewContact.useScatter ? (
                  <div className="admin-chart-frame admin-chart-frame--scatter">
                    <ResponsiveContainer width="100%" height="100%">
                      <ScatterChart margin={{ top: 10, right: 14, bottom: 22, left: 16 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                        <XAxis
                          type="number"
                          dataKey="x"
                          name="Vues"
                          tick={{ fontSize: 11, fill: '#64748b' }}
                          allowDecimals={false}
                          label={{
                            value: 'Vues profil',
                            position: 'insideBottom',
                            offset: -4,
                            style: { fontSize: 11, fill: '#78716c' },
                          }}
                        />
                        <YAxis
                          type="number"
                          dataKey="y"
                          name="Contacts"
                          tick={{ fontSize: 11, fill: '#64748b' }}
                          allowDecimals={false}
                          label={{
                            value: 'Clics contact',
                            angle: -90,
                            position: 'insideLeft',
                            style: { fontSize: 11, fill: '#78716c', textAnchor: 'middle' },
                          }}
                        />
                        <Tooltip content={<AttentionScatterTooltip />} cursor={{ strokeDasharray: '4 4' }} />
                        <Scatter data={attentionViewContact.scatter} fill="#4f46e5" fillOpacity={0.75} />
                      </ScatterChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="admin-attention-editorial">
                    <div className="admin-attention-segment">
                      <p className="admin-attention-segment__title">Très vus, peu contactés</p>
                      <p className="admin-attention-segment__meta">
                        {attentionViewContact.editorial.counts.highAttentionLowContact} profil
                        {attentionViewContact.editorial.counts.highAttentionLowContact > 1 ? 's' : ''}
                      </p>
                      <ul className="admin-decision-rows">
                        {attentionViewContact.editorial.highAttentionLowContact.length === 0 ? (
                          <li className="admin-decision-rows__empty">—</li>
                        ) : (
                          attentionViewContact.editorial.highAttentionLowContact.map((m: any) => {
                            const v = stats.profileViewsByUid?.[String(m.id)] ?? 0;
                            return (
                              <li key={m.id} className="admin-decision-rows__item">
                                <span className="admin-decision-rows__primary">
                                  {formatPersonName(String(m.nom ?? '').trim())}
                                </span>
                                <span className="admin-decision-rows__secondary">
                                  {v} vue{v > 1 ? 's' : ''} · 0 contact
                                </span>
                              </li>
                            );
                          })
                        )}
                      </ul>
                    </div>
                    <div className="admin-attention-segment">
                      <p className="admin-attention-segment__title">Vus et contactés</p>
                      <p className="admin-attention-segment__meta">
                        {attentionViewContact.editorial.counts.engaged} profil
                        {attentionViewContact.editorial.counts.engaged > 1 ? 's' : ''}
                      </p>
                      <ul className="admin-decision-rows">
                        {attentionViewContact.editorial.engaged.length === 0 ? (
                          <li className="admin-decision-rows__empty">—</li>
                        ) : (
                          attentionViewContact.editorial.engaged.map((m: any) => {
                            const v = stats.profileViewsByUid?.[String(m.id)] ?? 0;
                            const c = m.contactClicks ?? 0;
                            return (
                              <li key={m.id} className="admin-decision-rows__item">
                                <span className="admin-decision-rows__primary">
                                  {formatPersonName(String(m.nom ?? '').trim())}
                                </span>
                                <span className="admin-decision-rows__secondary">
                                  {v} vue{v > 1 ? 's' : ''} · {c} contact{c > 1 ? 's' : ''}
                                </span>
                              </li>
                            );
                          })
                        )}
                      </ul>
                    </div>
                    <div className="admin-attention-segment">
                      <p className="admin-attention-segment__title">Encore peu visibles</p>
                      <p className="admin-attention-segment__meta">
                        {attentionViewContact.editorial.counts.lowVisibility} profil
                        {attentionViewContact.editorial.counts.lowVisibility > 1 ? 's' : ''} sans signal
                      </p>
                      <ul className="admin-decision-rows">
                        {attentionViewContact.editorial.lowVisibility.length === 0 ? (
                          <li className="admin-decision-rows__empty">—</li>
                        ) : (
                          attentionViewContact.editorial.lowVisibility.map((m: any) => (
                            <li key={m.id} className="admin-decision-rows__item">
                              <span className="admin-decision-rows__primary">
                                {formatPersonName(String(m.nom ?? '').trim())}
                              </span>
                              <span className="admin-decision-rows__secondary">0 vue · 0 contact</span>
                            </li>
                          ))
                        )}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </article>

            <article className="admin-chart-card admin-chart-card--compact" id="admin-section-connect">
              <p className="admin-chart-card__title">Membres à connecter en priorité</p>
              <p className="admin-chart-card__subtitle">
                Forte proximité de passions avec d’autres membres — utile pour intros ciblées.
              </p>
              <div className="admin-chart-card__body">
                {relationshipPotential.memberScores.length === 0 ? (
                  <p className="admin-decision-empty">Pas assez de passions renseignées pour estimer le potentiel.</p>
                ) : (
                  <ul className="admin-opportunity-member-list">
                    {relationshipPotential.memberScores.map((m) => (
                      <li key={m.id} className="admin-opportunity-member-list__row">
                        <div className="admin-opportunity-member-list__text">
                          <p className="admin-opportunity-member-list__name">
                            {formatPersonName(String(m.nom ?? '').trim())}
                          </p>
                          {(m.entreprise || m.city) && (
                            <p className="admin-opportunity-member-list__meta">
                              {[String(m.entreprise ?? '').trim(), String(m.city ?? '').trim()]
                                .filter(Boolean)
                                .join(' · ')}
                            </p>
                          )}
                        </div>
                        <p className="admin-opportunity-member-list__score tabular-nums" title="Membres distincts partageant au moins une passion">
                          {m.score}
                          <span className="admin-opportunity-member-list__score-label"> recoupements</span>
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </article>

            <article className="admin-chart-card admin-chart-card--compact" id="admin-section-passions">
              <p className="admin-chart-card__title">Passions les plus transverses</p>
              <p className="admin-chart-card__subtitle">S’étendent sur le plus de secteurs — leviers pour animations transverses.</p>
              <div className="admin-chart-card__body">
                {relationshipPotential.topOverlapPassions.length === 0 ? (
                  <p className="admin-decision-empty">—</p>
                ) : (
                  <ul className="admin-opportunity-passion-list">
                    {relationshipPotential.topOverlapPassions.map((p) => (
                      <li key={p.pid} className="admin-opportunity-passion-list__row">
                        <p className="admin-opportunity-passion-list__label">{p.label}</p>
                        <div className="admin-opportunity-passion-list__metrics tabular-nums">
                          <span title="Nombre de secteurs distincts">{p.sectorCount} sect.</span>
                          <span className="admin-opportunity-passion-list__sep" aria-hidden>
                            ·
                          </span>
                          <span title="Membres avec cette passion">{p.memberCount} membres</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </article>

            <article className="admin-chart-card admin-chart-card--compact admin-decision-span-2" id="admin-section-gaps">
              <p className="admin-chart-card__title">Gaps secteurs & villes</p>
              <p className="admin-chart-card__subtitle">
                Zones comptant ≤ 2 membres — à surveiller pour la représentativité du réseau.
              </p>
              <div className="admin-chart-card__body">
                {coverageGapMatrixRows.length === 0 ? (
                  <p className="admin-decision-empty">
                    Aucun secteur ni ville sous le seuil (≤2) avec les données actuelles.
                  </p>
                ) : (
                  <div className="admin-gap-table-wrap">
                    <table className="admin-gap-table">
                      <thead>
                        <tr>
                          <th scope="col">Libellé</th>
                          <th scope="col">Type</th>
                          <th scope="col" className="admin-gap-table__num">
                            Membres
                          </th>
                          <th scope="col">Niveau</th>
                        </tr>
                      </thead>
                      <tbody>
                        {coverageGapMatrixRows.map((row) => {
                          const level = row.value <= 1 ? 'fragile' : 'faible';
                          return (
                            <tr key={`${row.kind}-${row.label}`}>
                              <td className="admin-gap-table__label">{row.label}</td>
                              <td>{row.kind}</td>
                              <td className="admin-gap-table__num tabular-nums">{row.value}</td>
                              <td>
                                <span className={`admin-gap-pill admin-gap-pill--${level}`}>
                                  {row.value <= 1 ? 'Très fin' : 'Fin'}
                                </span>
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
                        <p className="admin-mini-kpi__label">Mise en relation prioritaire</p>
                        <p className="admin-mini-kpi__value">Identifier les membres à connecter</p>
                        <p className="admin-mini-kpi__meta">Priorité basée sur les signaux observés</p>
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

