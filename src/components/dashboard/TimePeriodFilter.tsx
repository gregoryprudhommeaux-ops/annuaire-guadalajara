import React from 'react';
import { cn } from '@/cn';
import { useTimePeriod, type TimePeriod } from '@/contexts/TimePeriodContext';

const PERIODS: Array<{ key: TimePeriod; label: string }> = [
  { key: 'today', label: "Aujourd'hui" },
  { key: '7d', label: '7 jours' },
  { key: '30d', label: '30 jours' },
  { key: '90d', label: '90 jours' },
  { key: 'all', label: 'Tout' },
];

export default function TimePeriodFilter() {
  const { period, setPeriod, getPeriodLabel } = useTimePeriod();
  return (
    <div className="sticky top-0 z-10 -mx-4 border-b border-gray-100 bg-white/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-xl sm:border sm:border-stone-200 sm:bg-white sm:shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        {PERIODS.map((p) => {
          const active = p.key === period;
          return (
            <button
              key={p.key}
              type="button"
              onClick={() => setPeriod(p.key)}
              className={cn(
                'rounded-full px-3 py-1.5 text-xs font-medium transition-colors sm:px-4 sm:text-sm',
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
      <p className="mt-2 text-xs italic text-gray-400">Période : {getPeriodLabel()}</p>
    </div>
  );
}

