import React, { useEffect, useId, useMemo, useState } from 'react';
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { Language } from '@/types';
import {
  formatGrowthAxisDate,
  formatGrowthTooltipDate,
} from '@/lib/statsGrowthDateFormat';
import { chartTheme, hexToRgba } from '@/lib/chartTheme';
import {
  StatsBadge,
  StatsInsightCard,
  StatsPrimaryButton,
  StatsSectionHeader,
  StatsSectionShell,
} from '@/components/stats/ui';

/** Série unique : courbe + aire (lisible sur fond clair). */
const GROWTH_LINE = chartTheme.categorical[0]!;

type Row = { date: string; count: number };

function findAccelerationIndex(rows: Row[]): number {
  if (rows.length < 2) return -1;
  let bestI = 1;
  let bestDelta = -1;
  for (let i = 1; i < rows.length; i++) {
    const a = rows[i]!.count - rows[i - 1]!.count;
    if (a > bestDelta) {
      bestDelta = a;
      bestI = i;
    }
  }
  return bestDelta > 0 ? bestI : -1;
}

type Copy = {
  eyebrow: string;
  title: string;
  lead: string;
  annotTitle: string;
  annotSub: string;
  insightTitle: string;
  insightBody: string;
  badge1: (n: number) => string;
  badge2: (n: number) => string;
  tooltipN: (n: number) => string;
  transition: string;
  cta: string;
  empty: string;
};

function tcopy(lang: Language, _recentMembers: number, _total: number): Copy {
  if (lang === 'en') {
    return {
      eyebrow: 'Network growth',
      title: 'FrancoNetwork is accelerating week after week',
      lead: 'A visible dynamic driven by word of mouth, referrals, and the first active members.',
      annotTitle: 'Visible acceleration',
      annotSub: 'The network is starting to spread naturally',
      insightTitle: 'What this curve tells you',
      insightBody:
        'The first sign-ups are not just a volume. They show that a focused, Francophone, high-quality network can quickly create a flywheel in Guadalajara.',
      badge1: (n) => `+${n} members in the recent period`,
      badge2: (n) => `${n} decision-makers already listed`,
      tooltipN: (n) => `${n} members already signed up`,
      transition: 'Each new sign-up increases the value of the network for everyone else.',
      cta: 'Join the network',
      empty: 'Not enough history yet to plot the curve. Come back soon.',
    };
  }
  if (lang === 'es') {
    return {
      eyebrow: 'Crecimiento de la red',
      title: 'FrancoNetwork acelera semana a semana',
      lead: 'Dinamismo visible, impulsado por el boca a boca, referencias y los primeros miembros activos.',
      annotTitle: 'Aceleración visible',
      annotSub: 'La red empieza a difundirse de forma natural',
      insightTitle: 'Qué cuenta esta curva',
      insightBody:
        'Las primeras inscripciones no son solo volumen. Muestran que una red francófona, cualificada y segmentada puede generar un efecto de arranque en Guadalajara.',
      badge1: (n) => `+${n} miembros en el periodo reciente`,
      badge2: (n) => `${n} perfiles de decisores ya visibles`,
      tooltipN: (n) => `Ya ${n} miembros inscritos`,
      transition: 'Cada nueva inscripción hace crecer el valor de la red para todos los demás.',
      cta: 'Unirse a la red',
      empty: 'Aún no hay historial para la curva. Vuelve pronto.',
    };
  }
  return {
    eyebrow: 'Croissance du réseau',
    title: 'FrancoNetwork accélère semaine après semaine',
    lead: 'Une dynamique visible, portée par le bouche-à-oreille, les recommandations et les premiers membres actifs.',
    annotTitle: 'Accélération visible',
    annotSub: 'Le réseau commence à se diffuser naturellement',
    insightTitle: 'Ce que cette courbe raconte',
    insightBody:
      'Les premières inscriptions ne sont pas seulement un volume. Elles montrent qu’un réseau ciblé, francophone et qualifié peut rapidement créer un effet d’entraînement à Guadalajara.',
    badge1: (n) => `+${n} membres sur la période récente`,
    badge2: (n) => `${n} décideurs déjà visibles`,
    tooltipN: (n) => `${n} membres déjà inscrits`,
    transition: 'Chaque nouvelle inscription augmente la valeur du réseau pour tous les autres.',
    cta: 'Rejoindre le réseau',
    empty: 'Pas encore assez d’historique pour la courbe. Revenez bientôt.',
  };
}

