import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export type NeedChartRow = {
  key: string;
  label: string;
  count: number;
};

type Props = {
  data: NeedChartRow[];
  title?: string;
  subtitle?: string;
  /** Compact variant (e.g. Radar). */
  compact?: boolean;
  /** Aligne avec les cartes admin (pas de bordure / titre propre, uniquement le graphique). */
  embedded?: boolean;
  /** Override compact axis width (useful for mobile layouts). */
  compactYAxisWidth?: number;
  /** Override compact max chars per label line (tick renderer). */
  compactTickMaxChars?: number;
  /** Override compact tick font size. */
  compactTickFontSize?: number;
  /** Hard cap of visible categories (defaults to 8). */
  limit?: number;
};

const COLORS = [
  '#0f766e', // teal-700
  '#115e59', // teal-800
  '#1d4ed8', // blue-700
  '#7c3aed', // violet-600
  '#b45309', // amber-700
  '#be123c', // rose-700
  '#334155', // slate-700
  '#4338ca', // indigo-700
] as const;

function compactLabel(label: string, max: number): string {
  const s = String(label ?? '').trim();
  if (!s) return '';
  if (s.length <= max) return s;
  return `${s.slice(0, Math.max(0, max - 1))}…`;
}

/** Split long labels on " / " so each line stays readable; keeps tooltip full text via <title>. */
function splitLabelForTick(full: string, maxSingleLine: number): string[] | null {
  const s = String(full ?? '').trim();
  if (!s || s.length <= maxSingleLine) return null;
  const idx = s.indexOf(' / ');
  if (idx <= 0) return null;
  const a = s.slice(0, idx).trim();
  const b = s.slice(idx + 3).trim();
  if (!a || !b) return null;
  const line1 = `${a} /`;
  if (line1.length > maxSingleLine + 8 || b.length > maxSingleLine + 8) {
    return [compactLabel(line1, maxSingleLine + 4), compactLabel(b, maxSingleLine + 4)];
  }
  return [line1, b];
}

/** Coupure sur un espace proche de max pour éviter « partenaires commer… ». */
function splitAtWordNear(full: string, max: number): [string, string] | null {
  const s = String(full ?? '').trim();
  if (s.length <= max) return null;
  const head = s.slice(0, max);
  const sp = head.lastIndexOf(' ');
  if (sp > 10) {
    const a = s.slice(0, sp);
    const b = s.slice(sp + 1).trim();
    if (b) return [a, b];
  }
  return null;
}

function NeedsYAxisTick({
  x,
  y,
  payload,
  maxSingleLine,
  fontSize,
}: {
  x?: number | string;
  y?: number | string;
  payload?: { value?: string };
  /** Approx. max characters per line before wrap or ellipsis. */
  maxSingleLine: number;
  fontSize: number;
}) {
  const nx = typeof x === 'number' ? x : Number(x ?? 0);
  const ny = typeof y === 'number' ? y : Number(y ?? 0);
  const full = String(payload?.value ?? '');
  const splitSlash = splitLabelForTick(full, maxSingleLine);
  const splitWord = splitSlash ? null : splitAtWordNear(full, maxSingleLine);
  const lines: string[] | null = splitSlash ?? (splitWord ? [splitWord[0], splitWord[1]] : null);
  const single =
    lines == null
      ? full.length > maxSingleLine
        ? compactLabel(full, maxSingleLine)
        : full
      : null;

  return (
    <g transform={`translate(${nx},${ny})`}>
      <title>{full}</title>
      {lines && lines[1] ? (
        <text textAnchor="end" fill="#334155" fontSize={fontSize}>
          <tspan x={0} dy="-0.55em" dominantBaseline="middle">
            {lines[0]}
          </tspan>
          <tspan x={0} dy="1.15em" dominantBaseline="middle">
            {lines[1]}
          </tspan>
        </text>
      ) : (
        <text
          textAnchor="end"
          dominantBaseline="middle"
          fill="#334155"
          fontSize={fontSize}
        >
          {single}
        </text>
      )}
    </g>
  );
}

