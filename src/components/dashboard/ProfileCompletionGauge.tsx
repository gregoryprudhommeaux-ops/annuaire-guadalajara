import React, { useMemo, useState } from 'react';
import ReactApexChart from 'react-apexcharts';
import { HelpCircle } from 'lucide-react';

export function getGaugeColor(pct: number): string {
  return pct <= 40 ? '#ef4444' : pct <= 70 ? '#f59e0b' : '#10b981';
}

export default function ProfileCompletionGauge({
  totalMembers,
  completedProfiles,
  compact = false,
  embedded = false,
}: {
  totalMembers: number;
  completedProfiles: number;
  compact?: boolean;
  /** When embedded in another card, remove the outer wrapper. */
  embedded?: boolean;
}) {
  const pct = totalMembers > 0 ? Math.round((completedProfiles / totalMembers) * 100) : 0;
  const color = getGaugeColor(pct);
  const incomplete = Math.max(0, totalMembers - completedProfiles);
  const [open, setOpen] = useState(false);

  const chartHeight = compact ? 132 : 220;
  const series = useMemo(() => [pct], [pct]);
  const options = useMemo(
    () => ({
      chart: {
        type: 'radialBar' as const,
        sparkline: { enabled: true },
      },
      plotOptions: {
        radialBar: {
          hollow: { size: compact ? '66%' : '62%' },
          track: { background: '#e5e7eb' },
          dataLabels: {
            name: {
              show: !compact,
              fontSize: '12px',
              offsetY: 14,
              color: '#64748b',
            },
            value: {
              show: true,
              fontSize: compact ? '22px' : '28px',
              fontWeight: 800,
              offsetY: compact ? 2 : -12,
              color: '#0f172a',
              formatter: (v: number) => `${Math.round(v)}%`,
            },
          },
        },
      },
      labels: ['Complétion'],
      colors: [color],
      stroke: { lineCap: 'round' as const },
    }),
    [color, compact]
  );

  const content = (
    <>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className={`font-semibold text-stone-900 ${compact ? 'text-xs' : 'text-sm'}`}>Complétion des profils</h3>
          <p className={`text-stone-500 ${compact ? 'mt-0.5 text-[11px]' : 'mt-1 text-xs'}`}>
            {totalMembers === 0 ? 'Aucun membre' : `${completedProfiles}/${totalMembers} profils complets`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={`inline-flex items-center justify-center rounded-lg border border-stone-200 text-stone-500 hover:bg-stone-50 ${
            compact ? 'h-8 w-8' : 'h-9 w-9'
          }`}
          aria-label="Voir les critères"
          title="Voir les critères"
        >
          <HelpCircle className="h-4 w-4" aria-hidden />
        </button>
      </div>

      {open ? (
        <div
          className={`rounded-lg border border-stone-200 bg-stone-50 text-stone-700 ${
            compact ? 'mt-2 px-2 py-1.5 text-[11px]' : 'mt-3 px-3 py-2 text-xs'
          }`}
        >
          Profil complet = nom + secteur + description (≥ 30 caractères) + photo.
        </div>
      ) : null}

      <div className={`${compact ? 'mt-2' : 'mt-3'} w-full`} style={{ height: chartHeight }}>
        <ReactApexChart options={options as any} series={series as any} type="radialBar" height={chartHeight} />
      </div>

      <div className={`${compact ? 'mt-1.5' : 'mt-2'} grid grid-cols-2 gap-x-3 gap-y-1 text-xs`}>
        <p className="text-stone-700">
          <span className="mr-1 text-green-600">●</span>
          {completedProfiles} profils complets
        </p>
        <p className="text-stone-700">
          <span className="mr-1 text-red-500">●</span>
          {incomplete} profils incomplets
        </p>
      </div>
    </>
  );

  if (embedded) return <div className={compact ? 'p-1' : 'p-0'}>{content}</div>;

  return (
    <div className={`rounded-xl border border-stone-200 bg-white shadow-sm ${compact ? 'p-3' : 'p-4'}`}>{content}</div>
  );
}

