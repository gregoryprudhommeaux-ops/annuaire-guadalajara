import { useMemo } from 'react';
import Plot from 'react-plotly.js';
import type { UserProfile } from '@/types';

type SegmentKey = 'all' | 'freelance' | 'pme' | 'corporate';

type RadarChartsProps = {
  profiles: Array<Partial<UserProfile> & { uid?: string; id?: string }>;
};

const CATEGORIES = [
  'Orientation export',
  'Appétence events',
  'Besoins networking',
  'Maturité digitale',
  'Taille équipe',
  'Fréquence échanges',
];

// Champs attendus (optionnels). S'ils n'existent pas encore en Firestore, la valeur sera 0.
const FIELD_KEYS = [
  'orientationExport',
  'appetenceEvents',
  'besoinsNetworking',
  'maturiteDigitale',
  'tailleEquipe',
  'frequenceEchanges',
] as const;

const SEGMENT_LABELS: Record<SegmentKey, string> = {
  all: 'Communauté (moy.)',
  freelance: 'Freelance',
  pme: 'PME',
  corporate: 'Corporate',
};

const COLORS: Record<SegmentKey, string> = {
  all: '#4f46e5', // indigo-600
  freelance: '#10b981', // emerald-500
  pme: '#f59e0b', // amber-500
  corporate: '#f43f5e', // rose-500
};

function clamp05(v: unknown): number {
  const n = typeof v === 'number' ? v : Number(v);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(5, n));
}

function inSegment(p: any, segment: SegmentKey): boolean {
  if (segment === 'all') return true;
  const memberStatus = String(p?.communityMemberStatus ?? '').toLowerCase();
  const companyKind = String(p?.communityCompanyKind ?? '').toLowerCase();
  if (segment === 'freelance') return memberStatus === 'freelance' || companyKind === 'independent';
  if (segment === 'pme') return companyKind === 'pme';
  if (segment === 'corporate') return companyKind === 'corporate';
  return false;
}

function avg(profiles: RadarChartsProps['profiles'], segment: SegmentKey): number[] {
  const filtered = (profiles ?? []).filter((p) => inSegment(p, segment));
  if (!filtered.length) return Array(FIELD_KEYS.length).fill(0);
  return FIELD_KEYS.map((key) => {
    const vals = filtered
      .map((p) => clamp05((p as any)?.[key]))
      .filter((v) => typeof v === 'number' && Number.isFinite(v));
    return vals.length ? parseFloat((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2)) : 0;
  });
}

const closeLoop = (arr: number[]) => [...arr, arr[0]];
const catsLoop = [...CATEGORIES, CATEGORIES[0]];
const PLOTLY_CONFIG = { responsive: true, displayModeBar: false };

