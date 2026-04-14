import React, { useMemo } from 'react';
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
    <div className="w-full min-w-0" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={rows}
            dataKey="count"
            nameKey="secteur"
            cx="40%"
            cy="50%"
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
            contentStyle={{ fontSize: 12 }}
            formatter={(value: unknown, name: unknown) => {
              const n = String(name ?? '');
              const v = typeof value === 'number' ? value : Number(value ?? 0);
              const pct = total > 0 ? Math.round((v / total) * 100) : 0;
              const unit = v > 1 ? 'membres' : 'membre';
              return [`${v} ${unit} (${pct}%)`, n];
            }}
          />
          <Legend
            layout="vertical"
            verticalAlign="middle"
            align="right"
            iconSize={10}
            wrapperStyle={{ fontSize: 12, maxHeight: 260, overflow: 'auto' }}
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