export function NeedsBarChart({
  data,
  title = 'Besoins les plus exprimés',
  subtitle = 'Catégories de besoins actuellement les plus présentes dans le réseau',
  compact = false,
  embedded = false,
  compactYAxisWidth,
  compactTickMaxChars,
  compactTickFontSize,
  limit = 8,
}: Props) {
  const rows = useMemo(() => {
    const cap = Math.max(1, Math.min(8, Math.round(Number(limit) || 8)));
    return (data ?? [])
      .map((d) => ({
        key: String(d.key ?? '').trim(),
        label: String(d.label ?? '').trim() || String(d.key ?? '').trim() || '—',
        count: Number(d.count ?? 0),
      }))
      .filter((d) => d.key && Number.isFinite(d.count) && d.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, cap);
  }, [data, limit]);

  const hasData = rows.length > 0;

  const maxCount = useMemo(
    () => rows.reduce((m, r) => Math.max(m, r.count), 0) || 1,
    [rows]
  );

  const height = embedded ? 248 : compact ? 280 : 420;
  const titleSize = compact ? 'text-[13px]' : 'text-base md:text-lg';
  const subtitleSize = compact ? 'text-[11px]' : 'text-sm';
  const yTickFontSize = compact ? (compactTickFontSize ?? 11) : 11;
  /** Wider axis + more chars per line so labels stay readable (Recharts clips if width is too small). */
  // Compact (Radar): keep the chart visually left-aligned on mobile.
  // A too-wide Y axis creates a large empty gutter and pushes bars to the right.
  const yAxisWidth = embedded
    ? (compactYAxisWidth ?? 202)
    : compact
      ? (compactYAxisWidth ?? 160)
      : 300;
  const yTickMaxLine = embedded
    ? (compactTickMaxChars ?? 30)
    : compact
      ? (compactTickMaxChars ?? 22)
      : 40;

  const marginLeft = embedded ? 4 : compact ? 6 : 20;

  const chartInner = (
    <div
      style={{ height }}
      className={embedded ? 'h-full w-full min-h-0 min-w-0 flex-1' : 'w-full min-w-0'}
    >
      {!hasData ? (
        <div className="flex h-full min-h-[220px] w-full items-center justify-center rounded-xl border border-zinc-200/90 bg-zinc-50/90 px-3 text-sm text-zinc-600">
          <p className="text-center font-semibold leading-snug">
            Aucune donnée de besoins à afficher.
          </p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={rows}
            layout="vertical"
            margin={{ top: 4, right: 12, left: marginLeft, bottom: 4 }}
            barCategoryGap={compact ? 12 : 16}
          >
              <XAxis
                type="number"
                domain={[0, maxCount]}
                allowDecimals={false}
                tick={{ fontSize: compact ? 11 : 12, fill: '#64748b' }}
                stroke="#e4e4e7"
                axisLine={{ stroke: '#e4e4e7' }}
                tickLine={{ stroke: '#e4e4e7' }}
              />
              <YAxis
                type="category"
                dataKey="label"
                width={yAxisWidth}
                interval={0}
                stroke="#e4e4e7"
                axisLine={false}
                tickLine={false}
                tick={(p) => (
                  <NeedsYAxisTick
                    {...p}
                    maxSingleLine={yTickMaxLine}
                    fontSize={yTickFontSize}
                  />
                )}
              />
              <Tooltip
                cursor={{ fill: 'rgba(15,118,110,0.06)' }}
                formatter={(value: unknown) => [Number(value ?? 0), 'Membres']}
                contentStyle={{
                  borderRadius: 12,
                  border: '1px solid #e4e4e7',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                  fontSize: 12,
                }}
                labelStyle={{ color: '#0f172a', fontWeight: 700 }}
              />
              <Bar
                dataKey="count"
                radius={[0, compact ? 8 : 10, compact ? 8 : 10, 0]}
                maxBarSize={compact ? 22 : 26}
              >
                {rows.map((entry, index) => (
                  <Cell
                    key={entry.key}
                    fill={COLORS[index % COLORS.length]}
                    fillOpacity={0.95}
                  />
                ))}
              </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );

  if (embedded) {
    return chartInner;
  }

  return (
    <section className="flex flex-col rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm md:p-6">
      {title || subtitle ? (
        <header className={compact ? 'mb-3' : 'mb-4'}>
          {title ? (
            <h3 className={`${titleSize} font-semibold leading-snug text-zinc-900`}>
              {title}
            </h3>
          ) : null}
          {subtitle ? (
            <p className={`${subtitleSize} mt-1 text-zinc-500`}>{subtitle}</p>
          ) : null}
        </header>
      ) : null}

      {chartInner}
    </section>
  );
}