export function NetworkGrowthSection({
  growthCumulative,
  totalMembers,
  newMembersLast30d,
  lang,
  pdfMode = false,
}: {
  growthCumulative: Row[];
  totalMembers: number;
  newMembersLast30d: number;
  lang: Language;
  /**
   * When true, render a PDF-safe version of the chart.
   * html2canvas can fail on SVG `foreignObject` and some filters.
   */
  pdfMode?: boolean;
}) {
  const c = tcopy(lang, newMembersLast30d, totalMembers);
  const chartBase = useId().replace(/:/g, '');
  const gradId = `${chartBase}-fill`;
  const dropId = `${chartBase}-drop`;
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const t = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(t);
  }, []);

  const data = useMemo(() => growthCumulative.map((r) => ({ ...r })), [growthCumulative]);
  const annotIndex = useMemo(
    () => (pdfMode ? -1 : data.length ? findAccelerationIndex(data) : -1),
    [data, pdfMode]
  );
  const maxY = useMemo(() => {
    if (data.length === 0) return 1;
    return Math.max(...data.map((d) => d.count), 1);
  }, [data]);

  return (
    <section
      className={`network-growth-section mt-10 print:break-inside-avoid ${entered ? 'opacity-100' : 'opacity-0 translate-y-2 motion-reduce:translate-y-0 motion-reduce:opacity-100'} transition-all duration-500 ease-out motion-reduce:duration-0`}
    >
      <StatsSectionShell>
        <div className="border-b border-slate-100 px-4 py-5 sm:px-6 sm:py-6">
          <StatsSectionHeader eyebrow={c.eyebrow} title={c.title} description={c.lead} />
        </div>

        {data.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-slate-500 sm:px-6">{c.empty}</p>
        ) : (
          <div className="grid grid-cols-1 gap-6 p-4 sm:p-6 lg:grid-cols-12 lg:items-start">
            <div className="relative min-h-0 w-full min-w-0 max-w-full lg:col-span-7">
              <div className="h-64 w-full min-w-0 sm:h-72">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <ComposedChart
                    data={data}
                    margin={{ top: 12, right: 4, left: 0, bottom: 4 }}
                    accessibilityLayer={false}
                  >
                    <defs>
                      <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={hexToRgba(GROWTH_LINE, 0.22)} stopOpacity={1} />
                        <stop offset="100%" stopColor={hexToRgba(GROWTH_LINE, 0.04)} stopOpacity={1} />
                      </linearGradient>
                      {!pdfMode ? (
                        <filter
                          id={dropId}
                          x="-100%"
                          y="-100%"
                          width="300%"
                          height="300%"
                          colorInterpolationFilters="sRGB"
                        >
                          <feDropShadow dx="0" dy="1" stdDeviation="1.2" floodOpacity="0.1" />
                        </filter>
                      ) : null}
                    </defs>
                    <CartesianGrid
                      vertical={false}
                      stroke={chartTheme.base.axis}
                      strokeDasharray="3 3"
                    />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(d) => formatGrowthAxisDate(String(d), lang)}
                      tick={{ fontSize: 10, fill: chartTheme.base.labelMuted }}
                      minTickGap={20}
                      tickLine={false}
                      axisLine={{ stroke: chartTheme.base.axis }}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 10, fill: chartTheme.base.labelMuted }}
                      tickLine={false}
                      axisLine={false}
                      width={40}
                      domain={[0, Math.max(1, maxY * 1.1)]}
                    />
                    <Tooltip
                      content={
                        <GrowthTooltip
                          labelFormatter={(d) => formatGrowthTooltipDate(String(d), lang)}
                          lineMembers={c.tooltipN}
                        />
                      }
                    />
                    <Area
                      type="monotoneX"
                      dataKey="count"
                      fill={`url(#${gradId})`}
                      stroke="none"
                      isAnimationActive={false}
                    />
                    <Line
                      type="monotoneX"
                      dataKey="count"
                      name="count"
                      stroke={GROWTH_LINE}
                      strokeWidth={2.5}
                      isAnimationActive={false}
                      dot={lineDot(
                        annotIndex,
                        c.annotTitle,
                        c.annotSub,
                        data.length,
                        dropId,
                        pdfMode
                      )}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            <aside className="border-t border-slate-100 pt-5 lg:col-span-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
              <StatsInsightCard className="!shadow-none">
                <h3 className="text-sm font-extrabold text-slate-900">{c.insightTitle}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{c.insightBody}</p>
                <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-2">
                  <StatsBadge variant="neutral" caps={false} className="w-full justify-center !text-xs !font-semibold sm:w-auto">
                    {c.badge1(newMembersLast30d)}
                  </StatsBadge>
                  <StatsBadge variant="neutral" caps={false} className="w-full justify-center !text-xs !font-semibold sm:w-auto">
                    {c.badge2(totalMembers)}
                  </StatsBadge>
                </div>
              </StatsInsightCard>
            </aside>
          </div>
        )}

        {data.length > 0 && (
          <div className="border-t border-slate-100 px-4 py-4 sm:px-6 sm:py-5">
            <p className="text-sm text-slate-600">{c.transition}</p>
            <div className="mt-4 print:hidden">
              <StatsPrimaryButton to="/inscription" className="w-full sm:w-auto">
                {c.cta}
              </StatsPrimaryButton>
            </div>
            <p className="mt-2 hidden text-xs text-slate-500 print:block">franconetwork.app / inscription</p>
          </div>
        )}
      </StatsSectionShell>
    </section>
  );
}

