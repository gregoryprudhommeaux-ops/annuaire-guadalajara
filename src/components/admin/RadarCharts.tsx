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
  all: '#5B5BD6',
  freelance: '#22C55E',
  pme: '#F59E0B',
  corporate: '#EF4444',
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
      .filter((v) => typeof v === 'number' && v > 0);
    return vals.length ? parseFloat((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2)) : 0;
  });
}

const closeLoop = (arr: number[]) => [...arr, arr[0]];
const catsLoop = [...CATEGORIES, CATEGORIES[0]];
const PLOTLY_CONFIG = { responsive: true, displayModeBar: false };

export default function RadarCharts({ profiles }: RadarChartsProps) {
  const segmentKeys: SegmentKey[] = ['all', 'freelance', 'pme', 'corporate'];

  const segmentData = useMemo(() => {
    return Object.fromEntries(segmentKeys.map((seg) => [seg, avg(profiles, seg)])) as Record<SegmentKey, number[]>;
  }, [profiles]);

  const radarTraces = segmentKeys.map((seg) => {
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
      fillcolor: isAll ? 'rgba(91,91,214,0.15)' : undefined,
      opacity: isAll ? 0.9 : 0.75,
    };
  });

  const radarLayout = {
    polar: {
      radialaxis: {
        visible: true,
        range: [0, 5],
        tickvals: [1, 2, 3, 4, 5],
        tickfont: { size: 11 },
        gridcolor: 'rgba(180,180,180,0.4)',
      },
      angularaxis: { tickfont: { size: 12 } },
      bgcolor: 'rgba(248,248,252,0.6)',
    },
    showlegend: true,
    legend: {
      orientation: 'h' as const,
      yanchor: 'bottom' as const,
      y: -0.3,
      xanchor: 'center' as const,
      x: 0.5,
      font: { size: 11 },
    },
    title: {
      text: "Profil moyen par segment<br><span style='font-size:12px;font-weight:normal;'>Vue d'ensemble (échelle 0–5)</span>",
      font: { size: 15 },
      x: 0.5,
      xanchor: 'center' as const,
    },
    margin: { t: 80, b: 100, l: 40, r: 40 },
    paper_bgcolor: 'white',
    plot_bgcolor: 'white',
    autosize: true,
  };

  const barTraces = segmentKeys.map((seg) => ({
    type: 'bar' as const,
    name: SEGMENT_LABELS[seg],
    y: CATEGORIES,
    x: segmentData[seg],
    orientation: 'h' as const,
    marker: { color: COLORS[seg], opacity: 0.88 },
    text: segmentData[seg].map((v: number) => v.toFixed(1)),
    textposition: 'outside' as const,
    textfont: { size: 10 },
  }));

  const barLayout = {
    barmode: 'group' as const,
    xaxis: {
      range: [0, 6.2],
      title: { text: 'Score (0–5)' },
      tickvals: [0, 1, 2, 3, 4, 5],
      gridcolor: 'rgba(200,200,200,0.4)',
    },
    yaxis: {
      title: { text: '' },
      tickfont: { size: 11 },
      autorange: 'reversed' as const,
    },
    shapes: [
      {
        type: 'line' as const,
        x0: 2.5,
        x1: 2.5,
        y0: -0.5,
        y1: CATEGORIES.length - 0.5,
        line: { dash: 'dash' as const, color: 'rgba(100,100,100,0.35)', width: 1.5 },
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
        font: { size: 10, color: '#888' },
      },
    ],
    showlegend: false,
    title: {
      text: "Scores détaillés par axe & segment<br><span style='font-size:12px;font-weight:normal;'>Lecture valeur par valeur</span>",
      font: { size: 15 },
      x: 0.5,
      xanchor: 'center' as const,
    },
    margin: { t: 80, b: 50, l: 165, r: 60 },
    paper_bgcolor: 'white',
    plot_bgcolor: 'white',
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
          <Plot
            data={radarTraces as any}
            layout={radarLayout as any}
            config={PLOTLY_CONFIG as any}
            style={{ width: '100%', height: '420px' }}
            useResizeHandler
          />
        </div>

        <div className="overflow-hidden rounded-xl border border-stone-200 bg-white p-3 shadow-sm">
          <Plot
            data={barTraces as any}
            layout={barLayout as any}
            config={PLOTLY_CONFIG as any}
            style={{ width: '100%', height: '420px' }}
            useResizeHandler
          />
        </div>
      </div>
    </section>
  );
}