export default function RadarCharts({ profiles }: RadarChartsProps) {
  const segmentKeys: SegmentKey[] = ['all', 'freelance', 'pme', 'corporate'];

  const segmentCounts = useMemo(() => {
    const counts: Record<SegmentKey, number> = { all: profiles.length, freelance: 0, pme: 0, corporate: 0 };
    (profiles ?? []).forEach((p) => {
      if (inSegment(p, 'freelance')) counts.freelance += 1;
      if (inSegment(p, 'pme')) counts.pme += 1;
      if (inSegment(p, 'corporate')) counts.corporate += 1;
    });
    return counts;
  }, [profiles]);

  const visibleSegments = useMemo(() => {
    return segmentKeys.filter((k) => k === 'all' || segmentCounts[k] > 0);
  }, [segmentCounts]);

  const segmentData = useMemo(() => {
    return Object.fromEntries(visibleSegments.map((seg) => [seg, avg(profiles, seg)])) as Record<SegmentKey, number[]>;
  }, [profiles, visibleSegments]);

  const maxValue = useMemo(() => {
    let max = 0;
    visibleSegments.forEach((seg) => {
      segmentData[seg].forEach((v) => {
        if (v > max) max = v;
      });
    });
    return max;
  }, [segmentData, visibleSegments]);

  const radarTraces = visibleSegments.map((seg) => {
    const isAll = seg === 'all';
    return {
      type: 'scatterpolar' as const,
      r: closeLoop(segmentData[seg]),
      theta: catsLoop,
      fill: isAll ? ('toself' as const) : ('none' as const),
      name: SEGMENT_LABELS[seg],
      line: {
        color: COLORS[seg],
        width: isAll ? 3 : 2,
        dash: (isAll ? 'solid' : 'dot') as 'solid' | 'dot',
      },
      fillcolor: isAll ? 'rgba(79,70,229,0.12)' : undefined,
      opacity: isAll ? 0.9 : 0.75,
    };
  });

  const radarLayout = {
    font: {
      family:
        'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"',
      color: '#0f172a',
      size: 12,
    },
    polar: {
      radialaxis: {
        visible: true,
        range: [0, 5],
        tickvals: [1, 2, 3, 4, 5],
        tickfont: { size: 11, color: '#64748b' },
        gridcolor: 'rgba(148,163,184,0.35)',
      },
      angularaxis: { tickfont: { size: 11, color: '#334155' } },
      bgcolor: 'rgba(255,255,255,0)',
    },
    showlegend: true,
    legend: {
      orientation: 'h' as const,
      yanchor: 'bottom' as const,
      y: -0.22,
      xanchor: 'center' as const,
      x: 0.5,
      font: { size: 11, color: '#475569' },
    },
    margin: { t: 20, b: 70, l: 30, r: 30 },
    paper_bgcolor: 'rgba(255,255,255,0)',
    plot_bgcolor: 'rgba(255,255,255,0)',
    autosize: true,
  };

  const barTraces = visibleSegments.map((seg) => ({
    type: 'bar' as const,
    name: SEGMENT_LABELS[seg],
    y: CATEGORIES,
    x: segmentData[seg],
    orientation: 'h' as const,
    marker: { color: COLORS[seg], opacity: 0.88 },
    text: segmentData[seg].map((v: number) => v.toFixed(1)),
    textposition: 'inside' as const,
    insidetextanchor: 'end' as const,
    textfont: { size: 10, color: '#0f172a' },
    cliponaxis: false as const,
  }));

  const barLayout = {
    font: {
      family:
        'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"',
      color: '#0f172a',
      size: 12,
    },
    barmode: 'group' as const,
    xaxis: {
      range: [0, 5],
      title: { text: 'Score (0–5)', font: { size: 11, color: '#475569' } },
      tickvals: [0, 1, 2, 3, 4, 5],
      tickfont: { size: 11, color: '#64748b' },
      gridcolor: 'rgba(148,163,184,0.25)',
      zeroline: false,
    },
    yaxis: {
      title: { text: '' },
      tickfont: { size: 11, color: '#334155' },
      autorange: 'reversed' as const,
    },
    shapes: [
      {
        type: 'line' as const,
        x0: 2.5,
        x1: 2.5,
        y0: -0.5,
        y1: CATEGORIES.length - 0.5,
        line: { dash: 'dash' as const, color: 'rgba(100,116,139,0.35)', width: 1.5 },
      },
    ],
    annotations: [
      {
        x: 2.5,
        y: -0.7,
        xref: 'x' as const,
        yref: 'y' as const,
        text: 'Médiane',
        showarrow: false,
        font: { size: 10, color: '#94a3b8' },
      },
    ],
    showlegend: true,
    legend: {
      orientation: 'h' as const,
      yanchor: 'bottom' as const,
      y: -0.24,
      xanchor: 'center' as const,
      x: 0.5,
      font: { size: 11, color: '#475569' },
    },
    margin: { t: 20, b: 70, l: 170, r: 24 },
    paper_bgcolor: 'rgba(255,255,255,0)',
    plot_bgcolor: 'rgba(255,255,255,0)',
    autosize: true,
  };

  return (
    <section className="mt-6">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-stone-900">Profil de la communauté</h2>
        <p className="mt-0.5 text-sm text-stone-500">
          Moyennes calculées sur {profiles.length} profil{profiles.length > 1 ? 's' : ''} · échelle 0–5
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="overflow-hidden rounded-xl border border-stone-200 bg-white p-3 shadow-sm">
          <div className="mb-2">
            <p className="text-sm font-semibold text-stone-900">Profil moyen par segment</p>
            <p className="mt-0.5 text-xs text-stone-500">Vue d’ensemble (échelle 0–5)</p>
          </div>
          {maxValue <= 0 ? (
            <div className="flex h-[360px] items-center justify-center rounded-lg border border-stone-200 bg-stone-50 text-sm text-stone-600">
              Pas encore de données (scores 0–5) pour afficher ces graphiques.
            </div>
          ) : (
            <Plot
              data={radarTraces as any}
              layout={radarLayout as any}
              config={PLOTLY_CONFIG as any}
              style={{ width: '100%', height: '360px' }}
              useResizeHandler
            />
          )}
        </div>

        <div className="overflow-hidden rounded-xl border border-stone-200 bg-white p-3 shadow-sm">
          <div className="mb-2">
            <p className="text-sm font-semibold text-stone-900">Scores détaillés par axe & segment</p>
            <p className="mt-0.5 text-xs text-stone-500">Lecture valeur par valeur</p>
          </div>
          {maxValue <= 0 ? (
            <div className="flex h-[360px] items-center justify-center rounded-lg border border-stone-200 bg-stone-50 text-sm text-stone-600">
              Pas encore de données (scores 0–5) pour afficher ces graphiques.
            </div>
          ) : (
            <Plot
              data={barTraces as any}
              layout={barLayout as any}
              config={PLOTLY_CONFIG as any}
              style={{ width: '100%', height: '360px' }}
              useResizeHandler
            />
          )}
        </div>
      </div>
    </section>
  );
}

