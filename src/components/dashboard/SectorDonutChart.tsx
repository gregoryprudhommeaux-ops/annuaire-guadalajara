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

  if (rows.length === 0) {
    return (
      <div className="flex w-full items-center justify-center text-sm text-stone-500" style={{ height }}>
        Pas encore assez de données
      </div>
    );
  }

  const isNarrow = wrapWidth > 0 ? wrapWidth < 420 : false;

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
        <PieChart>
          <Pie
            data={rows}
            dataKey="count"
            nameKey="secteur"
            cx={isNarrow ? '50%' : '40%'}
            cy={isNarrow ? '42%' : '50%'}
            innerRadius={Math.round(Math.min(78, Math.max(54, height * 0.24)))}
            outerRadius={Math.round(Math.min(118, Math.max(90, height * 0.38)))}
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

