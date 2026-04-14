import React, { useMemo, useState } from 'react';
import ReactApexChart from 'react-apexcharts';
import { HelpCircle } from 'lucide-react';

export function getGaugeColor(pct: number): string {
  return pct <= 40 ? '#ef4444' : pct <= 70 ? '#f59e0b' : '#10b981';
}

export default function ProfileCompletionGauge({
  totalMembers,
  completedProfiles,
}: {
  totalMembers: number;
  completedProfiles: number;
}) {
  const pct = totalMembers > 0 ? Math.round((completedProfiles / totalMembers) * 100) : 0;
  const color = getGaugeColor(pct);
  const incomplete = Math.max(0, totalMembers - completedProfiles);
  const [open, setOpen] = useState(false);

  const series = useMemo(() => [pct], [pct]);
  const options = useMemo(
    () => ({
      chart: {
        type: 'radialBar' as const,
        sparkline: { enabled: true },
      },
      plotOptions: {
        radialBar: {
          hollow: { size: '62%' },
          track: { background: '#e5e7eb' },
          dataLabels: {
            name: { show: true, fontSize: '12px', offsetY: 14, color: '#64748b' },
            value: {
              show: true,
              fontSize: '28px',
              fontWeight: 800,
              offsetY: -12,
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
    [color]
  );

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-stone-900">Complétion des profils</h3>
          <p className="mt-1 text-xs text-stone-500">
            {totalMembers === 0 ? 'Aucun membre' : `${completedProfiles}/${totalMembers} profils complets`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-stone-200 text-stone-500 hover:bg-stone-50"
          aria-label="Voir les critères"
          title="Voir les critères"
        >
          <HelpCircle className="h-4 w-4" aria-hidden />
        </button>
      </div>

      {open ? (
        <div className="mt-3 rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-xs text-stone-700">
          Profil complet = nom + secteur + description (≥ 30 caractères) + photo.
        </div>
      ) : null}

      <div className="mt-3 h-[220px] w-full">
        <ReactApexChart options={options as any} series={series as any} type="radialBar" height={220} />
      </div>

      <div className="mt-2 grid grid-cols-1 gap-1 text-xs">
        <p className="text-stone-700">
          <span className="mr-1 text-green-600">●</span>
          {completedProfiles} profils complets
        </p>
        <p className="text-stone-700">
          <span className="mr-1 text-red-500">●</span>
          {incomplete} profils incomplets
        </p>
      </div>
    </div>
  );
}

