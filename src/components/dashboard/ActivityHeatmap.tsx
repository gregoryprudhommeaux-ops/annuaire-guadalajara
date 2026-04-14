import React, { useMemo } from 'react';
import type { Timestamp } from 'firebase/firestore';
import { ActivityCalendar } from 'react-activity-calendar';
import { eachDayOfInterval, format, parseISO, startOfToday, subWeeks } from 'date-fns';
import { fr as frLocale } from 'date-fns/locale';

export type HeatmapMember = { id: string; createdAt: Timestamp };

type DayRow = { date: string; count: number; level: 0 | 1 | 2 | 3 | 4 };

function levelForCount(c: number): 0 | 1 | 2 | 3 | 4 {
  if (c <= 0) return 0;
  if (c === 1) return 1;
  if (c === 2) return 2;
  if (c <= 4) return 3;
  return 4;
}

function toActivityData(members: HeatmapMember[]): DayRow[] {
  const end = startOfToday();
  const start = subWeeks(end, 52);
  const days = eachDayOfInterval({ start, end });
  const byDate = new Map<string, number>();
  members.forEach((m) => {
    const d = m.createdAt?.toDate?.();
    if (!d) return;
    const key = format(d, 'yyyy-MM-dd');
    byDate.set(key, (byDate.get(key) ?? 0) + 1);
  });
  return days.map((d) => {
    const key = format(d, 'yyyy-MM-dd');
    const count = byDate.get(key) ?? 0;
    return { date: key, count, level: levelForCount(count) };
  });
}

export default function ActivityHeatmap({ members }: { members: HeatmapMember[] }) {
  const data = useMemo(() => toActivityData(members ?? []), [members]);
  const total = useMemo(() => data.reduce((a, b) => a + b.count, 0), [data]);

  const colorScheme = {
    light: ['#eef2ff', '#c7d2fe', '#a5b4fc', '#818cf8', '#4f46e5'],
    dark: ['#1e1b4b', '#312e81', '#3730a3', '#4338ca', '#4f46e5'],
  } as const;

  const labels = {
    months: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'],
    weekdays: ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'],
    totalCount: '{{count}} inscriptions',
    legend: { less: 'Moins', more: 'Plus' },
  } as const;

  if ((members?.length ?? 0) < 5) {
    return (
      <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-stone-900">Activité d'inscription</h3>
        <p className="mt-1 text-xs text-stone-500">52 dernières semaines</p>
        <div className="mt-3 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs text-indigo-900">
          La heatmap sera plus lisible avec davantage de membres
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-stone-900">Activité d'inscription</h3>
      <p className="mt-1 text-xs text-stone-500">52 dernières semaines</p>
      <div className="mt-3">
        <ActivityCalendar
          data={data}
          blockSize={13}
          blockMargin={4}
          fontSize={12}
          colorScheme={colorScheme}
          labels={labels as any}
          showWeekdayLabels
          theme={{
            light: { text: '#475569' },
            dark: { text: '#e2e8f0' },
          }}
          renderBlock={(block, activity) => {
            const a = activity as unknown as DayRow;
            const date = parseISO(a.date);
            const label = `${a.count} inscriptions — ${format(date, 'd MMMM yyyy', { locale: frLocale })}`;
            return <div title={label}>{block}</div>;
          }}
        />
      </div>
      <p className="mt-3 text-xs italic text-stone-500">{total} inscriptions sur les 52 dernières semaines</p>
    </div>
  );
}