function lineDot(
  annotIndex: number,
  title: string,
  sub: string,
  nPoints: number,
  dropFilterId: string,
  pdfMode: boolean
) {
  function GrowthAnnotDot(props: {
    cx?: number;
    cy?: number;
    index?: number;
    payload?: Row;
    [k: string]: unknown;
  }) {
    if (annotIndex < 0 || props.index !== annotIndex) return null;
    if (pdfMode) return null;
    const { cx, cy, index = 0 } = props;
    if (typeof cx !== 'number' || typeof cy !== 'number') return null;
    return (
      <AnnotationPoint
        cx={cx}
        cy={cy}
        index={index}
        nPoints={nPoints}
        title={title}
        sub={sub}
        dropFilterId={dropFilterId}
        pdfMode={pdfMode}
      />
    );
  }
  GrowthAnnotDot.displayName = 'GrowthAnnotDot';
  return GrowthAnnotDot;
}

function GrowthTooltip({
  active,
  payload,
  label,
  labelFormatter,
  lineMembers,
}: {
  active?: boolean;
  payload?: Array<{ payload: Row; value: number }>;
  label?: string;
  labelFormatter: (d: string) => string;
  lineMembers: (n: number) => string;
}) {
  if (!active || !payload?.length) return null;
  const p = payload[0]?.payload;
  if (!p) return null;
  const dKey = String(label ?? p.date);
  return (
    <div
      className="rounded-lg px-3 py-2.5 text-left shadow-lg"
      style={{
        minWidth: 120,
        backgroundColor: chartTheme.base.tooltipBg,
        color: chartTheme.base.tooltipText,
        border: `1px solid ${chartTheme.base.axis}`,
      }}
    >
      <p className="text-[11px] font-medium opacity-90 sm:text-xs">{labelFormatter(dKey)}</p>
      <p className="mt-1 text-xl font-extrabold tabular-nums text-white">{p.count}</p>
      <p className="mt-0.5 text-xs opacity-90">{lineMembers(p.count)}</p>
    </div>
  );
}

/**
 * Repère visuel (point) + callout (foreignObject) — position ajustée selon le quartier du graph.
 */
function AnnotationPoint({
  cx,
  cy,
  title,
  sub,
  nPoints,
  index,
  dropFilterId,
  pdfMode,
}: {
  cx: number;
  cy: number;
  title: string;
  sub: string;
  nPoints: number;
  index: number;
  dropFilterId: string;
  pdfMode: boolean;
}) {
  if (!Number.isFinite(cx) || !Number.isFinite(cy)) return null;
  const placeRight = index < (nPoints - 1) * 0.55;
  const boxW = 158;
  const yOff = 52;

  if (pdfMode) {
    return (
      <g>
        <circle
          r={5}
          fill={GROWTH_LINE}
          stroke="#fff"
          strokeWidth={2}
          cx={cx}
          cy={cy}
        />
      </g>
    );
  }

  return (
    <g>
      <circle
        r={5}
        fill={GROWTH_LINE}
        stroke="#fff"
        strokeWidth={2}
        cx={cx}
        cy={cy}
        filter={`url(#${dropFilterId})`}
      />
      <foreignObject
        x={placeRight ? cx + 6 : cx - boxW - 4}
        y={cy - yOff}
        width={boxW}
        height={56}
        className="overflow-visible"
      >
        <div className="rounded-lg border border-slate-200/80 bg-white/95 px-2 py-1.5 shadow-sm backdrop-blur">
          <p className="text-[10px] font-semibold leading-tight" style={{ color: GROWTH_LINE }}>
            {title}
          </p>
          <p className="mt-0.5 text-[9px] leading-tight text-slate-600 sm:text-[10px]">{sub}</p>
        </div>
      </foreignObject>
    </g>
  );
}
