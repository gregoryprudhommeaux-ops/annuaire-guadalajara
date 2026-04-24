import React, { useEffect, useMemo, useRef, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export type SectorDonutDatum = { secteur: string; count: number };

export default function SectorDonutChart({
  data,
  height = 280,
}: {
  data: SectorDonutDatum[];
  /** Hauteur (px) de la zone graphique (donut + légende). */
  height?: number;
}) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [wrapWidth, setWrapWidth] = useState<number>(0);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries?.[0]?.contentRect?.width ?? 0;
      setWrapWidth(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const rows = useMemo(() => {
    return (data ?? [])
      .map((d) => ({
        secteur: String(d.secteur ?? '').trim() || '—',
        count: Number(d.count ?? 0) || 0,
      }))
      .filter((d) => d.count > 0);
  }, [data]);

  const total = useMemo(() => rows.reduce((acc, r) => acc + r.count, 0), [rows]);

  const COLORS = [
    '#6366f1',
    '#10b981',
    '#f59e0b',
    '#ef4444',
    '#3b82f6',
    '#8b5cf6',
    '#ec4899',
    '#14b8a6',
  ];

  const isNarrow = wrapWidth > 0 ? wrapWidth < 420 : false;
  /**
   * Sur des largeurs “moyennes” (ex. colonne admin), le donut peut déborder à gauche si `cx=40%`
   * + `outerRadius` proche de la hauteur — le conteneur admin a `overflow:hidden` et tronque le graph.
   */
  const { cx, innerRadius, outerRadius, pieChartMargin } = useMemo(() => {
    const w = wrapWidth > 0 ? wrapWidth : 0;
    // Hauteur utile: la zone <ResponsiveContainer /> correspond à `height` (padding vertical minimal).
    const h = height;

    const isTight = w > 0 && w < 700 && !isNarrow;
    // Centre du donut: en layout non-narrow, un cx trop "à droite" (40%) + un gros R peut dépasser à gauche.
    const cxPct = isNarrow
      ? 0.5
      : isTight
        ? w > 0 && w < 560
          ? 0.32
          : 0.34
        : 0.4;
    const cxValue = `${Math.round(cxPct * 100)}%` as const;

    // Marge empirique à droite pour ne pas mordre sur la légende (Recharts, layout vertical, align=right)
    // + une petite marge "anti-clipping" côté SVG.
    const legendRightGutter = isNarrow ? 0 : 150;
    const padL = 12;
    const padR = 12;
    // Bornes du rayon: centré sur cxPct*w dans la largeur de plot, avec garde-fous hauteur.
    const rFromLeft = w > 0 ? cxPct * w - padL : Number.POSITIVE_INFINITY;
    const rFromRight = w > 0 ? w - cxPct * w - legendRightGutter - padR : Number.POSITIVE_INFINITY;
    const rFromHeight = h * 0.42; // marge haute/basse pour le donut
    const outerR = Math.round(
      Math.min(118, Math.max(64, h * 0.34), rFromLeft, rFromRight, rFromHeight, w > 0 ? w * 0.32 : 118)
    );
    const innerR = Math.round(
      Math.min(78, Math.max(48, h * 0.22), Math.max(40, outerR * 0.6))
    );
    // Marges: help Recharts conserver de l’air (labels) — surtout visible dans un cadre overflow:hidden côté admin.
    const m = { top: 6, right: 8, bottom: 8, left: 10 } as const;

    return { cx: cxValue, innerRadius: innerR, outerRadius: outerR, pieChartMargin: m };
  }, [height, isNarrow, wrapWidth]);

  if (rows.length === 0) {
    return (
      <div className="flex w-full items-center justify-center text-sm text-stone-500" style={{ height }}>
        Pas encore assez de données
      </div>
    );
  }

  const label = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
  }: {
    cx?: number;
    cy?: number;
    midAngle?: number;
    innerRadius?: number;
    outerRadius?: number;
    percent?: number;
  }) => {
    if (!cx || !cy || !midAngle || !innerRadius || !outerRadius || !percent) return null;
    if (percent < 0.05) return null;
    const RAD = Math.PI / 180;
    const r = innerRadius + (outerRadius - innerRadius) * 0.55;
    const x = cx + r * Math.cos(-midAngle * RAD);
    const y = cy + r * Math.sin(-midAngle * RAD);
    const pct = Math.round(percent * 100);
    return (
      <text
        x={x}
        y={y}
        fill="#0f172a"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={11}
        fontWeight={700}
      >
        {pct}%
      </text>
    );
  };

  return (
    <div
      ref={wrapRef}
      className="relative w-full min-w-0"
      style={{ height, overflow: 'visible' }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart margin={pieChartMargin}>
          <Pie
            data={rows}
            dataKey="count"
            nameKey="secteur"
            cx={cx}
            cy={isNarrow ? '42%' : '50%'}
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            paddingAngle={2}
            labelLine={false}
            label={label}
          >
            {rows.map((entry, index) => (
              <Cell key={`${entry.secteur}-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            wrapperStyle={{
              zIndex: 50,
              pointerEvents: 'none',
            }}
            contentStyle={{
              fontSize: 12,
              borderRadius: 10,
              border: '1px solid rgba(0,0,0,0.08)',
              boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
            }}
            allowEscapeViewBox={{ x: true, y: true }}
            formatter={(value: unknown, name: unknown) => {
              const n = String(name ?? '');
              const v = typeof value === 'number' ? value : Number(value ?? 0);
              const pct = total > 0 ? Math.round((v / total) * 100) : 0;
              const unit = v > 1 ? 'membres' : 'membre';
              return [`${v} ${unit} (${pct}%)`, n];
            }}
          />
          <Legend
            layout={isNarrow ? 'horizontal' : 'vertical'}
            verticalAlign={isNarrow ? 'bottom' : 'middle'}
            align={isNarrow ? 'center' : 'right'}
            iconSize={10}
            wrapperStyle={
              isNarrow
                ? { fontSize: 12, width: '100%', paddingTop: 8, lineHeight: 1.25 }
                : { fontSize: 12, maxHeight: 260, overflow: 'auto' }
            }
            formatter={(value: unknown, _entry: unknown, index: number) => {
              const name = String(value ?? '');
              const r = rows[index];
              return `${name}${r ? ` — ${r.count}` : ''}`;
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

