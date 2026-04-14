import React, { useMemo, useState } from 'react';
import type { Timestamp } from 'firebase/firestore';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { eachDayOfInterval, format, isAfter, parseISO, startOfDay, subDays } from 'date-fns';
import { fr as frLocale } from 'date-fns/locale';
import { cn } from '@/cn';

export type InscriptionAreaChartMember = { id: string; createdAt: Timestamp };

type PeriodKey = '7d' | '30d' | '90d' | 'all';

const PERIODS: Array<{ key: PeriodKey; label: string }> = [
  { key: '7d', label: '7j' },
  { key: '30d', label: '30j' },
  { key: '90d', label: '90j' },
  { key: 'all', label: 'Tout' },
];

export default function InscriptionAreaChart({
  members,
  height = 260,
}: {
  members: InscriptionAreaChartMember[];
  /** Hauteur (px) de la zone graphique (sans le header). */
  height?: number;
}) {
  const [period, setPeriod] = useState<PeriodKey>('30d');

  const dateFilter = useMemo(() => {
    if (period === 'all') return null;
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    return subDays(new Date(), days);
  }, [period]);

  const rows = useMemo(() => {
    const now = new Date();
    const start = dateFilter ? startOfDay(dateFilter) : subDays(now, 120);
    const days = eachDayOfInterval({ start, end: now });

    const created = (members ?? [])
      .map((m) => ({ id: m.id, d: m.createdAt?.toDate?.() ?? null }))
      .filter((x): x is { id: string; d: Date } => Boolean(x.d));

    const filtered = dateFilter ? created.filter((m) => isAfter(m.d, dateFilter) || m.d >= dateFilter) : created;

    const byKey = new Map<string, number>();
    filtered.forEach((m) => {
      const k = format(m.d, 'yyyy-MM-dd');
      byKey.set(k, (byKey.get(k) ?? 0) + 1);
    });

    let cumulative = 0;
    return days.map((d) => {
      const k = format(d, 'yyyy-MM-dd');
      const count = byKey.get(k) ?? 0;
      cumulative += count;
      return {
        date: format(d, 'dd MMM', { locale: frLocale }),
        dateIso: k,
        daily: count,
        cumulative,
      };
    });
  }, [members, dateFilter]);

  const nonZeroPoints = useMemo(() => rows.filter((r) => r.daily > 0 || r.cumulative > 0).length, [rows]);

  if (rows.length < 2 || nonZeroPoints < 2) {
    return (
      <div className="flex h-[260px] w-full items-center justify-center rounded-xl border border-stone-200 bg-white text-sm text-stone-500">
        Inscriptions en cours de collecte...
      </div>
    );
  }

  const tick = { fontSize: 10, fill: '#64748b' };

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-stone-900">Évolution des inscriptions</h3>
          <p className="mt-1 text-xs text-stone-500">Nouveaux inscrits + total cumulatif</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {PERIODS.map((p) => {
            const active = p.key === period;
            return (
              <button
                key={p.key}
                type="button"
                onClick={() => setPeriod(p.key)}
                className={cn(
                  'rounded-full px-3 py-1.5 text-xs font-semibold transition-colors',
                  active
                    ? 'bg-indigo-600 text-white'
                    : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                )}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-3 w-full" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={rows} margin={{ top: 8, right: 8, bottom: 8, left: 4 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={tick} />
            <YAxis allowDecimals={false} tick={tick} width={28} />
            <Tooltip
              contentStyle={{ fontSize: 11 }}
              labelFormatter={(label: unknown, payload: any) => {
                const iso = payload?.[0]?.payload?.dateIso;
                if (typeof iso === 'string') {
                  try {
                    return format(parseISO(iso), 'd MMMM yyyy', { locale: frLocale });
                  } catch {
                    // ignore
                  }
                }
                return String(label ?? '');
              }}
            />
            <Area
              type="monotone"
              dataKey="daily"
              stroke="#6366f1"
              fill="#6366f1"
              fillOpacity={0.2}
              strokeWidth={2}
              name="Nouveaux inscrits"
            />
            <Area
              type="monotone"
              dataKey="cumulative"
              stroke="#10b981"
              fill="#10b981"
              fillOpacity={0.15}
              strokeWidth={2}
              name="Total cumulatif"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

